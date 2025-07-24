import Opencode from '@opencode-ai/sdk'
import EventSource from 'react-native-sse'
import { debug } from '../utils/debug'

// SSE-specific interfaces
export interface SSEConfig {
  baseURL: string
  timeout?: number
  pollingInterval?: number
  debug?: boolean
}

export interface RawSSEEvent {
  type: string
  properties?: Record<string, any>
}

export interface StreamResponse {
  id: string
  type:
    | 'message_updated'
    | 'message_part_updated'
    | 'session_updated'
    | 'session_error'
    | 'session_idle'
    | 'tool_execution'
    | 'error'
  messageInfo?: Opencode.Message
  part?: Opencode.Part
  sessionInfo?: Opencode.Session
  error?: string
}

export interface SSEEventQueue<T> {
  events: T[]
  resolveNext: ((value: IteratorResult<T>) => void) | null
  streamEnded: boolean
}

export class SSEEventStream {
  private eventSource: EventSource | null = null
  private config: SSEConfig

  constructor(config: SSEConfig) {
    this.config = config
  }

  /**
   * Create an async generator that streams StreamResponse objects directly from SSE
   */
  async *streamEvents(): AsyncGenerator<StreamResponse> {
    const url = new URL(`${this.config.baseURL}/event`)

    this.eventSource = new EventSource(url.toString(), {
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      timeout: this.config.timeout || 120000, // 2 minutes for streaming
      pollingInterval: this.config.pollingInterval || 5000, // Auto-reconnect
      debug: this.config.debug || __DEV__,
    })

    // Event queue to maintain async generator compatibility
    const eventQueue: SSEEventQueue<StreamResponse> = {
      events: [],
      resolveNext: null,
      streamEnded: false,
    }

    const queueEvent = (event: StreamResponse) => {
      eventQueue.events.push(event)
      if (eventQueue.resolveNext) {
        const resolve = eventQueue.resolveNext
        eventQueue.resolveNext = null
        resolve({ value: eventQueue.events.shift()!, done: false })
      }
    }

    try {
      // SSE event handlers
      this.eventSource.addEventListener('open', () => {
        debug.log('SSE connection opened')
      })

      this.eventSource.addEventListener('error', (event: any) => {
        debug.error('SSE error:', event)
        eventQueue.streamEnded = true
        if (eventQueue.resolveNext) {
          eventQueue.resolveNext({ value: undefined as any, done: true })
        }
      })

      // Handle OpenCode server events using generic message event
      this.eventSource.addEventListener('message', (event: any) => {
        const data = this.parseSSEData(event.data)

        // Debug logging to understand the actual data structure
        debug.log('SSE event received:', { type: data.type, data })

        // Handle special 'done' event that ends the stream
        if (data.type === 'done') {
          debug.log('SSE stream completed')
          eventQueue.streamEnded = true
          if (eventQueue.resolveNext) {
            eventQueue.resolveNext({ value: undefined as any, done: true })
          }
          return
        }

        // Convert SSE data directly to StreamResponse
        const streamResponse = this.parseSSEToStreamResponse(data)
        if (streamResponse) {
          queueEvent(streamResponse)
        } else {
          // Handle unknown event types - queue an error event
          debug.warn('Unknown SSE event type:', data.type, data)
          queueEvent({
            id: Math.random().toString(36).substring(2, 15),
            type: 'error',
            error: `Unknown event type: ${data.type}`,
          })
        }
      })

      // Maintain exact same async generator interface
      while (!eventQueue.streamEnded) {
        if (eventQueue.events.length > 0) {
          yield eventQueue.events.shift()!
        } else {
          await new Promise<void>(resolve => {
            eventQueue.resolveNext = result => {
              if (result.done) {
                eventQueue.streamEnded = true
              }
              resolve()
            }
          })
        }
      }
    } catch (error) {
      debug.error('Failed to stream SSE events:', error)
      throw error
    } finally {
      this.cleanup()
    }
  }

  /**
   * Convert raw SSE data directly to StreamResponse objects
   */
  private parseSSEToStreamResponse(data: RawSSEEvent): StreamResponse | null {
    try {
      const eventType = data.type
      const properties = data.properties || {}
      const id = Math.random().toString(36).substring(2, 15)

      switch (eventType) {
        case 'message.updated':
          return {
            id,
            type: 'message_updated',
            messageInfo: properties.info,
          }

        case 'message.part.updated':
          return {
            id,
            type: 'message_part_updated',
            part: properties.part,
          }

        case 'session.updated':
          return {
            id,
            type: 'session_updated',
            sessionInfo: properties.info,
          }

        case 'session.error':
          return {
            id,
            type: 'session_error',
            error: properties.error
              ? JSON.stringify(properties.error)
              : 'Unknown session error',
          }

        case 'session.idle':
          return {
            id,
            type: 'session_idle',
          }

        case 'storage.write':
          const { content, key } = properties

          if (content && key) {
            // Parse the storage key to determine type
            if (key.includes('/message/')) {
              // Handle message updates
              return {
                id,
                type: 'message_updated',
                messageInfo: content as Opencode.Message,
              }
            } else if (key.includes('/part/')) {
              // Handle part updates (streaming text)
              return {
                id,
                type: 'message_part_updated',
                part: content as Opencode.Part,
              }
            }
          }

          // Fallback for unknown storage.write events
          return {
            id,
            type: 'error',
            error: `Unknown storage.write key: ${key}`,
          }

        // Additional SDK event types that we acknowledge but don't handle in UI
        case 'message.removed':
        case 'session.deleted':
        case 'file.edited':
        case 'file.watcher.updated':
        case 'permission.updated':
        case 'installation.updated':
        case 'lsp.client.diagnostics':
          debug.log(`Received unhandled event type: ${eventType}`)
          return {
            id,
            type: 'error',
            error: `Unhandled event type: ${eventType}`,
          }

        default:
          debug.warn(`Unknown SSE event type: ${eventType}`)
          return {
            id,
            type: 'error',
            error: `Unknown event type: ${eventType}`,
          }
      }
    } catch (error) {
      debug.error('Failed to parse SSE data to StreamResponse:', error)
      return {
        id: Math.random().toString(36).substring(2, 15),
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Parse raw SSE data from string or object
   */
  private parseSSEData(data: any): RawSSEEvent {
    try {
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch (error) {
      debug.warn('Failed to parse SSE data:', error)
      return { type: 'unknown', properties: {} }
    }
  }

  /**
   * Clean up SSE connection and event listeners
   */
  cleanup(): void {
    if (this.eventSource) {
      this.eventSource.removeAllEventListeners()
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * Check if SSE connection is active
   */
  isConnected(): boolean {
    return this.eventSource !== null
  }
}
