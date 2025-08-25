import React from 'react'
import { useWindowDimensions } from 'react-native'
import { Heading, YStack } from 'tamagui'

export interface SectionHeaderProps {
  title: string
  isTablet?: boolean
}

export function SectionHeader({ title, isTablet }: SectionHeaderProps) {
  const { width } = useWindowDimensions()
  const isTabletScreen = isTablet ?? width > 768

  return (
    <YStack
      paddingHorizontal="$3"
      paddingTop="$4"
      paddingBottom="$2"
      justifyContent="center"
    >
      <Heading
        size={isTabletScreen ? '$6' : '$5'}
        color="$color11"
        fontWeight="600"
      >
        {title}
      </Heading>
    </YStack>
  )
}
