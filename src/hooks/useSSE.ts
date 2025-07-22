import { useCallback, useEffect, useRef, useState } from 'react'
import { connectionService } from '../services/connection'
import { openCodeService, type StreamResponse } from '../services/opencode'
import type { Message, Session } from '../services/types'

export interface UseSSEReturn {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  
  // Event handlers
  onMessageUpdate: (callback: (message: Message) => void) => () => void
  onSessionUpdate: (callback: (session: Session) => void) => () => void
  onError: (callback: (error: string) => void) => () => void
  
  // Connection control
  connect: () => Promise<void>
  disconnect: () => void
  
  // Error state
  error: string | null
  clearError: () => void
}

export function useSSE(): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Event listeners
  const messageUpdateListeners = useRef<Array<(message: Message) => void>>([])
  const sessionUpdateListeners = useRef<Array<(session: Session) => void>>([])
  const errorListeners = useRef<Array<(error: string) => void>>([])
  
  // Stream controller for cleanup
  const streamController = useRef<AbortController | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 2000 // 2 seconds

  const connect = useCallback(async () => {
    if (!connectionService.isReady()) {
      setError('Not connected to server')
      return
    }

    if (isConnected || isConnecting) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Cancel any existing stream
      if (streamController.current) {
        streamController.current.abort()
      }

      // Create new abort controller
      streamController.current = new AbortController()

      // Start streaming events
      const eventStream = openCodeService.streamEvents()
      
      setIsConnected(true)
      setIsConnecting(false)
      reconnectAttempts.current = 0

      // Process events
      for await (const event of eventStream) {
        if (streamController.current?.signal.aborted) {
          break
        }

        await handleStreamEvent(event)
      }

    } catch (err) {
      console.error('SSE connection error:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'SSE connection failed'
      setError(errorMessage)
      
      // Notify error listeners
      errorListeners.current.forEach(listener => listener(errorMessage))
      
      // Attempt reconnection
      scheduleReconnect()
      
    } finally {
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [isConnected, isConnecting])

  const disconnect = useCallback(() => {
    // Cancel reconnection attempts
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }

    // Abort stream
    if (streamController.current) {
      streamController.current.abort()
      streamController.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setError(null)
    reconnectAttempts.current = 0
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached')
      return
    }

    if (reconnectTimeout.current) {
      return // Already scheduled
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current) // Exponential backoff
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectTimeout.current = null
      reconnectAttempts.current++
      
      console.log(`Attempting SSE reconnection (${reconnectAttempts.current}/${maxReconnectAttempts})`)
      connect()
    }, delay)
  }, [connect])

  const handleStreamEvent = async (event: StreamResponse) => {
    try {
      switch (event.type) {
        case 'message_updated':
          if (event.messageInfo) {
            const message = transformMessageFromSSE(event.messageInfo)
            messageUpdateListeners.current.forEach(listener => listener(message))
          }
          break

        case 'message_part_updated':
          if (event.part && event.part.type === 'text') {
            // Handle streaming text updates
            const textPart = event.part as any // Type assertion for text part
            const partialMessage: Message = {
              id: textPart.messageID,
              sessionId: textPart.sessionID,
              role: 'assistant',
              content: textPart.text,
              // Preserve server timestamp if available, otherwise use current time
              timestamp: textPart.time?.created 
                ? new Date(textPart.time.created * 1000)
                : new Date(),
              status: 'sent',
            }
            messageUpdateListeners.current.forEach(listener => listener(partialMessage))
          }
          break

        case 'session_updated':
          if (event.sessionInfo) {
            const session = transformSessionFromSSE(event.sessionInfo)
            sessionUpdateListeners.current.forEach(listener => listener(session))
          }
          break

        case 'session_error':
          const errorMsg = event.error || 'Session error occurred'
          setError(errorMsg)
          errorListeners.current.forEach(listener => listener(errorMsg))
          break

        case 'session_idle':
          // Session became idle - could update UI state
          break

        default:
          console.log('Unknown SSE event type:', event.type)
      }
    } catch (err) {
      console.error('Error handling SSE event:', err)
    }
  }

  // Auto-connect when connection becomes ready
  useEffect(() => {
    if (connectionService.isReady() && !isConnected && !isConnecting) {
      connect()
    }
  }, [connect, isConnected, isConnecting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  // Event listener registration functions
  const onMessageUpdate = useCallback((callback: (message: Message) => void) => {
    messageUpdateListeners.current.push(callback)
    
    return () => {
      const index = messageUpdateListeners.current.indexOf(callback)
      if (index > -1) {
        messageUpdateListeners.current.splice(index, 1)
      }
    }
  }, [])

  const onSessionUpdate = useCallback((callback: (session: Session) => void) => {
    sessionUpdateListeners.current.push(callback)
    
    return () => {
      const index = sessionUpdateListeners.current.indexOf(callback)
      if (index > -1) {
        sessionUpdateListeners.current.splice(index, 1)
      }
    }
  }, [])

  const onError = useCallback((callback: (error: string) => void) => {
    errorListeners.current.push(callback)
    
    return () => {
      const index = errorListeners.current.indexOf(callback)
      if (index > -1) {
        errorListeners.current.splice(index, 1)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Connection state
    isConnected,
    isConnecting,
    
    // Event handlers
    onMessageUpdate,
    onSessionUpdate,
    onError,
    
    // Connection control
    connect,
    disconnect,
    
    // Error state
    error,
    clearError,
  }
}

// Helper functions to transform SSE data to our types
function transformMessageFromSSE(messageInfo: any): Message {
  return {
    id: messageInfo.id,
    sessionId: messageInfo.sessionID,
    role: messageInfo.role,
    content: '', // Will be filled by parts
    timestamp: new Date(messageInfo.role === 'user' 
      ? messageInfo.time.created * 1000
      : messageInfo.time.created * 1000
    ),
    status: 'sent',
  }
}

function transformSessionFromSSE(sessionInfo: any): Session {
  return {
    id: sessionInfo.id,
    title: sessionInfo.title || 'Untitled Session',
    createdAt: new Date(sessionInfo.time.created * 1000),
    updatedAt: new Date(sessionInfo.time.updated * 1000),
    messageCount: 0, // This would need to be calculated
    status: 'active',
  }
}