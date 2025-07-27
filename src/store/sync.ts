import { openCodeService } from '../services/opencode'
import type { StreamResponse } from '../services/sse'
import type { Message, MessagePart } from '../services/types'
import { actions } from './actions'
import { store$ } from './index'

class SyncService {
  private eventSource: AsyncGenerator<StreamResponse> | null = null
  private isListening = false
  private retryCount = 0
  private eventDependencies: Map<string, Promise<void>> = new Map()

  async startSync() {
    if (this.isListening) {
      return
    }

    try {
      this.isListening = true
      this.eventSource = openCodeService.streamEvents()

      for await (const event of this.eventSource) {
        await this.handleEvent(event)
      }
    } catch (error) {
      console.error('SSE connection error:', error)
      this.isListening = false

      // Enhanced retry with exponential backoff
      const retryDelay = this.getRetryDelay()
      setTimeout(() => {
        if (store$.connection.status.get() === 'connected') {
          this.startSync()
        }
      }, retryDelay)
    }
  }

  // Add retry logic
  private getRetryDelay(): number {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 16000) // Max 16s
    this.retryCount = Math.min(this.retryCount + 1, 5)
    return delay
  }

  // Update stopSync to reset retry count
  stopSync() {
    this.isListening = false
    this.eventSource = null
    this.retryCount = 0
    this.eventDependencies.clear()
  }

  private async handleEvent(event: StreamResponse) {
    switch (event.type) {
      case 'message.updated':
        if ('properties' in event && event.properties.info) {
          const messagePromise = this.handleMessageUpdate(event.properties.info)
          this.eventDependencies.set(event.properties.info.id, messagePromise)
          await messagePromise
        }
        break

      case 'message.part.updated':
        if ('properties' in event && event.properties.part) {
          // Wait for message to exist before processing parts
          const messageId = event.properties.part.messageID
          const messageDependency = this.eventDependencies.get(messageId)
          if (messageDependency) {
            await messageDependency
          }
          this.handleMessagePartUpdate(event.properties.part)
        }
        break

      case 'session.updated':
        if ('properties' in event && event.properties.info) {
          this.handleSessionUpdate(event.properties.info)
        }
        break

      case 'session.error':
        if ('properties' in event) {
          const errorMsg = event.properties.error
            ? JSON.stringify(event.properties.error)
            : 'Session error occurred'
          console.error('Session error:', errorMsg)
          store$.messages.error.set(errorMsg)
        }
        break

      case 'session.idle':
        // Mark all streaming messages as complete
        const currentSessionId = store$.sessions.current.get()
        if (currentSessionId) {
          const messages =
            store$.messages.bySessionId[currentSessionId].get() || []
          const updatedMessages = messages.map(msg =>
            msg.isStreaming ? { ...msg, isStreaming: false } : msg
          )
          store$.messages.bySessionId[currentSessionId].set(updatedMessages)
        }

        // Streaming is complete

        store$.messages.isSending.set(false)
        break

      case 'message.removed':
        if ('properties' in event) {
          const { messageID, sessionID } = event.properties
          const currentMessages =
            store$.messages.bySessionId[sessionID].get() || []
          store$.messages.bySessionId[sessionID].set(
            currentMessages.filter(m => m.id !== messageID)
          )
        }
        break

      case 'session.deleted':
        if ('properties' in event && event.properties.info) {
          const sessionId = event.properties.info.id
          store$.sessions.list.set(sessions =>
            sessions.filter(s => s.id !== sessionId)
          )
        }
        break

      case 'storage.write':
      case 'file.edited':
      case 'file.watcher.updated':
      case 'permission.updated':
      case 'installation.updated':
      case 'lsp.client.diagnostics':
        console.log(`Received ${event.type} event - not handled in UI`)
        break

      default:
        console.warn('Unknown event type:', (event as any).type)
    }
  }

  private async handleMessageUpdate(messageInfo: any): Promise<void> {
    const sessionId = messageInfo.sessionID
    const messageId = messageInfo.id

    const currentMessages = store$.messages.bySessionId[sessionId].get() || []
    const existingMessage = currentMessages.find(m => m.id === messageId)

    let message: Message

    if (existingMessage) {
      // Update existing streaming message with proper server timestamp
      message = {
        ...existingMessage,
        timestamp: new Date(messageInfo.time.created * 1000), // Always use server timestamp
        isStreaming: false, // Mark as completed
      }
    } else {
      // Create new message (for non-streaming messages)
      message = {
        id: messageInfo.id,
        sessionId: messageInfo.sessionID,
        role: messageInfo.role,
        content: '',
        timestamp: new Date(messageInfo.time.created * 1000), // Always use server timestamp
        status: 'sent',
        isStreaming: false,
      }
    }

    // Add or update the message in the store
    actions.messages.addMessage(message)
  }
  private handleTextPart(messageId: string, sessionId: string, part: any) {
    // Create text part using same pattern as tool parts
    const textPart: MessagePart = {
      type: 'text',
      content: part.text,
      synthetic: part.synthetic,
      id: part.id || `text-${Date.now()}`,
    }

    // Use existing addPartToMessage logic (same as tool parts)
    this.addPartToMessage(messageId, sessionId, textPart)
  }

  private handleToolPart(messageId: string, sessionId: string, part: any) {
    console.log('Tool part received:', {
      tool: part.tool,
      callID: part.callID,
      status: part.state?.status,
      messageId,
      sessionId,
    })

    const toolPart: MessagePart = {
      type: 'tool_execution',
      content: part.state?.title || `${part.tool} execution`,
      toolName: part.tool,
      callID: part.callID,
      id: part.id || part.callID || `tool-${part.tool}-${Date.now()}`,
      toolResult: {
        status: part.state?.status || 'pending',
        input: part.state?.input || {},
        output: part.state?.output || '',
        error: part.state?.error,
        time: part.state?.time,
        title: part.state?.title,
        metadata: part.state?.metadata,
      },
    }

    this.addPartToMessage(messageId, sessionId, toolPart)
  }

  private addPartToMessage(
    messageId: string,
    sessionId: string,
    newPart: MessagePart
  ) {
    const currentMessages = store$.messages.bySessionId[sessionId].get() || []
    const messageIndex = currentMessages.findIndex(m => m.id === messageId)

    if (messageIndex >= 0) {
      const currentMessage = currentMessages[messageIndex]

      // Find existing part by ID first, then fallback to type-based matching
      const existingPartIndex =
        currentMessage.parts?.findIndex(p => {
          // Match by ID if both parts have IDs
          if (p.id && newPart.id) {
            return p.id === newPart.id
          }
          // Fallback to type-based matching for compatibility
          if (
            p.type === 'tool_execution' &&
            newPart.type === 'tool_execution'
          ) {
            return p.callID === newPart.callID
          }
          if (p.type === 'text' && newPart.type === 'text') {
            return !p.synthetic && !newPart.synthetic // Match non-synthetic text parts
          }
          return false
        }) ?? -1

      let updatedParts: MessagePart[]
      if (existingPartIndex >= 0) {
        // UPDATE existing part (status transition or content update)
        updatedParts = [...(currentMessage.parts || [])]
        updatedParts[existingPartIndex] = {
          ...updatedParts[existingPartIndex],
          ...newPart,
          toolResult: {
            ...updatedParts[existingPartIndex].toolResult,
            ...newPart.toolResult,
          },
        }
        console.log(
          `Updated part ${newPart.id || newPart.callID}: ${newPart.toolResult?.status || 'text'}`
        )
      } else {
        // CREATE new part (first time)
        updatedParts = [...(currentMessage.parts || []), newPart]
        console.log(
          `Created part ${newPart.id || newPart.callID}: ${newPart.toolResult?.status || 'text'}`
        )
      }

      const updatedMessage = {
        ...currentMessage,
        parts: updatedParts,
        isStreaming: true,
      }

      store$.messages.bySessionId[sessionId].set(messages =>
        messages.map(m => (m.id === messageId ? updatedMessage : m))
      )
    } else {
      // Message doesn't exist yet - this shouldn't happen with proper event ordering
      console.warn(`Message ${messageId} not found when adding part`)
    }
  }

  private ensureMessageExists(
    messageId: string,
    sessionId: string,
    serverTimestamp?: number
  ) {
    const currentMessages = store$.messages.bySessionId[sessionId].get() || []
    const existingMessage = currentMessages.find(m => m.id === messageId)

    if (!existingMessage) {
      const newMessage: Message = {
        id: messageId,
        sessionId: sessionId,
        role: 'assistant',
        content: '',
        parts: [],
        timestamp: serverTimestamp
          ? new Date(serverTimestamp * 1000)
          : new Date(0), // Use server timestamp or placeholder
        status: 'sent',
        isStreaming: true,
      }
      actions.messages.addMessage(newMessage)
    }
  }
  private handleMessagePartUpdate(part: any) {
    const sessionId = part.sessionID
    const messageId = part.messageID

    // STEP 1: Ensure message exists for streaming parts (use server timestamp if available)
    const serverTimestamp = part.time?.start || part.time?.created
    this.ensureMessageExists(messageId, sessionId, serverTimestamp)

    // STEP 2: Handle only text and tool parts
    switch (part.type) {
      case 'text':
        this.handleTextPart(messageId, sessionId, part)
        break
      case 'tool':
        this.handleToolPart(messageId, sessionId, part)
        break
      default:
        // Ignore step-start, step-finish, and unknown types
        console.log(`Ignoring part type: ${part.type}`)
    }
  }

  private handleSessionUpdate(sessionInfo: any) {
    // Update session information
    const session = {
      id: sessionInfo.id,
      time: sessionInfo.time,
      title: sessionInfo.title || 'Untitled Session',
      version: sessionInfo.version,
      parentID: sessionInfo.parentID,
      revert: sessionInfo.revert,
      share: sessionInfo.share,
    }

    // Update the session in the store
    store$.sessions.list.set(sessions => {
      const existingIndex = sessions.findIndex(s => s.id === session.id)
      if (existingIndex >= 0) {
        // Update existing session
        const updated = [...sessions]
        updated[existingIndex] = session
        return updated
      } else {
        // Add new session
        return [...sessions, session]
      }
    })
  }
}

export const syncService = new SyncService()

// Auto-start sync when connected
store$.connection.status.onChange(({ value }) => {
  if (value === 'connected') {
    syncService.startSync()
  } else {
    syncService.stopSync()
  }
})
