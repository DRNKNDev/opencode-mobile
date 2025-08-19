import React from 'react'
import { Terminal, Copy } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { CodeBlock } from '../../code/CodeBlock'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface BashToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
  isExpanded?: boolean
}

export function BashToolRenderer({ part }: BashToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Helper function to get command from input
  const getCommand = (): string => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        return (
          (part.state.input as { command?: string })?.command || 'No command'
        )
      case 'pending':
        return 'No command'
      default:
        return 'No command'
    }
  }

  const handleCopyCommand = () => {
    const command = getCommand()
    if (command !== 'No command') {
      copyToClipboard(command)
    }
  }

  const handleCopyOutput = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <Terminal size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Bash Command
        </Text>
      </XStack>

      {/* Always show command */}
      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$2" color="$color11">
            Command:
          </Text>
          <Button
            size="$2"
            chromeless
            icon={Copy}
            onPress={handleCopyCommand}
            pressStyle={{ backgroundColor: '$backgroundPress' }}
          />
        </XStack>
        <Text
          fontSize="$3"
          fontFamily="$mono"
          color="$green10"
          backgroundColor="$background"
          padding="$2"
          borderRadius="$2"
        >
          $ {getCommand()}
        </Text>
      </YStack>

      {/* Show output only for completed state */}
      {part.state.status === 'completed' && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Output:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyOutput}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
          <CodeBlock
            code={part.state.output}
            language="bash"
            showLineNumbers={false}
            copyable={false}
          />
        </YStack>
      )}

      {/* Show error for error state */}
      {part.state.status === 'error' && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Error:
          </Text>
          <YStack
            backgroundColor="$red2"
            padding="$3"
            borderRadius="$2"
            borderWidth={0.5}
            borderColor="$red10"
          >
            <Text fontFamily="$mono" fontSize="$3" color="$red10">
              {part.state.error}
            </Text>
          </YStack>
        </YStack>
      )}

      {/* Show loading for pending/running */}
      {(part.state.status === 'pending' || part.state.status === 'running') && (
        <Text fontSize="$3" color="$color11">
          {part.state.status === 'pending'
            ? 'Waiting to execute...'
            : 'Executing command...'}
        </Text>
      )}
    </YStack>
  )
}
