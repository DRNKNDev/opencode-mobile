import { computed } from '@legendapp/state'
import type {
  Agent,
  Model,
  Session,
  SessionMessageResponse,
} from '@opencode-ai/sdk'
import type { ConnectionStatus } from '../services/types'
import { TimePeriod } from '../utils/dateFormatting'
import { store$ } from './index'

// Session list item interface for LegendList
export interface SessionListItem {
  type: 'header' | 'session'
  data: { title: string; id: string } | Session
  key: string
  groupType?: TimePeriod
}

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

// Session list items with headers for LegendList
export const sessionListItems = computed((): SessionListItem[] => {
  const sessions = store$.sessions.list.get()
  const sorted = [...sessions].sort((a, b) => b.time.updated - a.time.updated)

  const items: SessionListItem[] = []
  let currentPeriod: string | null = null

  sorted.forEach(session => {
    // Determine time period and header
    const now = Date.now()
    const sessionDate = new Date(session.time.updated)
    const age = now - session.time.updated
    const days = Math.floor(age / (1000 * 60 * 60 * 24))

    let period: TimePeriod
    let periodKey: string
    let title: string

    if (days === 0) {
      period = TimePeriod.TODAY
      periodKey = period
      title = 'Today'
    } else if (days === 1) {
      period = TimePeriod.YESTERDAY
      periodKey = period
      title = 'Yesterday'
    } else if (days <= 7) {
      period = TimePeriod.LAST_7_DAYS
      periodKey = period
      title = 'Last 7 days'
    } else if (days <= 30) {
      period = TimePeriod.LAST_30_DAYS
      periodKey = period
      title = 'Last 30 days'
    } else {
      period = TimePeriod.MONTH
      periodKey = `month-${sessionDate.toISOString().slice(0, 7)}`
      title = sessionDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    }

    // Add header when period changes
    if (periodKey !== currentPeriod) {
      items.push({
        type: 'header',
        data: { title, id: periodKey },
        key: `header-${periodKey}`,
      })
      currentPeriod = periodKey
    }

    // Add session
    items.push({
      type: 'session',
      data: session,
      key: `session-${session.id}`,
      groupType: period,
    })
  })

  return items
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
  isDarkTheme,
  isLightTheme,
  isAnyLoading,
  hasAnyError,
  currentSessionMessageCount,
  currentSessionHasMessages,
  lastMessage,
  isSendingMessage,
  sessionListItems,
  connectionStatus,
  appInfo,
  isGitRepo,
  projectName,
}
