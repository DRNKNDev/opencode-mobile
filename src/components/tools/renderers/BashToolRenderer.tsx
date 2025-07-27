import React from 'react'
import { Terminal, Copy } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { CodeBlock } from '../../code/CodeBlock'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPartRendererProps } from '../../../types/tools'

export function BashToolRenderer({ tool, status }: ToolPartRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const { input, output, error } = tool.state
  const currentStatus = status || tool.state.status

  const handleCopyCommand = () => {
    if (input.command) {
      copyToClipboard(input.command)
    }
  }

  const handleCopyOutput = () => {
    if (output) {
      copyToClipboard(output)
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
          $ {input.command || 'No command'}
        </Text>
      </YStack>

      {/* Show output only for completed state */}
      {currentStatus === 'completed' && output && (
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
            code={output}
            language="bash"
            showLineNumbers={false}
            copyable={false}
          />
        </YStack>
      )}

      {/* Show error for error state */}
      {currentStatus === 'error' && error && (
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
              {error}
            </Text>
          </YStack>
        </YStack>
      )}

      {/* Show loading for pending/running */}
      {(currentStatus === 'pending' || currentStatus === 'running') && (
        <Text fontSize="$3" color="$color11">
          {currentStatus === 'pending'
            ? 'Waiting to execute...'
            : 'Executing command...'}
        </Text>
      )}
    </YStack>
  )
}
