import React from 'react'
import { FileText, Copy } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { CodeBlock } from '../../code/CodeBlock'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import { detectLanguage } from '../../../utils/languageDetection'
import type { ToolPartRendererProps } from '../../../types/tools'

export function ReadToolRenderer({ tool, status }: ToolPartRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const { input, output } = tool.state
  const currentStatus = status || tool.state.status
  const filePath = input?.filePath || 'Unknown file'

  const handleCopyPath = () => {
    if (filePath) {
      copyToClipboard(filePath)
    }
  }

  const handleCopyContent = () => {
    if (output) {
      copyToClipboard(output)
    }
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <FileText size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Read File
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

      {currentStatus === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to read file...
        </Text>
      )}

      {currentStatus === 'running' && (
        <Text fontSize="$3" color="$color11">
          Reading file...
        </Text>
      )}

      {currentStatus === 'completed' && output && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              File Contents:
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
            code={output}
            language={detectLanguage(filePath)}
            filename={filePath}
            copyable={false}
          />
        </YStack>
      )}

      {currentStatus === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to read: {tool.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
