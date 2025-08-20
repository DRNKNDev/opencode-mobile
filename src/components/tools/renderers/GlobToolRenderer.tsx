import React from 'react'
import { Search, Copy, File } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button, Card } from 'tamagui'

import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface GlobToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
}

export function GlobToolRenderer({ part }: GlobToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get pattern from input when available
  const getPattern = (): string | undefined => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        return (part.state.input as { pattern?: string })?.pattern
      default:
        return undefined
    }
  }

  const pattern = getPattern()

  const handleCopyPattern = () => {
    if (pattern) {
      copyToClipboard(pattern)
    }
  }

  const handleCopyResults = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  // Parse output as file list
  const parseFileList = (output?: string): string[] => {
    if (!output) return []
    try {
      const parsed = JSON.parse(output)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      // Fallback to line-separated
      return output.split('\n').filter(line => line.trim())
    }
  }

  const files = parseFileList(
    part.state.status === 'completed' ? part.state.output : undefined
  )

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <Search size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          File Pattern Search
        </Text>
        {part.state.status === 'completed' && files.length > 0 && (
          <Text fontSize="$2" color="$green10">
            {files.length} files found
          </Text>
        )}
      </XStack>

      {/* Pattern */}
      {pattern && (
        <Card padding="$3" backgroundColor="$gray2">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2" flex={1}>
              <Text fontSize="$2" color="$gray11">
                Pattern:
              </Text>
              <Text fontSize="$3" fontFamily="$mono" color="$color12">
                {pattern}
              </Text>
            </XStack>
            <Button size="$2" variant="outlined" onPress={handleCopyPattern}>
              <Copy size={14} />
            </Button>
          </XStack>
        </Card>
      )}

      {/* Results */}
      {part.state.status === 'completed' && files.length > 0 && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Found Files ({files.length})
            </Text>
            <Button size="$2" variant="outlined" onPress={handleCopyResults}>
              <Copy size={14} />
            </Button>
          </XStack>

          <Card padding="$3" backgroundColor="$gray1" maxHeight={200}>
            <YStack gap="$1">
              {files.slice(0, 20).map((file, index) => (
                <XStack key={index} alignItems="center" gap="$2">
                  <File size={12} color="$color10" />
                  <Text fontSize="$2" fontFamily="$mono" color="$color11">
                    {file}
                  </Text>
                </XStack>
              ))}
              {files.length > 20 && (
                <Text fontSize="$2" color="$gray9" marginTop="$2">
                  ... and {files.length - 20} more files
                </Text>
              )}
            </YStack>
          </Card>
        </YStack>
      )}

      {/* Error */}
      {part.state.status === 'error' && (
        <Card padding="$3" backgroundColor="$red2">
          <Text fontSize="$3" color="$red11">
            Error: {part.state.error}
          </Text>
        </Card>
      )}
    </YStack>
  )
}
