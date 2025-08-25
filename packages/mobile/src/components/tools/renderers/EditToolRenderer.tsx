import React, { useState } from 'react'
import { Copy, FileEdit, GitBranch, Eye } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack, ScrollView } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPart } from '@opencode-ai/sdk'
import { detectLanguage } from '../../../utils/languageDetection'
import { DiffViewer } from '../../code/DiffViewer'

interface EditToolRendererProps {
  part: ToolPart
  onCopy?: (content: string) => void
  isExpanded: boolean
}

export function EditToolRenderer({ part, isExpanded }: EditToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()

  // Get file path from input when available
  const getFilePath = (): string => {
    switch (part.state.status) {
      case 'completed':
      case 'running':
      case 'error':
        return (
          (part.state.input as { filePath?: string })?.filePath ||
          'Unknown file'
        )
      default:
        return 'Unknown file'
    }
  }

  const filePath = getFilePath()
  const [viewMode, setViewMode] = useState<
    'unified' | 'split' | 'before' | 'after'
  >('unified')

  const handleCopyPath = () => {
    copyToClipboard(filePath)
  }

  const handleCopyDiff = () => {
    if (
      part.state.status !== 'completed' &&
      part.state.status !== 'running' &&
      part.state.status !== 'error'
    ) {
      return
    }

    const input = part.state.input as { oldString?: string; newString?: string }

    if (viewMode === 'before' && input.oldString) {
      copyToClipboard(input.oldString)
    } else if (viewMode === 'after' && input.newString) {
      copyToClipboard(input.newString)
    } else if (input.oldString && input.newString) {
      // For unified/split modes, copy both old and new strings
      copyToClipboard(
        `--- Before\n${input.oldString}\n\n+++ After\n${input.newString}`
      )
    }
  }

  const handleModeToggle = () => {
    const modes: ('unified' | 'split' | 'before' | 'after')[] = [
      'unified',
      'split',
      'before',
      'after',
    ]
    const currentIndex = modes.indexOf(viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setViewMode(modes[nextIndex])
  }

  if (!isExpanded) {
    return (
      <XStack alignItems="center" gap="$2">
        <FileEdit size={16} color="$color11" />
        <Text fontSize="$3" color="$color11" flex={1} numberOfLines={1}>
          Edit{' '}
          {filePath !== 'Unknown file' ? filePath.split('/').pop() : 'file'}
        </Text>
      </XStack>
    )
  }

  const language = detectLanguage(filePath)

  return (
    <YStack gap="$3">
      <XStack alignItems="center" gap="$2">
        <FileEdit size={16} color="$color11" />
        <Text fontSize="$3" fontWeight="600" color="$color12">
          Edit File
        </Text>
      </XStack>

      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize="$2" color="$color11">
            File Path:
          </Text>
          <Button
            size="$2"
            chromeless
            icon={Copy}
            onPress={handleCopyPath}
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
          numberOfLines={1}
        >
          {filePath}
        </Text>
      </YStack>

      {part.state.status === 'pending' && (
        <Text fontSize="$3" color="$color11">
          Preparing to edit file...
        </Text>
      )}

      {part.state.status === 'running' && (
        <Text fontSize="$3" color="$color11">
          Editing file...
        </Text>
      )}

      {part.state.status === 'error' && (
        <Text fontSize="$3" color="$red11">
          Failed to edit: {part.state.error || 'Unknown error'}
        </Text>
      )}

      {part.state.status === 'completed' &&
        (() => {
          const input = part.state.input as {
            oldString?: string
            newString?: string
          }
          return input.oldString && input.newString
        })() && (
          <YStack gap="$2">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$2" color="$color11">
                File Changes:
              </Text>
              <XStack alignItems="center" gap="$2">
                <Button
                  size="$2"
                  chromeless
                  icon={viewMode === 'unified' ? GitBranch : Eye}
                  onPress={handleModeToggle}
                  pressStyle={{ backgroundColor: '$backgroundPress' }}
                />
                <Button
                  size="$2"
                  chromeless
                  icon={Copy}
                  onPress={handleCopyDiff}
                  pressStyle={{ backgroundColor: '$backgroundPress' }}
                />
              </XStack>
            </XStack>
            <DiffViewer
              oldString={
                part.state.status === 'completed'
                  ? (part.state.input as { oldString?: string }).oldString || ''
                  : ''
              }
              newString={
                part.state.status === 'completed'
                  ? (part.state.input as { newString?: string }).newString || ''
                  : ''
              }
              filename={filePath}
              language={language}
              copyable={false}
              collapsible={false}
              modeToggleable={false}
              viewMode={viewMode}
            />
          </YStack>
        )}

      {part.state.status === 'completed' && part.state.output && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Result:
          </Text>
          <ScrollView
            maxHeight={200}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontFamily="$mono" color="$green11">
              {part.state.output}
            </Text>
          </ScrollView>
        </YStack>
      )}
    </YStack>
  )
}
