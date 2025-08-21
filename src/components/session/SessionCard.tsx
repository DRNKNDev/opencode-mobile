import type { Session } from '@opencode-ai/sdk'
import { ChevronRight } from '@tamagui/lucide-icons'
import React from 'react'
import { Card, Text, XStack, YStack } from 'tamagui'
import { formatContextualDate } from '../../utils/dateFormatting'
import type { TimePeriod } from '../../utils/sessionGrouping'

export interface SessionCardProps {
  session: Session
  onPress: () => void
  groupType?: TimePeriod
}

export function SessionCard({ session, onPress, groupType }: SessionCardProps) {
  const formatDate = (timestamp: number) => {
    return formatContextualDate(timestamp, groupType)
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
