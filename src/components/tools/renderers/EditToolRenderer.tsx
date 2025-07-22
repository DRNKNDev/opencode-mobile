import React, { useState } from 'react'
import { Copy, FileEdit, GitBranch, Eye } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import type { ToolPartRendererProps } from '../../../types/tools'
import { detectLanguage } from '../../../utils/languageDetection'
import { DiffViewer } from '../../code/DiffViewer'

interface EditToolRendererProps extends ToolPartRendererProps {
  isExpanded: boolean
}

export function EditToolRenderer({ tool, isExpanded }: EditToolRendererProps) {
  const { copyToClipboard } = useCopyToClipboard()
  const input = tool.state.input || {}
  const [viewMode, setViewMode] = useState<
    'unified' | 'split' | 'before' | 'after'
  >('unified')

  const handleCopyPath = () => {
    if (input.filePath) {
      copyToClipboard(input.filePath)
    }
  }

  const handleCopyDiff = () => {
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
          Edit {input.filePath ? input.filePath.split('/').pop() : 'file'}
        </Text>
      </XStack>
    )
  }

  const language = detectLanguage(input.filePath)

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
          {input.filePath || 'No file path'}
        </Text>
      </YStack>

      {input.oldString && input.newString && (
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
            oldString={input.oldString}
            newString={input.newString}
            filename={input.filePath}
            language={language}
            copyable={false}
            collapsible={false}
            modeToggleable={false}
            viewMode={viewMode}
          />
        </YStack>
      )}

      {tool.state.output && (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11">
            Result:
          </Text>
          <Text
            fontSize="$3"
            color={tool.state.status === 'completed' ? '$green11' : '$red11'}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            {tool.state.output}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
