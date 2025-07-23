import React, { useState } from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { Message, MessagePart } from '../../services/types'
import type { ToolPart } from '../../types/tools'
import { debug } from '../../utils/debug'
import { isPlanMode, formatMessageTime } from '../../utils/planMode'
import { CodeBlock } from '../code/CodeBlock'
import { ToolExecutionCard } from '../tools/ToolExecutionCard'

export interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const { copyToClipboard } = useCopyToClipboard()
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const isInPlanMode = isPlanMode(message)

  const shouldRenderPart = (part: MessagePart): boolean => {
    // Filter out all synthetic text parts (system reminders, tool execution descriptions, file contents, etc.)
    if (part.synthetic && part.type === 'text') {
      return false
    }
    return true
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
    debug.log('MessageBubble renderMessagePart:', {
      index,
      messageId: message.id,
      partType: part.type,
      partContent: part.content?.substring(0, 100) + '...',
      toolName: part.toolName,
      toolResult: part.toolResult,
      fullPart: part,
    })

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
        debug.log('Tool execution part detected:', {
          toolName: part.toolName,
          hasToolResult: !!part.toolResult,
          toolResult: part.toolResult,
        })

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

          debug.log('Constructed toolPart for ToolExecutionCard:', toolPart)

          return (
            <ToolExecutionCard
              key={index}
              tool={toolPart}
              isExpanded={expandedTools.has(toolPart.id)}
              onToggleExpanded={handleToggleToolExpanded}
              onCopy={copyToClipboard}
            />
          )
        } else {
          debug.warn('Tool execution part has no toolResult, returning null')
        }
        return null
      case 'text':
      default:
        return (
          <Card
            key={index}
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
              {part.content}
            </Text>
          </Card>
        )
    }
  }

  const renderPartWithLayout = (part: MessagePart, index: number) => {
    if (part.type === 'tool_execution') {
      // Tool executions render full width
      return (
        <YStack
          key={`${message.id}-part-${index}`}
          paddingHorizontal="$4"
          marginBottom="$2"
        >
          {renderMessagePart(part, index)}
        </YStack>
      )
    } else {
      // Text/code parts render with user/assistant alignment
      return (
        <XStack
          key={`${message.id}-part-${index}`}
          justifyContent={isUser ? 'flex-end' : 'flex-start'}
          paddingHorizontal="$4"
          marginBottom="$2"
        >
          <YStack
            maxWidth={isUser ? '80%' : '100%'}
            alignItems={isUser ? 'flex-end' : 'flex-start'}
          >
            {renderMessagePart(part, index)}
          </YStack>
        </XStack>
      )
    }
  }

  return (
    <YStack marginBottom="$3" gap="$1">
      {message.parts && message.parts.length > 0 ? (
        <>
          {/* Render all parts in original sequential order, filtering out all synthetic text parts */}
          {message.parts
            .filter(shouldRenderPart)
            .map((part, index) => renderPartWithLayout(part, index))}

          {/* Timestamp at the end */}
          <XStack
            justifyContent={isUser ? 'flex-end' : 'flex-start'}
            paddingHorizontal="$4"
            marginTop="$1"
          >
            <XStack alignItems="center" gap="$1">
              <Text
                fontSize="$1"
                color={isUser ? 'rgba(255,255,255,0.7)' : '$color10'}
                opacity={0.8}
              >
                {formatMessageTime(message.timestamp, isInPlanMode)}{' '}
              </Text>
              {message.status === 'sending' && (
                <Text
                  fontSize="$1"
                  color={isUser ? 'rgba(255,255,255,0.7)' : '$color10'}
                  opacity={0.8}
                >
                  • Sending...
                </Text>
              )}
              {message.status === 'error' && (
                <Text fontSize="$1" color="$red10" opacity={0.9}>
                  • Failed
                </Text>
              )}
            </XStack>
          </XStack>
        </>
      ) : (
        /* Fallback for messages without parts */
        <XStack
          justifyContent={isUser ? 'flex-end' : 'flex-start'}
          paddingHorizontal="$4"
        >
          <YStack
            maxWidth={isUser ? '80%' : '100%'}
            alignItems={isUser ? 'flex-end' : 'flex-start'}
          >
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
                  {formatMessageTime(message.timestamp, isInPlanMode)}
                  {message.status === 'sending' ? ' • Sending...' : ''}
                  {message.status === 'error' ? ' • Failed' : ''}
                </Text>
              </XStack>
            </Card>
          </YStack>
        </XStack>
      )}
    </YStack>
  )
}
