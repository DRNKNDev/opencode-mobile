import React from 'react'
import { FileText, Copy } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button } from 'tamagui'
import { CodeBlock } from '../../code/CodeBlock'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import { detectLanguage } from '../../../utils/languageDetection'
import type { ToolPartRendererProps } from '../../../types/tools'

export function ReadToolRenderer({ tool }: ToolPartRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const { input, output } = tool.state

  const handleCopyPath = () => {
    if (input.filePath) {
      copyToClipboard(input.filePath)
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
          {input.filePath || 'No file path'}
        </Text>
      </YStack>

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
          language={detectLanguage(input.filePath)}
          filename={input.filePath}
          copyable={false}
        />
      </YStack>
    </YStack>
  )
}
