import { Copy, FileEdit } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPartRendererProps } from '../../../types/tools'
import { detectLanguage } from '../../../utils/languageDetection'
import { CodeBlock } from '../../code/CodeBlock'

export function WriteToolRenderer({ tool }: ToolPartRendererProps) {
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
          {input.filePath || 'No file path'}
        </Text>
      </YStack>

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
          code={output}
          language={detectLanguage(input.filePath)}
          filename={input.filePath}
          copyable={false}
        />
      </YStack>
    </YStack>
  )
}
