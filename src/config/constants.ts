export const APP_CONFIG = {
  name: 'Patjoe',
  version: '1.0.0',
  defaultServerUrl: 'http://localhost:3000',
  maxMessageLength: 10000,
  maxSessions: 100,
  animationDuration: 200,
} as const

export const STORAGE_KEYS = {
  serverUrl: 'opencode_server_url',
  sessions: 'opencode_sessions',
  currentSession: 'opencode_current_session',
  selectedModel: 'opencode_selected_model',
  userPreferences: 'opencode_user_preferences',
  cachedModels: 'opencode_cached_models',
  modelPreferences: 'opencode_model_preferences',
} as const

export const API_ENDPOINTS = {
  health: '/health',
  models: '/models',
  sessions: '/sessions',
  messages: '/messages',
  stream: '/stream',
} as const
