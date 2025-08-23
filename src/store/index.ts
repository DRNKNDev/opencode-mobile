import { observable } from '@legendapp/state'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { syncObservable } from '@legendapp/state/sync'
import type {
  Agent,
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
    appInfo: {
      hostname: string
      git: boolean
      path: {
        config: string
        data: string
        root: string
        cwd: string
        state: string
      }
      time: {
        initialized?: number
      }
    } | null
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
    isAborting: boolean
    error: string | null
  }

  models: {
    providers: Provider[]
    default: Record<string, string>
    selected: { modelID: string; providerID: string } | null
    isLoading: boolean
    error: string | null
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

  cache: {
    sessionsLastFetched: number | null
    providersLastFetched: number | null
    agentsLastFetched: number | null
    messagesLastFetched: Record<string, number> // per session
  }
}

export const store$ = observable<StoreState>({
  connection: {
    status: 'disconnected',
    serverUrl: '',
    error: null,
    isLoading: false,
    lastConnected: null,
    appInfo: null,
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
    isAborting: false,
    error: null,
  },

  models: {
    providers: [],
    default: {}, // { providerId: modelId } from API
    selected: null,
    isLoading: false,
    error: null,
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

  cache: {
    sessionsLastFetched: null,
    providersLastFetched: null,
    agentsLastFetched: null,
    messagesLastFetched: {},
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

syncObservable(store$.cache, {
  persist: {
    name: 'cache-timestamps',
    plugin: ObservablePersistMMKV,
  },
})

export default store$
