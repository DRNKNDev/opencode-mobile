import Opencode from '@opencode-ai/sdk'
import type { Session, Message, Model } from './types'
import { debug } from '../utils/debug'

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
  mode?: string
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

class OpenCodeService {
  private client: Opencode | null = null
  private config: OpenCodeConfig | null = null

  initialize(config: OpenCodeConfig): void {
    this.config = config
    this.client = new Opencode({
      baseURL: config.baseURL,
      timeout: config.timeout || 60000, // 1 minute default
      maxRetries: config.maxRetries || 2,
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
      // Try to get app info to check if server is responding
      await this.client.app.get()
      return { status: 'ok' }
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async getModels(): Promise<{
    models: Model[]
    defaultModels: Record<string, string>
  }> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.app.providers()

      // Transform response to our Model interface
      const models: Model[] = []

      response.providers.forEach(provider => {
        Object.entries(provider.models).forEach(([modelId, model]) => {
          models.push({
            id: modelId,
            name: model.name,
            provider: provider.name,
            providerId: provider.id,
            description: `${model.name} - Context: ${model.limit.context}, Output: ${model.limit.output}`,
          })
        })
      })

      return {
        models,
        defaultModels: response.default || {},
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      throw error
    }
  }

  async getSessions(): Promise<Session[]> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.list()

      // Transform response to our Session interface
      return response.map(session => ({
        id: session.id,
        title: session.title || 'Untitled Session',
        createdAt: new Date(session.time.created * 1000), // Convert from Unix timestamp
        updatedAt: new Date(session.time.updated * 1000), // Convert from Unix timestamp
        messageCount: 0, // We'll need to get this separately if needed
        status: 'idle' as const,
        modelName: undefined,
        lastMessage: undefined,
      }))
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

      return {
        id: response.id,
        title: response.title || 'Untitled Session',
        createdAt: new Date(response.time.created * 1000),
        updatedAt: new Date(response.time.updated * 1000),
        messageCount: 0,
        status: 'active',
        modelName: undefined,
      }
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
      await this.client.session.delete(sessionId)
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw error
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const response = await this.client.session.messages(sessionId)

      return response.map(item => {
        const message = item.info
        const textParts = item.parts.filter(
          part => part.type === 'text'
        ) as Opencode.TextPart[]
        const content = textParts.map(part => part.text).join('')

        return {
          id: message.id,
          sessionId: message.sessionID,
          role: message.role,
          content: content,
          timestamp: new Date(
            message.role === 'user'
              ? (message as Opencode.UserMessage).time.created * 1000
              : (message as Opencode.AssistantMessage).time.created * 1000
          ),
          status: 'sent' as const,
          parts: item.parts
            .filter(part => {
              // Filter out unwanted part types at the source
              const unwantedTypes = ['step-start', 'step-finish', 'snapshot']
              return !unwantedTypes.includes(part.type)
            })
            .map((part, partIndex) => {
              debug.log(
                `Processing part ${partIndex} for message ${message.id}:`,
                {
                  originalPartType: part.type,
                  mappedPartType: this.mapPartType(part.type),
                  isTextPart: part.type === 'text',
                  isToolPart: part.type === 'tool',
                  isFilePart: part.type === 'file',
                  toolName:
                    part.type === 'tool'
                      ? (part as Opencode.ToolPart).tool
                      : undefined,
                  toolState:
                    part.type === 'tool'
                      ? (part as Opencode.ToolPart).state
                      : undefined,
                  fileName:
                    part.type === 'file'
                      ? (part as Opencode.FilePart).filename
                      : undefined,
                  fullPart: part,
                }
              )

              const mappedPart = {
                type: this.mapPartType(part.type),
                content:
                  part.type === 'text'
                    ? (part as Opencode.TextPart).text
                    : part.type === 'file'
                      ? `File: ${(part as Opencode.FilePart).filename}`
                      : '',
                language:
                  part.type === 'file'
                    ? this.getLanguageFromFilename(
                        (part as Opencode.FilePart).filename || 'unknown'
                      )
                    : undefined,
                toolName:
                  part.type === 'tool'
                    ? (part as Opencode.ToolPart).tool
                    : undefined,
                toolResult:
                  part.type === 'tool'
                    ? (part as Opencode.ToolPart).state
                    : undefined,
              }

              debug.success(`Created mapped part ${partIndex}:`, mappedPart)
              return mappedPart
            }),
        }
      })
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      throw error
    }
  }

  async sendMessage(
    request: SendMessageRequest
  ): Promise<Opencode.AssistantMessage> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const messageId = `msg${Math.random().toString(36).substring(2, 15)}`

      const response = await this.client.session.chat(request.sessionId, {
        messageID: messageId,
        mode: request.mode || 'chat',
        modelID: request.modelId,
        providerID: request.providerId,
        parts: [
          {
            id: Math.random().toString(36).substring(2, 15),
            messageID: messageId,
            sessionID: request.sessionId,
            text: request.content,
            type: 'text' as const,
          },
        ],
      })

      return response
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  async *streamEvents(): AsyncGenerator<StreamResponse> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      const stream = await this.client.event.list()

      for await (const event of stream) {
        yield this.transformEvent(event)
      }
    } catch (error) {
      console.error('Failed to stream events:', error)
      yield {
        id: Math.random().toString(36),
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private transformEvent(event: Opencode.EventListResponse): StreamResponse {
    const id = Math.random().toString(36).substring(2, 15)

    switch (event.type) {
      case 'message.updated':
        return {
          id,
          type: 'message_updated',
          messageInfo: event.properties.info,
        }

      case 'message.part.updated':
        return {
          id,
          type: 'message_part_updated',
          part: event.properties.part,
        }

      case 'session.updated':
        return {
          id,
          type: 'session_updated',
          sessionInfo: event.properties.info,
        }

      case 'session.error':
        return {
          id,
          type: 'session_error',
          error: event.properties.error
            ? JSON.stringify(event.properties.error)
            : 'Unknown session error',
        }

      case 'session.idle':
        return {
          id,
          type: 'session_idle',
        }

      default:
        return {
          id,
          type: 'error',
          error: `Unknown event type: ${event.type}`,
        }
    }
  }

  private mapPartType(partType: string): 'text' | 'code' | 'tool_execution' {
    debug.log('mapPartType called with:', partType)

    switch (partType) {
      case 'text':
        debug.success('Mapped to: text')
        return 'text'
      case 'tool':
        debug.success('Mapped to: tool_execution')
        return 'tool_execution'
      case 'file':
        debug.success('Mapped to: code')
        return 'code'
      default:
        debug.warn('Unknown part type, defaulting to: text')
        return 'text'
    }
  }

  private getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()

    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'cs':
        return 'csharp'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'swift':
        return 'swift'
      case 'kt':
        return 'kotlin'
      case 'scala':
        return 'scala'
      case 'sh':
      case 'bash':
        return 'bash'
      case 'json':
        return 'json'
      case 'xml':
        return 'xml'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'scss':
      case 'sass':
        return 'scss'
      case 'md':
        return 'markdown'
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'sql':
        return 'sql'
      default:
        return 'text'
    }
  }

  disconnect(): void {
    this.client = null
    this.config = null
  }
}

export const openCodeService = new OpenCodeService()
