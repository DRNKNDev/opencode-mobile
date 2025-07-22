import { MMKV } from 'react-native-mmkv'
import { STORAGE_KEYS } from '../config/constants'
import type {
  Session,
  UserPreferences,
  Model,
  ModelPreferences,
  CachedModels,
} from './types'

class StorageService {
  private storage = new MMKV()

  // Server URL
  getServerUrl(): string | null {
    return this.storage.getString(STORAGE_KEYS.serverUrl) ?? null
  }

  setServerUrl(url: string): void {
    this.storage.set(STORAGE_KEYS.serverUrl, url)
  }

  // Sessions
  getSessions(): Session[] {
    const sessionsJson = this.storage.getString(STORAGE_KEYS.sessions)
    if (!sessionsJson) return []

    try {
      const sessions = JSON.parse(sessionsJson)
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }))
    } catch {
      return []
    }
  }

  setSessions(sessions: Session[]): void {
    this.storage.set(STORAGE_KEYS.sessions, JSON.stringify(sessions))
  }

  addSession(session: Session): void {
    const sessions = this.getSessions()
    sessions.unshift(session)
    this.setSessions(sessions)
  }

  removeSession(sessionId: string): void {
    const sessions = this.getSessions().filter(s => s.id !== sessionId)
    this.setSessions(sessions)
  }

  updateSession(sessionId: string, updates: Partial<Session>): void {
    const sessions = this.getSessions()
    const index = sessions.findIndex(s => s.id === sessionId)
    if (index !== -1) {
      sessions[index] = {
        ...sessions[index],
        ...updates,
        updatedAt: new Date(),
      }
      this.setSessions(sessions)
    }
  }

  // Current session
  getCurrentSessionId(): string | null {
    return this.storage.getString(STORAGE_KEYS.currentSession) ?? null
  }

  setCurrentSessionId(sessionId: string): void {
    this.storage.set(STORAGE_KEYS.currentSession, sessionId)
  }

  // Selected model
  getSelectedModel(): string | null {
    return this.storage.getString(STORAGE_KEYS.selectedModel) ?? null
  }

  setSelectedModel(modelId: string): void {
    this.storage.set(STORAGE_KEYS.selectedModel, modelId)
  }

  // User preferences
  getUserPreferences(): UserPreferences {
    const prefsJson = this.storage.getString(STORAGE_KEYS.userPreferences)
    if (!prefsJson) {
      return {
        selectedModel: '',
        theme: 'tokyonight-dark',
        hapticFeedback: true,
      }
    }

    try {
      return JSON.parse(prefsJson)
    } catch {
      return {
        selectedModel: '',
        theme: 'tokyonight-dark',
        hapticFeedback: true,
      }
    }
  }

  setUserPreferences(preferences: UserPreferences): void {
    this.storage.set(STORAGE_KEYS.userPreferences, JSON.stringify(preferences))
  }

  // Cached models
  getCachedModels(): CachedModels | null {
    const cachedJson = this.storage.getString(STORAGE_KEYS.cachedModels)
    if (!cachedJson) return null

    try {
      const cached = JSON.parse(cachedJson)
      return {
        ...cached,
        models: cached.models.map((model: any) => ({
          ...model,
          isAvailable: model.isAvailable ?? true,
        })),
      }
    } catch {
      return null
    }
  }

  setCachedModels(models: Model[], serverUrl: string): void {
    const cached: CachedModels = {
      models,
      lastUpdated: Date.now(),
      serverUrl,
    }
    this.storage.set(STORAGE_KEYS.cachedModels, JSON.stringify(cached))
  }

  // Model preferences
  getModelPreferences(): ModelPreferences {
    const prefsJson = this.storage.getString(STORAGE_KEYS.modelPreferences)
    if (!prefsJson) {
      return {
        defaultModel: '',
        lastUsedModel: '',
        providerPreferences: {},
      }
    }

    try {
      return JSON.parse(prefsJson)
    } catch {
      return {
        defaultModel: '',
        lastUsedModel: '',
        providerPreferences: {},
      }
    }
  }

  setModelPreferences(preferences: ModelPreferences): void {
    this.storage.set(STORAGE_KEYS.modelPreferences, JSON.stringify(preferences))
  }

  updateModelPreference(
    key: keyof ModelPreferences,
    value: string | Record<string, string>
  ): void {
    const preferences = this.getModelPreferences()
    preferences[key] = value as any
    this.setModelPreferences(preferences)
  }

  // Helper to check if cached models are still valid (24 hours)
  isCacheValid(cached: CachedModels, serverUrl: string): boolean {
    const cacheAge = Date.now() - cached.lastUpdated
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    return cached.serverUrl === serverUrl && cacheAge < maxAge
  }

  // Clear all data
  clearAll(): void {
    this.storage.clearAll()
  }
}

export const storage = new StorageService()
