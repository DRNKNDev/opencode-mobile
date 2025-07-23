import React, { useState } from 'react'
import { useSelector } from '@legendapp/state/react'
import { useWindowDimensions } from 'react-native'
import { YStack, Input, Button, Text, Heading, Card } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { storage } from '../services/storage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { store$ } from '../store'
import { actions } from '../store/actions'
import { isConnecting } from '../store/computed'

export default function ConnectionScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [serverUrl, setServerUrl] = useState(
    storage.getServerUrl() || 'http://localhost:3000'
  )

  // LegendState integration
  const connecting = useSelector(isConnecting)
  const connectionState = useSelector(store$.connection)
  const error = connectionState.error

  const isTablet = width > 768

  // Clear errors when URL changes
  React.useEffect(() => {
    if (error) {
      store$.connection.error.set(null)
    }
  }, [serverUrl, error])

  const handleConnect = async () => {
    try {
      // Validate URL format first
      new URL(serverUrl)

      // Test actual connection to the server
      await actions.connection.connect(serverUrl)

      // Navigate to sessions screen on successful connection
      router.replace('/sessions')
    } catch (err) {
      console.error('Connection failed:', err)
      // Error handling is now managed by the store actions
    }
  }

  if (connecting) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
        paddingTop={insets.top}
        paddingBottom={insets.bottom}
        paddingLeft={insets.left}
        paddingRight={insets.right}
      >
        <LoadingSpinner text="Connecting to server..." />
      </YStack>
    )
  }

  return (
    <YStack
      flex={1}
      padding={isTablet ? '$6' : '$4'}
      backgroundColor="$background"
      justifyContent="center"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      <YStack
        gap={isTablet ? '$6' : '$4'}
        maxWidth={isTablet ? 600 : 400}
        alignSelf="center"
        width="100%"
      >
        <YStack gap="$2" alignItems="center">
          <Heading
            size={isTablet ? '$10' : '$8'}
            color="$color"
            textAlign="center"
          >
            Patjoe
          </Heading>
          <Text
            color="$color11"
            textAlign="center"
            fontSize={isTablet ? '$5' : '$4'}
            maxWidth={isTablet ? 500 : 300}
          >
            Opencode Client - Connect to your Opencode server to get started
          </Text>
        </YStack>

        <Card
          padding="$4"
          backgroundColor="$backgroundHover"
          borderWidth={0.5}
          borderColor="$borderColor"
          borderRadius="$4"
        >
          <YStack gap="$3">
            <Text fontWeight="600" color="$color" fontSize="$4">
              Server URL
            </Text>
            <Input
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://localhost:3000"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              borderColor={error ? '$red10' : '$borderColor'}
              focusStyle={{
                borderColor: error ? '$red10' : '$blue10',
                borderWidth: 2,
              }}
            />
            {error && (
              <Text color="$red10" fontSize="$3">
                {error}
              </Text>
            )}
            {connectionState.status !== 'disconnected' && (
              <Text color="$color11" fontSize="$3">
                Status: {connectionState.status}
              </Text>
            )}
          </YStack>
        </Card>

        <Button
          onPress={handleConnect}
          disabled={!serverUrl.trim()}
          backgroundColor="$blue10"
          size="$4"
          pressStyle={{
            backgroundColor: '$blue9',
            scale: 0.98,
          }}
          disabledStyle={{
            backgroundColor: '$color5',
          }}
        >
          <Text color="white" fontWeight="600">
            Connect
          </Text>
        </Button>

        <YStack alignItems="center" gap="$2" marginTop="$4">
          <Text color="$color11" fontSize="$3" textAlign="center">
            💡 Make sure Opencode server is running on your computer
          </Text>
          <Text
            color="$color11"
            fontSize="$3"
            textAlign="center"
            fontFamily="$mono"
          >
            Run: opencode serve
          </Text>
        </YStack>
      </YStack>
    </YStack>
  )
}
