import { useState, useEffect, useCallback } from 'react'
import { openCodeService, type SendMessageRequest } from '../services/opencode'
import { storage } from '../services/storage'
import { connectionService } from '../services/connection'
import { useConnection } from './useConnection'
import type { Message } from '../services/types'

export interface UseMessagesReturn {
  // Message data
  messages: Message[]
  
  // Loading states
  isLoading: boolean
  isSending: boolean
  
  // Message actions
  sendMessage: (content: string, modelId: string, providerId: string, mode?: string) => Promise<void>
  refreshMessages: () => Promise<void>
  clearMessages: () => void
  
  // SSE integration methods
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  
  // Error handling
  error: string | null
  clearError: () => void
}

export function useMessages(sessionId: string | null): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Monitor connection state
  const { isReady } = useConnection()

  const loadMessages = useCallback(async (sessionId: string, forceSync = false) => {
    console.log(`🔄 Loading messages for session: ${sessionId}${forceSync ? ' (forced sync)' : ''}`)
    console.log(`🔗 Connection ready: ${connectionService.isReady()}`)
    
    setIsLoading(true)
    setError(null)

    // CACHE-FIRST STRATEGY: Always load cached messages immediately
    const cachedMessages = loadCachedMessages(sessionId)
    console.log(`💾 Loaded ${cachedMessages.length} messages from cache`)
    setMessages(cachedMessages)
    
    // If we have cached messages, show them immediately and stop loading
    if (cachedMessages.length > 0 && !forceSync) {
      setIsLoading(false)
      console.log('✅ Showing cached messages immediately')
    }

    // BACKGROUND SYNC: Try to sync with server if connected
    try {
      if (connectionService.isReady()) {
        console.log('📡 Syncing with server in background...')
        const remoteMessages = await openCodeService.getMessages(sessionId)
        console.log(`✅ Received ${remoteMessages.length} messages from server`)
        
        // Only update if server has different/newer messages
        const messagesChanged = remoteMessages.length !== cachedMessages.length ||
          remoteMessages.some((remoteMsg, index) => {
            const cachedMsg = cachedMessages[index]
            return !cachedMsg || 
              remoteMsg.id !== cachedMsg.id ||
              remoteMsg.content !== cachedMsg.content ||
              remoteMsg.status !== cachedMsg.status ||
              Math.abs(remoteMsg.timestamp.getTime() - cachedMsg.timestamp.getTime()) > 1000 // Allow 1s difference
          })
        
        if (messagesChanged) {
          console.log('🔄 Server has newer messages, updating...')
          setMessages(remoteMessages)
          cacheMessages(sessionId, remoteMessages)
        } else {
          console.log('✅ Messages are up to date')
        }
      } else {
        console.log('⚠️ Connection not ready, using cached messages only')
      }
    } catch (err) {
      console.error('❌ Failed to sync with server:', err)
      
      // If we don't have cached messages, show error
      if (cachedMessages.length === 0) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load messages'
        setError(errorMessage)
      }
      // If we have cached messages, just log the sync failure but don't show error to user
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load messages when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }

    loadMessages(sessionId)
  }, [sessionId, loadMessages])

  // Background sync when connection becomes ready
  useEffect(() => {
    if (sessionId && isReady) {
      console.log('🔗 Connection became ready, syncing session:', sessionId)
      loadMessages(sessionId, true) // Force sync when connection becomes ready
    }
  }, [sessionId, isReady, loadMessages])

  const refreshMessages = useCallback(async () => {
    if (!sessionId) return
    await loadMessages(sessionId)
  }, [sessionId, loadMessages])

  const sendMessage = useCallback(async (
    content: string, 
    modelId: string, 
    providerId: string, 
    mode: string = 'chat'
  ) => {
    if (!sessionId) {
      throw new Error('No session selected')
    }

    if (!connectionService.isReady()) {
      throw new Error('Not connected to server')
    }

    setIsSending(true)
    setError(null)

    // Create optimistic user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date(),
      status: 'sending',
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage])

    try {
      const request: SendMessageRequest = {
        sessionId,
        content,
        modelId,
        providerId,
        mode,
      }

      // Send message to server
      await openCodeService.sendMessage(request)
      
      // Update user message status
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' as const }
          : msg
      ))

      // The assistant response will come through SSE events
      // which will be handled by the useSSE hook
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      
      // Update user message status to error
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'error' as const }
          : msg
      ))
      
      throw err
    } finally {
      setIsSending(false)
    }
  }, [sessionId])

  const clearMessages = useCallback(() => {
    setMessages([])
    if (sessionId) {
      clearCachedMessages(sessionId)
    }
  }, [sessionId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Add new message (called from SSE events)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(m => m.id === message.id)
      if (exists) {
        // Update existing message
        return prev.map(m => m.id === message.id ? message : m)
      } else {
        // Add new message
        const updated = [...prev, message]
        
        // Cache updated messages
        if (sessionId) {
          cacheMessages(sessionId, updated)
        }
        
        return updated
      }
    })
  }, [sessionId])

  // Update message (called from SSE events)
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => {
      const updated = prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
      
      // Cache updated messages
      if (sessionId) {
        cacheMessages(sessionId, updated)
      }
      
      return updated
    })
  }, [sessionId])

  return {
    // Message data
    messages,
    
    // Loading states
    isLoading,
    isSending,
    
    // Message actions
    sendMessage,
    refreshMessages,
    clearMessages,
    
    // SSE integration methods
    addMessage,
    updateMessage,
    
    // Error handling
    error,
    clearError,
  }
}

// Helper functions for message caching
function getCacheKey(sessionId: string): string {
  return `messages_${sessionId}`
}

function cacheMessages(sessionId: string, messages: Message[]): void {
  try {
    const cacheKey = getCacheKey(sessionId)
    const serializedMessages = JSON.stringify(messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp.toISOString(),
    })))
    
    // Use MMKV storage for caching
    storage['storage'].set(cacheKey, serializedMessages)
  } catch (error) {
    console.warn('Failed to cache messages:', error)
  }
}

function loadCachedMessages(sessionId: string): Message[] {
  try {
    const cacheKey = getCacheKey(sessionId)
    const cached = storage['storage'].getString(cacheKey)
    
    if (!cached) return []
    
    const parsed = JSON.parse(cached)
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  } catch (error) {
    console.warn('Failed to load cached messages:', error)
    return []
  }
}

function clearCachedMessages(sessionId: string): void {
  try {
    const cacheKey = getCacheKey(sessionId)
    storage['storage'].delete(cacheKey)
  } catch (error) {
    console.warn('Failed to clear cached messages:', error)
  }
}