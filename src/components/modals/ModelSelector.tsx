import { RefreshCw, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import React, { useState } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { useModels } from '../../hooks/useModels'
import type { Model } from '../../services/types'

export interface ModelSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedModel: string
  onModelSelect: (modelId: string) => void
}

export function ModelSelector({
  open,
  onOpenChange,
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  const { availableModels, defaultModels, isLoading, error, refreshModels } =
    useModels()
  const [instanceId] = useState(() =>
    Math.random().toString(36).substring(2, 9)
  )

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleRefresh = async () => {
    try {
      await refreshModels()
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to refresh models:', err)
    }
  }

  // Helper function to check if a model is the default for its provider
  const isDefaultModel = (model: Model): boolean => {
    const providerId = model.providerId || model.provider.toLowerCase()
    return defaultModels[providerId] === model.id
  }

  // Get default models as a separate group
  const defaultModelsList = availableModels.filter(isDefaultModel)

  // Group all models by provider
  const groupedModels = availableModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model)
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
  }: {
    model: Model
    showProvider?: boolean
  }) => (
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
        id={`${instanceId}-${model.id}`}
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
              {model.provider}
            </Text>
          )}
        </XStack>
        {model.description && (
          <Text fontSize="$3" color="$color11">
            {model.description}
          </Text>
        )}
      </YStack>
    </XStack>
  )

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[60, 85]}
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
                          <YStack key={`recommended-${model.id}`}>
                            <ModelItem model={model} showProvider={true} />
                            {index < defaultModelsList.length - 1 && (
                              <Separator
                                marginHorizontal="$3"
                                borderWidth={0.5}
                                borderColor="$blue6"
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
                              ({providerModels.length})
                            </Text>
                            {providerModels.length > MAX_VISIBLE_MODELS && (
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
                                {providerModels.map((model, index) => (
                                  <YStack key={model.id}>
                                    <ModelItem model={model} />
                                    {index < providerModels.length - 1 && (
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
