import { store$ } from './index'
import { connectionService } from '../services/connection'
import { openCodeService, type SendMessageRequest } from '../services/opencode'
import type { Message } from '../services/types'

export const actions = {
  // Connection actions
  connection: {
    connect: async (serverUrl: string) => {
      store$.connection.isLoading.set(true)
      store$.connection.error.set(null)

      try {
        await connectionService.connect(serverUrl)
        const state = connectionService.getState()

        store$.connection.status.set(state.status)
        store$.connection.serverUrl.set(state.serverUrl || '')
        store$.connection.models.set(state.models)
        store$.connection.defaultModels.set(state.defaultModels)
        store$.connection.error.set(state.error)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Connection failed'
        store$.connection.error.set(errorMessage)
        store$.connection.status.set('error')
        throw error
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    disconnect: async () => {
      store$.connection.isLoading.set(true)

      try {
        await connectionService.disconnect()
        const state = connectionService.getState()

        store$.connection.status.set(state.status)
        store$.connection.serverUrl.set('')
        store$.connection.models.set([])
        store$.connection.defaultModels.set({})
        store$.connection.error.set(null)
      } finally {
        store$.connection.isLoading.set(false)
      }
    },

    reconnect: async () => {
      const serverUrl = store$.connection.serverUrl.get()
      if (!serverUrl) {
        throw new Error('No server URL to reconnect to')
      }
      await actions.connection.connect(serverUrl)
    },

    refreshModels: async () => {
      store$.models.isLoading.set(true)

      try {
        await connectionService.refreshModels()
        const state = connectionService.getState()

        store$.connection.models.set(state.models)
        store$.connection.defaultModels.set(state.defaultModels)
        store$.models.available.set(state.models)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to refresh models'
        store$.connection.error.set(errorMessage)
        throw error
      } finally {
        store$.models.isLoading.set(false)
      }
    },

    initializeFromStorage: async () => {
      try {
        await connectionService.initializeFromStorage()
        const state = connectionService.getState()

        store$.connection.status.set(state.status)
        store$.connection.serverUrl.set(state.serverUrl || '')
        store$.connection.models.set(state.models)
        store$.connection.defaultModels.set(state.defaultModels)
        store$.connection.error.set(state.error)
        store$.models.available.set(state.models)
      } catch (error) {
        console.warn('Failed to initialize connection from storage:', error)
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
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load sessions'
        store$.sessions.error.set(errorMessage)
        throw error
      } finally {
        store$.sessions.isLoading.set(false)
      }
    },

    createSession: async () => {
      store$.sessions.isLoading.set(true)

      try {
        const session = await openCodeService.createSession()
        store$.sessions.list.set(sessions => [...sessions, session])
        store$.sessions.current.set(session.id)
        return session
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create session'
        store$.sessions.error.set(errorMessage)
        throw error
      } finally {
        store$.sessions.isLoading.set(false)
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
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete session'
        store$.sessions.error.set(errorMessage)
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
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load messages'
        store$.messages.error.set(errorMessage)
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
      if (!connectionService.isReady()) {
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
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message'
        store$.messages.error.set(errorMessage)

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

    setPreference: (key: string, value: string) => {
      store$.models.preferences.set(prefs => ({
        ...prefs,
        [key]: value,
      }))
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
