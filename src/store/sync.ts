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
      case 'message_updated':
        if (event.messageInfo) {
          this.handleMessageUpdate(event.messageInfo)
        }
        break

      case 'message_part_updated':
        if (event.part) {
          this.handleMessagePartUpdate(event.part)
        }
        break

      case 'session_updated':
        if (event.sessionInfo) {
          this.handleSessionUpdate(event.sessionInfo)
        }
        break

      case 'session_error':
        console.error('Session error:', event.error)
        store$.messages.error.set(event.error || 'Session error occurred')
        break

      case 'session_idle':
        // Session is idle, could update UI state
        store$.messages.isSending.set(false)
        break

      case 'error':
        console.error('SSE error:', event.error)
        store$.messages.error.set(event.error || 'Stream error occurred')
        break

      default:
        console.warn('Unknown event type:', event.type)
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
