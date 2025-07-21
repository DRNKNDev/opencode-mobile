import {
  CheckCircle,
  Circle,
  Clock,
  Copy,
  ListTodo,
  X,
} from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { TodoItem } from '../../../types/todo'
import type { ToolPartRendererProps } from '../../../types/tools'

interface TodoWriteToolRendererProps extends ToolPartRendererProps {
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
  tool,
  isExpanded,
}: TodoWriteToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const input = tool.state.input || {}
  const todos = input.todos || []

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
            gap="$1"
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

      {tool.state.output && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Result:
          </Text>
          <Text
            fontSize="$3"
            color={tool.state.status === 'completed' ? '$green11' : '$red11'}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {tool.state.output}
          </Text>
        </YStack>
      )}

      {tool.state.error && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Error:
          </Text>
          <Text
            fontSize="$3"
            color="$red11"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {tool.state.error}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
