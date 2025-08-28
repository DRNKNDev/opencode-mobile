import { openCodeService, type TextMatch } from '@/src/services/opencode'
import type { File } from '@opencode-ai/sdk'
import { Check, X } from '@tamagui/lucide-icons'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, Sheet, Text, XStack, YStack } from 'tamagui'

// Define ContextItem type as specified in the design
export type ContextItem =
  | { type: 'file'; path: string }
  | {
      type: 'text'
      path: string
      start: number
      end: number
      preview: string
      match: TextMatch
    }

export interface ContextSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onItemSelect: (item: ContextItem) => void
  onItemDeselect: (item: ContextItem) => void
  selectedItems: ContextItem[]
}

interface FileWithStatus {
  path: string
  status?: File
}

export function ContextSelector({
  open,
  onOpenChange,
  onItemSelect,
  onItemDeselect,
  selectedItems,
}: ContextSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filesList, setFilesList] = useState<FileWithStatus[]>([])
  const [textMatches, setTextMatches] = useState<TextMatch[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!openCodeService.isInitialized()) return

    setLoading(true)
    try {
      if (query.trim() === '') {
        // Empty search: load files with status
        const [files, fileStatus] = await Promise.all([
          openCodeService.findFiles(''),
          openCodeService.getFileStatus(),
        ])

        // Merge files with their status information
        const filesWithStatus: FileWithStatus[] = files.map(filePath => {
          const status = fileStatus.find(f => f.path === filePath)
          return { path: filePath, status }
        })

        setFilesList(filesWithStatus)
        setTextMatches([])
      } else {
        // Non-empty search: search BOTH files and text
        const [files, fileStatus, textMatches] = await Promise.all([
          openCodeService.findFiles(query), // Pass query to API for efficient filtering
          openCodeService.getFileStatus(),
          openCodeService.searchText(query), // Search text content
        ])

        // Merge files with their status information (no manual filtering needed)
        const filesWithStatus: FileWithStatus[] = files.map(filePath => {
          const status = fileStatus.find(f => f.path === filePath)
          return { path: filePath, status }
        })

        setFilesList(filesWithStatus)
        setTextMatches(textMatches)
      }
    } catch (error) {
      console.error('Search error:', error)
      setFilesList([])
      setTextMatches([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query)
      }, 300)
    },
    [performSearch]
  )

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      debouncedSearch(searchQuery)
    }
  }, [open, debouncedSearch, searchQuery])

  // Handle search input change
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)
      debouncedSearch(text)
    },
    [debouncedSearch]
  )

  // Check if item is selected
  const isItemSelected = useCallback(
    (item: ContextItem): boolean => {
      return selectedItems.some(selected => {
        if (selected.type !== item.type) return false
        if (selected.type === 'file' && item.type === 'file') {
          return selected.path === item.path
        }
        if (selected.type === 'text' && item.type === 'text') {
          return (
            selected.path === item.path &&
            selected.start === item.start &&
            selected.end === item.end
          )
        }
        return false
      })
    },
    [selectedItems]
  )

  // Handle item selection toggle
  const handleItemToggle = useCallback(
    (item: ContextItem) => {
      if (isItemSelected(item)) {
        onItemDeselect(item)
      } else {
        onItemSelect(item)
      }
    },
    [isItemSelected, onItemSelect, onItemDeselect]
  )

  // Get status color and indicator for files
  const getFileStatusInfo = (status?: File) => {
    if (!status) return { color: '$color', indicator: '' }

    switch (status.status) {
      case 'added':
        return { color: '$green10', indicator: `+${status.added}` }
      case 'deleted':
        return { color: '$red10', indicator: `-${status.removed}` }
      case 'modified':
        return {
          color: '$yellow10',
          indicator: `±${status.added + status.removed}`,
        }
      default:
        return { color: '$color', indicator: '' }
    }
  }

  // Render file item
  const renderFileItem = (fileWithStatus: FileWithStatus) => {
    const item: ContextItem = { type: 'file', path: fileWithStatus.path }
    const selected = isItemSelected(item)
    const { color, indicator } = getFileStatusInfo(fileWithStatus.status)

    return (
      <Button
        key={fileWithStatus.path}
        unstyled
        onPress={() => handleItemToggle(item)}
        backgroundColor={selected ? '$backgroundPress' : 'transparent'}
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        pressStyle={{ backgroundColor: '$backgroundPress' }}
        padding="$3"
        borderRadius="$2"
      >
        <XStack alignItems="center" justifyContent="space-between" flex={1}>
          <XStack alignItems="center" flex={1}>
            {selected && <Check size={16} color="$blue10" marginRight="$2" />}
            <Text color={color} fontSize="$3" numberOfLines={1} flex={1}>
              {fileWithStatus.path}
            </Text>
          </XStack>
          {indicator && (
            <Text color={color} fontSize="$2" fontWeight="bold">
              {indicator}
            </Text>
          )}
        </XStack>
      </Button>
    )
  }

  // Render text match item
  const renderTextMatchItem = (textMatch: TextMatch, index: number) => {
    const item: ContextItem = {
      type: 'text',
      path: textMatch.path.text,
      start: textMatch.line_number,
      end: textMatch.line_number,
      preview: textMatch.lines.text.trim(),
      match: textMatch,
    }
    const selected = isItemSelected(item)

    return (
      <Button
        key={`${textMatch.path.text}-${index}`}
        unstyled
        onPress={() => handleItemToggle(item)}
        backgroundColor={selected ? '$backgroundPress' : 'transparent'}
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        pressStyle={{ backgroundColor: '$backgroundPress' }}
        padding="$3"
        borderRadius="$2"
      >
        <XStack alignItems="center" flex={1}>
          {selected && <Check size={16} color="$color" marginRight="$2" />}
          <YStack flex={1}>
            <XStack alignItems="center" marginBottom="$1">
              <Text fontSize="$3" fontWeight="500">
                {textMatch.path.text}
              </Text>
              <Text fontSize="$2" color="$color10" marginLeft="$2">
                :L{textMatch.line_number}
              </Text>
            </XStack>
            <Text fontSize="$2" color="$color11" numberOfLines={2}>
              {textMatch.lines.text.trim()}
            </Text>
          </YStack>
        </XStack>
      </Button>
    )
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[60]}
      dismissOnSnapToBottom
      animation="medium"
      zIndex={100_000}
      moveOnKeyboardChange
    >
      <Sheet.Overlay
        backgroundColor="$backgroundTransparent"
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />

      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle />

        <YStack gap="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="600" color="$color">
              Add Context
            </Text>
            <Button size="$3" chromeless icon={X} onPress={handleClose} />
          </XStack>

          {/* Search Input */}
          <Input
            placeholder="Search files or text..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            size="$3"
            borderWidth={0}
            focusStyle={{ borderWidth: 0 }}
            backgroundColor="$backgroundHover"
          />

          {/* Results */}
          <Sheet.ScrollView
            height={400}
            flex={0}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <YStack gap="$1" paddingRight="$2">
              {loading ? (
                <Text textAlign="center" padding="$4" color="$color10">
                  Searching...
                </Text>
              ) : (
                <>
                  {/* Files Section */}
                  {filesList.length > 0 && (
                    <YStack gap="$1">
                      <Text
                        fontSize="$2"
                        fontWeight="600"
                        color="$color11"
                        padding="$2"
                      >
                        Files
                      </Text>
                      {filesList.map(renderFileItem)}
                    </YStack>
                  )}

                  {/* Text Matches Section */}
                  {textMatches.length > 0 && (
                    <YStack gap="$1">
                      <Text
                        fontSize="$2"
                        fontWeight="600"
                        color="$color11"
                        padding="$2"
                      >
                        Text Matches
                      </Text>
                      {textMatches.map(renderTextMatchItem)}
                    </YStack>
                  )}

                  {/* No Results */}
                  {!loading &&
                    filesList.length === 0 &&
                    textMatches.length === 0 && (
                      <Text
                        textAlign="center"
                        padding="$4"
                        color="$color10"
                        fontSize="$3"
                      >
                        No results found
                      </Text>
                    )}
                </>
              )}
            </YStack>
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
