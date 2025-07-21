import { Spinner, YStack, Text } from 'tamagui'

export interface LoadingSpinnerProps {
  size?: 'small' | 'large'
  text?: string
  color?: string
}

export function LoadingSpinner({
  size = 'large',
  text,
  color = '$blue10',
}: LoadingSpinnerProps) {
  return (
    <YStack alignItems="center" justifyContent="center" gap="$3">
      <Spinner size={size} color={color} />
      {text && (
        <Text color="$color11" fontSize="$4">
          {text}
        </Text>
      )}
    </YStack>
  )
}
