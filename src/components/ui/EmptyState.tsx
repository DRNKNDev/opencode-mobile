import { YStack, Text } from 'tamagui'
import { ReactNode } from 'react'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  maxWidth?: number
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  maxWidth = 400,
}: EmptyStateProps) {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$4"
      padding="$4"
      maxWidth={maxWidth}
      alignSelf="center"
    >
      {icon}

      <YStack alignItems="center" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          {title}
        </Text>

        <Text fontSize="$4" color="$color11" textAlign="center" lineHeight="$5">
          {description}
        </Text>
      </YStack>

      {action && action}
    </YStack>
  )
}
