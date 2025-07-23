import { observable } from '@legendapp/state'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import { syncObservable } from '@legendapp/state/sync'
import type { Message, Model, Session } from '../services/types'

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
    error: string | null
  }

  messages: {
    bySessionId: Record<string, Message[]>
    isLoading: boolean
    isSending: boolean
    error: string | null
  }

  models: {
    available: Model[]
    defaults: Record<string, string>
    selected: string | null
    isLoading: boolean
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
    defaults: {},
    selected: null,
    isLoading: false,
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

export default store$
