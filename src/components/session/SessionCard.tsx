import { ChevronRight, Share2, Trash2 } from '@tamagui/lucide-icons'
import React from 'react'
import { Button, Card, Text, XStack, YStack } from 'tamagui'
import type { Session } from '@opencode-ai/sdk'

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
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp) // Timestamp already in milliseconds
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Get last message preview
  const getLastMessagePreview = () => {
    // SDK doesn't provide lastMessage directly
    return 'Click to view messages'
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

          {/* Updated Time */}
          <XStack alignItems="center" gap="$2" marginTop="$1">
            <Text color="$color11" fontSize="$2">
              {formatDate(session.time.updated)}
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
