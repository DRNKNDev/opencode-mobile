import { useCallback } from 'react'
import Clipboard from '@react-native-clipboard/clipboard'
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'

export const useCopyToClipboard = () => {
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      Clipboard.setString(text)

      // Haptic feedback
      impactAsync(ImpactFeedbackStyle.Light)

      // TODO: Add toast notification when toast system is available
      console.log('Copied to clipboard:', text.substring(0, 50) + '...')

      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [])

  return { copyToClipboard }
}
