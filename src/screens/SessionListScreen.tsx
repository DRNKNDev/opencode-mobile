import { MessageCircle } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, YStack } from 'tamagui'
import { InputBar } from '../components/chat/InputBar'
import { SessionCard } from '../components/session/SessionCard'
import { Header } from '../components/ui/Header'
import { storage } from '../services/storage'
import type { Session } from '../services/types'
import { sampleMessages } from '../test-data/sampleData'

export default function SessionListScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [sessions, setSessions] = useState<Session[]>([])
  const [newSessionInput, setNewSessionInput] = useState('')
  const [isConnected] = useState(true) // TODO: Connect to actual connection state
  const [currentModel, setCurrentModel] = useState('claude-3.5-sonnet')
  const [currentMode, setCurrentMode] = useState<'build' | 'plan'>('build')

  const isTablet = width > 768

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const storedSessions = storage.getSessions()

    // Add a test session with sample data if no sessions exist
    if (storedSessions.length === 0) {
      const testSession: Session = {
        id: 'test-session-1',
        title: 'TypeScript Helper Functions',
        createdAt: new Date(Date.now() - 240000), // 4 minutes ago
        updatedAt: new Date(Date.now() - 240000),
        messageCount: sampleMessages.length,
        status: 'active',
        modelName: 'claude-3.5-sonnet',
        lastMessage:
          sampleMessages[sampleMessages.length - 1].content.substring(0, 100) +
          '...',
      }

      storage.addSession(testSession)
      setSessions([testSession])
    } else {
      setSessions(storedSessions)
    }
  }

  const createNewSession = () => {
    if (!newSessionInput.trim()) return

    const newSession: Session = {
      id: Date.now().toString(),
      title: newSessionInput.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      status: 'idle',
      modelName: currentModel,
      lastMessage: 'New session created',
    }

    storage.addSession(newSession)
    storage.setCurrentSessionId(newSession.id)
    setNewSessionInput('')
    loadSessions()

    router.push(`/chat/${newSession.id}`)
  }

  const openSession = (session: Session) => {
    storage.setCurrentSessionId(session.id)
    router.push(`/chat/${session.id}`)
  }

  const shareSession = (session: Session) => {
    // TODO: Implement session sharing functionality
    console.log('Sharing session:', session.id)
  }

  const renderSession = ({ item }: { item: Session }) => (
    <SessionCard
      session={item}
      onPress={() => openSession(item)}
      onShare={() => shareSession(item)}
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
          Start your first session in {currentMode} mode with {currentModel}
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
          onModelSelect={setCurrentModel}
          currentMode={currentMode}
          onModeSelect={setCurrentMode}
          placeholder="What can I help you with?"
          currentModel={currentModel}
          disabled={false}
          isStreaming={false}
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
