import { useSelector } from '@legendapp/state/react'
import {
  ArrowUpCircle,
  AsteriskSquare,
  ChevronDown,
  Code,
  ListTodo,
  Settings,
  StopCircle,
} from '@tamagui/lucide-icons'
import React, { useState } from 'react'
import type { InputProps } from 'tamagui'
import { Button, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { selectedAgent } from '../../store/computed'
import { AgentSelector } from '../modals/AgentSelector'
import { ModelSelector } from '../modals/ModelSelector'
import { TextArea } from '../ui/TextArea'

export interface InputBarProps {
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
  onStop: () => void
  onModelSelect?: (modelId: string) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  isAborting?: boolean
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
  disabled = false,
  placeholder = 'Type a message...',
  isStreaming = false,
  isAborting = false,
  currentModel,
  size = '$2',
  borderWidth,
  focusStyle,
  paddingHorizontal,
  paddingVertical,
}: InputBarProps) {
  const availableModels = useSelector(store$.models.available)
  const providers = useSelector(store$.models.providers)
  const currentAgent = useSelector(selectedAgent)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showAgentSelector, setShowAgentSelector] = useState(false)
  const canSend = value.trim().length > 0 && !disabled

  const getModelName = (modelId: string | undefined): string => {
    if (!modelId) return 'Select Model'

    // First try to find in availableModels array
    let foundModel = availableModels.find(m => m.id === modelId)

    // If not found, search through providers' models
    if (!foundModel && providers.length > 0) {
      for (const provider of providers) {
        if (provider.models && provider.models[modelId]) {
          foundModel = provider.models[modelId]
          break
        }
      }
    }

    return foundModel?.name || modelId
  }

  const handleSubmit = () => {
    if (canSend && !isStreaming) {
      onSubmit()
    }
  }

  const handleStop = () => {
    if (isStreaming && !isAborting) {
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
            onPress={() => setShowAgentSelector(true)}
            disabled={disabled}
            pressStyle={{
              backgroundColor: '$backgroundPress',
            }}
            aria-label="Select agent"
          >
            {currentAgent?.name === 'general' ? (
              <AsteriskSquare size={16} color="$purple10" />
            ) : currentAgent?.name === 'build' ? (
              <Code size={16} color="$blue10" />
            ) : currentAgent?.name === 'plan' ? (
              <ListTodo size={16} color="$orange10" />
            ) : (
              <Settings size={16} color="$gray10" />
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
              {getModelName(currentModel)}
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
          disabled={(!isStreaming && !canSend) || isAborting}
          animation={isAborting ? 'bouncy' : undefined}
          animateOnly={isAborting ? ['opacity'] : undefined}
          opacity={isAborting ? 0.7 : 1}
          pressStyle={{
            scale: 0.95,
            backgroundColor: isStreaming && !isAborting ? '$red11' : '$blue11',
          }}
        />
      </XStack>

      <ModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        selectedModel={currentModel || ''}
        onModelSelect={modelId => {
          onModelSelect?.(modelId)
          setShowModelSelector(false)
        }}
      />

      <AgentSelector
        open={showAgentSelector}
        onOpenChange={setShowAgentSelector}
      />
    </YStack>
  )
}
