import React, { useState } from 'react'
import { useSelector } from '@legendapp/state/react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import { X, Code, ListTodo, Settings } from '@tamagui/lucide-icons'
import { actions } from '../../store/actions'
import { availableModes, selectedMode } from '../../store/computed'
import { store$ } from '../../store'

export interface Mode {
  name: string
  tools: Record<string, boolean>
  model: {
    modelID: string
    providerID: string
  }
}

export interface ModeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModeSelector({ open, onOpenChange }: ModeSelectorProps) {
  const [instanceId] = useState(() =>
    Math.random().toString(36).substring(2, 9)
  )

  // Use store selectors
  const modes = useSelector(availableModes)
  const currentSelectedMode = useSelector(selectedMode)
  const isLoadingModes = useSelector(store$.modes.isLoading)
  const modesError = useSelector(store$.modes.error)

  // UI helper functions
  const getDisplayName = (mode: Mode) => {
    switch (mode.name) {
      case 'build':
        return 'Build Mode'
      case 'plan':
        return 'Plan Mode'
      default:
        return mode.name.charAt(0).toUpperCase() + mode.name.slice(1) + ' Mode'
    }
  }

  const getDescription = (mode: Mode) => {
    switch (mode.name) {
      case 'build':
        return 'Write, edit, and execute code with full tool access'
      case 'plan':
        return 'Read and analyze code without making changes'
      default: {
        const restrictedTools = Object.entries(mode.tools)
          .filter(([_, enabled]) => !enabled)
          .map(([tool, _]) => tool)

        return restrictedTools.length === 0
          ? 'Custom mode with full tool access'
          : `Custom mode - ${restrictedTools.join(', ')} disabled`
      }
    }
  }

  const getIcon = (mode: Mode) => {
    switch (mode.name) {
      case 'build':
        return Code
      case 'plan':
        return ListTodo
      default:
        return Settings
    }
  }

  const getColor = (mode: Mode) => {
    switch (mode.name) {
      case 'build':
        return '$blue10'
      case 'plan':
        return '$orange10'
      default:
        return '$purple10'
    }
  }

  const isAvailable = (mode: Mode) => {
    // All modes from API are considered available
    return true
  }

  const handleModeSelect = (modeName: string) => {
    const mode = modes.find(m => m.name === modeName)
    if (mode && isAvailable(mode)) {
      actions.modes.selectMode(modeName)
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
          {isLoadingModes ? (
            <YStack alignItems="center" padding="$4">
              <Text fontSize="$4" color="$color11">
                Loading modes...
              </Text>
            </YStack>
          ) : modesError ? (
            <YStack alignItems="center" padding="$4" gap="$2">
              <Text fontSize="$4" color="$red10">
                Failed to load modes
              </Text>
              <Text fontSize="$3" color="$color11" textAlign="center">
                {modesError}
              </Text>
            </YStack>
          ) : modes.length === 0 ? (
            <YStack alignItems="center" padding="$4">
              <Text fontSize="$4" color="$color11">
                No modes available
              </Text>
            </YStack>
          ) : (
            <RadioGroup
              value={currentSelectedMode?.name || ''}
              onValueChange={handleModeSelect}
              name={`mode-selector-${instanceId}`}
            >
              <YStack gap="$3">
                {modes.map(mode => {
                  // Ensure mode has valid name
                  if (!mode?.name) return null

                  const Icon = getIcon(mode)
                  const available = isAvailable(mode)
                  const color = getColor(mode)

                  return (
                    <YStack key={mode.name}>
                      <XStack
                        alignItems="center"
                        gap="$3"
                        padding="$3"
                        borderRadius="$4"
                        backgroundColor="$backgroundHover"
                        opacity={available ? 1 : 0.5}
                        pressStyle={
                          available
                            ? {
                                backgroundColor: '$backgroundPress',
                              }
                            : undefined
                        }
                        onPress={() => available && handleModeSelect(mode.name)}
                      >
                        <RadioGroup.Item
                          value={mode.name}
                          id={`${instanceId}-${mode.name}`}
                          size="$4"
                          disabled={!available}
                        >
                          <RadioGroup.Indicator />
                        </RadioGroup.Item>

                        <Icon
                          size={20}
                          color={available ? color : '$color11'}
                        />

                        <YStack flex={1}>
                          <XStack alignItems="center" gap="$2">
                            <Text
                              fontSize="$4"
                              fontWeight="500"
                              color={
                                currentSelectedMode?.name === mode.name
                                  ? color
                                  : '$color'
                              }
                            >
                              {getDisplayName(mode)}
                            </Text>
                            {!available && (
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
                            {getDescription(mode)}
                          </Text>
                        </YStack>
                      </XStack>
                    </YStack>
                  )
                })}
              </YStack>
            </RadioGroup>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
