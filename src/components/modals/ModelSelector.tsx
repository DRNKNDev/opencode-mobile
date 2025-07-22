import React, { useState } from 'react'
import { RefreshCw, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
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
  const { availableModels, isLoading, error, refreshModels } = useModels()
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

  // Group models by provider
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
                {Object.entries(groupedModels).map(
                  ([provider, providerModels]) => (
                    <YStack key={provider} gap="$2">
                      <Text fontSize="$4" fontWeight="600" color="$color11">
                        {provider}
                      </Text>

                      <YStack
                        backgroundColor="$backgroundHover"
                        borderRadius="$4"
                        padding="$2"
                      >
                        <Sheet.ScrollView
                          style={{ maxHeight: 200 }}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                          <YStack gap="$1" paddingRight="$2">
                            {providerModels.map((model, index) => (
                              <YStack key={model.id}>
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
                                    <Text
                                      fontSize="$4"
                                      fontWeight="500"
                                      color={
                                        selectedModel === model.id
                                          ? '$blue10'
                                          : '$color'
                                      }
                                    >
                                      {model.name}
                                    </Text>
                                    {model.description && (
                                      <Text fontSize="$3" color="$color11">
                                        {model.description}
                                      </Text>
                                    )}
                                  </YStack>
                                </XStack>

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
            </RadioGroup>
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
