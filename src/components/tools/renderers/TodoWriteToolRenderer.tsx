import {
  CheckCircle,
  Circle,
  Clock,
  Copy,
  ListTodo,
  X,
} from '@tamagui/lucide-icons'
import React from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface TodoItem {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
}

interface TodoWriteToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
  isExpanded: boolean
}

const getStatusIcon = (status: TodoItem['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle size={14} color="$green11" />
    case 'in_progress':
      return <Clock size={14} color="$blue11" />
    case 'cancelled':
      return <X size={14} color="$red11" />
    default:
      return <Circle size={14} color="$color11" />
  }
}

const getPriorityColor = (priority: TodoItem['priority']) => {
  switch (priority) {
    case 'high':
      return '$red11'
    case 'medium':
      return '$orange11'
    case 'low':
      return '$green11'
    default:
      return '$color11'
  }
}

export function TodoWriteToolRenderer({
  part,
  isExpanded,
}: TodoWriteToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const input =
    part.state.status === 'completed' || part.state.status === 'running'
      ? part.state.input
      : {}
  const todos = (input as any)?.todos || []

  const handleCopyTodos = () => {
    const todoText = todos
      .map(
        (todo: TodoItem) =>
          `${todo.status === 'completed' ? '✅' : '⭕'} ${todo.content} (${todo.priority})`
      )
      .join('\n')
    copyToClipboard(todoText)
  }

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <ListTodo size={16} color="$orange11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Update {todos.length} todo{todos.length !== 1 ? 's' : ''}
        </Text>
      </XStack>
    )
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <ListTodo size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Todo List Update
        </Text>
      </XStack>

      {todos.length > 0 && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              {todos.length} Todo{todos.length !== 1 ? 's' : ''}:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyTodos}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>

          <YStack
            gap="$2"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
            maxHeight={200}
          >
            {todos.map((todo: TodoItem, index: number) => (
              <XStack key={todo.id || index} alignItems="center" gap="$2">
                {getStatusIcon(todo.status)}
                <Text fontSize="$2" color="$color12" flex={1} numberOfLines={2}>
                  {todo.content}
                </Text>
                <Text
                  fontSize="$1"
                  color={getPriorityColor(todo.priority)}
                  fontWeight="600"
                >
                  {todo.priority.toUpperCase()}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      )}

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to update todos...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Updating todo list...
        </Text>
      )}

      {part.state.status === 'completed' && (
        <Text fontSize="$3" color="$green11">
          Todo list updated successfully
        </Text>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to update todos:{' '}
          {part.state.status === 'error' ? part.state.error : 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
