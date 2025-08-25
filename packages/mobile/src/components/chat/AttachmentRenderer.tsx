import { Paperclip } from '@tamagui/lucide-icons'
import React from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import type { Part } from '@opencode-ai/sdk'
import { getFileName, isImageMimeType } from '../../utils/fileUtils'

export interface AttachmentRendererProps {
  files: Part[]
}

function isPdfFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.pdf')
}

export function AttachmentRenderer({ files }: AttachmentRendererProps) {
  if (!files || files.length === 0) {
    return null
  }

  // Filter to only show file parts that are images and PDFs
  const visibleFiles = files.filter(file => {
    if (file.type !== 'file') return false
    const filename = 'filename' in file ? file.filename || '' : ''
    const mimeType = 'mime' in file ? file.mime : undefined
    return isImageMimeType(mimeType) || isPdfFile(filename)
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
          const filename = getFileName(
            'filename' in file ? file.filename || '' : 'Unknown file'
          )
          const isImage = isImageMimeType(
            'mime' in file ? file.mime : undefined
          )

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
