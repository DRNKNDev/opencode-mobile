import type { Agent, Session, SessionMessageResponse } from '@opencode-ai/sdk'
import { openCodeService, type OpenCodeConfig } from '../services/opencode'
import { debug } from '../utils/debug'
import { store$ } from './index'

// Cache TTL constants
const CACHE_TTL = {
  sessions: 5 * 60 * 1000, // 5 minutes
  providers: 10 * 60 * 1000, // 10 minutes
  agents: 10 * 60 * 1000, // 10 minutes
  messages: 2 * 60 * 1000, // 2 minutes
}

// Simple helper to check if cache is valid
const isCacheValid = (lastFetched: number | null, ttl: number): boolean => {
  if (!lastFetched) return false
  return Date.now() - lastFetched < ttl
}

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

export const actions = {
  // Connection actions
  connection: {
    connect: async (serverUrl?: string) => {
      // Use provided URL or fall back to stored URL
      const url = serverUrl || store$.connection.serverUrl.get()
      if (!url) {
        throw new Error('No server URL available')
      }

      // Prevent multiple simultaneous connections
      if (store$.connection.status.get() === 'connecting') {
        return
      }

      store$.connection.isLoading.set(true)
      store$.connection.status.set('connecting')
      store$.connection.serverUrl.set(url)
      store$.connection.error.set(null)

      try {
        // Validate URL format
        const validatedUrl = new URL(url)
        if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
          throw new Error('Invalid protocol. Use http:// or https://')
        }

        // Initialize OpenCode service
        const config: OpenCodeConfig = {
          baseURL: url,
        }

        openCodeService.initialize(config)

        // Test connection and get app info
        const appInfo = await openCodeService.getAppInfo()
        store$.connection.appInfo.set(appInfo)

        // Load initial data in parallel
        await Promise.allSettled([
          actions.agents.loadAgents(),
          actions.models.loadProviders(),
          actions.sessions.loadSessions(),
        ]).catch(error => {
          debug.warn('Failed to load initial data:', error)
        })

        // Update store with successful connection
        store$.connection.status.set('connected')
        store$.connection.lastConnected.set(new Date())
      } catch (error) {
        setActionError(error, 'Connection failed', store$.connection.error.set)
        store$.connection.status.set('error')

        throw error
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    disconnect: async () => {
      store$.connection.isLoading.set(true)

      try {
        // Disconnect OpenCode service
        openCodeService.disconnect()

        // Reset connection state
        store$.connection.status.set('disconnected')
        store$.connection.serverUrl.set('')
        store$.connection.error.set(null)
        store$.connection.lastConnected.set(null)
        store$.models.providers.set([])
        store$.agents.available.set([])
      } finally {
        store$.connection.isLoading.set(false)
      }
    },
  },

  // Session actions
  sessions: {
    loadSessions: async (forceRefresh = false) => {
      // Check if sessions exist and cache is valid (unless force refresh)
      if (!forceRefresh) {
        const existingSessions = store$.sessions.list.get()
        const lastFetched = store$.cache.sessionsLastFetched.get()

        if (
          existingSessions.length > 0 &&
          isCacheValid(lastFetched, CACHE_TTL.sessions)
        ) {
          debug.info('Using cached sessions, skipping API call')
          return
        }
      }

      store$.sessions.isLoading.set(true)
      store$.sessions.error.set(null)

      try {
        const sessions = await openCodeService.getSessions()
        const sorted = sessions.sort((a, b) => b.time.updated - a.time.updated)
        store$.sessions.list.set(sorted)
        store$.cache.sessionsLastFetched.set(Date.now())
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

    upsertSession: (session: Session) => {
      store$.sessions.list.set(sessions => {
        const existingIndex = sessions.findIndex(s => s.id === session.id)

        if (existingIndex >= 0) {
          // Update existing session
          const updated = [...sessions]
          updated[existingIndex] = session
          return updated
        } else {
          // Add new session at the beginning (most recent first)
          return [session, ...sessions]
        }
      })
    },

    createSession: async () => {
      store$.sessions.isCreating.set(true)

      try {
        const session = await openCodeService.createSession()

        actions.sessions.upsertSession(session)
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

    shareSession: async (sessionId: string): Promise<void> => {
      try {
        const result = await openCodeService.shareSession(sessionId)

        // Update the session in the store with share data
        store$.sessions.list.set(sessions =>
          sessions.map(session =>
            session.id === sessionId
              ? { ...session, share: { url: result.url } }
              : session
          )
        )

        debug.success(`Session shared successfully: ${result.url}`)
      } catch (error) {
        debug.error('❌ Failed to share session:', error)
        setActionError(
          error,
          'Failed to share session',
          store$.sessions.error.set
        )
        throw error
      }
    },

    unshareSession: async (sessionId: string): Promise<void> => {
      try {
        await openCodeService.unshareSession(sessionId)

        // Update the session in the store to remove share data
        store$.sessions.list.set(sessions =>
          sessions.map(session =>
            session.id === sessionId
              ? { ...session, share: undefined }
              : session
          )
        )
      } catch (error) {
        setActionError(
          error,
          'Failed to unshare session',
          store$.sessions.error.set
        )
        throw error
      }
    },
  },

  // Message actions
  messages: {
    loadMessages: async (sessionId: string, forceRefresh = false) => {
      // Check if messages exist and per-session cache is valid (unless force refresh)
      if (!forceRefresh) {
        const existingMessages =
          store$.messages.bySessionId[sessionId].get() || []
        const lastFetched = store$.cache.messagesLastFetched.get()[sessionId]

        if (
          existingMessages.length > 0 &&
          isCacheValid(lastFetched, CACHE_TTL.messages)
        ) {
          debug.info(
            `Using cached messages for session ${sessionId}, skipping API call`
          )
          return
        }
      }

      store$.messages.isLoading.set(true)
      store$.messages.error.set(null)

      try {
        const messages = await openCodeService.getMessages(sessionId)
        store$.messages.bySessionId[sessionId].set(messages)
        store$.cache.messagesLastFetched.set(current => ({
          ...current,
          [sessionId]: Date.now(),
        }))
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

    sendMessage: async (sessionId: string, content: string) => {
      if (store$.connection.status.get() !== 'connected') {
        throw new Error('Not connected to server')
      }

      // Get current selections from store
      const modelSelection = store$.models.selected.get()
      const agentName = store$.agents.selected.get()

      // Validate we have required selections
      if (!modelSelection?.modelID) {
        throw new Error('No model selected')
      }
      if (!modelSelection.providerID) {
        throw new Error('No provider selected')
      }
      if (!agentName) {
        throw new Error('No agent selected')
      }

      store$.messages.isSending.set(true)
      store$.messages.error.set(null)

      try {
        await openCodeService.sendMessage(
          sessionId,
          content,
          modelSelection.modelID,
          modelSelection.providerID,
          agentName
        )
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

    upsertMessage: (
      sessionId: string,
      messageId: string,
      updater:
        | SessionMessageResponse
        | ((
            current?: SessionMessageResponse
          ) => SessionMessageResponse | undefined)
    ) => {
      const currentMessages = store$.messages.bySessionId[sessionId].get() || []
      const existingMessageIndex = currentMessages.findIndex(
        m => m.info.id === messageId
      )

      if (existingMessageIndex >= 0) {
        // Update existing message
        const existingMessage = currentMessages[existingMessageIndex]
        const updatedMessage =
          typeof updater === 'function' ? updater(existingMessage) : updater

        // Skip update if updater returns undefined
        if (updatedMessage === undefined) return

        store$.messages.bySessionId[sessionId].set(messages =>
          messages.map((m, index) =>
            index === existingMessageIndex ? updatedMessage : m
          )
        )
      } else {
        // Add new message
        const newMessage =
          typeof updater === 'function' ? updater(undefined) : updater

        // Skip creation if updater returns undefined
        if (newMessage === undefined) return

        store$.messages.bySessionId[sessionId].set([
          ...currentMessages,
          newMessage,
        ])
      }
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
    loadProviders: async (forceRefresh = false) => {
      // Check if providers exist and cache is valid (unless force refresh)
      if (!forceRefresh) {
        const existingProviders = store$.models.providers.get()
        const lastFetched = store$.cache.providersLastFetched.get()

        if (
          existingProviders.length > 0 &&
          isCacheValid(lastFetched, CACHE_TTL.providers)
        ) {
          debug.info('Using cached providers, skipping API call')
          return
        }
      }

      store$.models.isLoading.set(true)
      store$.models.error.set(null)

      try {
        const providersResponse = await openCodeService.getProviders()
        const { providers, default: defaults } = providersResponse

        store$.models.providers.set(providers)
        store$.models.default.set(defaults || {})
        store$.cache.providersLastFetched.set(Date.now())
      } catch (error) {
        setActionError(
          error,
          'Failed to load providers',
          store$.models.error.set
        )
        throw error
      } finally {
        store$.models.isLoading.set(false)
      }
    },

    selectModel: (modelId: string, providerId: string) => {
      const providers = store$.models.providers.get()
      const provider = providers.find(p => p.id === providerId)

      if (!provider?.models?.[modelId]) {
        throw new Error(
          `Model '${modelId}' not found in provider '${providerId}'`
        )
      }

      store$.models.selected.set({ modelID: modelId, providerID: providerId })
    },
  },

  // Agent actions
  agents: {
    loadAgents: async (forceRefresh = false) => {
      // Check if agents exist and cache is valid (unless force refresh)
      if (!forceRefresh) {
        const existingAgents = store$.agents.available.get()
        const lastFetched = store$.cache.agentsLastFetched.get()

        if (
          existingAgents.length > 0 &&
          isCacheValid(lastFetched, CACHE_TTL.agents)
        ) {
          debug.info('Using cached agents, skipping API call')
          return
        }
      }

      store$.agents.isLoading.set(true)
      store$.agents.error.set(null)

      try {
        const agents = await openCodeService.getAgents()
        store$.agents.available.set(agents)
        store$.cache.agentsLastFetched.set(Date.now())

        // Auto-select build agent if none selected
        const currentSelected = store$.agents.selected.get()
        if (!currentSelected) {
          store$.agents.selected.set('build')
        }
      } catch (error) {
        setActionError(error, 'Failed to load agents', store$.agents.error.set)
        throw error
      } finally {
        store$.agents.isLoading.set(false)
      }
    },

    selectAgent: (agentName: string) => {
      store$.agents.selected.set(agentName)
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
