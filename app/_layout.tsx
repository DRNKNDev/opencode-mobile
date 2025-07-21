import { Stack } from 'expo-router'
import { TamaguiProvider } from '@tamagui/core'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import config from '../tamagui.config'
import { ThemeProvider, useThemeContext } from '../src/contexts/ThemeContext'
import { ThemeStatusBar } from '../src/components/ui/ThemeStatusBar'

function AppContent() {
  const { currentTheme } = useThemeContext()

  return (
    <TamaguiProvider config={config} defaultTheme={currentTheme}>
      <ThemeStatusBar />
      <PortalProvider shouldAddRootHost>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="connection" />
          <Stack.Screen name="sessions" />
          <Stack.Screen name="chat/[id]" />
        </Stack>
      </PortalProvider>
    </TamaguiProvider>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
