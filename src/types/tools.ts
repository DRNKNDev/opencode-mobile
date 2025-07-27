export interface ToolPart {
  id: string
  tool: string
  state: ToolPartState
  type: ToolPartType
}

export interface ToolPartState {
  status: 'pending' | 'running' | 'completed' | 'error'
  input: any
  output: string
  error?: string
  metadata?: {
    duration?: string
    [key: string]: any
  }
}

export type ToolPartType =
  | 'read'
  | 'edit'
  | 'write'
  | 'bash'
  | 'webfetch'
  | 'todowrite'
  | 'grep'
  | 'glob'

export interface ToolExecutionCardProps {
  tool: ToolPart
  status?: 'pending' | 'running' | 'completed' | 'error'
  isExpanded?: boolean
  onToggleExpanded: (toolId: string) => void
  onCopy?: (content: string) => void
  maxHeight?: number
}

export interface ToolPartRendererProps {
  tool: ToolPart
  onCopy?: (content: string) => void
  status?: 'pending' | 'running' | 'completed' | 'error'
  isExpanded?: boolean
}

export interface ToolStatusConfig {
  icon: string
  color: string
  label: string
  backgroundColor: string
}
