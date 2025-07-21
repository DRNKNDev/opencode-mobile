import { YStack, XStack } from 'tamagui'
import { useEffect, useState } from 'react'

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
    <YStack gap="$2" padding="$4">
      <XStack gap="$3" alignItems="center">
        <SkeletonLoader width={20} height={20} borderRadius="$10" />
        <SkeletonLoader width={80} height={16} />
      </XStack>
      <SkeletonLoader width="90%" height={16} />
      <SkeletonLoader width="70%" height={16} />
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
