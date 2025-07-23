import { Stack } from 'expo-router'
import { useSelector } from '@legendapp/state/react'
import { TamaguiProvider } from '@tamagui/core'
import { PortalProvider } from '@tamagui/portal'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import config from '../tamagui.config'
import { store$ } from '../src/store'
import { actions } from '../src/store/actions'
import { ThemeStatusBar } from '../src/components/ui/ThemeStatusBar'
import { useEffect } from 'react'
// Import sync service to initialize it
import '../src/store/sync'

function AppContent() {
  const currentTheme = useSelector(store$.theme)

  // Initialize connection from storage on app start
  useEffect(() => {
    actions.connection.initializeFromStorage()
  }, [])

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
      <AppContent />
    </SafeAreaProvider>
  )
}
