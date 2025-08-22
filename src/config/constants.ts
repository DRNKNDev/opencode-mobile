export const APP_CONFIG = {
  name: 'Opencode',
  version: '1.0.0',
  defaultServerUrl: 'http://localhost:3000',
} as const

export const NETWORK_CONFIG = {
  timeout: 120000, // 2 minutes
  maxRetries: 2,
  maxRetryLimit: 3,
} as const
