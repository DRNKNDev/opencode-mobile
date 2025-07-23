import { store$ } from './index'
import {
  openCodeService,
  type SendMessageRequest,
  type OpenCodeConfig,
} from '../services/opencode'
import type { Message } from '../services/types'
import { setActionError } from './utils'

export const actions = {
  // Connection actions
  connection: {
    connect: async (serverUrl: string) => {
      // Prevent multiple simultaneous connections
      if (store$.connection.status.get() === 'connecting') {
        return
      }

      store$.connection.isLoading.set(true)
      store$.connection.status.set('connecting')
      store$.connection.serverUrl.set(serverUrl)
      store$.connection.error.set(null)
      store$.connection.retryCount.set(0)

      try {
        // Validate URL format
        const url = new URL(serverUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol. Use http:// or https://')
        }

        // Initialize OpenCode service
        const config: OpenCodeConfig = {
          baseURL: serverUrl,
          timeout: 10000, // 10 seconds for connection
          maxRetries: 2,
        }

        openCodeService.initialize(config)

        // Test connection
        const healthCheck = await openCodeService.checkHealth()
        if (healthCheck.status === 'error') {
          throw new Error(healthCheck.error || 'Health check failed')
        }

        // Fetch models
        const modelsResponse = await openCodeService.getModels()

        // Update store with successful connection
        store$.connection.status.set('connected')
        store$.connection.lastConnected.set(new Date())
        store$.connection.retryCount.set(0)
        store$.models.available.set(modelsResponse.models)
        store$.models.defaults.set(modelsResponse.defaultModels)

        // Auto-select a default model if none is currently selected
        const currentSelected = store$.models.selected.get()
        if (!currentSelected && modelsResponse.models.length > 0) {
          const defaultModelId = Object.values(modelsResponse.defaultModels)[0]
          const modelToSelect = defaultModelId || modelsResponse.models[0].id
          store$.models.selected.set(modelToSelect)
        }

        // Start health monitoring
        actions.connection.startHealthMonitoring()
      } catch (error) {
        setActionError(error, 'Connection failed', store$.connection.error.set)
        store$.connection.status.set('error')

        // Attempt retry if not at max retries
        const retryCount = store$.connection.retryCount.get()
        if (retryCount < 3) {
          actions.connection.scheduleReconnect()
        }

        throw error
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    disconnect: async () => {
      store$.connection.isLoading.set(true)

      try {
        // Stop health monitoring and reconnection attempts
        actions.connection.stopHealthMonitoring()
        actions.connection.stopReconnectAttempts()

        // Disconnect OpenCode service
        openCodeService.disconnect()

        // Reset connection state
        store$.connection.status.set('disconnected')
        store$.connection.serverUrl.set('')
        store$.connection.error.set(null)
        store$.connection.lastConnected.set(null)
        store$.connection.retryCount.set(0)
        store$.models.available.set([])
        store$.models.defaults.set({})
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    refreshModels: async () => {
      // Check if we're connected
      if (
        store$.connection.status.get() !== 'connected' ||
        !openCodeService.isInitialized()
      ) {
        throw new Error('Not connected to server')
      }

      store$.models.isLoading.set(true)

      try {
        const modelsResponse = await openCodeService.getModels()

        store$.models.available.set(modelsResponse.models)
        store$.models.defaults.set(modelsResponse.defaultModels)

        // Auto-select a default model if none is currently selected
        const currentSelected = store$.models.selected.get()
        if (!currentSelected && modelsResponse.models.length > 0) {
          // Try to find a default model first
          const defaultModelId = Object.values(modelsResponse.defaultModels)[0]
          const modelToSelect = defaultModelId || modelsResponse.models[0].id
          store$.models.selected.set(modelToSelect)
        }
      } catch (error) {
        setActionError(
          error,
          'Failed to refresh models',
          store$.connection.error.set
        )
        throw error
      } finally {
        store$.models.isLoading.set(false)
      }
    },

    reconnect: async () => {
      const serverUrl = store$.connection.serverUrl.get()
      if (!serverUrl) {
        throw new Error('No server URL to reconnect to')
      }
      await actions.connection.connect(serverUrl)
    },

    initializeFromStorage: async () => {
      try {
        // Check if we have a persisted server URL
        const serverUrl = store$.connection.serverUrl.get()

        if (serverUrl) {
          // Attempt to connect to the stored server URL
          await actions.connection.connect(serverUrl)

          // Load sessions and models in the background after successful connection
          setTimeout(() => {
            // Load sessions
            actions.sessions.loadSessions().catch(error => {
              console.warn(
                'Failed to load sessions during initialization:',
                error
              )
            })

            // Refresh models to ensure we have the latest model data
            actions.connection.refreshModels().catch(error => {
              console.warn(
                'Failed to refresh models during initialization:',
                error
              )
            })
          }, 0)
        }
      } catch (error) {
        console.warn('Failed to initialize connection from storage:', error)
      }
    },

    // Health monitoring
    startHealthMonitoring: () => {
      actions.connection.stopHealthMonitoring()

      const interval = setInterval(() => {
        actions.connection.performHealthCheck()
      }, 300000) // 5 minutes

      store$.connection.healthCheckInterval.set(interval)
    },

    stopHealthMonitoring: () => {
      const interval = store$.connection.healthCheckInterval.get()
      if (interval) {
        clearInterval(interval)
        store$.connection.healthCheckInterval.set(null)
      }
    },

    performHealthCheck: async () => {
      if (store$.connection.status.get() !== 'connected') {
        return
      }

      try {
        const healthCheck = await openCodeService.checkHealth()

        if (healthCheck.status === 'error') {
          store$.connection.status.set('error')
          store$.connection.error.set(
            healthCheck.error || 'Health check failed'
          )
          actions.connection.scheduleReconnect()
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Health check failed'
        store$.connection.status.set('error')
        store$.connection.error.set(errorMessage)
        actions.connection.scheduleReconnect()
      }
    },

    // Reconnection logic
    scheduleReconnect: () => {
      const retryCount = store$.connection.retryCount.get()
      const existingTimeout = store$.connection.reconnectTimeout.get()

      if (existingTimeout || retryCount >= 3) {
        return
      }

      const delay = 2000 * Math.pow(2, retryCount) // Exponential backoff

      const timeout = setTimeout(async () => {
        store$.connection.reconnectTimeout.set(null)
        store$.connection.retryCount.set(retryCount + 1)

        try {
          await actions.connection.reconnect()
        } catch (error) {
          console.error('Reconnection failed:', error)
        }
      }, delay)

      store$.connection.reconnectTimeout.set(timeout)
    },

    stopReconnectAttempts: () => {
      const timeout = store$.connection.reconnectTimeout.get()
      if (timeout) {
        clearTimeout(timeout)
        store$.connection.reconnectTimeout.set(null)
      }
    },
  },

  // Session actions
  sessions: {
    loadSessions: async () => {
      store$.sessions.isLoading.set(true)
      store$.sessions.error.set(null)

      try {
        const sessions = await openCodeService.getSessions()
        store$.sessions.list.set(sessions)
      } catch (error) {
        setActionError(
          error,
          'Failed to load sessions',
          store$.sessions.error.set
        )
        throw error
      } finally {
        store$.sessions.isLoading.set(false)
      }
    },

    createSession: async () => {
      store$.sessions.isCreating.set(true)

      try {
        const session = await openCodeService.createSession()
        store$.sessions.list.set(sessions => [...sessions, session])
        store$.sessions.current.set(session.id)
        return session
      } catch (error) {
        setActionError(
          error,
          'Failed to create session',
          store$.sessions.error.set
        )
        throw error
      } finally {
        store$.sessions.isCreating.set(false)
      }
    },

    selectSession: (sessionId: string) => {
      store$.sessions.current.set(sessionId)
    },

    deleteSession: async (sessionId: string) => {
      try {
        await openCodeService.deleteSession(sessionId)
        store$.sessions.list.set(sessions =>
          sessions.filter(s => s.id !== sessionId)
        )

        // If we deleted the current session, clear it
        if (store$.sessions.current.get() === sessionId) {
          store$.sessions.current.set(null)
        }

        // Clear messages for this session
        store$.messages.bySessionId.set(messages => {
          const updated = { ...messages }
          delete updated[sessionId]
          return updated
        })
      } catch (error) {
        setActionError(
          error,
          'Failed to delete session',
          store$.sessions.error.set
        )
        throw error
      }
    },
  },

  // Message actions
  messages: {
    loadMessages: async (sessionId: string, forceSync = false) => {
      store$.messages.isLoading.set(true)
      store$.messages.error.set(null)

      try {
        const messages = await openCodeService.getMessages(sessionId)
        store$.messages.bySessionId[sessionId].set(messages)
      } catch (error) {
        setActionError(
          error,
          'Failed to load messages',
          store$.messages.error.set
        )
        throw error
      } finally {
        store$.messages.isLoading.set(false)
      }
    },

    sendMessage: async (
      sessionId: string,
      content: string,
      modelId: string,
      providerId: string,
      mode = 'chat'
    ) => {
      if (
        store$.connection.status.get() !== 'connected' ||
        !openCodeService.isInitialized()
      ) {
        throw new Error('Not connected to server')
      }

      store$.messages.isSending.set(true)
      store$.messages.error.set(null)

      // Create optimistic user message
      const tempId = `temp-${Date.now()}`
      const userMessage: Message = {
        id: tempId,
        sessionId,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      }

      // Add user message to UI immediately
      const currentMessages = store$.messages.bySessionId[sessionId].get() || []
      store$.messages.bySessionId[sessionId].set([
        ...currentMessages,
        userMessage,
      ])

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

        // Update user message status to sent
        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map(msg =>
            msg.id === tempId ? { ...msg, status: 'sent' as const } : msg
          )
        )

        // The assistant response will come through SSE events
      } catch (error) {
        setActionError(
          error,
          'Failed to send message',
          store$.messages.error.set
        )

        // Update user message status to error
        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map(msg =>
            msg.id === tempId ? { ...msg, status: 'error' as const } : msg
          )
        )

        throw error
      } finally {
        store$.messages.isSending.set(false)
      }
    },

    addMessage: (message: Message) => {
      const sessionId = message.sessionId
      const currentMessages = store$.messages.bySessionId[sessionId].get() || []

      // Check if message already exists
      const exists = currentMessages.some(m => m.id === message.id)
      if (exists) {
        // Update existing message
        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map(m => (m.id === message.id ? message : m))
        )
      } else {
        // Add new message
        store$.messages.bySessionId[sessionId].set([
          ...currentMessages,
          message,
        ])
      }
    },

    updateMessage: (
      sessionId: string,
      messageId: string,
      updates: Partial<Message>
    ) => {
      store$.messages.bySessionId[sessionId].set(messages =>
        messages.map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      )
    },

    clearMessages: (sessionId: string) => {
      store$.messages.bySessionId[sessionId].set([])
    },
  },

  // Model actions
  models: {
    selectModel: (modelId: string) => {
      store$.models.selected.set(modelId)
    },
  },

  // Theme actions
  theme: {
    toggle: () => {
      store$.theme.set(current =>
        current === 'tokyonight-dark' ? 'tokyonight-light' : 'tokyonight-dark'
      )
    },

    set: (theme: 'tokyonight-dark' | 'tokyonight-light') => {
      store$.theme.set(theme)
    },
  },
}
