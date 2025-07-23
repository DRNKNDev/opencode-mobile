export interface Session {
  id: string
  time: {
    created: number
    updated: number
  }
  title: string
  version: string
  parentID?: string
  revert?: {
    messageID: string
    part: number
    snapshot?: string
  }
  share?: {
    url: string
  }
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
  type: 'text' | 'code' | 'tool_execution' | 'file'
  content: string
  language?: string
  toolName?: string
  toolResult?: any
  synthetic?: boolean
  // File-specific properties
  mime?: string
  filename?: string
  url?: string
}

export interface Model {
  id: string
  name: string
  provider: string
  description?: string
  providerId?: string
  contextLimit?: number
  outputLimit?: number
  isAvailable?: boolean
}

export interface ConnectionStatus {
  connected: boolean
  serverUrl: string
  error?: string
  models?: Model[]
}
