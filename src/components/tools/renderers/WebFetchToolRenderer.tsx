import { YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { Globe, Copy, ExternalLink } from '@tamagui/lucide-icons'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPartRendererProps } from '../../../types/tools'

interface WebFetchToolRendererProps extends ToolPartRendererProps {
  isExpanded: boolean
}

export function WebFetchToolRenderer({
  tool,
  isExpanded,
}: WebFetchToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const input = tool.state.input || {}

  const handleCopyUrl = () => {
    if (input.url) {
      copyToClipboard(input.url)
    }
  }

  const handleCopyContent = () => {
    if (tool.state.output) {
      copyToClipboard(tool.state.output)
    }
  }

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <Globe size={16} color="$color11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Fetch {input.url ? new URL(input.url).hostname : 'web content'}
        </Text>
      </XStack>
    )
  }

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <Globe size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Web Fetch
        </Text>
      </XStack>

      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$2" color="$color11">
            URL:
          </Text>
          <XStack gap="$1">
            <Button
              size="$2"
              chromeless
              icon={ExternalLink}
              onPress={() => {
                // Note: In a real app, you'd use Linking.openURL
                console.log('Open URL:', input.url)
              }}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyUrl}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
        </XStack>
        <Text
          fontSize="$3"
          fontFamily="$mono"
          color="$blue11"
          backgroundColor="$background"
          padding="$2"
          borderRadius="$2"
          numberOfLines={2}
        >
          {input.url || 'No URL provided'}
        </Text>
      </YStack>

      {input.format && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Format:
          </Text>
          <Text
            fontSize="$3"
            color="$color12"
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {input.format}
          </Text>
        </YStack>
      )}

      {tool.state.output && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$2" color="$color11">
              Content:
            </Text>
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={handleCopyContent}
              pressStyle={{ backgroundColor: '$backgroundPress' }}
            />
          </XStack>
          <ScrollView
            maxHeight={200}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontFamily="$mono" color="$color12">
              {tool.state.output}
            </Text>
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
