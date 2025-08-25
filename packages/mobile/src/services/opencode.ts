import { debug } from '@/src/utils/debug'
import type {
  Agent,
  Message,
  Part,
  Provider,
  Session,
  TextPartInput,
} from '@opencode-ai/sdk'
import { createOpencodeClient } from '@opencode-ai/sdk/client'
import EventSource from 'react-native-sse'

export interface OpenCodeConfig {
  baseURL: string
}

class OpenCodeService {
  private client: ReturnType<typeof createOpencodeClient> | null = null
  private config: OpenCodeConfig | null = null

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

  async getAppInfo(): Promise<{
    hostname: string
    git: boolean
    path: {
      config: string
      data: string
      root: string
      cwd: string
      state: string
    }
    time: {
      initialized?: number
    }
  }> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.app.get()
      if ('error' in response && response.error) {
        throw new Error('Failed to get app info')
      }

      if (!response.data) {
        throw new Error('No app info returned')
      }

      return response.data
    } catch (error) {
      console.error('Failed to get app info:', error)
      throw error
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

  async createSession(title?: string): Promise<Session> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.create({
        body: title ? { title } : undefined,
      })
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

  async shareSession(sessionId: string): Promise<{ url: string }> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.share({
        path: { id: sessionId },
      })
      if ('error' in response && response.error) {
        throw new Error('Failed to share session')
      }

      if (!response.data?.share?.url) {
        throw new Error('No share URL returned')
      }

      return { url: response.data.share.url }
    } catch (error) {
      debug.error('Failed to share session:', error)
      throw error
    }
  }

  async unshareSession(sessionId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.unshare({
        path: { id: sessionId },
      })
      if ('error' in response && response.error) {
        throw new Error('Failed to unshare session')
      }
    } catch (error) {
      console.error('Failed to unshare session:', error)
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

  async sendMessage(
    sessionId: string,
    content: string,
    modelId: string,
    providerId: string,
    agent?: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.chat({
        path: { id: sessionId },
        body: {
          modelID: modelId,
          providerID: providerId,
          agent: agent,
          parts: [
            {
              type: 'text',
              text: content,
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

  // Create SSE EventSource connection
  createEventSource(): EventSource<never> {
    if (!this.config) {
      throw new Error('Service not initialized')
    }

    const eventURL = `${this.config.baseURL}/event`
    debug.log('SSE: Creating EventSource for', eventURL)

    return new EventSource(eventURL)
  }

  disconnect(): void {
    this.client = null
    this.config = null
  }
}

export const openCodeService = new OpenCodeService()
