import { computed } from '@legendapp/state'
import { store$ } from './index'
import type {
  Message,
  Session,
  Model,
  ConnectionStatus,
} from '../services/types'

// Connection computed values
export const isConnected = computed(
  () => store$.connection.status.get() === 'connected'
)
export const isConnecting = computed(
  () => store$.connection.status.get() === 'connecting'
)
export const isDisconnected = computed(
  () => store$.connection.status.get() === 'disconnected'
)
export const hasConnectionError = computed(
  () => store$.connection.status.get() === 'error'
)
export const isReady = computed(
  () =>
    store$.connection.status.get() === 'connected' &&
    !store$.connection.isLoading.get()
)

// Current session messages
export const currentMessages = computed((): Message[] => {
  const sessionId = store$.sessions.current.get()
  return sessionId ? store$.messages.bySessionId[sessionId].get() || [] : []
})

// Current session info
export const currentSession = computed((): Session | null => {
  const sessionId = store$.sessions.current.get()
  const sessions = store$.sessions.list.get()
  return sessions.find(s => s.id === sessionId) || null
})

// Selected model info
export const selectedModel = computed((): Model | null => {
  const modelId = store$.models.selected.get()
  const models = store$.models.available.get()
  return models.find(m => m.id === modelId) || null
})

// Default model for a provider
export const getDefaultModelForProvider = (
  providerId: string
): string | null => {
  const defaultModels = store$.models.defaults.get()
  return defaultModels[providerId] || null
}

// Available models grouped by provider
export const modelsByProvider = computed(() => {
  const models = store$.models.available.get()
  const grouped: Record<string, Model[]> = {}

  models.forEach(model => {
    if (!grouped[model.provider]) {
      grouped[model.provider] = []
    }
    grouped[model.provider].push(model)
  })

  return grouped
})

// Theme computed values
export const isDarkTheme = computed(
  () => store$.theme.get() === 'tokyonight-dark'
)
export const isLightTheme = computed(
  () => store$.theme.get() === 'tokyonight-light'
)

// Loading states
export const isAnyLoading = computed(
  () =>
    store$.connection.isLoading.get() ||
    store$.sessions.isLoading.get() ||
    store$.messages.isLoading.get() ||
    store$.models.isLoading.get()
)

// Error states
export const hasAnyError = computed(
  () =>
    !!store$.connection.error.get() ||
    !!store$.sessions.error.get() ||
    !!store$.messages.error.get()
)

// Message states for current session
export const currentSessionMessageCount = computed((): number => {
  const messages = currentMessages.get()
  return messages.length
})

export const currentSessionHasMessages = computed((): boolean => {
  const messages = currentMessages.get()
  return messages.length > 0
})

// Last message in current session
export const lastMessage = computed((): Message | null => {
  const messages = currentMessages.get()
  return messages.length > 0 ? messages[messages.length - 1] : null
})

// Check if we're currently sending a message
export const isSendingMessage = computed(() => store$.messages.isSending.get())

// Session list sorted by most recent
export const sessionsSortedByTime = computed((): Session[] => {
  const sessions = store$.sessions.list.get()
  return [...sessions].sort((a, b) => b.time.updated - a.time.updated)
})

// Available providers
export const availableProviders = computed((): string[] => {
  const models = store$.models.available.get()
  const providers = new Set(models.map(m => m.provider))
  return Array.from(providers)
})

// Connection status for UI
export const connectionStatus = computed(
  (): ConnectionStatus => ({
    connected: isConnected.get(),
    serverUrl: store$.connection.serverUrl.get(),
    error: store$.connection.error.get() || undefined,
    models: store$.models.available.get(),
  })
)

// Grouped computed exports for convenience
export const computed$ = {
  isConnected,
  isConnecting,
  isDisconnected,
  hasConnectionError,
  isReady,
  currentMessages,
  currentSession,
  selectedModel,
  modelsByProvider,
  isDarkTheme,
  isLightTheme,
  isAnyLoading,
  hasAnyError,
  currentSessionMessageCount,
  currentSessionHasMessages,
  lastMessage,
  isSendingMessage,
  sessionsSortedByTime,
  availableProviders,
  connectionStatus,
}
