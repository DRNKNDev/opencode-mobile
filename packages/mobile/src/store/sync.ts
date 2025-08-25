import { batch } from '@legendapp/state'
import type { Event } from '@opencode-ai/sdk'
import EventSource from 'react-native-sse'
import { openCodeService } from '../services/opencode'
import { debug } from '../utils/debug'
import { actions } from './actions'
import { store$ } from './index'

class SyncService {
  private eventSource: EventSource<never> | null = null
  private isListening = false

  async startSync() {
    if (this.isListening) {
      return
    }

    try {
      this.isListening = true
      this.eventSource = openCodeService.createEventSource()

      if (!this.eventSource) {
        throw new Error('Failed to create EventSource')
      }

      // Connection opened
      this.eventSource.addEventListener('open', () => {
        debug.success('SSE: Connection established')
        batch(() => {
          store$.connection.status.set('connected')
          store$.connection.lastConnected.set(new Date())
          store$.connection.error.set(null)
        })
      })

      // Message received
      this.eventSource.addEventListener('message', async (event: any) => {
        debug.log('SSE: Received message', event.data)

        const data = event.data
        if (data && data !== '[DONE]') {
          try {
            const eventObj: Event = JSON.parse(data)
            await this.handleEvent(eventObj)
          } catch (e) {
            debug.error('SSE: Failed to parse event JSON', e)
            // Continue processing other events - don't break the connection
          }
        } else if (data === '[DONE]') {
          debug.log('SSE: Stream completed with DONE marker')
        }
      })

      // Connection error
      this.eventSource.addEventListener('error', (event: any) => {
        debug.error('SSE: Connection error', event)
        store$.connection.status.set('disconnected')
        store$.connection.error.set(event.message || 'SSE connection failed')
      })

      // Connection closed
      this.eventSource.addEventListener('close', () => {
        debug.log('SSE: Connection closed')
        store$.connection.status.set('disconnected')
        this.isListening = false
      })
    } catch (error) {
      console.error('Failed to start sync:', error)
      this.isListening = false

      store$.connection.status.set('disconnected')
      store$.connection.error.set(
        error instanceof Error ? error.message : 'Failed to start sync'
      )
    }
  }

  stopSync() {
    this.isListening = false

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  private async handleEvent(event: Event) {
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

          // If this is an abort-related error or session is idle due to abort, clean up state
          batch(() => {
            store$.messages.isSending.set(false)
            store$.messages.isAborting.set(false)
          })
        }
        break

      case 'session.idle':
        // Session is now idle - this happens after completion OR abort
        const currentSessionId = store$.sessions.current.get()
        const wasAborting = store$.messages.isAborting.get()

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

          // Clear all streaming and aborting states - session is now idle
          store$.messages.isSending.set(false)
          store$.messages.isAborting.set(false)
        })

        // Log the reason for going idle
        if (wasAborting) {
          console.log('Session went idle after abort')
        } else {
          console.log('Session went idle after completion')
        }
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

      case 'server.connected':
        console.log('SSE: Server connected event received')
        store$.connection.status.set('connected')
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

  private handleMessageUpdate(messageInfo: any): void {
    const sessionId = messageInfo.sessionID
    const messageId = messageInfo.id

    actions.messages.upsertMessage(sessionId, messageId, existingMessage => {
      if (existingMessage) {
        // Update existing message with server info
        return {
          ...existingMessage,
          info: {
            ...existingMessage.info,
            time: messageInfo.time,
          },
        }
      } else {
        // Create new message
        return {
          info: messageInfo,
          parts: [],
        }
      }
    })
  }

  private handleMessagePartUpdate(part: any) {
    const sessionId = part.sessionID
    const messageId = part.messageID

    // Handle only text and tool parts that we can render
    switch (part.type) {
      case 'text':
      case 'tool':
      case 'reasoning':
      case 'file':
        // Batch all part updates for better performance
        batch(() => {
          actions.messages.upsertMessage(
            sessionId,
            messageId,
            existingMessage => {
              if (!existingMessage) {
                console.warn(
                  `Part ${part.id} arrived before message ${messageId} - skipping`
                )
                return undefined
              }

              // Find existing part by ID
              const existingPartIndex =
                existingMessage.parts?.findIndex(p => p.id === part.id) ?? -1

              let updatedParts: any[]
              if (existingPartIndex >= 0) {
                // UPDATE existing part (status transition or content update)
                updatedParts = [...(existingMessage.parts || [])]
                updatedParts[existingPartIndex] = part
                console.log(`Updated part ${part.id}: ${part.type}`)
              } else {
                // CREATE new part (first time)
                updatedParts = [...(existingMessage.parts || []), part]
                console.log(`Added part ${part.id}: ${part.type}`)
              }

              return {
                ...existingMessage,
                parts: updatedParts,
              }
            }
          )
        })
        break
      default:
        // Ignore step-start, step-finish, and other types
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

    actions.sessions.upsertSession(session)

    // Sort sessions after update to maintain proper order
    store$.sessions.list.set(sessions =>
      [...sessions].sort((a, b) => b.time.updated - a.time.updated)
    )
  }
}

export const syncService = new SyncService()

// Auto-start sync when connected
store$.connection.status.onChange(({ value }) => {
  if (value === 'connected') {
    syncService.startSync()
  }
})

// Only stop sync when server URL is cleared (explicit disconnect)
store$.connection.serverUrl.onChange(({ value }) => {
  if (!value) {
    syncService.stopSync()
  }
})
