import { useState } from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { Message, MessagePart } from '../../services/types'
import type { ToolPart } from '../../types/tools'
import { CodeBlock } from '../code/CodeBlock'
import { ToolExecutionCard } from '../tools/ToolExecutionCard'

export interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const { copyToClipboard } = useCopyToClipboard()
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleToggleToolExpanded = (toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }

  const renderMessagePart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case 'code':
        return (
          <CodeBlock
            key={index}
            code={part.content}
            language={part.language || 'text'}
            showLineNumbers={true}
          />
        )
      case 'tool_execution':
        if (part.toolResult) {
          const toolPart: ToolPart = {
            id: `${message.id}-tool-${index}`,
            tool: part.toolName || 'unknown',
            type: (part.toolName as any) || 'bash',
            state: {
              status: 'completed',
              input: part.toolResult.input || {},
              output: part.toolResult.output || part.content,
              error: part.toolResult.error,
            },
          }

          return (
            <ToolExecutionCard
              key={index}
              tool={toolPart}
              isExpanded={expandedTools.has(toolPart.id)}
              onToggleExpanded={handleToggleToolExpanded}
              onCopy={copyToClipboard}
            />
          )
        }
        return null
      default:
        return (
          <Text
            key={index}
            color={isUser ? 'white' : '$color'}
            fontSize="$4"
            lineHeight="$4"
          >
            {part.content}
          </Text>
        )
    }
  }

  // Separate tool executions from other content
  const toolParts =
    message.parts?.filter(part => part.type === 'tool_execution') || []
  const nonToolParts =
    message.parts?.filter(part => part.type !== 'tool_execution') || []

  return (
    <YStack marginBottom="$3" gap="$2">
      {/* Regular message content */}
      <XStack
        justifyContent={isUser ? 'flex-end' : 'flex-start'}
        paddingHorizontal="$4"
      >
        <YStack
          maxWidth={isUser ? '80%' : '100%'}
          alignItems={isUser ? 'flex-end' : 'flex-start'}
        >
          <YStack gap="$2" maxWidth="100%">
            {nonToolParts.length > 0 ? (
              <YStack>
                {nonToolParts.map((part, index) =>
                  renderMessagePart(part, index)
                )}
                <XStack
                  justifyContent={isUser ? 'flex-end' : 'flex-start'}
                  marginTop="$1"
                >
                  <Text
                    fontSize="$1"
                    color={isUser ? 'rgba(255,255,255,0.7)' : '$color10'}
                    opacity={0.8}
                  >
                    {formatTime(message.timestamp)}
                    {message.status === 'sending' ? ' • Sending...' : ''}
                    {message.status === 'error' ? ' • Failed' : ''}
                  </Text>
                </XStack>
              </YStack>
            ) : !message.parts || message.parts.length === 0 ? (
              <Card
                padding="$3"
                backgroundColor={isUser ? '$blue10' : 'transparent'}
                borderRadius="$2"
                maxWidth="100%"
              >
                <Text
                  color={isUser ? 'white' : '$color'}
                  fontSize="$4"
                  lineHeight="$4"
                >
                  {message.content}
                </Text>
                <XStack
                  justifyContent={isUser ? 'flex-end' : 'flex-start'}
                  marginTop="$1"
                >
                  <Text
                    fontSize="$1"
                    color={isUser ? 'rgba(255,255,255,0.7)' : '$color10'}
                    opacity={0.8}
                  >
                    {formatTime(message.timestamp)}
                    {message.status === 'sending' ? ' • Sending...' : ''}
                    {message.status === 'error' ? ' • Failed' : ''}
                  </Text>
                </XStack>
              </Card>
            ) : null}
          </YStack>
        </YStack>
      </XStack>

      {/* Tool execution cards - full width */}
      {toolParts.length > 0 && (
        <YStack paddingHorizontal="$4" gap="$2">
          {toolParts.map((part, index) => renderMessagePart(part, index))}
        </YStack>
      )}
    </YStack>
  )
}
