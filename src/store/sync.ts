import { openCodeService } from '../services/opencode'
import type { StreamResponse } from '../services/sse'
import { actions } from './actions'
import { store$ } from './index'
import type { Message } from '../services/types'

class SyncService {
  private eventSource: AsyncGenerator<StreamResponse> | null = null
  private isListening = false
  private retryCount = 0

  async startSync() {
    if (this.isListening) {
      return
    }

    try {
      this.isListening = true
      this.eventSource = openCodeService.streamEvents()

      for await (const event of this.eventSource) {
        this.handleEvent(event)
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
  }

  private handleEvent(event: StreamResponse) {
    switch (event.type) {
      case 'message.updated':
        if ('properties' in event && event.properties.info) {
          this.handleMessageUpdate(event.properties.info)
        }
        break

      case 'message.part.updated':
        if ('properties' in event && event.properties.part) {
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
        store$.messages.isSending.set(false)
        break

      case 'storage.write':
        if ('properties' in event) {
          const { content, key } = event.properties
          if (content && key) {
            if (key.includes('/message/')) {
              this.handleMessageUpdate(content as any)
            } else if (key.includes('/part/')) {
              this.handleMessagePartUpdate(content as any)
            }
          }
        }
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

  private handleMessageUpdate(messageInfo: any) {
    // Convert OpenCode message format to our Message format
    const message: Message = {
      id: messageInfo.id,
      sessionId: messageInfo.sessionID,
      role: messageInfo.role,
      content: '', // Will be filled by parts
      timestamp: new Date(messageInfo.time.created * 1000),
      status: 'sent',
    }

    // Add or update the message in the store
    actions.messages.addMessage(message)
  }

  private handleMessagePartUpdate(part: any) {
    // Handle streaming message part updates
    // This would update the content of an existing message
    const sessionId = part.sessionID
    const messageId = part.messageID

    if (part.type === 'text') {
      // Update message content with new text part
      const currentMessages = store$.messages.bySessionId[sessionId].get() || []
      const messageIndex = currentMessages.findIndex(m => m.id === messageId)

      if (messageIndex >= 0) {
        const updatedMessage = {
          ...currentMessages[messageIndex],
          content: part.text,
        }

        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map(m => (m.id === messageId ? updatedMessage : m))
        )
      }
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
