import { YStack, Button, Text } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { AlertCircle, RefreshCw, Home } from '@tamagui/lucide-icons'

export interface ErrorScreenProps {
  title?: string
  message?: string
  showHomeButton?: boolean
  showRetryButton?: boolean
  onRetry?: () => void
}

export default function ErrorScreen({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showHomeButton = true,
  showRetryButton = true,
  onRetry,
}: ErrorScreenProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handleGoHome = () => {
    router.replace('/sessions')
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      router.back()
    }
  }

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
      padding="$6"
      gap="$6"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      <AlertCircle size={64} color="$red10" />

      <YStack alignItems="center" gap="$3" maxWidth={400}>
        <Text fontSize="$7" fontWeight="600" color="$color" textAlign="center">
          {title}
        </Text>

        <Text fontSize="$4" color="$color11" textAlign="center" lineHeight="$5">
          {message}
        </Text>
      </YStack>

      <YStack gap="$3" width="100%" maxWidth={300}>
        {showRetryButton && (
          <Button
            backgroundColor="$blue10"
            size="$4"
            icon={RefreshCw}
            onPress={handleRetry}
            noTextWrap
          >
            <Text color="white">Try Again</Text>
          </Button>
        )}

        {showHomeButton && (
          <Button
            variant="outlined"
            size="$4"
            icon={Home}
            onPress={handleGoHome}
            noTextWrap
          >
            <Text>Go Home</Text>
          </Button>
        )}
      </YStack>
    </YStack>
  )
}
