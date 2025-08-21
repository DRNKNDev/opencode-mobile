import { computed } from '@legendapp/state'
import { store$ } from './index'
import type {
  Session,
  Model,
  Agent,
  SessionMessageResponse,
} from '@opencode-ai/sdk'
import type { ConnectionStatus } from '../services/types'
import {
  groupSessionsByTime,
  flattenGroupsForList,
  type SessionGroup,
  type ListItem,
} from '../utils/sessionGrouping'

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
export const currentMessages = computed((): SessionMessageResponse[] => {
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
  const selection = store$.models.selected.get()
  if (!selection) return null

  const providers = store$.models.providers.get()
  for (const provider of providers) {
    if (provider.id === selection.providerID && provider.models) {
      const model = provider.models[selection.modelID]
      return model || null
    }
  }
  return null
})

// Selected agent info
export const selectedAgent = computed((): Agent | null => {
  const agentName = store$.agents.selected.get()
  const agents = store$.agents.available.get()
  return agents.find(a => a.name === agentName) || null
})

// Available agents
export const availableAgents = computed((): Agent[] => {
  return store$.agents.available.get()
})

// Default model for a provider - uses API defaults first, then fallback to first model
export const getDefaultModelForProvider = (
  providerId: string
): string | null => {
  // First check if we have an API-provided default for this provider
  const defaults = store$.models.defaults.get()
  if (defaults[providerId]) {
    // Verify the default model still exists in the provider
    const providers = store$.models.providers.get()
    const provider = providers.find(p => p.id === providerId)
    if (provider?.models && provider.models[defaults[providerId]]) {
      return defaults[providerId]
    }
  }

  // Fallback to first available model if no valid default
  const providers = store$.models.providers.get()
  const provider = providers.find(p => p.id === providerId)
  if (provider?.models) {
    const modelIds = Object.keys(provider.models)
    return modelIds.length > 0 ? modelIds[0] : null
  }
  return null
}

// Available models grouped by provider
export const modelsByProvider = computed(() => {
  const providers = store$.models.providers.get()
  const grouped: Record<string, Model[]> = {}

  providers.forEach(provider => {
    if (provider.models) {
      grouped[provider.id] = Object.values(provider.models)
    }
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
export const lastMessage = computed((): SessionMessageResponse | null => {
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

// Sessions grouped by time periods
export const sessionsGroupedByTime = computed((): SessionGroup[] => {
  const sessions = sessionsSortedByTime.get()
  return groupSessionsByTime(sessions)
})

// Flattened list of sessions with section headers for LegendList
export const sessionsWithHeaders = computed((): ListItem[] => {
  const groups = sessionsGroupedByTime.get()
  return flattenGroupsForList(groups)
})

// Available providers
export const availableProviders = computed((): string[] => {
  const providers = store$.models.providers.get()
  return providers.map(p => p.id)
})

// Connection status for UI
export const connectionStatus = computed(
  (): ConnectionStatus => ({
    connected: isConnected.get(),
    serverUrl: store$.connection.serverUrl.get(),
    error: store$.connection.error.get() || undefined,
  })
)

// App info computed values
export const appInfo = computed(() => store$.connection.appInfo.get())

export const isGitRepo = computed(
  () => store$.connection.appInfo.get()?.git ?? false
)

export const projectName = computed((): string | null => {
  const appInfoValue = store$.connection.appInfo.get()
  if (!appInfoValue?.path.root) return null

  // Extract last directory name from path
  const path = appInfoValue.path.root
  if (path === '/' || path === '') return 'root'

  // Remove trailing slash and get last segment
  const cleanPath = path.replace(/\/$/, '')
  const segments = cleanPath.split('/')
  const lastSegment = segments[segments.length - 1]

  return lastSegment || 'root'
})

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
  selectedAgent,
  availableAgents,
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
  sessionsGroupedByTime,
  sessionsWithHeaders,
  availableProviders,
  connectionStatus,
  appInfo,
  isGitRepo,
  projectName,
}
