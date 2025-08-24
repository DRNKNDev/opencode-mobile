import { useSelector } from '@legendapp/state/react'
import type { Agent } from '@opencode-ai/sdk'
import { AsteriskSquare, Code, ListTodo, Settings, X } from '@tamagui/lucide-icons'
import { RadioGroup } from '@tamagui/radio-group'
import { Sheet } from '@tamagui/sheet'
import React, { useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { store$ } from '../../store'
import { actions } from '../../store/actions'
import { availableAgents, selectedAgent } from '../../store/computed'

export function getAgentInfo(agent: Agent | string) {
  const name = typeof agent === 'string' ? agent : agent.name

  switch (name) {
    case 'general':
      return {
        displayName: 'General Agent',
        description:
          'Research complex questions, search code, and execute multi-step tasks',
        icon: AsteriskSquare,
        color: '$purple10',
      }
    case 'build':
      return {
        displayName: 'Build Agent',
        description:
          'Default agent with all tools enabled for development work',
        icon: Code,
        color: '$blue10',
      }
    case 'plan':
      return {
        displayName: 'Plan Agent',
        description:
          'Analyze and plan without modifying files or running commands',
        icon: ListTodo,
        color: '$orange10',
      }
    default: {
      // Handle custom agents
      const displayName =
        typeof agent === 'string'
          ? agent.charAt(0).toUpperCase() + agent.slice(1) + ' Agent'
          : agent.name.charAt(0).toUpperCase() + agent.name.slice(1) + ' Agent'

      let description =
        'Custom agent with full tool access for specialized tasks'
      if (typeof agent === 'object' && agent.tools) {
        const deniedTools = Object.entries(agent.tools)
          .filter(([_, enabled]) => !enabled)
          .map(([tool]) => tool)
        if (deniedTools.length > 0) {
          description = `Custom agent with restricted access - ${deniedTools.join(', ')} disabled`
        }
      }

      return {
        displayName,
        description,
        icon: Settings,
        color: '$gray10',
      }
    }
  }
}

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

  const handleAgentSelect = (agentName: string) => {
    const agent = agents.find(a => a.name === agentName)
    if (agent) {
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
            <Sheet.ScrollView
              height={400}
              flex={0}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <RadioGroup
                value={currentSelectedAgent?.name || ''}
                onValueChange={handleAgentSelect}
                name={`agent-selector-${instanceId}`}
              >
                <YStack gap="$3" paddingRight="$2">
                  {agents.map(agent => {
                    // Ensure agent has valid name
                    if (!agent?.name) return null

                    const agentInfo = getAgentInfo(agent)
                    const Icon = agentInfo.icon
                    const color = agentInfo.color

                    return (
                      <YStack key={agent.name}>
                        <XStack
                          alignItems="center"
                          gap="$3"
                          padding="$3"
                          borderRadius="$4"
                          backgroundColor="$backgroundHover"
                          pressStyle={{
                            backgroundColor: '$backgroundPress',
                          }}
                          onPress={() => handleAgentSelect(agent.name)}
                        >
                          <RadioGroup.Item
                            value={agent.name}
                            id={`${instanceId}-${agent.name}`}
                            size="$4"
                          >
                            <RadioGroup.Indicator />
                          </RadioGroup.Item>

                          <Icon size={20} color={color} />

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
                                {agentInfo.displayName}
                              </Text>
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
                              {agentInfo.description}
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
            </Sheet.ScrollView>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
