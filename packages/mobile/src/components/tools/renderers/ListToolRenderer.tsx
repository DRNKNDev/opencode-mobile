import React from 'react'
import { FolderOpen, Copy, File, Folder } from '@tamagui/lucide-icons'
import { YStack, XStack, Text, Button, Card } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'

interface DirectoryItem {
  name: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
}

interface ListToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
}

export function ListToolRenderer({ part }: ListToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get path from input when available
  const getPath = (): string | undefined => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        return (part.state.input as { path?: string })?.path
      default:
        return undefined
    }
  }

  const path = getPath()

  const handleCopyPath = () => {
    if (path) {
      copyToClipboard(path)
    }
  }

  const handleCopyResults = () => {
    if (part.state.status === 'completed') {
      copyToClipboard(part.state.output)
    }
  }

  // Parse output as directory listing
  const parseDirectoryListing = (output?: string): DirectoryItem[] => {
    if (!output) return []
    try {
      const parsed = JSON.parse(output)
      if (Array.isArray(parsed)) return parsed
      return []
    } catch {
      // Fallback to line-separated parsing
      return output
        .split('\n')
        .filter(line => line.trim())
        .map(
          line =>
            ({
              name: line.trim(),
              type: line.endsWith('/') ? 'directory' : 'file',
            }) as DirectoryItem
        )
    }
  }

  const output =
    part.state.status === 'completed' ? part.state.output : undefined
  const items = parseDirectoryListing(output)
  const directories = items.filter(item => item.type === 'directory')
  const files = items.filter(item => item.type === 'file')

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <FolderOpen size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Directory Listing
        </Text>
        {part.state.status === 'completed' && items.length > 0 && (
          <Text fontSize="$2" color="$green10">
            {items.length} items
          </Text>
        )}
      </XStack>

      {/* Path */}
      {path && (
        <Card padding="$3" backgroundColor="$gray2">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2" flex={1}>
              <Text fontSize="$2" color="$gray11">
                Path:
              </Text>
              <Text fontSize="$3" fontFamily="$mono" color="$color12">
                {path}
              </Text>
            </XStack>
            <Button size="$2" variant="outlined" onPress={handleCopyPath}>
              <Copy size={14} />
            </Button>
          </XStack>
        </Card>
      )}

      {/* Results */}
      {part.state.status === 'completed' && items.length > 0 && (
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$3" fontWeight="500" color="$color11">
              Contents ({directories.length} folders, {files.length} files)
            </Text>
            <Button size="$2" variant="outlined" onPress={handleCopyResults}>
              <Copy size={14} />
            </Button>
          </XStack>

          <Card padding="$3" backgroundColor="$gray1" maxHeight={300}>
            <YStack gap="$1">
              {/* Directories first */}
              {directories.map((item, index) => (
                <XStack key={`dir-${index}`} alignItems="center" gap="$2">
                  <Folder size={12} color="$blue10" />
                  <Text fontSize="$2" fontFamily="$mono" color="$color11">
                    {item.name}
                  </Text>
                  {item.modified && (
                    <Text fontSize="$1" color="$gray9" marginLeft="auto">
                      {item.modified}
                    </Text>
                  )}
                </XStack>
              ))}

              {/* Files second */}
              {files.map((item, index) => (
                <XStack key={`file-${index}`} alignItems="center" gap="$2">
                  <File size={12} color="$color10" />
                  <Text fontSize="$2" fontFamily="$mono" color="$color11">
                    {item.name}
                  </Text>
                  {item.size && (
                    <Text fontSize="$1" color="$gray9" marginLeft="$2">
                      {formatFileSize(item.size)}
                    </Text>
                  )}
                  {item.modified && (
                    <Text fontSize="$1" color="$gray9" marginLeft="auto">
                      {item.modified}
                    </Text>
                  )}
                </XStack>
              ))}
            </YStack>
          </Card>
        </YStack>
      )}

      {/* Empty directory */}
      {part.state.status === 'completed' && items.length === 0 && (
        <Card padding="$3" backgroundColor="$gray1">
          <Text fontSize="$3" color="$gray9" textAlign="center">
            Directory is empty
          </Text>
        </Card>
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

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
