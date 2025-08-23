import { useSelector } from '@legendapp/state/react'
import { TamaguiProvider } from '@tamagui/core'
import { PortalProvider } from '@tamagui/portal'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import 'react-native-url-polyfill/auto'
import { ThemeStatusBar } from '../src/components/ui/ThemeStatusBar'
import { store$ } from '../src/store'
import { actions } from '../src/store/actions'
import { debug } from '../src/utils/debug'
import config from '../tamagui.config'
// Import sync service to initialize it
import '../src/store/sync'

function AppContent() {
  const currentTheme = useSelector(store$.theme)

  // Auto-reconnect on app start if we have a stored URL
  useEffect(() => {
    actions.connection.connect().catch(error => {
      debug.warn('Auto-reconnect failed:', error)
      // User will need to manually connect
    })
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
          <Stack.Screen
            name="chat/[id]"
            getId={props => `chat-${String(props?.params?.id || 'unknown')}`}
          />
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
