import React, { useState, useEffect } from 'react'
import { useSelector } from '@legendapp/state/react'
import { MessageCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useWindowDimensions, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LegendList } from '@legendapp/list'
import { Text, YStack } from 'tamagui'
import { InputBar } from '../components/chat/InputBar'
import { SessionCard } from '../components/session/SessionCard'
import { Header } from '../components/ui/Header'
import { store$ } from '../store'
import { actions } from '../store/actions'
import {
  isConnected,
  selectedModel,
  sessionsSortedByTime,
} from '../store/computed'
import type { Session } from '../services/types'

export default function SessionListScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [newSessionInput, setNewSessionInput] = useState('')
  const [currentMode, setCurrentMode] = useState<'build' | 'plan'>('build')

  // LegendState integration
  const connected = useSelector(isConnected)
  const model = useSelector(selectedModel)
  const sessions = useSelector(sessionsSortedByTime)
  const isLoading = useSelector(store$.sessions.isLoading)
  const isCreating = isLoading
  const isDeleting = false // TODO: Add per-session deletion state
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

    try {
      const newSession = await actions.sessions.createSession()
      setNewSessionInput('')

      // Navigate to the new session
      router.push(`/chat/${newSession.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      // TODO: Show error toast
    }
  }

  const openSession = (session: Session) => {
    actions.sessions.selectSession(session.id)
    router.push(`/chat/${session.id}`)
  }

  const handleDeleteSession = async (session: Session) => {
    try {
      await actions.sessions.deleteSession(session.id)
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to delete session:', error)
      // TODO: Show error toast
    }
  }

  const shareSession = (session: Session) => {
    // TODO: Implement session sharing functionality
    console.log('Sharing session:', session.id)
  }

  const handleModelSelect = (modelId: string) => {
    actions.models.selectModel(modelId)
  }

  const handleRefresh = async () => {
    try {
      await actions.sessions.loadSessions()
    } catch (error) {
      console.error('Failed to refresh sessions:', error)
    }
  }

  const renderSession = ({ item }: { item: Session }) => (
    <SessionCard
      session={item}
      onPress={() => openSession(item)}
      onShare={() => shareSession(item)}
      onDelete={() => handleDeleteSession(item)}
      isDeleting={isDeleting}
    />
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
          Start your first session in {currentMode} mode with{' '}
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
      paddingBottom={insets.bottom}
      paddingLeft={insets.left}
      paddingRight={insets.right}
    >
      {/* Header */}
      <Header title="Sessions" connected={connected} showBorder={true} />

      {/* Input Section */}
      <YStack
        padding={isTablet ? '$6' : '$4'}
        maxWidth={isTablet ? 1200 : undefined}
        alignSelf="center"
        width="100%"
      >
        {/* Always-visible input */}
        <InputBar
          value={newSessionInput}
          onChange={setNewSessionInput}
          onSubmit={createNewSession}
          onStop={() => {}}
          onModelSelect={handleModelSelect}
          currentMode={currentMode}
          onModeSelect={setCurrentMode}
          placeholder="What can I help you with?"
          currentModel={model?.id || ''}
          disabled={!connected || isCreating}
          isStreaming={isCreating}
          size="$4"
        />
      </YStack>

      {/* Session List */}
      <YStack
        flex={1}
        padding={isTablet ? '$6' : '$4'}
        paddingTop="$0"
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
