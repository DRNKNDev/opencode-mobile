import { useState, useEffect, useCallback, useRef } from 'react'
import { openCodeService } from '../services/opencode'
import { storage } from '../services/storage'
import { connectionService } from '../services/connection'
import type { Session } from '../services/types'
import { debug } from '../utils/debug'

export interface UseSessionsReturn {
  // Session data
  sessions: Session[]
  currentSessionId: string | null
  currentSession: Session | null

  // Loading states
  isLoading: boolean
  isRefreshing: boolean
  isCreating: boolean
  isDeleting: boolean

  // Session actions
  createSession: () => Promise<Session>
  deleteSession: (sessionId: string) => Promise<void>
  selectSession: (sessionId: string) => void
  refreshSessions: (isUserTriggered?: boolean) => Promise<void>

  // Error handling
  error: string | null
  clearError: () => void
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshPromise = useRef<Promise<void> | null>(null)
  const hasInitiallyLoaded = useRef(false)

  // Refresh sessions from server when connected
  const refreshSessions = useCallback(async (isUserTriggered = false) => {
    // If already refreshing, return existing promise
    if (refreshPromise.current) {
      return refreshPromise.current
    }

    if (!connectionService.isReady()) {
      debug.warn('Connection not ready, skipping refresh')
      return
    }

    const promise = (async () => {
      if (isUserTriggered) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const remoteSessions = await openCodeService.getSessions()
        debug.success(`Fetched ${remoteSessions.length} sessions`)

        // Get current sessions to merge with
        setSessions(currentSessions => {
          // Merge with local sessions, preferring remote data
          const mergedSessions = mergeSessions(currentSessions, remoteSessions)
          storage.setSessions(mergedSessions)
          return mergedSessions
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to refresh sessions'
        debug.error('Failed to refresh sessions:', err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
        refreshPromise.current = null
      }
    })()

    refreshPromise.current = promise
    return promise
  }, []) // Remove sessions dependency to prevent stale closures

  // Load sessions from storage on mount and trigger refresh
  useEffect(() => {
    const loadStoredSessions = () => {
      try {
        const storedSessions = storage.getSessions()
        debug.log(`Loaded ${storedSessions.length} sessions from storage`)
        setSessions(storedSessions)

        const storedCurrentSessionId = storage.getCurrentSessionId()
        setCurrentSessionId(storedCurrentSessionId)

        // Only trigger initial refresh once
        if (!hasInitiallyLoaded.current) {
          hasInitiallyLoaded.current = true
          // Trigger refresh if connection is ready
          setTimeout(() => {
            if (connectionService.isReady()) {
              refreshSessions()
            }
          }, 500) // Small delay to ensure connection is established
        }
      } catch (err) {
        debug.error('Failed to load sessions from storage:', err)
        setError('Failed to load sessions from storage')
      }
    }

    loadStoredSessions()
  }, [refreshSessions])

  // Auto-refresh when connection becomes ready (only if not already loaded)
  useEffect(() => {
    if (connectionService.isReady() && !hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true
      refreshSessions()
    }
  }, [refreshSessions])

  // Listen to connection state changes (only refresh once per connection)
  useEffect(() => {
    const unsubscribe = connectionService.subscribe(state => {
      if (state.status === 'connected' && !hasInitiallyLoaded.current) {
        hasInitiallyLoaded.current = true
        // Small delay to ensure openCodeService is fully initialized
        setTimeout(() => {
          if (connectionService.isReady()) {
            refreshSessions()
          }
        }, 100)
      }
    })

    return unsubscribe
  }, [refreshSessions])

  const createSession = useCallback(async (): Promise<Session> => {
    if (!connectionService.isReady()) {
      throw new Error('Not connected to server')
    }

    setIsCreating(true)
    setError(null)

    try {
      const newSession = await openCodeService.createSession()
      debug.success(`Session created: ${newSession.id}`)

      // Add to local state and storage using functional update
      setSessions(currentSessions => {
        const updatedSessions = [newSession, ...currentSessions]
        storage.setSessions(updatedSessions)
        return updatedSessions
      })

      // Set as current session
      setCurrentSessionId(newSession.id)
      storage.setCurrentSessionId(newSession.id)

      return newSession
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session'
      debug.error('Failed to create session:', err)
      setError(errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, []) // Remove sessions dependency

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsDeleting(true)
    setError(null)

    try {
      // Delete from server if connected
      if (connectionService.isReady()) {
        await openCodeService.deleteSession(sessionId)
        debug.success('Session deleted from server')
      }

      // Remove from local state and storage using functional update
      setSessions(currentSessions => {
        const updatedSessions = currentSessions.filter(s => s.id !== sessionId)
        storage.setSessions(updatedSessions)

        // Clear current session if it was deleted
        setCurrentSessionId(currentId => {
          if (currentId === sessionId) {
            const newCurrentSessionId =
              updatedSessions.length > 0 ? updatedSessions[0].id : null
            if (newCurrentSessionId) {
              storage.setCurrentSessionId(newCurrentSessionId)
            } else {
              storage.setCurrentSessionId('')
            }
            return newCurrentSessionId
          }
          return currentId
        })

        return updatedSessions
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete session'
      debug.error('Failed to delete session:', err)
      setError(errorMessage)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, []) // Remove dependencies

  const selectSession = useCallback((sessionId: string) => {
    setSessions(currentSessions => {
      const session = currentSessions.find(s => s.id === sessionId)
      if (session) {
        setCurrentSessionId(sessionId)
        storage.setCurrentSessionId(sessionId)
        debug.log(`Session selected: ${sessionId}`)
      } else {
        debug.warn(`Session not found: ${sessionId}`)
      }
      return currentSessions
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Get current session object
  const currentSession = currentSessionId
    ? sessions.find(s => s.id === currentSessionId) || null
    : null

  return {
    // Session data
    sessions,
    currentSessionId,
    currentSession,

    // Loading states
    isLoading,
    isRefreshing,
    isCreating,
    isDeleting,

    // Session actions
    createSession,
    deleteSession,
    selectSession,
    refreshSessions,

    // Error handling
    error,
    clearError,
  }
}

// Helper function to merge local and remote sessions
function mergeSessions(
  localSessions: Session[],
  remoteSessions: Session[]
): Session[] {
  const sessionMap = new Map<string, Session>()

  // Add local sessions first
  localSessions.forEach(session => {
    sessionMap.set(session.id, session)
  })

  // Override with remote sessions (they have priority)
  remoteSessions.forEach(session => {
    sessionMap.set(session.id, session)
  })

  // Convert back to array and sort by time.updated (newest first)
  return Array.from(sessionMap.values()).sort(
    (a, b) => b.time.updated - a.time.updated
  )
}
