import { openCodeService } from '../services/opencode'
import type { Event, SessionMessageResponse } from '@opencode-ai/sdk'
import { batch } from '@legendapp/state'
import { actions } from './actions'
import { store$ } from './index'

class SyncService {
  private eventStream: AsyncGenerator<Event> | null = null
  private isListening = false
  private retryCount = 0
  private eventDependencies: Map<string, Promise<void>> = new Map()

  async startSync() {
    if (this.isListening) {
      return
    }

    try {
      this.isListening = true
      this.eventStream = openCodeService.streamEvents()

      for await (const event of this.eventStream) {
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

  private getRetryDelay(): number {
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 16000) // Max 16s
    this.retryCount = Math.min(this.retryCount + 1, 5)
    return delay
  }

  stopSync() {
    this.isListening = false
    this.eventStream = null
    this.retryCount = 0
    this.eventDependencies.clear()
  }

  private async handleEvent(event: Event) {
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
        // Mark all streaming messages as complete using batching
        const currentSessionId = store$.sessions.current.get()
        batch(() => {
          if (currentSessionId) {
            const messages =
              store$.messages.bySessionId[currentSessionId].get() || []
            const updatedMessages = messages.map(msg => ({
              ...msg,
              // Remove any streaming indicators from message info if they exist
            }))
            store$.messages.bySessionId[currentSessionId].set(updatedMessages)
          }

          // Streaming is complete
          store$.messages.isSending.set(false)
        })
        break

      case 'message.removed':
        if ('properties' in event) {
          const { messageID, sessionID } = event.properties
          const currentMessages =
            store$.messages.bySessionId[sessionID].get() || []
          store$.messages.bySessionId[sessionID].set(
            currentMessages.filter(m => m.info.id !== messageID)
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
    const existingMessage = currentMessages.find(m => m.info.id === messageId)

    let message: SessionMessageResponse

    if (existingMessage) {
      // Update existing message with server info
      message = {
        ...existingMessage,
        info: {
          ...existingMessage.info,
          time: messageInfo.time,
        },
      }
    } else {
      // Create new message
      message = {
        info: messageInfo,
        parts: [],
      }
    }

    // Add or update the message in the store
    actions.messages.addMessage(sessionId, message)
  }

  private handleMessagePartUpdate(part: any) {
    const sessionId = part.sessionID
    const messageId = part.messageID

    // Batch all part updates for better performance
    batch(() => {
      // STEP 1: Ensure message exists for streaming parts
      this.ensureMessageExists(
        messageId,
        sessionId,
        part.time?.start || part.time?.created
      )

      // STEP 2: Handle only text and tool parts that we can render
      switch (part.type) {
        case 'text':
          this.addPartToMessage(messageId, sessionId, part)
          break
        case 'tool':
          this.addPartToMessage(messageId, sessionId, part)
          break
        case 'reasoning':
          // Add reasoning parts too - they may be useful
          this.addPartToMessage(messageId, sessionId, part)
          break
        case 'file':
          // Add file parts
          this.addPartToMessage(messageId, sessionId, part)
          break
        default:
          // Ignore step-start, step-finish, and other types
          console.log(`Ignoring part type: ${part.type}`)
      }
    })
  }

  private addPartToMessage(messageId: string, sessionId: string, newPart: any) {
    const currentMessages = store$.messages.bySessionId[sessionId].get() || []
    const messageIndex = currentMessages.findIndex(m => m.info.id === messageId)

    if (messageIndex >= 0) {
      const currentMessage = currentMessages[messageIndex]

      // Find existing part by ID
      const existingPartIndex =
        currentMessage.parts?.findIndex(p => p.id === newPart.id) ?? -1

      let updatedParts: any[]
      if (existingPartIndex >= 0) {
        // UPDATE existing part (status transition or content update)
        updatedParts = [...(currentMessage.parts || [])]
        updatedParts[existingPartIndex] = newPart
        console.log(`Updated part ${newPart.id}: ${newPart.type}`)
      } else {
        // CREATE new part (first time)
        updatedParts = [...(currentMessage.parts || []), newPart]
        console.log(`Created part ${newPart.id}: ${newPart.type}`)
      }

      const updatedMessage: SessionMessageResponse = {
        ...currentMessage,
        parts: updatedParts,
      }

      store$.messages.bySessionId[sessionId].set(messages =>
        messages.map(m => (m.info.id === messageId ? updatedMessage : m))
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
    const existingMessage = currentMessages.find(m => m.info.id === messageId)

    if (!existingMessage) {
      // Create a minimal message structure that will be populated by parts
      const newMessage: SessionMessageResponse = {
        info: {
          id: messageId,
          sessionID: sessionId,
          role: 'assistant' as const,
          time: {
            created: serverTimestamp || Date.now() / 1000,
          },
        } as any, // Use any to bypass strict typing for now
        parts: [],
      }
      actions.messages.addMessage(sessionId, newMessage)
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
