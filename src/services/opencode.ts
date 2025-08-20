// Import types from the main SDK (these are just TypeScript types, no runtime code)
import type {
  Agent,
  Event,
  Message,
  Part,
  Provider,
  Session,
  TextPartInput,
} from '@opencode-ai/sdk'

// Import EventSource from react-native-sse for SSE transport layer
import EventSource from 'react-native-sse'

// Import the client creation functions directly from internals to avoid Node.js dependencies
// @ts-ignore - These internal paths work at runtime but aren't in the package exports
import { createClient } from '@opencode-ai/sdk/dist/gen/client/client.js'
// @ts-ignore
import { OpencodeClient } from '@opencode-ai/sdk/dist/gen/sdk.gen.js'

// Import debug utility for logging
import { debug } from '@/src/utils/debug'

// Create our own createOpencodeClient function that avoids the main SDK entry point
function createOpencodeClient(config: { baseUrl: string }) {
  const client = createClient(config)
  return new OpencodeClient({ client })
}

export interface OpenCodeConfig {
  baseURL: string
  timeout?: number
  maxRetries?: number
}

export interface CreateSessionRequest {
  title?: string
}

export interface SendMessageRequest {
  sessionId: string
  content: string
  modelId: string
  providerId: string
  agent?: string
}

class OpenCodeService {
  private client: ReturnType<typeof createOpencodeClient> | null = null
  private config: OpenCodeConfig | null = null
  private eventSource: EventSource | null = null

  initialize(config: OpenCodeConfig): void {
    this.config = config
    this.client = createOpencodeClient({
      baseUrl: config.baseURL,
    })
  }

  isInitialized(): boolean {
    return this.client !== null && this.config !== null
  }

  getConfig(): OpenCodeConfig | null {
    return this.config
  }

  async checkHealth(): Promise<{ status: 'ok' | 'error'; error?: string }> {
    if (!this.client) {
      return { status: 'error', error: 'Client not initialized' }
    }

    try {
      const response = await this.client.app.get()
      if ('error' in response && response.error) {
        return {
          status: 'error',
          error: 'Failed to get app info',
        }
      }
      return { status: 'ok' }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getProviders(): Promise<{
    providers: Provider[]
    default: Record<string, string>
  }> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.config.providers()
      if ('error' in response && response.error) {
        throw new Error('Failed to fetch providers')
      }

      return {
        providers: response.data?.providers || [],
        default: response.data?.default || {},
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      throw error
    }
  }

  async getAgents(): Promise<Agent[]> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.app.agents()
      if ('error' in response && response.error) {
        throw new Error('Failed to fetch agents')
      }

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      throw error
    }
  }

  async getSessions(): Promise<Session[]> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.list()
      if ('error' in response && response.error) {
        throw new Error('Failed to fetch sessions')
      }

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      throw error
    }
  }

  async createSession(): Promise<Session> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.create()
      if ('error' in response && response.error) {
        throw new Error('Failed to create session')
      }

      if (!response.data) {
        throw new Error('No session data returned')
      }

      return response.data
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.delete({
        path: { id: sessionId },
      })
      if ('error' in response && response.error) {
        throw new Error('Failed to delete session')
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw error
    }
  }

  async getMessages(
    sessionId: string
  ): Promise<{ info: Message; parts: Part[] }[]> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.messages({
        path: { id: sessionId },
      })
      if ('error' in response && response.error) {
        throw new Error('Failed to fetch messages')
      }

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      throw error
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.chat({
        path: { id: request.sessionId },
        body: {
          modelID: request.modelId,
          providerID: request.providerId,
          agent: request.agent,
          parts: [
            {
              type: 'text',
              text: request.content,
            } as TextPartInput,
          ],
        },
      })

      if ('error' in response && response.error) {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  async abortSession(sessionId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      debug.log('Aborting session:', sessionId)
      const response = await this.client.session.abort({
        path: { id: sessionId },
      })

      if ('error' in response && response.error) {
        throw new Error('Failed to abort session')
      }

      debug.success('Session aborted successfully:', sessionId)
    } catch (error) {
      debug.error('Failed to abort session:', error)
      throw error
    }
  }

  // SSE event streaming using react-native-sse
  async *streamEvents(): AsyncGenerator<Event> {
    if (!this.config) {
      throw new Error('Service not initialized')
    }

    // SSE stream controller for AsyncGenerator pattern
    interface StreamController {
      eventQueue: Event[]
      resolveNext: ((value: IteratorResult<Event>) => void) | null
      rejectNext: ((error: any) => void) | null
      closed: boolean
    }

    const controller: StreamController = {
      eventQueue: [],
      resolveNext: null,
      rejectNext: null,
      closed: false,
    }

    let eventCount = 0

    try {
      // Create EventSource connection
      const eventURL = `${this.config.baseURL}/event`
      debug.log('SSE: Connecting to', eventURL)

      this.eventSource = new EventSource(eventURL)

      // EventSource message handler - simplified JSON parsing
      this.eventSource.addEventListener('message', (event: any) => {
        debug.log('SSE: Received message', event.data)

        const data = event.data
        if (data && data !== '[DONE]') {
          try {
            const eventObj: Event = JSON.parse(data)
            eventCount++

            // Log first few events for debugging
            if (eventCount <= 3) {
              debug.log('SSE: Parsed event', {
                type: eventObj.type,
                eventCount,
              })
            }

            // Add to queue
            controller.eventQueue.push(eventObj)

            // Resolve pending next() call if any
            if (controller.resolveNext) {
              const resolve = controller.resolveNext
              controller.resolveNext = null
              resolve({ value: eventObj, done: false })
            }
          } catch (e) {
            debug.error('SSE: Failed to parse event JSON', e)
            // Continue processing other events
          }
        } else if (data === '[DONE]') {
          debug.log('SSE: Stream completed with DONE marker')
          controller.closed = true

          if (controller.resolveNext) {
            const resolve = controller.resolveNext
            controller.resolveNext = null
            resolve({ value: undefined, done: true })
          }
        }
      })

      // EventSource connection opened
      this.eventSource.addEventListener('open', () => {
        debug.success('SSE: Connection established')
      })

      // EventSource error handler
      this.eventSource.addEventListener('error', (event: any) => {
        debug.error('SSE: Connection error', event)
        controller.closed = true

        if (controller.rejectNext) {
          const reject = controller.rejectNext
          controller.rejectNext = null
          reject(new Error('SSE connection error'))
        }
      })

      // AsyncGenerator implementation
      try {
        while (!controller.closed) {
          // If we have queued events, yield them immediately
          if (controller.eventQueue.length > 0) {
            const event = controller.eventQueue.shift()!
            yield event
            continue
          }

          // Wait for next event
          const result = await new Promise<IteratorResult<Event>>(
            (resolve, reject) => {
              if (controller.closed) {
                resolve({ value: undefined, done: true })
                return
              }

              controller.resolveNext = resolve
              controller.rejectNext = reject
            }
          )

          if (result.done) {
            break
          }

          yield result.value
        }
      } finally {
        // Cleanup on generator completion
        debug.log('SSE: Cleaning up connection')
        controller.closed = true
        controller.eventQueue = []
        controller.resolveNext = null
        controller.rejectNext = null

        if (this.eventSource) {
          this.eventSource.close()
          this.eventSource = null
        }
      }

      debug.success(`SSE: Stream completed, processed ${eventCount} events`)
    } catch (error) {
      debug.error('SSE: Stream failed', error)

      // Cleanup on error
      if (this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }

      throw error
    }
  }

  disconnect(): void {
    // Close any active EventSource
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.client = null
    this.config = null
  }
}

export const openCodeService = new OpenCodeService()
