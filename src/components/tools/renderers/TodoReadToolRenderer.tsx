import React from 'react'
import { CheckSquare, Copy } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface TodoReadToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
}

export function TodoReadToolRenderer({ part }: TodoReadToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  const handleCopyTodos = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <CheckSquare size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Read Todo List
        </Text>
      </XStack>

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Reading todo list...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Loading todos...
        </Text>
      )}

      {part.state.status === 'completed' && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Todo List:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyTodos}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
          <Text
            fontSize="$3"
            fontFamily="$mono"
            color="$color12"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {part.state.output}
          </Text>
        </YStack>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to read todos: {part.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
