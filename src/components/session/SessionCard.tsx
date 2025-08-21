import type { Session } from '@opencode-ai/sdk'
import { ChevronRight } from '@tamagui/lucide-icons'
import React from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'

export interface SessionCardProps {
  session: Session
  onPress: () => void
}

export function SessionCard({ session, onPress }: SessionCardProps) {
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

  return (
    <Card
      padding="$3"
      marginBottom="$2"
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

          {/* Updated Time */}
          <XStack alignItems="center" gap="$2" marginTop="$1">
            <Text color="$color11" fontSize="$2">
              {formatDate(session.time.updated)}
            </Text>
          </XStack>
        </YStack>

        {/* Right Side Actions */}
        <XStack alignItems="center" gap="$2">
          {/* Chevron Right */}
          <ChevronRight size={16} color="$color11" />
        </XStack>
      </XStack>
    </Card>
  )
}
