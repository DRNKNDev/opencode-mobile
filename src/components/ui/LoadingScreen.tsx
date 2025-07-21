import { YStack, Text, Spinner } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface LoadingScreenProps {
  message?: string
  size?: 'small' | 'large'
}

export function LoadingScreen({
  message = 'Loading...',
  size = 'large',
}: LoadingScreenProps) {
  const insets = useSafeAreaInsets()
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
      gap="$4"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      <Spinner size={size} color="$blue10" />
      <Text color="$color11" fontSize="$4" textAlign="center" maxWidth={300}>
        {message}
      </Text>
    </YStack>
  )
}
