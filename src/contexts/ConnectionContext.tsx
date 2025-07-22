import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { connectionService, type ConnectionState } from '../services/connection'
import type { ConnectionStatus, Model } from '../services/types'

export interface ConnectionContextValue {
  // Connection state
  connectionState: ConnectionState
  connectionStatus: ConnectionStatus
  isConnected: boolean
  isConnecting: boolean
  isReady: boolean

  // Connection actions
  connect: (serverUrl: string) => Promise<void>
  disconnect: () => Promise<void>
  reconnect: () => Promise<void>

  // Models
  models: Model[]
  defaultModels: Record<string, string>
  refreshModels: () => Promise<void>

  // Error handling
  error: string | null
  clearError: () => void
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

export function useConnectionContext(): ConnectionContextValue {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error(
      'useConnectionContext must be used within a ConnectionProvider'
    )
  }
  return context
}

interface ConnectionProviderProps {
  children: React.ReactNode
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    connectionService.getState()
  )
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = connectionService.subscribe(state => {
      setConnectionState(state)
    })

    return unsubscribe
  }, [])

  // Initialize connection from storage on mount (ONLY ONCE)
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        console.log(
          '🚀 Initializing connection from storage (ConnectionProvider)'
        )
        await connectionService.initializeFromStorage()
      } catch (error) {
        console.warn('Failed to initialize connection from storage:', error)
      }
    }

    initializeConnection()
  }, []) // Empty dependency array - only run once

  const connect = useCallback(async (serverUrl: string) => {
    setIsLoading(true)
    try {
      await connectionService.connect(serverUrl)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setIsLoading(true)
    try {
      await connectionService.disconnect()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reconnect = useCallback(async () => {
    setIsLoading(true)
    try {
      await connectionService.reconnect()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshModels = useCallback(async () => {
    try {
      await connectionService.refreshModels()
    } catch (error) {
      console.error('Failed to refresh models:', error)
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    // Trigger a reconnect to clear the error
    if (connectionState.status === 'error' && connectionState.serverUrl) {
      reconnect()
    }
  }, [connectionState.status, connectionState.serverUrl, reconnect])

  const contextValue: ConnectionContextValue = {
    // Connection state
    connectionState,
    connectionStatus: connectionService.getConnectionStatus(),
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting' || isLoading,
    isReady: connectionService.isReady(),

    // Connection actions
    connect,
    disconnect,
    reconnect,

    // Models
    models: connectionState.models,
    defaultModels: connectionState.defaultModels,
    refreshModels,

    // Error handling
    error: connectionState.error,
    clearError,
  }

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  )
}
