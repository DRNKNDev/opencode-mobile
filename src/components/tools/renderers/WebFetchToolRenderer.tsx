import React from 'react'
import { Globe, Copy, ExternalLink } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface WebFetchToolRendererProps {
  part: ToolPart
  isExpanded: boolean
  onCopy?: (content: string) => void
}

export function WebFetchToolRenderer({
  part,
  isExpanded,
}: WebFetchToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get webfetch data from input when available
  const getWebFetchData = () => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        const input = part.state.input as {
          url?: string
          format?: string
        }
        return {
          url: input.url,
          format: input.format,
        }
      default:
        return {
          url: undefined,
          format: undefined,
        }
    }
  }

  const { url, format } = getWebFetchData()

  const handleCopyUrl = () => {
    if (url) {
      copyToClipboard(url)
    }
  }

  const handleCopyContent = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <Globe size={16} color="$color11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Fetch {url ? new URL(url).hostname : 'web content'}
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
                console.log('Open URL:', url)
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
          {url || 'No URL provided'}
        </Text>
      </YStack>

      {format && (
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
            {format}
          </Text>
        </YStack>
      )}

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to fetch content...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Fetching content...
        </Text>
      )}

      {part.state.status === 'completed' && part.state.output && (
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
              {part.state.output}
            </Text>
          </ScrollView>
        </YStack>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to fetch: {part.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
