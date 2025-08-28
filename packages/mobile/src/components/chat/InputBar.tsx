import { useSelector } from '@legendapp/state/react'
import {
  ArrowUpCircle,
  AtSign,
  ChevronDown,
  StopCircle,
} from '@tamagui/lucide-icons'
import React, { useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { openCodeService } from '../../services/opencode'
import { selectedAgent, selectedModel } from '../../store/computed'
import { AgentSelector, getAgentInfo } from '../modals/AgentSelector'
import { ContextSelector, type ContextItem } from '../modals/ContextSelector'
import { ModelSelector } from '../modals/ModelSelector'
import { TextArea } from '../ui/TextArea'
import { SelectedContextDisplay } from './SelectedContextDisplay'

export interface InputBarProps {
  value: string
  onChange: (text: string) => void
  onSubmit: () => void
  onStop: () => void
  onModelSelect?: (modelId: string, providerId: string) => void
  selectedContextItems?: ContextItem[]
  onContextItemSelect?: (item: ContextItem) => void
  onContextItemDeselect?: (item: ContextItem) => void
  disabled?: boolean
  placeholder?: string
  isStreaming?: boolean
  isAborting?: boolean
  currentModel?: string
}

export function InputBar({
  value,
  onChange,
  onSubmit,
  onStop,
  onModelSelect,
  selectedContextItems = [],
  onContextItemSelect,
  onContextItemDeselect,
  disabled = false,
  placeholder = 'Type a message...',
  isStreaming = false,
  isAborting = false,
  currentModel,
}: InputBarProps) {
  const currentAgent = useSelector(selectedAgent)
  const currentSelectedModel = useSelector(selectedModel)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showAgentSelector, setShowAgentSelector] = useState(false)
  const [showContextSelector, setShowContextSelector] = useState(false)
  const canSend = value.trim().length > 0 && !disabled

  const getModelName = (): string => {
    return currentSelectedModel?.name || currentModel || 'Select Model'
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
      {/* Show selected context items above the input when any are selected */}
      {selectedContextItems.length > 0 && (
        <XStack paddingHorizontal="$2" paddingBottom="$2">
          <SelectedContextDisplay
            selectedItems={selectedContextItems}
            onRemoveItem={onContextItemDeselect || (() => {})}
          />
        </XStack>
      )}

      <TextArea
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLines={4}
        minLines={1}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        size="$2"
        borderWidth={0}
        focusStyle={{ borderWidth: 0 }}
        maxHeight="$16"
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
            {(() => {
              const agentInfo = getAgentInfo(currentAgent?.name || '')
              const Icon = agentInfo.icon
              return <Icon size={16} color={agentInfo.color} />
            })()}
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
              {getModelName()}
            </Text>
          </Button>
        </XStack>

        <XStack alignItems="center" gap="$2">
          {/* Add Context button - just icon */}
          <Button
            size="$3"
            chromeless
            icon={AtSign}
            disabled={!openCodeService.isInitialized() || disabled}
            onPress={() => setShowContextSelector(true)}
            pressStyle={{
              backgroundColor: '$backgroundPress',
            }}
            aria-label="Add context"
            color="$color11"
          />

          {/* Submit/Stop button */}
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
              backgroundColor:
                isStreaming && !isAborting ? '$red11' : '$blue11',
            }}
          />
        </XStack>
      </XStack>

      <ModelSelector
        open={showModelSelector}
        onOpenChange={setShowModelSelector}
        selectedModel={currentModel || ''}
        onModelSelect={(modelId, providerId) => {
          onModelSelect?.(modelId, providerId)
          setShowModelSelector(false)
        }}
      />

      <AgentSelector
        open={showAgentSelector}
        onOpenChange={setShowAgentSelector}
      />

      {/* Add Context Selector modal - always render but with no-op handlers if not provided */}
      <ContextSelector
        open={showContextSelector}
        onOpenChange={setShowContextSelector}
        onItemSelect={onContextItemSelect || (() => {})}
        onItemDeselect={onContextItemDeselect || (() => {})}
        selectedItems={selectedContextItems}
      />
    </YStack>
  )
}
