import { X } from '@tamagui/lucide-icons'
import React from 'react'
import { Button, ScrollView, Text, XStack } from 'tamagui'
import { getFileName } from '../../utils/files'
import type { ContextItem } from '../modals/ContextSelector'

export interface SelectedContextDisplayProps {
  selectedItems: ContextItem[]
  onRemoveItem: (item: ContextItem) => void
}

export function SelectedContextDisplay({
  selectedItems,
  onRemoveItem,
}: SelectedContextDisplayProps) {
  // Don't render anything if no items are selected
  if (selectedItems.length === 0) {
    return null
  }

  // Format display text for different item types
  const getItemDisplayText = (item: ContextItem): string => {
    if (item.type === 'file') {
      return getFileName(item.path)
    } else {
      // Text match: show as "filename.ext:L2-10"
      const filename = getFileName(item.path)
      return `${filename}:L${item.start}${item.end !== item.start ? `-${item.end}` : ''}`
    }
  }

  // Create a unique key for each item for React reconciliation
  const getItemKey = (item: ContextItem, index: number): string => {
    if (item.type === 'file') {
      return `file-${item.path}`
    } else {
      return `text-${item.path}-${item.start}-${item.end}-${index}`
    }
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
      maxHeight={32}
    >
      <XStack gap="$2" alignItems="center">
        {selectedItems.map((item, index) => (
          <XStack
            key={getItemKey(item, index)}
            alignItems="center"
            backgroundColor="$background"
            borderRadius="$3"
            paddingHorizontal="$2"
            paddingVertical="$1.5"
            maxWidth={200}
          >
            <Text
              fontSize="$2"
              color="$color"
              numberOfLines={1}
              flexShrink={1}
              marginRight="$1"
            >
              {getItemDisplayText(item)}
            </Text>
            <Button
              unstyled
              size="$1"
              onPress={() => onRemoveItem(item)}
              backgroundColor="transparent"
              borderRadius="$2"
              alignItems="center"
              justifyContent="center"
              width={16}
              height={16}
            >
              <X size={12} color="$color11" />
            </Button>
          </XStack>
        ))}
      </XStack>
    </ScrollView>
  )
}
