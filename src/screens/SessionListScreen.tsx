import React from 'react'
import { MessageCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, useWindowDimensions, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, YStack } from 'tamagui'
import { InputBar } from '../components/chat/InputBar'
import { SessionCard } from '../components/session/SessionCard'
import { Header } from '../components/ui/Header'
import { useConnectionContext } from '../contexts/ConnectionContext'
import { useModels } from '../hooks/useModels'
import { useSessions } from '../hooks/useSessions'
import type { Session } from '../services/types'

export default function SessionListScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [newSessionInput, setNewSessionInput] = useState('')
  const [currentMode, setCurrentMode] = useState<'build' | 'plan'>('build')

  // Use our custom hooks
  const { isConnected } = useConnectionContext()
  const { selectedModel, selectModel } = useModels()
  const {
    sessions,
    isLoading,
    isRefreshing,
    isCreating,
    isDeleting,
    createSession,
    deleteSession,
    selectSession,
    refreshSessions,
    error: sessionError,
  } = useSessions()

  const isTablet = width > 768

  const createNewSession = async () => {
    if (!newSessionInput.trim()) return

    try {
      const newSession = await createSession()
      setNewSessionInput('')
      
      // Navigate to the new session
      router.push(`/chat/${newSession.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      // TODO: Show error toast
    }
  }

  const openSession = (session: Session) => {
    selectSession(session.id)
    router.push(`/chat/${session.id}`)
  }

  const handleDeleteSession = async (session: Session) => {
    try {
      await deleteSession(session.id)
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
    selectModel(modelId)
  }

  const handleRefresh = async () => {
    try {
      await refreshSessions()
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
          Start your first session in {currentMode} mode with {selectedModel}
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
      <Header title="Sessions" connected={isConnected} showBorder={true} />

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
          currentModel={selectedModel}
          disabled={!isConnected || isCreating}
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
          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => refreshSessions(true)}
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
