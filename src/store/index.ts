import { observable } from '@legendapp/state'
import { syncObservable } from '@legendapp/state/sync'
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
import type { Session, Message, Model } from '../services/types'

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'

export interface StoreState {
  connection: {
    status: ConnectionState
    serverUrl: string
    models: Model[]
    defaultModels: Record<string, string>
    error: string | null
    isLoading: boolean
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
    selected: string | null
    preferences: Record<string, string>
    isLoading: boolean
  }
}

export const store$ = observable<StoreState>({
  connection: {
    status: 'disconnected',
    serverUrl: '',
    models: [],
    defaultModels: {},
    error: null,
    isLoading: false,
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
    selected: null,
    preferences: {},
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

syncObservable(store$.models.preferences, {
  persist: {
    name: 'model-preferences',
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
