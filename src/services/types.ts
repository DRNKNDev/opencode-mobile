export interface Session {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  status?: 'active' | 'idle' | 'error' | 'completed'
  modelName?: string
  lastMessage?: string
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
  parts?: MessagePart[]
}

export interface MessagePart {
  type: 'text' | 'code' | 'tool_execution'
  content: string
  language?: string
  toolName?: string
  toolResult?: any
}

export interface Model {
  id: string
  name: string
  provider: string
  description?: string
}

export interface ConnectionStatus {
  connected: boolean
  serverUrl: string
  error?: string
  models?: Model[]
}

export interface UserPreferences {
  selectedModel: string
  theme: 'tokyonight-dark' | 'tokyonight-light'
  hapticFeedback: boolean
}
