import { ChevronDown, ChevronUp, Copy } from '@tamagui/lucide-icons'
import { Button, Text, XStack, YStack } from 'tamagui'
import type { ToolExecutionCardProps } from '../../types/tools'
import { BashToolRenderer } from './renderers/BashToolRenderer'
import { EditToolRenderer } from './renderers/EditToolRenderer'
import { GrepToolRenderer } from './renderers/GrepToolRenderer'
import { ReadToolRenderer } from './renderers/ReadToolRenderer'
import { TodoWriteToolRenderer } from './renderers/TodoWriteToolRenderer'
import { WebFetchToolRenderer } from './renderers/WebFetchToolRenderer'
import { WriteToolRenderer } from './renderers/WriteToolRenderer'

export function ToolExecutionCard({
  tool,
  isExpanded = false,
  onToggleExpanded,
  onCopy,
  maxHeight = 700,
}: ToolExecutionCardProps) {
  // DEBUG: Log what data ToolExecutionCard receives
  console.log('🎯 ToolExecutionCard received:', {
    toolId: tool.id,
    toolName: tool.tool,
    toolType: tool.type,
    toolState: tool.state,
    isExpanded,
    fullTool: tool
  })
  const getStatusColor = () => {
    switch (tool.state.status) {
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
    const input = tool.state.input || {}
    const output = tool.state.output || ''

    switch (tool.type) {
      case 'read':
        const readLines = output ? output.split('\n').length : 0
        const readFileName = input.filePath?.split('/').pop() || 'file'
        return readLines > 1
          ? `Read ${readFileName} (${readLines} lines)`
          : `Read ${readFileName}`
      case 'write':
        const writeLines = output ? output.split('\n').length : 0
        const writeFileName = input.filePath?.split('/').pop() || 'file'
        return writeLines > 1
          ? `Write ${writeFileName} (${writeLines} lines)`
          : `Write ${writeFileName}`
      case 'edit':
        const editFileName = input.filePath?.split('/').pop() || 'file'
        if (input.oldString && input.newString) {
          const oldLines = input.oldString.split('\n').length
          const newLines = input.newString.split('\n').length
          const added = Math.max(0, newLines - oldLines)
          const removed = Math.max(0, oldLines - newLines)
          if (added > 0 || removed > 0) {
            return `Edit ${editFileName} (+${added} -${removed} lines)`
          }
        }
        return `Edit ${editFileName}`
      case 'bash':
        return `Run ${input.command || 'command'}`
      case 'grep':
        const results = tool.state.output
          ? tool.state.output
              .trim()
              .split('\n')
              .filter(line => line.trim()).length
          : 0
        return `Search "${input.pattern}" (${results} results)`
      case 'webfetch':
        return `Fetch ${input.url || 'URL'}`
      case 'todowrite':
        return `Update todos (${input.todos?.length || 0} items)`
      default:
        return tool.tool || 'Unknown tool'
    }
  }

  const renderToolContent = () => {
    const commonProps = { tool, onCopy, isExpanded }

    switch (tool.type) {
      case 'read':
        return <ReadToolRenderer {...commonProps} />
      case 'bash':
        return <BashToolRenderer {...commonProps} />
      case 'write':
        return <WriteToolRenderer {...commonProps} />
      case 'edit':
        return <EditToolRenderer {...commonProps} />
      case 'webfetch':
        return <WebFetchToolRenderer {...commonProps} />
      case 'todowrite':
        return <TodoWriteToolRenderer {...commonProps} />
      case 'grep':
        return <GrepToolRenderer {...commonProps} />
      default:
        return (
          <YStack gap="$2">
            <Text fontSize="$3" color="$color11">
              Output:
            </Text>
            <Text fontFamily="$mono" fontSize="$3" color="$color">
              {tool.state.output || 'No output available'}
            </Text>
          </YStack>
        )
    }
  }

  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderRadius="$2"
      borderWidth={0.5}
      borderColor="$borderColor"
      marginVertical="$2"
      overflow="hidden"
    >
      {/* Tool Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$3"
        backgroundColor="$backgroundPress"
        pressStyle={{ backgroundColor: '$backgroundHover' }}
        onPress={() => onToggleExpanded(tool.id)}
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <YStack
            width={8}
            height={8}
            borderRadius={4}
            backgroundColor={getStatusColor()}
            flexShrink={0}
          />
          <Text fontSize="$3" color="$color" flex={1} numberOfLines={1}>
            {getToolInfo()}
          </Text>
        </XStack>

        {isExpanded ? (
          <ChevronUp size={16} color="$color11" />
        ) : (
          <ChevronDown size={16} color="$color11" />
        )}
      </XStack>

      {/* Tool Content */}
      {isExpanded && (
        <YStack padding="$3" maxHeight={maxHeight}>
          {renderToolContent()}

          {/* Metadata */}
          {tool.state.metadata && (
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginTop="$2"
              paddingTop="$2"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <Text fontSize="$2" color="$color11">
                Duration: {tool.state.metadata.duration || 'N/A'}
              </Text>

              {onCopy && (
                <Button
                  size="$2"
                  chromeless
                  icon={Copy}
                  onPress={() => onCopy(tool.state.output)}
                  color="$color11"
                />
              )}
            </XStack>
          )}
        </YStack>
      )}
    </YStack>
  )
}
