import { Paperclip } from '@tamagui/lucide-icons'
import React from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import type { MessagePart } from '../../services/types'
import { getFileName, isImageMimeType } from '../../utils/fileUtils'

export interface AttachmentRendererProps {
  files: MessagePart[]
}

function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf')
}

export function AttachmentRenderer({ files }: AttachmentRendererProps) {
  if (!files || files.length === 0) {
    return null
  }

  // Filter to only show images and PDFs
  const visibleFiles = files.filter(file => {
    const filename = file.filename || ''
    return isImageMimeType(file.mime) || isPdfFile(filename)
  })

  // If no visible files, don't render anything
  if (visibleFiles.length === 0) {
    return null
  }

  let imageCounter = 0
  let fileCounter = 0

  return (
    <Card
      padding="$3"
      backgroundColor="$backgroundStrong"
      width="100%"
      minWidth={300}
    >
      {/* Header */}
      <XStack alignItems="center" gap="$2" marginBottom="$3">
        <Paperclip size={16} color="$gray11" />
        <Text fontSize="$2" color="$gray11" fontWeight="600">
          Attachments ({visibleFiles.length})
        </Text>
      </XStack>

      {/* File List */}
      <YStack gap="$2">
        {visibleFiles.map((file, index) => {
          const filename = getFileName(file.filename || '')
          const isImage = isImageMimeType(file.mime)

          if (isImage) {
            imageCounter++
            return (
              <Text key={index} fontSize="$3" color="$color">
                [Image #{imageCounter}] {filename}
              </Text>
            )
          } else {
            fileCounter++
            return (
              <Text key={index} fontSize="$3" color="$color">
                [File #{fileCounter}] {filename}
              </Text>
            )
          }
        })}
      </YStack>
    </Card>
  )
}
