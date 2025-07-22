import React from 'react'
import { Button, Text } from 'tamagui'
import { Moon, Sun } from '@tamagui/lucide-icons'
import { useThemeContext } from '../../contexts/ThemeContext'

export function ThemeToggle() {
  const { currentTheme, toggleTheme } = useThemeContext()
  const isDark = currentTheme === 'tokyonight-dark'

  return (
    <Button
      size="$3"
      chromeless
      icon={isDark ? Sun : Moon}
      onPress={toggleTheme}
      pressStyle={{
        backgroundColor: '$backgroundPress',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <Text fontSize="$3" color="$color11">
        {isDark ? 'Light' : 'Dark'}
      </Text>
    </Button>
  )
}
