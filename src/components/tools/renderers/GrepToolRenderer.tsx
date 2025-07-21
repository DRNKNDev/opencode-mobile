import { YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { Search, Copy, FileText } from '@tamagui/lucide-icons'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPartRendererProps } from '../../../types/tools'

interface GrepToolRendererProps extends ToolPartRendererProps {
  isExpanded: boolean
}

export function GrepToolRenderer({ tool, isExpanded }: GrepToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const input = tool.state.input || {}

  const handleCopyPattern = () => {
    if (input.pattern) {
      copyToClipboard(input.pattern)
    }
  }

  const handleCopyResults = () => {
    if (tool.state.output) {
      copyToClipboard(tool.state.output)
    }
  }

  const parseResults = (output: string) => {
    if (!output) return []

    // Try to parse as file paths (one per line)
    const lines = output
      .trim()
      .split('\n')
      .filter(line => line.trim())
    return lines.map(line => line.trim())
  }

  const results = parseResults(tool.state.output || '')

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <Search size={16} color="$color11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Search &ldquo;{input.pattern}&rdquo; ({results.length} results)
        </Text>
      </XStack>
    )
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <Search size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Grep Search
        </Text>
      </XStack>

      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$2" color="$color11">
            Pattern:
          </Text>
          <Button
            size="$2"
            chromeless
            icon={Copy}
            onPress={handleCopyPattern}
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
          {input.pattern || 'No pattern'}
        </Text>
      </YStack>

      {input.include && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Include Pattern:
          </Text>
          <Text
            fontSize="$3"
            fontFamily="$mono"
            color="$color12"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {input.include}
          </Text>
        </YStack>
      )}

      {input.path && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Search Path:
          </Text>
          <Text
            fontSize="$3"
            fontFamily="$mono"
            color="$color12"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {input.path}
          </Text>
        </YStack>
      )}

      {results.length > 0 && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Results ({results.length} files):
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyResults}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>

          <ScrollView
            maxHeight={200}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            <YStack gap="$1">
              {results.map((result, index) => (
                <XStack key={index} alignItems="center" gap="$2">
                  <FileText size={12} color="$color11" />
                  <Text
                    fontSize="$2"
                    fontFamily="$mono"
                    color="$color12"
                    flex={1}
                  >
                    {result}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </ScrollView>
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
