import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '@tamagui/core'

export function ThemeStatusBar() {
  const theme = useTheme()

  // Determine status bar style based on background color brightness
  const getStatusBarStyle = () => {
    const bgColor = theme.background.val

    // Calculate brightness from hex color
    const hex = bgColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    // Use light text on dark backgrounds, dark text on light backgrounds
    return brightness > 128 ? 'dark' : 'light'
  }

  return (
    <StatusBar
      style={getStatusBarStyle()}
      backgroundColor={theme.background.val}
      translucent={true}
    />
  )
}
