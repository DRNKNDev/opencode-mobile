import { MMKV } from 'react-native-mmkv'
import { STORAGE_KEYS } from '../config/constants'
import type { Session, UserPreferences } from './types'

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

  // Clear all data
  clearAll(): void {
    this.storage.clearAll()
  }
}

export const storage = new StorageService()
