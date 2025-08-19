import React from 'react'
import { Zap, Copy, User } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface TaskToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
}

export function TaskToolRenderer({ part }: TaskToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get task data from input when available
  const getTaskData = () => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        const input = part.state.input as {
          prompt?: string
          subagent_type?: string
          description?: string
        }
        return {
          agentType: input.subagent_type || 'general',
          description: input.description || 'Agent task',
          prompt: input.prompt || '',
        }
      default:
        return {
          agentType: 'general',
          description: 'Agent task',
          prompt: '',
        }
    }
  }

  const { agentType, description, prompt } = getTaskData()

  const handleCopyPrompt = () => {
    if (prompt) {
      copyToClipboard(prompt)
    }
  }

  const handleCopyResult = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <Zap size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Agent Task
        </Text>
        <XStack alignItems="center" gap="$1">
          <User size={12} color="$blue10" />
          <Text fontSize="$2" color="$blue10">
            {agentType}
          </Text>
        </XStack>
      </XStack>

      <YStack gap="$2">
        <Text fontSize="$2" color="$color11">
          Description: {description}
        </Text>
      </YStack>

      {prompt && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Task Prompt:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyPrompt}
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
            {prompt}
          </Text>
        </YStack>
      )}

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to delegate task...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Agent working on task...
        </Text>
      )}

      {part.state.status === 'completed' && part.state.output && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Agent Result:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyResult}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
          <Text
            fontSize="$3"
            fontFamily="$mono"
            color="$green11"
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
          Task failed: {part.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
