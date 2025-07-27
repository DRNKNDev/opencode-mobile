import type { EventListResponse } from '@opencode-ai/sdk/resources/event'
import EventSource from 'react-native-sse'
import { NETWORK_CONFIG } from '../config/constants'
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

export type StreamResponse = EventListResponse & {
  id: string
  sequence?: number
  serverTimestamp?: number
}

export interface SSEEventQueue<T> {
  events: T[]
  resolveNext: ((value: IteratorResult<T>) => void) | null
  streamEnded: boolean
}

export interface OrderedEventBuffer<T> {
  buffer: Map<number, T>
  expectedSequence: number
  processingTimeout: ReturnType<typeof setTimeout> | null
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
      timeout: 0, // No timeout - connection never expires
      pollingInterval: this.config.pollingInterval || 5000, // Auto-reconnect
      debug: this.config.debug || __DEV__,
    })

    // Ordered event buffer for proper sequencing (TUI-inspired)
    const orderedBuffer: OrderedEventBuffer<StreamResponse> = {
      buffer: new Map(),
      expectedSequence: 0,
      processingTimeout: null,
      streamEnded: false,
    }

    // Event queue for fallback compatibility
    const eventQueue: SSEEventQueue<StreamResponse> = {
      events: [],
      resolveNext: null,
      streamEnded: false,
    }

    const processOrderedEvents = () => {
      // Process events in sequence order
      while (orderedBuffer.buffer.has(orderedBuffer.expectedSequence)) {
        const event = orderedBuffer.buffer.get(orderedBuffer.expectedSequence)!
        orderedBuffer.buffer.delete(orderedBuffer.expectedSequence)
        orderedBuffer.expectedSequence++

        // Queue the ordered event
        eventQueue.events.push(event)
        if (eventQueue.resolveNext) {
          const resolve = eventQueue.resolveNext
          eventQueue.resolveNext = null
          resolve({ value: eventQueue.events.shift()!, done: false })
        }
      }

      // Clear processing timeout
      if (orderedBuffer.processingTimeout) {
        clearTimeout(orderedBuffer.processingTimeout)
        orderedBuffer.processingTimeout = null
      }
    }

    const queueEvent = (event: StreamResponse) => {
      // If event has sequence number, use ordered processing
      if (typeof event.sequence === 'number') {
        orderedBuffer.buffer.set(event.sequence, event)
        processOrderedEvents()

        // Set timeout to process remaining events if some are missing
        if (orderedBuffer.processingTimeout) {
          clearTimeout(orderedBuffer.processingTimeout)
        }
        orderedBuffer.processingTimeout = setTimeout(() => {
          debug.warn(
            'Processing timeout - some events may be missing, continuing with available events'
          )
          // Process any remaining events in buffer order
          const sortedSequences = Array.from(orderedBuffer.buffer.keys()).sort(
            (a, b) => a - b
          )
          for (const seq of sortedSequences) {
            const event = orderedBuffer.buffer.get(seq)!
            orderedBuffer.buffer.delete(seq)
            eventQueue.events.push(event)
            if (eventQueue.resolveNext) {
              const resolve = eventQueue.resolveNext
              eventQueue.resolveNext = null
              resolve({ value: eventQueue.events.shift()!, done: false })
            }
          }
          orderedBuffer.expectedSequence =
            Math.max(...sortedSequences, orderedBuffer.expectedSequence) + 1
        }, NETWORK_CONFIG.retryBaseDelay) // Use centralized retry delay for missing events
      } else {
        // Fallback to immediate processing for events without sequence
        eventQueue.events.push(event)
        if (eventQueue.resolveNext) {
          const resolve = eventQueue.resolveNext
          eventQueue.resolveNext = null
          resolve({ value: eventQueue.events.shift()!, done: false })
        }
      }
    }

    try {
      // SSE event handlers
      this.eventSource.addEventListener('open', () => {
        debug.log('SSE connection opened')
      })

      this.eventSource.addEventListener('error', (event: any) => {
        debug.error('SSE error:', event)
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

        // Use SDK EventListResponse directly with minimal extension
        if (this.isValidEventListResponse(data)) {
          const streamResponse: StreamResponse = {
            ...data,
            id: Math.random().toString(36).substring(2, 15),
            sequence: (data as any).sequence,
            serverTimestamp: (data as any).serverTimestamp || Date.now() / 1000,
          }
          queueEvent(streamResponse)
        } else {
          debug.warn('Invalid event data received:', data)
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
   * Type guard to check if data is a valid EventListResponse
   */
  private isValidEventListResponse(
    data: RawSSEEvent
  ): data is EventListResponse {
    const validTypes = [
      'lsp.client.diagnostics',
      'permission.updated',
      'file.edited',
      'installation.updated',
      'message.updated',
      'message.removed',
      'message.part.updated',
      'storage.write',
      'session.updated',
      'session.deleted',
      'session.idle',
      'session.error',
      'file.watcher.updated',
    ]
    return validTypes.includes(data.type) && typeof data.properties === 'object'
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
