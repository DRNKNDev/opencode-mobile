import { X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import { useState } from 'react'
import { Button, Separator, Text, XStack, YStack } from 'tamagui'

export interface Model {
  id: string
  name: string
  provider: string
  description?: string
}

export interface ModelSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedModel: string
  onModelSelect: (modelId: string) => void
  models?: Model[]
}

const defaultModels: Model[] = [
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for simple tasks',
  },
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    description: 'Next generation model with enhanced capabilities',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Latest multimodal model',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    description: 'Smaller, faster version of GPT-4o',
  },
]

export function ModelSelector({
  open,
  onOpenChange,
  selectedModel,
  onModelSelect,
  models = defaultModels,
}: ModelSelectorProps) {
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

  // Group models by provider
  const groupedModels = models.reduce(
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
            <Button size="$3" chromeless icon={X} onPress={handleClose} />
          </XStack>

          {/* Model List */}
          <RadioGroup
            value={selectedModel}
            onValueChange={handleModelSelect}
            name={`model-selector-${instanceId}`}
          >
            <YStack gap="$4">
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
                  </YStack>
                )
              )}
            </YStack>
          </RadioGroup>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
