import { useSelector } from '@legendapp/state/react'
import type { Agent } from '@opencode-ai/sdk'
import { Brain, Code, ListTodo, Settings, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import React, { useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { actions } from '../../store/actions'
import { availableAgents, selectedAgent } from '../../store/computed'

export interface AgentSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentSelector({ open, onOpenChange }: AgentSelectorProps) {
  const [instanceId] = useState(() =>
    Math.random().toString(36).substring(2, 9)
  )

  // Use store selectors
  const agents = useSelector(availableAgents)
  const currentSelectedAgent = useSelector(selectedAgent)
  const isLoadingAgents = useSelector(store$.agents.isLoading)
  const agentsError = useSelector(store$.agents.error)

  // UI helper functions
  const getDisplayName = (agent: Agent) => {
    switch (agent.name) {
      case 'build':
        return 'Build Agent'
      case 'plan':
        return 'Plan Agent'
      case 'review':
        return 'Review Agent'
      case 'debug':
        return 'Debug Agent'
      default:
        return (
          agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + ' Agent'
        )
    }
  }

  const getDescription = (agent: Agent) => {
    if (agent.description) {
      return agent.description
    }

    switch (agent.name) {
      case 'build':
        return 'Write, edit, and execute code with full tool access'
      case 'plan':
        return 'Read and analyze code without making changes'
      case 'review':
        return 'Review code and provide feedback'
      case 'debug':
        return 'Debug and troubleshoot code issues'
      default: {
        const deniedTools = Object.entries(agent.tools || {})
          .filter(([_, enabled]) => !enabled)
          .map(([tool, _]) => tool)

        if (deniedTools.length === 0) {
          return 'Custom agent with full tool access'
        } else {
          return `Custom agent - ${deniedTools.join(', ')} disabled`
        }
      }
    }
  }

  const getIcon = (agent: Agent) => {
    switch (agent.name) {
      case 'build':
        return Code
      case 'plan':
        return ListTodo
      case 'review':
        return Brain
      case 'debug':
        return Settings
      default:
        return Settings
    }
  }

  const getColor = (agent: Agent) => {
    switch (agent.name) {
      case 'build':
        return '$blue10'
      case 'plan':
        return '$orange10'
      case 'review':
        return '$green10'
      case 'debug':
        return '$red10'
      default:
        return '$purple10'
    }
  }

  const isAvailable = (agent: Agent) => {
    // All agents from API are considered available
    return true
  }

  const handleAgentSelect = (agentName: string) => {
    const agent = agents.find(a => a.name === agentName)
    if (agent && isAvailable(agent)) {
      actions.agents.selectAgent(agentName)
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
              Select Agent
            </Text>
            <Button size="$3" chromeless icon={X} onPress={handleClose} />
          </XStack>

          {/* Agent List */}
          {isLoadingAgents ? (
            <YStack alignItems="center" padding="$4">
              <Text fontSize="$4" color="$color11">
                Loading agents...
              </Text>
            </YStack>
          ) : agentsError ? (
            <YStack alignItems="center" padding="$4" gap="$2">
              <Text fontSize="$4" color="$red10">
                Failed to load agents
              </Text>
              <Text fontSize="$3" color="$color11" textAlign="center">
                {agentsError}
              </Text>
            </YStack>
          ) : agents.length === 0 ? (
            <YStack alignItems="center" padding="$4">
              <Text fontSize="$4" color="$color11">
                No agents available
              </Text>
            </YStack>
          ) : (
            <RadioGroup
              value={currentSelectedAgent?.name || ''}
              onValueChange={handleAgentSelect}
              name={`agent-selector-${instanceId}`}
            >
              <YStack gap="$3">
                {agents.map(agent => {
                  // Ensure agent has valid name
                  if (!agent?.name) return null

                  const Icon = getIcon(agent)
                  const available = isAvailable(agent)
                  const color = getColor(agent)

                  return (
                    <YStack key={agent.name}>
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
                        onPress={() =>
                          available && handleAgentSelect(agent.name)
                        }
                      >
                        <RadioGroup.Item
                          value={agent.name}
                          id={`${instanceId}-${agent.name}`}
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
                                currentSelectedAgent?.name === agent.name
                                  ? color
                                  : '$color'
                              }
                            >
                              {getDisplayName(agent)}
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
                            {agent.builtIn && (
                              <Text
                                fontSize="$2"
                                color="$blue10"
                                backgroundColor="$blue3"
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                              >
                                Built-in
                              </Text>
                            )}
                          </XStack>
                          <Text fontSize="$3" color="$color11">
                            {getDescription(agent)}
                          </Text>
                          {agent.mode && (
                            <Text
                              fontSize="$2"
                              color="$color11"
                              fontWeight="300"
                            >
                              Mode: {agent.mode}
                            </Text>
                          )}
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
