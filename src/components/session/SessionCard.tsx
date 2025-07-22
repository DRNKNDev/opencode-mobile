import { ChevronRight, Share2, Trash2 } from '@tamagui/lucide-icons'
import React from 'react'
import { Button, Card, Circle, Text, XStack, YStack } from 'tamagui'
import type { Session } from '../../services/types'

export interface SessionCardProps {
  session: Session
  onPress: () => void
  onShare?: () => void
  onDelete?: () => void
  isDeleting?: boolean
}

export function SessionCard({
  session,
  onPress,
  onShare,
  onDelete,
  isDeleting,
}: SessionCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    )

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Determine status color based on session state
  const getStatusColor = () => {
    // TODO: Connect to actual Opencode SDK session status
    if (session.status === 'active') return '$green10'
    if (session.status === 'error') return '$red10'
    if (session.status === 'idle') return '$yellow10'
    return '$color11' // default/completed
  }

  // Get model display name
  const getModelName = () => {
    // TODO: Get from last AssistantMessage.modelID via SDK
    const modelMap: Record<string, string> = {
      'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
      'claude-3.5-haiku': 'Claude 3.5 Haiku',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o mini',
    }
    return session.modelName
      ? modelMap[session.modelName] || session.modelName
      : 'Claude 3.5 Sonnet'
  }

  // Get last message preview
  const getLastMessagePreview = () => {
    // TODO: Get from last TextPart.text via SDK SessionMessagesResponse
    return session.lastMessage || 'No messages yet'
  }

  return (
    <Card
      padding="$4"
      marginBottom="$2"
      backgroundColor="$background"
      borderWidth={0.5}
      borderColor="$borderColor"
      borderRadius="$2"
      pressStyle={{
        backgroundColor: '$backgroundPress',
        borderColor: '$blue10',
        scale: 0.98,
      }}
      onPress={onPress}
      animation="quick"
    >
      <XStack alignItems="center" gap="$3">
        {/* Status Dot */}
        <Circle size={12} backgroundColor={getStatusColor()} />

        {/* Main Content */}
        <YStack flex={1} gap="$1">
          {/* Title */}
          <Text fontWeight="600" color="$color" numberOfLines={1} fontSize="$4">
            {session.title}
          </Text>

          {/* Last Message Preview */}
          <Text color="$color11" fontSize="$3" numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>

          {/* Model Name and Updated Time */}
          <XStack alignItems="center" gap="$2" marginTop="$1">
            <Text color="$color11" fontSize="$2" fontWeight="500">
              {getModelName()}
            </Text>
            <Text color="$color11" fontSize="$2">
              • {formatDate(session.updatedAt)}
            </Text>
          </XStack>
        </YStack>

        {/* Right Side Actions */}
        <XStack alignItems="center" gap="$2">
          {/* Delete Button */}
          {onDelete && (
            <Button
              size="$3"
              chromeless
              icon={Trash2}
              disabled={isDeleting}
              onPress={e => {
                e.stopPropagation()
                onDelete()
              }}
              theme="red"
            />
          )}

          {/* Share Button */}
          {onShare && (
            <Button
              size="$3"
              chromeless
              icon={Share2}
              onPress={e => {
                e.stopPropagation()
                onShare()
              }}
            />
          )}

          {/* Chevron Right */}
          <ChevronRight size={16} color="$color11" />
        </XStack>
      </XStack>
    </Card>
  )
}
