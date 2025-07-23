export interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  maxLines?: number
  copyable?: boolean
  collapsible?: boolean
  title?: string
  showHeader?: boolean
}

export interface DiffViewerProps {
  oldString: string
  newString: string
  filename?: string
  language?: string
  copyable?: boolean
  collapsible?: boolean
  modeToggleable?: boolean
  viewMode?: 'unified' | 'split' | 'before' | 'after'
  title?: string
}

export interface MessagePart {
  type: 'text' | 'tool' | 'code' | 'todos'
  content?: string
  language?: string
  filename?: string
  tool?: any
  todos?: any[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  parts?: MessagePart[]
  mode?: 'build' | 'plan'
  timestamp: Date
}
