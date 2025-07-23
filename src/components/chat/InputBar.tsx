import {
  ArrowUpCircle,
  ChevronDown,
  Code,
  ListTodo,
  StopCircle,
} from '@tamagui/lucide-icons'
import React, { useState } from 'react'
import { useSelector } from '@legendapp/state/react'
import type { InputProps } from 'tamagui'
import { Button, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { selectedModel } from '../../store/computed'
import { ModelSelector } from '../modals/ModelSelector'
import { ModeSelector } from '../modals/ModeSelector'
import { TextArea } from '../ui/TextArea'

export interface InputBarProps {
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
  onStop: () => void
  onModelSelect?: (modelId: string) => void
  currentMode?: 'build' | 'plan'
  onModeSelect?: (mode: 'build' | 'plan') => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  currentModel?: string
  size?: '$2' | '$3' | '$4'
  borderWidth?: number
  focusStyle?: InputProps['focusStyle']
  paddingHorizontal?: number
  paddingVertical?: number
}

export function InputBar({
  value,
  onChange,
  onSubmit,
  onStop,
  onModelSelect,
  currentMode = 'build',
  onModeSelect,
  disabled = false,
  placeholder = 'Type a message...',
  isStreaming = false,
  currentModel,
  size = '$2',
  borderWidth,
  focusStyle,
  paddingHorizontal,
  paddingVertical,
}: InputBarProps) {
  const availableModels = useSelector(store$.models.available)
  const model = useSelector(selectedModel)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)
  const canSend = value.trim().length > 0 && !disabled

  // Use currentModel prop if provided, otherwise fall back to selectedModel from store
  const effectiveModel = currentModel || model?.id || ''

  const getModelName = (modelId: string): string => {
    const foundModel = availableModels.find(m => m.id === modelId)
    return foundModel?.name || modelId
  }

  const handleSubmit = () => {
    if (canSend && !isStreaming) {
      onSubmit()
    }
  }

  const handleStop = () => {
    if (isStreaming) {
      onStop()
    }
  }

  return (
    <YStack>
      <TextArea
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLines={4}
        minLines={1}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        size={size}
        borderWidth={borderWidth}
        focusStyle={focusStyle}
        paddingHorizontal={paddingHorizontal}
        paddingVertical={paddingVertical}
      />

      <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
        <XStack alignItems="center">
          <Button
            size="$3"
            chromeless
            onPress={() => setShowModeSelector(true)}
            disabled={disabled}
            pressStyle={{
              backgroundColor: '$backgroundPress',
            }}
            aria-label="Select mode"
          >
            {currentMode === 'build' ? (
              <Code size={16} color="$blue10" />
            ) : (
              <ListTodo size={16} color="$orange10" />
            )}
          </Button>

          <Button
            size="$3"
            chromeless
            onPress={() => setShowModelSelector(true)}
            disabled={disabled}
            iconAfter={ChevronDown}
            pressStyle={{
              backgroundColor: '$backgroundPress',
            }}
            aria-label="Select AI model"
          >
            <Text fontSize="$3" color="$color11" numberOfLines={1}>
              {getModelName(effectiveModel)}
            </Text>
          </Button>
        </XStack>

        <Button
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={isStreaming ? '$red10' : '$blue10'}
          color="white"
          icon={isStreaming ? StopCircle : ArrowUpCircle}
          scaleIcon={1.5}
          onPress={isStreaming ? handleStop : handleSubmit}
          disabled={!isStreaming && !canSend}
          pressStyle={{
            scale: 0.95,
            backgroundColor: isStreaming ? '$red11' : '$blue11',
          }}
        />
      </XStack>

      <ModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        selectedModel={effectiveModel}
        onModelSelect={modelId => {
          onModelSelect?.(modelId)
          setShowModelSelector(false)
        }}
      />

      <ModeSelector
        open={showModeSelector}
        onOpenChange={setShowModeSelector}
        selectedMode={currentMode}
        onModeSelect={mode => {
          onModeSelect?.(mode)
          setShowModeSelector(false)
        }}
      />
    </YStack>
  )
}
