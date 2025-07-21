import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { YStack, Input, Button, Text, Heading, Card } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { storage } from '../services/storage'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function ConnectionScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [serverUrl, setServerUrl] = useState(
    storage.getServerUrl() || 'http://localhost:3000'
  )
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTablet = width > 768

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // TODO: Implement actual connection test
      // For now, just validate URL format
      new URL(serverUrl)

      // Store the server URL
      storage.setServerUrl(serverUrl)

      // Navigate to sessions screen
      router.replace('/sessions')
    } catch {
      setError('Invalid server URL. Please enter a valid URL.')
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnecting) {
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
