import React from 'react'
import { Circle } from 'tamagui'

export interface ConnectionStatusProps {
  connected: boolean
  size?: number
}

export function ConnectionStatus({
  connected,
  size = 8,
}: ConnectionStatusProps) {
  return (
    <Circle size={size} backgroundColor={connected ? '$green10' : '$red10'} />
  )
}
