import React, { useState } from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { SessionMessageResponse, Part, ToolPart } from '@opencode-ai/sdk'
import { debug } from '../../utils/debug'
import { ToolExecutionCard } from '../tools/ToolExecutionCard'
import { AttachmentRenderer } from './AttachmentRenderer'
import { MarkdownRenderer } from './MarkdownRenderer'

export interface MessageBubbleProps {
  message: SessionMessageResponse
}

// Helper function to format message time (simplified version for SDK compatibility)
const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.info.role === 'user'
  const { copyToClipboard } = useCopyToClipboard()
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  // Extract timestamp from message.info
  const timestamp = new Date(message.info.time.created * 1000)

  const shouldRenderPart = (part: Part): boolean => {
    // Filter out synthetic text parts and step parts that shouldn't be shown
    if (part.type === 'step-start' || part.type === 'step-finish') {
      return false
    }
    // Filter out synthetic text parts if they exist
    if (part.type === 'text' && 'synthetic' in part && part.synthetic) {
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

  const renderMessagePart = (part: Part, index: number) => {
    debug.log('MessageBubble renderMessagePart:', {
      index,
      messageId: message.info.id,
      partType: part.type,
      partId: part.id,
      fullPart: part,
    })

    switch (part.type) {
      case 'text':
        const textContent = 'text' in part ? part.text : ''
        return (
          <Card
            key={index}
            padding={isUser ? '$3' : '$0'}
            backgroundColor={isUser ? '$blue10' : 'transparent'}
            borderRadius="$2"
            maxWidth="100%"
          >
            {isUser ? (
              <Text color="white" fontSize="$4" lineHeight="$4">
                {textContent}
              </Text>
            ) : (
              <YStack width="100%">
                <MarkdownRenderer content={textContent} />
              </YStack>
            )}
          </Card>
        )

      case 'tool':
        debug.log('Tool part detected:', {
          tool: 'tool' in part ? part.tool : 'unknown',
          callId: 'callID' in part ? part.callID : 'unknown',
          state: 'state' in part ? part.state : null,
        })

        // Use SDK ToolPart directly
        const toolPart = part as ToolPart
        debug.log('SDK ToolPart for ToolExecutionCard:', toolPart)

        return (
          <ToolExecutionCard
            key={index}
            part={toolPart}
            isExpanded={expandedTools.has(toolPart.id)}
            onToggleExpanded={handleToggleToolExpanded}
            onCopy={copyToClipboard}
          />
        )
        return null

      case 'file':
        return <AttachmentRenderer key={index} files={[part]} />

      case 'reasoning':
        // Show reasoning parts as markdown for now
        const reasoningContent = 'text' in part ? part.text : ''
        return (
          <Card
            key={index}
            padding="$3"
            backgroundColor="$gray3"
            borderRadius="$2"
            maxWidth="100%"
            borderLeftWidth={3}
            borderLeftColor="$blue8"
          >
            <Text
              fontSize="$2"
              color="$blue10"
              fontWeight="bold"
              marginBottom="$2"
            >
              Reasoning
            </Text>
            <MarkdownRenderer content={reasoningContent} />
          </Card>
        )

      default:
        debug.warn('Unknown part type:', part.type)
        return null
    }
  }

  const renderPartWithLayout = (part: Part, index: number) => {
    if (part.type === 'tool') {
      // Tool executions render full width
      return (
        <YStack
          key={`${message.info.id}-part-${index}`}
          paddingHorizontal="$4"
          marginBottom="$2"
        >
          {renderMessagePart(part, index)}
        </YStack>
      )
    } else {
      // Text/code/reasoning parts render with user/assistant alignment
      return (
        <XStack
          key={`${message.info.id}-part-${index}`}
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

  // Collect all text parts to create a fallback content
  const textParts =
    message.parts?.filter(part => part.type === 'text' && 'text' in part) || []
  const fallbackContent = textParts
    .map(part => ('text' in part ? part.text : ''))
    .join(' ')

  return (
    <YStack marginBottom="$3" gap="$1">
      {message.parts && message.parts.length > 0 ? (
        <>
          {/* Render all parts in original sequential order, filtering out synthetic and step parts */}
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
                {formatMessageTime(timestamp)}
              </Text>
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
              padding={isUser ? '$3' : '$0'}
              backgroundColor={isUser ? '$blue10' : 'transparent'}
              borderRadius="$2"
              maxWidth="100%"
            >
              {isUser ? (
                <Text color="white" fontSize="$4" lineHeight="$4">
                  {fallbackContent || 'No content'}
                </Text>
              ) : (
                <YStack width="100%">
                  <MarkdownRenderer content={fallbackContent || 'No content'} />
                </YStack>
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
                  {formatMessageTime(timestamp)}
                </Text>
              </XStack>
            </Card>
          </YStack>
        </XStack>
      )}
    </YStack>
  )
}
