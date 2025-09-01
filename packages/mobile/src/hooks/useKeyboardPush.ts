import { Platform } from 'react-native'
import { useKeyboardHandler } from 'react-native-keyboard-controller'
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

interface UseKeyboardPushOptions {
  /** Additional offset to add to keyboard height */
  offset?: number
  /** Whether to enable the animation */
  enabled?: boolean
  /** Custom animation duration (Android only) */
  duration?: number
}

/**
 * Hook that provides an animated style to push content up when keyboard appears.
 * This solves the white space issue by syncing perfectly with keyboard animation.
 *
 * @param options Configuration options for the keyboard animation
 * @returns An animated style object that can be applied to an Animated.View
 */
export const useKeyboardPush = (options: UseKeyboardPushOptions = {}) => {
  const { offset = 0, enabled = true, duration = 250 } = options
  const height = useSharedValue(0)

  useKeyboardHandler(
    {
      onMove: event => {
        'worklet'
        if (!enabled) {
          height.value = 0
          return
        }

        const targetHeight = Math.max(event.height + offset, 0)

        // On Android, we might want to add timing for smoother animation
        if (Platform.OS === 'android' && duration > 0) {
          height.value = withTiming(targetHeight, { duration })
        } else {
          // iOS uses native animation, so direct assignment is smooth
          height.value = targetHeight
        }
      },
      onEnd: event => {
        'worklet'
        if (!enabled) {
          height.value = 0
          return
        }
        // Ensure final position is correct
        height.value = event.height > 0 ? event.height + offset : 0
      },
    },
    [enabled, offset, duration]
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    }
  }, [])

  return {
    animatedStyle,
    keyboardHeight: height, // Expose the raw value if needed for other animations
  }
}
