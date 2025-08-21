import { LegendList } from '@legendapp/list'
import { useSelector } from '@legendapp/state/react'
import type { Session } from '@opencode-ai/sdk'
import { Folder, FolderGit2, MessageCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { RefreshControl, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'
import { InputBar } from '../components/chat/InputBar'
import { SessionCard } from '../components/session/SessionCard'
import { Header } from '../components/ui/Header'
import { store$ } from '../store'
import { actions } from '../store/actions'
import {
  appInfo,
  isConnected,
  isGitRepo,
  projectName,
  selectedAgent,
  selectedModel,
  sessionsSortedByTime,
} from '../store/computed'

export default function SessionListScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [newSessionInput, setNewSessionInput] = useState('')

  // LegendState integration
  const connected = useSelector(isConnected)
  const model = useSelector(selectedModel)
  const currentAgent = useSelector(selectedAgent)
  const sessions = useSelector(sessionsSortedByTime)
  const currentAppInfo = useSelector(appInfo)
  const isGitRepository = useSelector(isGitRepo)
  const currentProjectName = useSelector(projectName)
  const sessionState = useSelector(() => ({
    isLoading: store$.sessions.isLoading.get(),
    isCreating: store$.sessions.isCreating.get(),
  }))
  const { isLoading, isCreating } = sessionState
  const isRefreshing = isLoading

  const isTablet = width > 768

  // Load sessions when component mounts and when connection becomes available
  useEffect(() => {
    if (connected) {
      actions.sessions.loadSessions()
    }
  }, [connected])

  const createNewSession = async () => {
    if (!newSessionInput.trim()) return

    const messageContent = newSessionInput.trim()
    setNewSessionInput('')

    try {
      // Create the session first
      const newSession = await actions.sessions.createSession()

      // Navigate immediately for fast UX
      router.push(`/chat/${newSession.id}`)

      // Send the initial message in the background (don't await)
      if (model) {
        const currentSelection = store$.models.selected.get()
        const providerId = currentSelection?.providerID || 'anthropic'

        // Fire and forget - let it happen in background
        actions.messages
          .sendMessage(
            newSession.id,
            messageContent,
            model.id,
            providerId,
            currentAgent?.name || 'build'
          )
          .catch(error => {
            console.error('Failed to send initial message:', error)
            // Could show a toast here if needed
          })
      }
    } catch (error) {
      console.error('Failed to create session:', error)
      // TODO: Show error toast
    }
  }
  const openSession = (session: Session) => {
    actions.sessions.selectSession(session.id)
    router.push(`/chat/${session.id}`)
  }

  const handleModelSelect = (modelId: string) => {
    // Find which provider owns this model
    const providers = store$.models.providers.get()
    let foundProviderId: string | null = null

    for (const provider of providers) {
      if (provider.models && provider.models[modelId]) {
        foundProviderId = provider.id
        break
      }
    }

    // If we found the provider, use it; otherwise fall back to current or default
    if (foundProviderId) {
      actions.models.selectModel(modelId, foundProviderId)
    } else {
      // This shouldn't happen if the model selector is working correctly
      console.warn(`Could not find provider for model ${modelId}`)
      const currentSelection = store$.models.selected.get()
      const providerId = currentSelection?.providerID || 'anthropic'
      actions.models.selectModel(modelId, providerId)
    }
  }

  const handleRefresh = async () => {
    try {
      await actions.sessions.loadSessions()
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  }

  const renderSession = ({ item }: { item: Session }) => (
    <SessionCard session={item} onPress={() => openSession(item)} />
  )

  const renderEmptyState = () => (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      gap="$4"
      padding="$4"
    >
      <MessageCircle size={isTablet ? 80 : 64} color="$color11" />
      <YStack alignItems="center" gap="$2" maxWidth={400}>
        <Text fontSize={isTablet ? '$7' : '$6'} fontWeight="600" color="$color">
          No sessions yet
        </Text>
        <Text
          fontSize={isTablet ? '$5' : '$4'}
          color="$color11"
          textAlign="center"
        >
          Start your first session in {currentAgent?.name || 'build'} mode with{' '}
          {model?.name || 'AI'}
        </Text>
      </YStack>
    </YStack>
  )

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={insets.top}
      paddingLeft={insets.left + (isTablet ? 24 : 16)}
      paddingRight={insets.right + (isTablet ? 24 : 16)}
      paddingBottom={isTablet ? 24 : 16}
    >
      {/* Header */}
      <Header title="Sessions" connected={connected} showBorder={true} />

      {/* Input Section */}
      <YStack
        padding="$2"
        margin="$4"
        maxWidth={isTablet ? 1200 : undefined}
        alignSelf="center"
        width="100%"
        backgroundColor="$backgroundHover"
        borderWidth={0.5}
        borderColor="$borderColor"
        borderRadius="$6"
      >
        {/* Project info display */}
        {currentAppInfo && (
          <XStack
            alignItems="center"
            gap="$2"
            paddingHorizontal="$3"
            paddingVertical="$2"
          >
            {isGitRepository ? (
              <FolderGit2 size={16} color="$color11" />
            ) : (
              <Folder size={16} color="$color11" />
            )}
            <Text fontSize="$2" color="$color11" numberOfLines={1}>
              {currentProjectName}
            </Text>
          </XStack>
        )}

        {/* Always-visible input */}
        <InputBar
          value={newSessionInput}
          onChange={setNewSessionInput}
          onSubmit={createNewSession}
          onStop={() => {}}
          onModelSelect={handleModelSelect}
          placeholder="What can I help you with?"
          currentModel={model?.id}
          disabled={!connected || isCreating}
          isStreaming={isCreating}
        />
      </YStack>

      {/* Session List */}
      <YStack
        flex={1}
        maxWidth={isTablet ? 1200 : undefined}
        alignSelf="center"
        width="100%"
      >
        {sessions.length === 0 ? (
          renderEmptyState()
        ) : (
          <LegendList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            recycleItems
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="$color11"
              />
            }
            contentContainerStyle={{
              paddingBottom: 20,
              maxWidth: isTablet ? 800 : undefined,
              alignSelf: isTablet ? 'center' : undefined,
              width: isTablet ? '100%' : undefined,
            }}
          />
        )}
      </YStack>
    </YStack>
  )
}
