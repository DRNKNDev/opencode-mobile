import React, { useEffect, useState } from 'react'
import { YStack, XStack } from 'tamagui'

export interface SkeletonLoaderProps {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  animated?: boolean
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = '$2',
  animated = true,
}: SkeletonLoaderProps) {
  const [opacity, setOpacity] = useState(0.3)

  useEffect(() => {
    if (!animated) return

    const interval = setInterval(() => {
      setOpacity(prev => (prev === 0.3 ? 0.7 : 0.3))
    }, 800)

    return () => clearInterval(interval)
  }, [animated])

  return (
    <YStack
      width={width}
      height={height}
      backgroundColor="$color5"
      borderRadius={borderRadius}
      opacity={opacity}
      animation="quick"
    />
  )
}

export function MessageSkeleton() {
  return (
    <YStack gap="$4" padding="$4">
      {[1, 2, 3].map(i => (
        <YStack key={i} gap="$3">
          {/* Assistant message skeleton */}
          <XStack justifyContent="flex-start" paddingHorizontal="$4">
            <YStack flex={1} gap="$2" maxWidth="90%">
              {/* Small header line */}
              <YStack
                height={16}
                backgroundColor="$backgroundHover"
                borderRadius="$2"
                width="30%"
                opacity={0.8}
              />
              {/* Main content block */}
              <YStack
                height={80}
                backgroundColor="$backgroundPress"
                borderRadius="$2"
                opacity={0.6}
              />
              {/* Timestamp line */}
              <YStack
                height={12}
                backgroundColor="$color11"
                borderRadius="$2"
                width="20%"
                opacity={0.4}
              />
            </YStack>
          </XStack>

          {/* User message skeleton */}
          <XStack justifyContent="flex-end" paddingHorizontal="$4">
            <YStack gap="$2" maxWidth="80%" alignItems="flex-end">
              {/* User message bubble */}
              <YStack
                height={40}
                backgroundColor="$blue10"
                borderRadius="$2"
                width="60%"
                opacity={0.3}
              />
              {/* Timestamp */}
              <YStack
                height={12}
                backgroundColor="$color11"
                borderRadius="$2"
                width="25%"
                opacity={0.4}
              />
            </YStack>
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

export function SessionSkeleton() {
  return (
    <YStack
      gap="$2"
      padding="$3"
      backgroundColor="$backgroundHover"
      borderRadius="$4"
      marginBottom="$2"
    >
      <XStack gap="$3" alignItems="center">
        <SkeletonLoader width={20} height={20} borderRadius="$2" />
        <YStack flex={1} gap="$1">
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} />
        </YStack>
      </XStack>
    </YStack>
  )
}
