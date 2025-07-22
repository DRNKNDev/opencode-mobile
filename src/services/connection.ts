import { openCodeService, type OpenCodeConfig } from './opencode'
import { storage } from './storage'
import type { ConnectionStatus, Model } from './types'

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  serverUrl: string | null
  error: string | null
  models: Model[]
  lastConnected: Date | null
  retryCount: number
}

class ConnectionService {
  private state: ConnectionState = {
    status: 'disconnected',
    serverUrl: null,
    error: null,
    models: [],
    lastConnected: null,
    retryCount: 0,
  }

  private listeners: Array<(state: ConnectionState) => void> = []
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private maxRetries = 3
  private retryDelay = 2000 // 2 seconds
  private healthCheckInterval_ms = 300000 // 5 minutes (reduced from 30 seconds)

  getState(): ConnectionState {
    return { ...this.state }
  }

  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private setState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  async connect(serverUrl: string): Promise<void> {
    if (this.state.status === 'connecting') {
      return
    }

    this.setState({
      status: 'connecting',
      serverUrl,
      error: null,
      retryCount: 0,
    })

    try {
      // Validate URL format
      const url = new URL(serverUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol. Use http:// or https://')
      }

      // Initialize OpenCode service
      const config: OpenCodeConfig = {
        baseURL: serverUrl,
        timeout: 10000, // 10 seconds for connection
        maxRetries: 2,
      }

      openCodeService.initialize(config)

      // Test connection
      const healthCheck = await openCodeService.checkHealth()
      if (healthCheck.status === 'error') {
        throw new Error(healthCheck.error || 'Health check failed')
      }

      // Fetch models
      const models = await openCodeService.getModels()

      // Save connection details
      storage.setServerUrl(serverUrl)

      this.setState({
        status: 'connected',
        serverUrl,
        error: null,
        models,
        lastConnected: new Date(),
        retryCount: 0,
      })

      // Start health monitoring
      this.startHealthMonitoring()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      
      this.setState({
        status: 'error',
        error: errorMessage,
      })

      // Attempt retry if not at max retries
      if (this.state.retryCount < this.maxRetries) {
        this.scheduleReconnect()
      }

      throw error
    }
  }

  async disconnect(): Promise<void> {
    this.stopHealthMonitoring()
    this.stopReconnectAttempts()
    
    openCodeService.disconnect()
    
    this.setState({
      status: 'disconnected',
      serverUrl: null,
      error: null,
      models: [],
      lastConnected: null,
      retryCount: 0,
    })
  }

  async reconnect(): Promise<void> {
    if (!this.state.serverUrl) {
      throw new Error('No server URL to reconnect to')
    }

    await this.connect(this.state.serverUrl)
  }

  private async performHealthCheck(): Promise<void> {
    if (this.state.status !== 'connected') {
      return
    }

    try {
      const healthCheck = await openCodeService.checkHealth()
      
      if (healthCheck.status === 'error') {
        this.setState({
          status: 'error',
          error: healthCheck.error || 'Health check failed',
        })

        // Attempt reconnection
        this.scheduleReconnect()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed'
      
      this.setState({
        status: 'error',
        error: errorMessage,
      })

      this.scheduleReconnect()
    }
  }

  private startHealthMonitoring(): void {
    this.stopHealthMonitoring()
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.healthCheckInterval_ms)
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout || this.state.retryCount >= this.maxRetries) {
      return
    }

    const delay = this.retryDelay * Math.pow(2, this.state.retryCount) // Exponential backoff
    
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      
      this.setState({
        retryCount: this.state.retryCount + 1,
      })

      try {
        await this.reconnect()
      } catch (error) {
        // Error handling is done in connect method
        console.error('Reconnection failed:', error)
      }
    }, delay)
  }

  private stopReconnectAttempts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  // Initialize connection from stored URL
  async initializeFromStorage(): Promise<void> {
    const storedUrl = storage.getServerUrl()
    if (storedUrl) {
      try {
        await this.connect(storedUrl)
      } catch (error) {
        // Don't throw on initialization failure
        console.warn('Failed to connect to stored server URL:', error)
      }
    }
  }

  // Get connection status for UI
  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.state.status === 'connected',
      serverUrl: this.state.serverUrl || '',
      error: this.state.error || undefined,
      models: this.state.models,
    }
  }

  // Check if we're ready to make API calls
  isReady(): boolean {
    return this.state.status === 'connected' && openCodeService.isInitialized()
  }

  // Get current models
  getModels(): Model[] {
    return this.state.models
  }

  // Refresh models
  async refreshModels(): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Not connected to server')
    }

    try {
      const models = await openCodeService.getModels()
      this.setState({ models })
    } catch (error) {
      console.error('Failed to refresh models:', error)
      throw error
    }
  }
}

export const connectionService = new ConnectionService()