export const APP_CONFIG = {
  name: 'Patjoe',
  version: '1.0.0',
  defaultServerUrl: 'http://localhost:3000',
} as const

export const NETWORK_CONFIG = {
  timeout: 120000, // 2 minutes
  maxRetries: 2,
  maxRetryLimit: 3,
  healthCheckInterval: 300000, // 5 minutes
  retryBaseDelay: 2000, // exponential backoff base
} as const
