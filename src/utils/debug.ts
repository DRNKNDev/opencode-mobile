/**
 * Simple environment-based debug logging utility for Expo
 *
 * Features:
 * - Production-safe (no logs in production builds)
 * - Simple general logging with emojis for easy scanning
 * - Environment control via EXPO_PUBLIC_DEBUG
 * - Compatible with React Native DevTools
 */

// Check if debugging is enabled
const DEBUG_ENABLED =
  __DEV__ &&
  (process.env.EXPO_PUBLIC_DEBUG === 'true' ||
    process.env.NODE_ENV === 'development')

// Simple debug logging
export const debug = {
  /**
   * General debug log
   */
  log: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) console.log(`🔍 ${message}`, ...args)
  },

  /**
   * Success messages
   */
  success: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) console.log(`✅ ${message}`, ...args)
  },

  /**
   * Warning messages
   */
  warn: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) console.warn(`⚠️ ${message}`, ...args)
  },

  /**
   * Error messages
   */
  error: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) console.error(`❌ ${message}`, ...args)
  },

  /**
   * Info messages
   */
  info: (message: string, ...args: any[]) => {
    if (DEBUG_ENABLED) console.info(`ℹ️ ${message}`, ...args)
  },
}

/**
 * Debug utility functions
 */
export const debugUtils = {
  /**
   * Check if debugging is enabled
   */
  isEnabled: () => DEBUG_ENABLED,

  /**
   * Log object with pretty formatting
   */
  logObject: (label: string, obj: any) => {
    if (DEBUG_ENABLED) {
      debug.log(`${label}:`)
      console.table(obj)
    }
  },

  /**
   * Time a function execution
   */
  time: <T>(label: string, fn: () => T): T => {
    if (DEBUG_ENABLED) {
      console.time(`⏱️ ${label}`)
      const result = fn()
      console.timeEnd(`⏱️ ${label}`)
      return result
    }
    return fn()
  },

  /**
   * Time an async function execution
   */
  timeAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (DEBUG_ENABLED) {
      console.time(`⏱️ ${label}`)
      const result = await fn()
      console.timeEnd(`⏱️ ${label}`)
      return result
    }
    return fn()
  },

  /**
   * Group related logs together
   */
  group: (label: string, fn: () => void) => {
    if (DEBUG_ENABLED) {
      console.group(`📁 ${label}`)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },

  /**
   * Collapsed group for less important logs
   */
  groupCollapsed: (label: string, fn: () => void) => {
    if (DEBUG_ENABLED) {
      console.groupCollapsed(`📁 ${label}`)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  },
}

/**
 * Environment info for debugging
 */
export const debugEnv = {
  isDev: __DEV__,
  isDebugEnabled: DEBUG_ENABLED,
  nodeEnv: process.env.NODE_ENV,
  expoDebug: process.env.EXPO_PUBLIC_DEBUG,

  /**
   * Print environment debug info
   */
  printInfo: () => {
    if (DEBUG_ENABLED) {
      debug.info('Debug Environment Info', {
        isDev: debugEnv.isDev,
        isDebugEnabled: debugEnv.isDebugEnabled,
        nodeEnv: debugEnv.nodeEnv,
        expoDebug: debugEnv.expoDebug,
      })
    }
  },
}
