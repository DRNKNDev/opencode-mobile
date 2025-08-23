import { useSelector } from '@legendapp/state/react'
import type { Model, Provider } from '@opencode-ai/sdk'
import { RefreshCw, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import React, { useEffect, useState } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { actions } from '../../store/actions'
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

  // Load models when modal opens if not already loaded
  useEffect(() => {
    if (open && providers.length === 0 && !isLoading) {
      actions.models.loadProviders().catch((error: Error) => {
        debug.warn('Failed to load providers in ModelSelector:', error)
      })
    }
  }, [open, providers.length, isLoading])

  const handleModelSelect = (modelId: string) => {
    // Find the provider that has this model
    for (const provider of providers) {
      if (provider.models && provider.models[modelId]) {
        onModelSelect(modelId, provider.id)
        onOpenChange(false)
        return
      }
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

  // Get default models and group providers
  const defaults = useSelector(store$.models.default)
  const defaultModels: {
    model: Model
    providerId: string
    providerName: string
  }[] = []
  const providerGroups: {
    provider: Provider
    models: Model[]
    nonDefaultModels: Model[]
  }[] = []

  // Collect ALL default model IDs from all providers
  const allDefaultModelIds = new Set(Object.values(defaults))

  providers.forEach(provider => {
    if (!provider.models) return

    const models = Object.values(provider.models)
    const defaultModelId = defaults[provider.id]
    const defaultModel = defaultModelId ? provider.models[defaultModelId] : null

    if (defaultModel) {
      defaultModels.push({
        model: defaultModel,
        providerId: provider.id,
        providerName: provider.name || provider.id,
      })
    }

    // Filter out ALL default models, not just this provider's default
    const nonDefaultModels = models.filter(model => !allDefaultModelIds.has(model.id))

    if (nonDefaultModels.length > 0) {
      providerGroups.push({
        provider,
        models,
        nonDefaultModels,
      })
    }
  })

  // Constants for model display
  const MODEL_ITEM_HEIGHT = 60 // Approximate height including padding and separator
  const MAX_VISIBLE_MODELS = 3
  const PROVIDER_SECTION_HEIGHT = MAX_VISIBLE_MODELS * MODEL_ITEM_HEIGHT

  // Helper component to render a model item
  const ModelItem = ({
    model,
    providerId,
    providerName,
    showProvider = false,
  }: {
    model: Model
    providerId: string
    providerName?: string
    showProvider?: boolean
  }) => {
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
          id={`${providerId}-${model.id}`}
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
          {!isLoading && providers.length === 0 && (
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
                {/* Default Models Section */}
                {defaultModels.length > 0 && (
                  <YStack gap="$2">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$4" fontWeight="600" color="$blue10">
                        Default
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        ({defaultModels.length})
                      </Text>
                    </XStack>

                    <YStack
                      backgroundColor="$backgroundHover"
                      borderRadius="$4"
                      padding="$2"
                    >
                      <YStack gap="$1" paddingRight="$2">
                        {defaultModels.map((item, index) => (
                          <YStack
                            key={`default-${item.providerId}-${item.model.id}-${index}`}
                          >
                            <ModelItem
                              model={item.model}
                              providerId={item.providerId}
                              providerName={item.providerName}
                              showProvider={true}
                            />
                            {index < defaultModels.length - 1 && (
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
                    {providerGroups.map(group => (
                      <YStack key={group.provider.id} gap="$2">
                        <XStack alignItems="center" gap="$2">
                          <Text fontSize="$4" fontWeight="500" color="$color11">
                            {group.provider.name || group.provider.id}
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            ({group.nonDefaultModels.length})
                          </Text>
                          {group.nonDefaultModels.length >
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
                                group.nonDefaultModels.length >
                                MAX_VISIBLE_MODELS
                                  ? PROVIDER_SECTION_HEIGHT
                                  : undefined,
                            }}
                            showsVerticalScrollIndicator={
                              group.nonDefaultModels.length > MAX_VISIBLE_MODELS
                            }
                            nestedScrollEnabled={true}
                          >
                            <YStack gap="$1" paddingRight="$2">
                              {group.nonDefaultModels.map((model, index) => (
                                <YStack
                                  key={`${group.provider.id}-${model.id}-${index}`}
                                >
                                  <ModelItem
                                    model={model}
                                    providerId={group.provider.id}
                                    providerName={
                                      group.provider.name || group.provider.id
                                    }
                                  />
                                  {index <
                                    group.nonDefaultModels.length - 1 && (
                                    <Separator
                                      marginHorizontal="$3"
                                      borderWidth={0.5}
                                    />
                                  )}
                                </YStack>
                              ))}
                            </YStack>
                          </Sheet.ScrollView>
                        </YStack>
                      </YStack>
                    ))}
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
