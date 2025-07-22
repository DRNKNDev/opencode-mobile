import { useCallback, useEffect, useState } from 'react'
import { useConnectionContext } from '../contexts/ConnectionContext'
import { storage } from '../services/storage'
import type { Model, ModelPreferences } from '../services/types'

export interface UseModelsReturn {
  models: Model[]
  availableModels: Model[]
  selectedModel: string
  modelPreferences: ModelPreferences
  isLoading: boolean
  error: string | null
  selectModel: (modelId: string) => void
  getProviderIdForModel: (modelId: string) => string | null
  refreshModels: () => Promise<void>
  setDefaultModel: (modelId: string) => void
  getModelById: (modelId: string) => Model | null
}

export function useModels(): UseModelsReturn {
  const {
    models: connectionModels,
    isConnected,
    refreshModels: refreshConnectionModels,
  } = useConnectionContext()
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [modelPreferences, setModelPreferences] = useState<ModelPreferences>({
    defaultModel: '',
    lastUsedModel: '',
    providerPreferences: {},
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cached models and preferences on mount
  const loadModelsAndPreferences = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load preferences
      const prefs = storage.getModelPreferences()
      setModelPreferences(prefs)

      // Load cached models if not connected
      if (!isConnected) {
        const serverUrl = storage.getServerUrl()
        if (serverUrl) {
          const cached = storage.getCachedModels()
          if (cached && storage.isCacheValid(cached, serverUrl)) {
            setModels(cached.models)
          }
        }
      }

      // Load selected model from storage
      const storedModel = storage.getSelectedModel()
      if (storedModel) {
        setSelectedModel(storedModel)
      }

      // Mark as initialized after loading
      setIsInitialized(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setIsLoading(false)
    }
  }, [isConnected])

  useEffect(() => {
    loadModelsAndPreferences()
  }, [loadModelsAndPreferences])

  const getProviderIdForModel = useCallback(
    (modelId: string): string | null => {
      const model = models.find(m => m.id === modelId)
      if (!model) return null

      // If model has explicit providerId, use it
      if (model.providerId) {
        return model.providerId
      }

      // Otherwise, try to map provider name to ID
      // This is a simple mapping - you might need to adjust based on your API
      const providerMap: Record<string, string> = {
        Anthropic: 'anthropic',
        OpenAI: 'openai',
        Google: 'google',
        Meta: 'meta',
        Mistral: 'mistral',
      }

      return providerMap[model.provider] || model.provider.toLowerCase()
    },
    [models]
  )

  // Simplified default selection logic
  const getEffectiveDefaultModel = useCallback(
    (availableModels: Model[]) => {
      if (availableModels.length === 0) return null

      // Priority 1: Last used model
      if (modelPreferences.lastUsedModel) {
        const lastUsed = availableModels.find(
          m => m.id === modelPreferences.lastUsedModel
        )
        if (lastUsed) return lastUsed.id
      }

      // Priority 2: Default model (from API or user setting)
      if (modelPreferences.defaultModel) {
        const defaultModel = availableModels.find(
          m => m.id === modelPreferences.defaultModel
        )
        if (defaultModel) return defaultModel.id
      }

      // Priority 3: First available model
      return availableModels[0].id
    },
    [modelPreferences]
  )

  // Update models when connection models change
  useEffect(() => {
    if (isConnected && connectionModels.length > 0) {
      setModels(connectionModels)

      // Cache the models
      const serverUrl = storage.getServerUrl()
      if (serverUrl) {
        storage.setCachedModels(connectionModels, serverUrl)
      }

      // Only set default model if we're initialized and there's no stored model
      if (
        isInitialized &&
        !storage.getSelectedModel() &&
        connectionModels.length > 0
      ) {
        const defaultModel = getEffectiveDefaultModel(connectionModels)
        if (defaultModel) {
          setSelectedModel(defaultModel)
          storage.setSelectedModel(defaultModel)
        }
      }
    }
  }, [isConnected, connectionModels, isInitialized, getEffectiveDefaultModel])

  const selectModel = useCallback(
    (modelId: string) => {
      const model = models.find(m => m.id === modelId)
      if (!model) {
        setError(`Model ${modelId} not found`)
        return
      }

      setSelectedModel(modelId)
      storage.setSelectedModel(modelId)

      // Update preferences
      const updatedPrefs = {
        ...modelPreferences,
        lastUsedModel: modelId,
      }
      setModelPreferences(updatedPrefs)
      storage.setModelPreferences(updatedPrefs)
    },
    [models, modelPreferences]
  )

  const refreshModels = useCallback(async () => {
    if (!isConnected) {
      setError('Not connected to server')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await refreshConnectionModels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh models')
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, refreshConnectionModels])

  const setDefaultModel = useCallback(
    (modelId: string) => {
      const model = models.find(m => m.id === modelId)
      if (!model) {
        setError(`Model ${modelId} not found`)
        return
      }

      const updatedPrefs = {
        ...modelPreferences,
        defaultModel: modelId,
      }
      setModelPreferences(updatedPrefs)
      storage.setModelPreferences(updatedPrefs)
    },
    [models, modelPreferences]
  )

  const getModelById = useCallback(
    (modelId: string): Model | null => {
      return models.find(m => m.id === modelId) || null
    },
    [models]
  )

  // Filter available models (not explicitly marked as unavailable)
  const availableModels = models.filter(model => model.isAvailable !== false)

  return {
    models,
    availableModels,
    selectedModel,
    modelPreferences,
    isLoading,
    error,
    selectModel,
    getProviderIdForModel,
    refreshModels,
    setDefaultModel,
    getModelById,
  }
}
