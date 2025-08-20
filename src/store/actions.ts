import type { Agent, Provider, SessionMessageResponse } from '@opencode-ai/sdk'
import { NETWORK_CONFIG } from '../config/constants'
import {
  openCodeService,
  type OpenCodeConfig,
  type SendMessageRequest,
} from '../services/opencode'
import { debug } from '../utils/debug'
import { store$ } from './index'

// Simple helper for error handling
const setActionError = (
  error: unknown,
  fallback: string,
  setter: (msg: string) => void
): string => {
  const message = error instanceof Error ? error.message : fallback
  setter(message)
  return message
}

// Helper function for fallback agents
const getFallbackAgents = (): Agent[] => {
  return [
    {
      name: 'build',
      description: 'Write, edit, and execute code with full tool access',
      mode: 'primary' as const,
      builtIn: true,
      tools: {},
      permission: {
        edit: 'allow' as const,
        bash: {},
      },
      options: {},
    },
    {
      name: 'plan',
      description: 'Read and analyze code without making changes',
      mode: 'primary' as const,
      builtIn: true,
      tools: {
        write: false,
        edit: false,
        bash: false,
      },
      permission: {
        edit: 'deny' as const,
        bash: {},
      },
      options: {},
    },
  ]
}

// Simple helper to auto-select a model
const selectDefaultModel = (
  providers: Provider[],
  defaults: Record<string, string>
) => {
  if (!providers?.length) return null

  // Try API defaults first
  if (defaults && Object.keys(defaults).length > 0) {
    for (const [providerId, modelId] of Object.entries(defaults)) {
      const provider = providers.find(p => p.id === providerId)
      if (provider?.models?.[modelId]) {
        return { modelID: modelId, providerID: providerId }
      }
    }
  }

  // Fallback to first available model
  for (const provider of providers) {
    const modelIds = Object.keys(provider.models || {})
    if (modelIds.length > 0) {
      return { modelID: modelIds[0], providerID: provider.id }
    }
  }

  return null
}

// Simple helper to select default agent
const selectDefaultAgent = (agents: Agent[]) => {
  if (!agents?.length) return null
  // Prefer build agent if available
  return agents.find(a => a.name === 'build')?.name || agents[0]?.name || null
}

// Helper to avoid duplicating model selection logic
const ensureModelSelected = (
  providers: Provider[],
  defaults: Record<string, string>
) => {
  const currentSelected = store$.models.selected.get()
  if (!currentSelected) {
    const selected = selectDefaultModel(providers, defaults || {})
    if (selected) {
      store$.models.selected.set(selected)
    }
  }
}

// Helper to avoid duplicating agent selection logic
const ensureAgentSelected = async (): Promise<Agent[]> => {
  let agents: Agent[]

  try {
    agents = await openCodeService.getAgents()
  } catch (agentError) {
    debug.warn('Failed to fetch agents from API, using fallback:', agentError)
    agents = getFallbackAgents()
  }

  store$.agents.available.set(agents)

  // Auto-select a default agent if none is currently selected
  const currentSelected = store$.agents.selected.get()
  if (!currentSelected) {
    const selected = selectDefaultAgent(agents)
    if (selected) {
      store$.agents.selected.set(selected)
    }
  }

  return agents
}

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
          timeout: NETWORK_CONFIG.timeout, // 2 minutes for streaming connections
          maxRetries: NETWORK_CONFIG.maxRetries,
        }

        openCodeService.initialize(config)

        // Test connection
        const healthCheck = await openCodeService.checkHealth()
        if (healthCheck.status === 'error') {
          throw new Error(healthCheck.error || 'Health check failed')
        }

        // Fetch providers and agents
        const providersResponse = await openCodeService.getProviders()
        const { providers, default: defaults } = providersResponse

        // Fetch and setup agents
        await ensureAgentSelected()

        // Update store with successful connection
        store$.connection.status.set('connected')
        store$.connection.lastConnected.set(new Date())
        store$.connection.retryCount.set(0)
        store$.models.providers.set(providers)
        store$.models.defaults.set(defaults || {})

        // Auto-select a default model if none is currently selected
        ensureModelSelected(providers, defaults || {})

        // Start health monitoring
        actions.connection.startHealthMonitoring()
      } catch (error) {
        setActionError(error, 'Connection failed', store$.connection.error.set)
        store$.connection.status.set('error')

        // Attempt retry if not at max retries
        const retryCount = store$.connection.retryCount.get()
        if (retryCount < NETWORK_CONFIG.maxRetryLimit) {
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
        store$.models.providers.set([])
        store$.agents.available.set([])
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    refreshProviders: async () => {
      // Check if we're connected
      if (
        store$.connection.status.get() !== 'connected' ||
        !openCodeService.isInitialized()
      ) {
        throw new Error('Not connected to server')
      }

      store$.models.isLoading.set(true)

      try {
        const providersResponse = await openCodeService.getProviders()
        const { providers, default: defaults } = providersResponse

        store$.models.providers.set(providers)
        store$.models.defaults.set(defaults || {})

        // Auto-select a default model if none is currently selected
        ensureModelSelected(providers, defaults || {})
      } catch (error) {
        setActionError(
          error,
          'Failed to refresh providers',
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
              debug.warn(
                'Failed to load sessions during initialization:',
                error
              )
            })

            // Refresh providers to ensure we have the latest provider data
            actions.connection.refreshProviders().catch(error => {
              debug.warn(
                'Failed to refresh providers during initialization:',
                error
              )
            })
          }, 0)
        }
      } catch (error) {
        debug.warn('Failed to initialize connection from storage:', error)
      }
    },

    // Health monitoring
    startHealthMonitoring: () => {
      actions.connection.stopHealthMonitoring()

      const interval = setInterval(() => {
        actions.connection.performHealthCheck()
      }, NETWORK_CONFIG.healthCheckInterval) // 5 minutes

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

      if (existingTimeout || retryCount >= NETWORK_CONFIG.maxRetryLimit) {
        return
      }

      const delay = NETWORK_CONFIG.retryBaseDelay * Math.pow(2, retryCount) // Exponential backoff

      const timeout = setTimeout(async () => {
        store$.connection.reconnectTimeout.set(null)
        store$.connection.retryCount.set(retryCount + 1)

        try {
          await actions.connection.reconnect()
        } catch (error) {
          debug.error('Reconnection failed:', error)
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
        // Don't add to store here - let SSE handle it via session.updated event
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
    loadMessages: async (sessionId: string) => {
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
      agent?: string
    ) => {
      if (
        store$.connection.status.get() !== 'connected' ||
        !openCodeService.isInitialized()
      ) {
        throw new Error('Not connected to server')
      }

      store$.messages.isSending.set(true)
      store$.messages.error.set(null)

      try {
        const request: SendMessageRequest = {
          sessionId,
          content,
          modelId,
          providerId,
          agent,
        }

        // Send message to server
        await openCodeService.sendMessage(request)
      } catch (error) {
        setActionError(
          error,
          'Failed to send message',
          store$.messages.error.set
        )
        throw error
      } finally {
        store$.messages.isSending.set(false)
      }
    },

    addMessage: (
      sessionId: string,
      messageResponse: SessionMessageResponse
    ) => {
      const currentMessages = store$.messages.bySessionId[sessionId].get() || []

      // Check if message already exists
      const exists = currentMessages.some(
        m => m.info.id === messageResponse.info.id
      )
      if (exists) {
        // Update existing message
        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map(m =>
            m.info.id === messageResponse.info.id ? messageResponse : m
          )
        )
      } else {
        // Add new message
        store$.messages.bySessionId[sessionId].set([
          ...currentMessages,
          messageResponse,
        ])
      }
    },

    updateMessage: (
      sessionId: string,
      messageId: string,
      updates: Partial<SessionMessageResponse>
    ) => {
      store$.messages.bySessionId[sessionId].set(messages =>
        messages.map(msg =>
          msg.info.id === messageId ? { ...msg, ...updates } : msg
        )
      )
    },

    clearMessages: (sessionId: string) => {
      store$.messages.bySessionId[sessionId].set([])
    },

    abortSession: async (sessionId: string) => {
      // Prevent multiple simultaneous abort attempts
      if (store$.messages.isAborting.get()) {
        return
      }

      store$.messages.isAborting.set(true)
      store$.messages.error.set(null)

      try {
        await openCodeService.abortSession(sessionId)
        // Set both isSending and isAborting to false after successful abort
        store$.messages.isSending.set(false)
      } catch (error) {
        setActionError(
          error,
          'Failed to abort session',
          store$.messages.error.set
        )
        throw error
      } finally {
        store$.messages.isAborting.set(false)
      }
    },
  },

  // Model actions
  models: {
    selectModel: (modelId: string, providerId: string) => {
      store$.models.selected.set({ modelID: modelId, providerID: providerId })
    },
  },

  // Agent actions
  agents: {
    loadAgents: async () => {
      if (
        store$.connection.status.get() !== 'connected' ||
        !openCodeService.isInitialized()
      ) {
        throw new Error('Not connected to server')
      }

      store$.agents.isLoading.set(true)
      store$.agents.error.set(null)

      try {
        await ensureAgentSelected()
      } catch (error) {
        setActionError(
          error,
          'Failed to load agents from server, using fallback agents',
          store$.agents.error.set
        )
      } finally {
        store$.agents.isLoading.set(false)
      }
    },

    selectAgent: (agentName: string) => {
      store$.agents.selected.set(agentName)
    },

    refreshAgents: async () => {
      await actions.agents.loadAgents()
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
