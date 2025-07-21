import React, { useState } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import { X, Code, ListTodo, Settings } from '@tamagui/lucide-icons'

export interface Mode {
  id: 'build' | 'plan' | 'custom'
  name: string
  description: string
  icon: React.ComponentType
  color: string
  available: boolean
}

const modes: Mode[] = [
  {
    id: 'build',
    name: 'Build Mode',
    description: 'Write, edit, and execute code with full tool access',
    icon: Code,
    color: '$blue10',
    available: true,
  },
  {
    id: 'plan',
    name: 'Plan Mode',
    description: 'Read and analyze code without making changes',
    icon: ListTodo,
    color: '$orange10',
    available: true,
  },
  {
    id: 'custom',
    name: 'Custom Mode',
    description: 'Create personalized tool configurations and workflows',
    icon: Settings,
    color: '$purple10',
    available: false,
  },
]

export interface ModeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedMode: 'build' | 'plan'
  onModeSelect: (mode: 'build' | 'plan') => void
}

export function ModeSelector({
  open,
  onOpenChange,
  selectedMode,
  onModeSelect,
}: ModeSelectorProps) {
  const [instanceId] = useState(() =>
    Math.random().toString(36).substring(2, 9)
  )

  const handleModeSelect = (modeId: string) => {
    const mode = modes.find(m => m.id === modeId)
    if (mode?.available && (modeId === 'build' || modeId === 'plan')) {
      onModeSelect(modeId)
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50, 75]}
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
              Select Mode
            </Text>
            <Button size="$3" chromeless icon={X} onPress={handleClose} />
          </XStack>

          {/* Mode List */}
          <RadioGroup
            value={selectedMode}
            onValueChange={handleModeSelect}
            name={`mode-selector-${instanceId}`}
          >
            <YStack gap="$3">
              {modes.map(mode => (
                <YStack key={mode.id}>
                  <XStack
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    borderRadius="$4"
                    backgroundColor="$backgroundHover"
                    opacity={mode.available ? 1 : 0.5}
                    pressStyle={
                      mode.available
                        ? {
                            backgroundColor: '$backgroundPress',
                          }
                        : undefined
                    }
                    onPress={() => mode.available && handleModeSelect(mode.id)}
                  >
                    <RadioGroup.Item
                      value={mode.id}
                      id={`${instanceId}-${mode.id}`}
                      size="$4"
                      disabled={!mode.available}
                    >
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>

                    {mode.id === 'build' && (
                      <Code
                        size={20}
                        color={mode.available ? mode.color : '$color11'}
                      />
                    )}
                    {mode.id === 'plan' && (
                      <ListTodo
                        size={20}
                        color={mode.available ? mode.color : '$color11'}
                      />
                    )}
                    {mode.id === 'custom' && (
                      <Settings
                        size={20}
                        color={mode.available ? mode.color : '$color11'}
                      />
                    )}

                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$2">
                        <Text
                          fontSize="$4"
                          fontWeight="500"
                          color={
                            selectedMode === mode.id ? mode.color : '$color'
                          }
                        >
                          {mode.name}
                        </Text>
                        {!mode.available && (
                          <Text
                            fontSize="$2"
                            color="$color11"
                            backgroundColor="$backgroundHover"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                          >
                            Coming Soon
                          </Text>
                        )}
                      </XStack>
                      <Text fontSize="$3" color="$color11">
                        {mode.description}
                      </Text>
                    </YStack>
                  </XStack>
                </YStack>
              ))}
            </YStack>
          </RadioGroup>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
