import { ArrowLeft } from '@tamagui/lucide-icons'
import React from 'react'
import { useWindowDimensions } from 'react-native'
import { Button, Heading, XStack } from 'tamagui'
import { ConnectionStatus } from './ConnectionStatus'

export interface HeaderProps {
  title: string
  showBackButton?: boolean
  onBackPress?: () => void
  connected?: boolean
  showBorder?: boolean
}

export function Header({
  title,
  showBackButton = false,
  onBackPress,
  connected = true,
  showBorder = false,
}: HeaderProps) {
  const { width } = useWindowDimensions()
  const isTablet = width > 768

  return (
    <XStack
      paddingHorizontal={isTablet ? '$6' : '$4'}
      height={53}
      justifyContent="space-between"
      alignItems="center"
      backgroundColor="$background"
      maxWidth={isTablet ? 1200 : undefined}
      alignSelf="center"
      width="100%"
    >
      <XStack alignItems="center" gap="$3" flex={1}>
        {showBackButton && (
          <Button
            size="$3"
            chromeless
            icon={ArrowLeft}
            onPress={onBackPress}
            aria-label="Go back"
          />
        )}
        <Heading
          size={isTablet ? '$6' : '$5'}
          color="$color"
          numberOfLines={1}
          flex={showBackButton ? 1 : undefined}
        >
          {title}
        </Heading>
      </XStack>
      <ConnectionStatus connected={connected} />
    </XStack>
  )
}
