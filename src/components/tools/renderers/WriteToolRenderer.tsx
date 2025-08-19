import React from 'react'
import { Copy, FileEdit } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'
import { detectLanguage } from '../../../utils/languageDetection'
import { CodeBlock } from '../../code/CodeBlock'

interface WriteToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
}

export function WriteToolRenderer({ part }: WriteToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get file path from input when available
  const getFilePath = (): string => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        return (
          (part.state.input as { filePath?: string })?.filePath ||
          'Unknown file'
        )
      default:
        return 'Unknown file'
    }
  }

  const filePath = getFilePath()

  const handleCopyPath = () => {
    copyToClipboard(filePath)
  }

  const handleCopyContent = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <FileEdit size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Write File
        </Text>
      </XStack>

      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$2" color="$color11">
            File Path:
          </Text>
          <Button
            size="$2"
            chromeless
            icon={Copy}
            onPress={handleCopyPath}
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
          numberOfLines={1}
        >
          {filePath}
        </Text>
      </YStack>

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to write file...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Writing file...
        </Text>
      )}

      {part.state.status === 'completed' && part.state.output && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Content Written:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyContent}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
          <CodeBlock
            code={part.state.output}
            language={detectLanguage(filePath)}
            filename={filePath}
            copyable={false}
          />
        </YStack>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to write: {part.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
