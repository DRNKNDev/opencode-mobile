import React from 'react'
import { useSelector } from '@legendapp/state/react'
import { Button, Text } from 'tamagui'
import { Moon, Sun } from '@tamagui/lucide-icons'
import { store$ } from '../../store'
import { actions } from '../../store/actions'

export function ThemeToggle() {
  const currentTheme = useSelector(store$.theme)
  const isDark = currentTheme === 'tokyonight-dark'

  return (
    <Button
      size="$3"
      chromeless
      icon={isDark ? Sun : Moon}
      onPress={actions.theme.toggle}
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
