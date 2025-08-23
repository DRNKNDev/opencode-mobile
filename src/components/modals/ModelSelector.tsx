import { useSelector } from '@legendapp/state/react'
import type { Model } from '@opencode-ai/sdk'
import { RefreshCw, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import React, { useEffect, useState } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { actions } from '../../store/actions'
import { allModels, findProviderForModel } from '../../store/computed'
import { debug } from '../../utils/debug'

export interface ModelSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedModel: string
  onModelSelect: (modelId: string, providerId: string) => void
}

export function ModelSelector({
  open,
  onOpenChange,
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  const providers = useSelector(store$.models.providers)
  const isLoading = useSelector(store$.models.isLoading)
  const error = useSelector(store$.connection.error)
  const [instanceId] = useState(() =>
    Math.random().toString(36).substring(2, 9)
  )

  // Get all models from computed value
  const availableModels = useSelector(allModels)

  // Load models when modal opens if not already loaded
  useEffect(() => {
    if (open && providers.length === 0 && !isLoading) {
      actions.models.loadProviders().catch((error: Error) => {
        debug.warn('Failed to load providers in ModelSelector:', error)
      })
    }
  }, [open, providers.length, isLoading])

  const handleModelSelect = (modelId: string) => {
    const provider = findProviderForModel(modelId)
    if (provider) {
      onModelSelect(modelId, provider.id)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleRefresh = async () => {
    try {
      await actions.models.loadProviders(true) // Force refresh
    } catch (err) {
      // Error is handled by the store actions
      debug.error('Failed to load providers:', err)
    }
  }

  // Helper function to check if a model is the API-provided default for its provider
  const isDefaultModel = (model: Model): boolean => {
    const provider = findProviderForModel(model.id)
    if (!provider?.models) return false

    // Check if this model is the API-provided default for this provider
    const defaults = store$.models.default.get()
    const defaultModelId = defaults[provider.id]

    return defaultModelId === model.id
  }

  // Get default models as a separate group (first model from each provider)
  const defaultModelsList = availableModels.filter(isDefaultModel)

  // Group non-default models by provider (exclude models that are already in defaults)
  const defaultModelIds = new Set(defaultModelsList.map(m => m.id))
  const nonDefaultModels = availableModels.filter(
    model => !defaultModelIds.has(model.id)
  )

  const groupedModels = nonDefaultModels.reduce(
    (acc: Record<string, Model[]>, model: Model) => {
      const provider = findProviderForModel(model.id)
      const providerName = provider?.name || provider?.id || 'Unknown'
      if (!acc[providerName]) {
        acc[providerName] = []
      }
      acc[providerName].push(model)
      return acc
    },
    {} as Record<string, Model[]>
  )

  // Constants for model display
  const MODEL_ITEM_HEIGHT = 60 // Approximate height including padding and separator
  const MAX_VISIBLE_MODELS = 3
  const PROVIDER_SECTION_HEIGHT = MAX_VISIBLE_MODELS * MODEL_ITEM_HEIGHT

  // Helper component to render a model item
  const ModelItem = ({
    model,
    showProvider = false,
    section = 'provider',
  }: {
    model: Model
    showProvider?: boolean
    section?: 'default' | 'provider'
  }) => {
    // Get provider name for this model
    const modelProvider = findProviderForModel(model.id)
    const providerName = modelProvider?.name || modelProvider?.id || 'Unknown'

    return (
      <XStack
        alignItems="center"
        gap="$3"
        padding="$3"
        borderRadius="$2"
        pressStyle={{
          backgroundColor: '$backgroundPress',
        }}
        hoverStyle={{
          backgroundColor: '$backgroundHover',
        }}
        onPress={() => handleModelSelect(model.id)}
      >
        <RadioGroup.Item
          value={model.id}
          id={`${instanceId}-${section}-${model.id}`}
          size="$4"
        >
          <RadioGroup.Indicator />
        </RadioGroup.Item>

        <YStack flex={1}>
          <XStack alignItems="center" gap="$2">
            <Text
              fontSize="$4"
              fontWeight="500"
              color={selectedModel === model.id ? '$blue10' : '$color'}
            >
              {model.name}
            </Text>
            {showProvider && (
              <Text
                fontSize="$2"
                fontWeight="500"
                color="$color11"
                backgroundColor="$color4"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                {providerName}
              </Text>
            )}
          </XStack>
        </YStack>
      </XStack>
    )
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[60]}
      dismissOnSnapToBottom
      animation="medium"
      zIndex={100_000}
      moveOnKeyboardChange
    >
      <Sheet.Overlay
        backgroundColor="$backgroundTransparent"
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        padding="$4"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <Sheet.Handle />

        <YStack gap="$4">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="600" color="$color">
              Select Model
            </Text>
            <XStack gap="$2">
              <Button
                size="$3"
                chromeless
                icon={RefreshCw}
                onPress={handleRefresh}
                disabled={isLoading}
                opacity={isLoading ? 0.5 : 1}
              />
              <Button size="$3" chromeless icon={X} onPress={handleClose} />
            </XStack>
          </XStack>

          {/* Error Message */}
          {error && (
            <Text fontSize="$3" color="$red10" textAlign="center">
              {error}
            </Text>
          )}

          {/* Loading State */}
          {isLoading && (
            <XStack justifyContent="center" padding="$4">
              <Spinner size="small" />
              <Text fontSize="$3" color="$color11" marginLeft="$2">
                Loading models...
              </Text>
            </XStack>
          )}

          {/* Empty State */}
          {!isLoading && availableModels.length === 0 && (
            <Text
              fontSize="$4"
              color="$color11"
              textAlign="center"
              padding="$4"
            >
              No models available. Try refreshing or check your connection.
            </Text>
          )}

          {/* Model List */}
          <Sheet.ScrollView
            height={400}
            flex={0}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <RadioGroup
              value={selectedModel}
              onValueChange={handleModelSelect}
              name={`model-selector-${instanceId}`}
            >
              <YStack gap="$4" paddingRight="$2">
                {/* Recommended Models Section */}
                {defaultModelsList.length > 0 && (
                  <YStack gap="$2">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$4" fontWeight="600" color="$blue10">
                        Default
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        ({defaultModelsList.length})
                      </Text>
                    </XStack>

                    <YStack
                      backgroundColor="$backgroundHover"
                      borderRadius="$4"
                      padding="$2"
                    >
                      <YStack gap="$1" paddingRight="$2">
                        {defaultModelsList.map((model, index) => (
                          <YStack key={`default-${model.id}-${index}`}>
                            <ModelItem
                              model={model}
                              showProvider={true}
                              section="default"
                            />
                            {index < defaultModelsList.length - 1 && (
                              <Separator
                                marginHorizontal="$3"
                                borderWidth={0.5}
                              />
                            )}
                          </YStack>
                        ))}
                      </YStack>
                    </YStack>
                  </YStack>
                )}

                {/* All Models by Provider Section */}
                <YStack gap="$2">
                  <YStack gap="$3">
                    {Object.entries(groupedModels).map(
                      ([provider, providerModels]) => (
                        <YStack key={provider} gap="$2">
                          <XStack alignItems="center" gap="$2">
                            <Text
                              fontSize="$4"
                              fontWeight="500"
                              color="$color11"
                            >
                              {provider}
                            </Text>
                            <Text fontSize="$3" color="$color11">
                              ({(providerModels as Model[]).length})
                            </Text>
                            {(providerModels as Model[]).length >
                              MAX_VISIBLE_MODELS && (
                              <Text
                                fontSize="$2"
                                color="$color10"
                                fontStyle="italic"
                              >
                                scroll for more
                              </Text>
                            )}
                          </XStack>

                          <YStack
                            backgroundColor="$backgroundHover"
                            borderRadius="$4"
                            padding="$2"
                          >
                            <Sheet.ScrollView
                              style={{
                                maxHeight:
                                  providerModels.length > MAX_VISIBLE_MODELS
                                    ? PROVIDER_SECTION_HEIGHT
                                    : undefined,
                              }}
                              showsVerticalScrollIndicator={
                                providerModels.length > MAX_VISIBLE_MODELS
                              }
                              nestedScrollEnabled={true}
                            >
                              <YStack gap="$1" paddingRight="$2">
                                {providerModels.map(
                                  (model: Model, index: number) => (
                                    <YStack
                                      key={`${provider}-${model.id}-${index}`}
                                    >
                                      <ModelItem
                                        model={model}
                                        section="provider"
                                      />
                                      {index < providerModels.length - 1 && (
                                        <Separator
                                          marginHorizontal="$3"
                                          borderWidth={0.5}
                                        />
                                      )}
                                    </YStack>
                                  )
                                )}
                              </YStack>
                            </Sheet.ScrollView>
                          </YStack>
                        </YStack>
                      )
                    )}
                  </YStack>
                </YStack>
              </YStack>
            </RadioGroup>
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
