import { observable } from '@legendapp/state'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { syncObservable } from '@legendapp/state/sync'
import type {
  Agent,
  Model,
  Provider,
  Session,
  SessionMessageResponse,
  ToolState,
} from '@opencode-ai/sdk'

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface StoreState {
  connection: {
    status: ConnectionState
    serverUrl: string
    error: string | null
    isLoading: boolean
    lastConnected: Date | null
    retryCount: number
    healthCheckInterval: any
    reconnectTimeout: any
  }

  theme: 'tokyonight-dark' | 'tokyonight-light'

  sessions: {
    list: Session[]
    current: string | null
    isLoading: boolean
    isCreating: boolean
    error: string | null
  }

  messages: {
    bySessionId: Record<string, SessionMessageResponse[]>
    isLoading: boolean
    isSending: boolean
    error: string | null
  }

  models: {
    available: Model[]
    providers: Provider[]
    defaults: Record<string, string>
    selected: { modelID: string; providerID: string } | null
    isLoading: boolean
  }

  agents: {
    available: Agent[]
    selected: string | null
    isLoading: boolean
    error: string | null
  }

  tools: {
    states: Record<string, ToolState>
    activeTools: string[]
  }
}

export const store$ = observable<StoreState>({
  connection: {
    status: 'disconnected',
    serverUrl: '',
    error: null,
    isLoading: false,
    lastConnected: null,
    retryCount: 0,
    healthCheckInterval: null,
    reconnectTimeout: null,
  },

  theme: 'tokyonight-dark',

  sessions: {
    list: [],
    current: null,
    isLoading: false,
    isCreating: false,
    error: null,
  },

  messages: {
    bySessionId: {},
    isLoading: false,
    isSending: false,
    error: null,
  },

  models: {
    available: [],
    providers: [],
    defaults: {}, // { providerId: modelId } from API
    selected: null,
    isLoading: false,
  },

  agents: {
    available: [],
    selected: null,
    isLoading: false,
    error: null,
  },

  tools: {
    states: {},
    activeTools: [],
  },
})

// Setup persistence for relevant state
syncObservable(store$.theme, {
  persist: {
    name: 'theme',
    plugin: ObservablePersistMMKV,
  },
})

syncObservable(store$.models.selected, {
  persist: {
    name: 'selected-model',
    plugin: ObservablePersistMMKV,
  },
})

syncObservable(store$.sessions, {
  persist: {
    name: 'sessions',
    plugin: ObservablePersistMMKV,
  },
})

syncObservable(store$.connection.serverUrl, {
  persist: {
    name: 'server-url',
    plugin: ObservablePersistMMKV,
  },
})

syncObservable(store$.agents.selected, {
  persist: {
    name: 'selected-agent',
    plugin: ObservablePersistMMKV,
  },
})

export default store$
