import React from 'react'
import { Search, Copy, FileText } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button, ScrollView } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface GrepToolRendererProps {
  part: ToolPart
  isExpanded: boolean
  onCopy?: (content: string) => void
}

export function GrepToolRenderer({ part, isExpanded }: GrepToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get grep data from input when available
  const getGrepData = () => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        const input = part.state.input as {
          pattern?: string
          include?: string
          path?: string
        }
        return {
          pattern: input.pattern || 'pattern',
          include: input.include,
          path: input.path,
        }
      default:
        return {
          pattern: 'pattern',
          include: undefined,
          path: undefined,
        }
    }
  }

  const { pattern, include, path } = getGrepData()

  const handleCopyPattern = () => {
    copyToClipboard(pattern)
  }

  const handleCopyResults = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
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

  const results = parseResults(
    part.state.status === 'completed' ? part.state.output : ''
  )

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <Search size={16} color="$color11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Search &ldquo;{pattern}&rdquo; ({results.length} results)
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
          {pattern}
        </Text>
      </YStack>

      {include && (
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
            {include}
          </Text>
        </YStack>
      )}

      {path && (
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
            {path}
          </Text>
        </YStack>
      )}

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to search...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Searching files...
        </Text>
      )}

      {part.state.status === 'completed' && results.length > 0 && (
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

      {part.state.status === 'completed' && results.length === 0 && (
        <Text fontSize="$3" color="$color11">
          No matches found
        </Text>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Search failed: {part.state.error || 'Unknown error'}
        </Text>
      )}
    </YStack>
  )
}
