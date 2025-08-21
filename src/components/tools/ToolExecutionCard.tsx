import type { ToolPart } from '@opencode-ai/sdk'
import { ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import React from 'react'
import { Text, XStack, YStack } from 'tamagui'

// Import renderers
import { BashToolRenderer } from './renderers/BashToolRenderer'
import { EditToolRenderer } from './renderers/EditToolRenderer'
import { GlobToolRenderer } from './renderers/GlobToolRenderer'
import { GrepToolRenderer } from './renderers/GrepToolRenderer'
import { ListToolRenderer } from './renderers/ListToolRenderer'
import { ReadToolRenderer } from './renderers/ReadToolRenderer'
import { TaskToolRenderer } from './renderers/TaskToolRenderer'
import { TodoReadToolRenderer } from './renderers/TodoReadToolRenderer'
import { TodoWriteToolRenderer } from './renderers/TodoWriteToolRenderer'
import { WebFetchToolRenderer } from './renderers/WebFetchToolRenderer'
import { WriteToolRenderer } from './renderers/WriteToolRenderer'

interface ToolExecutionCardProps {
  part: ToolPart
  isExpanded?: boolean
  onToggleExpanded: (toolId: string) => void
  onCopy?: (content: string) => void
  maxHeight?: number
}

export function ToolExecutionCard({
  part,
  isExpanded = false,
  onToggleExpanded,
  onCopy,
  maxHeight = 700,
}: ToolExecutionCardProps) {
  if (!part) {
    return null
  }

  const getStatusColor = () => {
    switch (part.state.status) {
      case 'completed':
        return '$green10'
      case 'running':
        return '$blue10'
      case 'error':
        return '$red10'
      default:
        return '$gray10'
    }
  }

  const getToolInfo = () => {
    const status = part.state.status
    const toolName = part.tool.charAt(0).toUpperCase() + part.tool.slice(1)

    // Status-based display logic
    switch (status) {
      case 'pending':
        return `${toolName} starting...`
      case 'running':
        return `${toolName} running...`
      case 'error':
        return `${toolName} failed`
      case 'completed':
        // Show detailed info for completed tools
        switch (part.tool) {
          case 'read':
            const output = part.state.output || ''
            const readLines = output.split('\n').length
            const input = part.state.input as { filePath?: string }
            const readFileName = input.filePath?.split('/').pop() || 'file'
            return readLines > 1
              ? `Read ${readFileName} (${readLines} lines)`
              : `Read ${readFileName}`
          case 'write':
            const writeOutput = part.state.output || ''
            const writeLines = writeOutput.split('\n').length
            const writeInput = part.state.input as { filePath?: string }
            const writeFileName =
              writeInput.filePath?.split('/').pop() || 'file'
            return writeLines > 1
              ? `Write ${writeFileName} (${writeLines} lines)`
              : `Write ${writeFileName}`
          case 'edit':
            const editInput = part.state.input as { filePath?: string }
            const editFileName = editInput.filePath?.split('/').pop() || 'file'
            return `Edit ${editFileName}`
          case 'bash':
            const bashInput = part.state.input as { command?: string }
            return `Run ${bashInput.command || 'command'}`
          case 'grep':
            const grepOutput = part.state.output || ''
            const results = grepOutput
              .trim()
              .split('\n')
              .filter(line => line.trim()).length
            return results > 0 ? `Found ${results} matches` : 'No matches found'
          case 'glob':
            const globOutput = part.state.output || ''
            const files = globOutput
              .trim()
              .split('\n')
              .filter(line => line.trim()).length
            return files > 0 ? `Found ${files} files` : 'No files found'
          case 'todowrite':
            const todoInput = part.state.input as { todos?: any[] }
            const todoCount = todoInput.todos?.length || 0
            return `Updated ${todoCount} todos`
          default:
            return `${toolName} completed`
        }
      default:
        return `${toolName} (${status})`
    }
  }

  const renderToolContent = () => {
    const commonProps = { part, onCopy }

    switch (part.tool) {
      case 'bash':
        return <BashToolRenderer {...commonProps} />
      case 'read':
        return <ReadToolRenderer {...commonProps} />
      case 'write':
        return <WriteToolRenderer {...commonProps} />
      case 'edit':
        return <EditToolRenderer {...commonProps} isExpanded={isExpanded} />
      case 'grep':
        return <GrepToolRenderer {...commonProps} isExpanded={isExpanded} />
      case 'glob':
        return <GlobToolRenderer {...commonProps} />
      case 'list':
        return <ListToolRenderer {...commonProps} />
      case 'task':
        return <TaskToolRenderer {...commonProps} />
      case 'todoread':
        return <TodoReadToolRenderer {...commonProps} />
      case 'todowrite':
        return (
          <TodoWriteToolRenderer {...commonProps} isExpanded={isExpanded} />
        )
      case 'webfetch':
        return <WebFetchToolRenderer {...commonProps} isExpanded={isExpanded} />
      default:
        return (
          <Text fontSize="$3" color="$color11">
            Unsupported tool: {part.tool}
          </Text>
        )
    }
  }

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$2"
      overflow="hidden"
      borderWidth={0.5}
      borderColor="$borderColor"
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        padding="$3"
        pressStyle={{ backgroundColor: '$backgroundPress' }}
        cursor="pointer"
        onPress={() => onToggleExpanded(part.id)}
      >
        <XStack alignItems="center" gap="$3" flex={1}>
          {/* Status Indicator */}
          <YStack
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor={getStatusColor()}
          />
          <Text
            fontSize="$3"
            fontWeight="500"
            color="$color12"
            flex={1}
            numberOfLines={1}
          >
            {getToolInfo()}
          </Text>
        </XStack>
        <XStack alignItems="center">
          {isExpanded ? (
            <ChevronUp size={16} color="$color11" />
          ) : (
            <ChevronDown size={16} color="$color11" />
          )}
        </XStack>
      </XStack>

      {/* Expandable Content */}
      {isExpanded && (
        <YStack padding="$3" maxHeight={maxHeight} overflow="hidden">
          {renderToolContent()}
        </YStack>
      )}
    </YStack>
  )
}
