import { YStack, Text, Button } from 'tamagui'
import { AlertCircle, RefreshCw } from '@tamagui/lucide-icons'

export interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  retryText?: string
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
}: ErrorMessageProps) {
  return (
    <YStack alignItems="center" justifyContent="center" gap="$4" padding="$6">
      <AlertCircle size={48} color="$red10" />

      <YStack alignItems="center" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
          {title}
        </Text>

        <Text fontSize="$4" color="$color11" textAlign="center" maxWidth={300}>
          {message}
        </Text>
      </YStack>

      {onRetry && (
        <Button
          backgroundColor="$blue10"
          color="white"
          icon={RefreshCw}
          onPress={onRetry}
          size="$4"
        >
          <Text color="white">{retryText}</Text>
        </Button>
      )}
    </YStack>
  )
}
