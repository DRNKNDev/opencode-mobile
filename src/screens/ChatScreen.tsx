import { LegendList, LegendListRef } from '@legendapp/list'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Text, YStack } from 'tamagui'
import { InputBar } from '../components/chat/InputBar'
import { MessageBubble } from '../components/chat/MessageBubble'
import { Header } from '../components/ui/Header'
import { storage } from '../services/storage'
import type { Message, Session } from '../services/types'
import { sampleMessages } from '../test-data/sampleData'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<LegendListRef>(null)
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isConnected] = useState(true) // TODO: Connect to actual connection state
  const [currentModel, setCurrentModel] = useState('claude-3.5-sonnet')
  const [currentMode, setCurrentMode] = useState<'build' | 'plan'>('plan') // Start in plan mode to show todos
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevMessagesLength = useRef(0)

  const isTablet = width > 768

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true })
  }, [])

  useEffect(() => {
    if (id) {
      loadSession(id)
      loadMessages(id)
    }
  }, [id])

  // Auto-scroll when new assistant messages arrive (only if user was already near bottom)
  useEffect(() => {
    // Only auto-scroll if new messages were added
    if (messages.length > prevMessagesLength.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Capture isNearBottom at the time of message addition
      const wasNearBottom = isNearBottom
      if (lastMessage.role === 'assistant' && wasNearBottom) {
        setTimeout(() => scrollToBottom(), 100)
      }
      prevMessagesLength.current = messages.length
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, scrollToBottom])

  const loadSession = (sessionId: string) => {
    const sessions = storage.getSessions()
    const foundSession = sessions.find(s => s.id === sessionId)
    setSession(foundSession || null)
  }

  const loadMessages = (sessionId: string) => {
    // Use sample messages with tool executions and code blocks for testing
    const messagesWithSessionId = sampleMessages.map(msg => ({
      ...msg,
      sessionId,
    }))
    setMessages(messagesWithSessionId)
  }

  const handleScroll = useCallback(
    (event: {
      nativeEvent: {
        contentOffset: { y: number }
        contentSize: { height: number }
        layoutMeasurement: { height: number }
      }
    }) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent
      const isScrollable = contentSize.height > layoutMeasurement.height
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height)
      const nearBottom = distanceFromBottom < 100

      setIsNearBottom(nearBottom)
      const shouldShow = isScrollable && !nearBottom

      if (shouldShow !== showScrollButton) {
        setShowScrollButton(shouldShow)
        Animated.timing(scrollButtonOpacity, {
          toValue: shouldShow ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }
    },
    [showScrollButton, scrollButtonOpacity]
  )

  const handleSendMessage = () => {
    if (!inputValue.trim() || !id) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sessionId: id,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      status: 'sending',
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsStreaming(true)

    // Auto-scroll when user sends a message
    setTimeout(() => scrollToBottom(), 100)

    // TODO: Send message to Opencode API
    // For now, simulate response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        sessionId: id,
        role: 'assistant',
        content:
          'This is a simulated response. In the real implementation, this would come from the Opencode API.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, responseMessage])
      setIsStreaming(false)
    }, 2000)
  }

  const handleStopStreaming = () => {
    setIsStreaming(false)
    // TODO: Stop the actual streaming request
  }

  const handleModelSelect = (modelId: string) => {
    setCurrentModel(modelId)
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  )

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={-insets.bottom + 8}
    >
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingTop={insets.top}
        paddingLeft={insets.left}
        paddingRight={insets.right}
      >
        {/* Header */}
        <Header
          title={session?.title || 'Chat'}
          showBackButton={true}
          onBackPress={() => router.back()}
          connected={isConnected}
          showBorder={true}
        />

        {/* Messages */}
        <YStack
          flex={1}
          maxWidth={isTablet ? 1200 : undefined}
          alignSelf="center"
          width="100%"
        >
          {messages.length === 0 ? (
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              gap="$4"
              padding="$4"
            >
              <Text
                fontSize={isTablet ? '$7' : '$6'}
                fontWeight="600"
                color="$color"
              >
                Start a session
              </Text>
              <Text
                fontSize={isTablet ? '$5' : '$4'}
                color="$color11"
                textAlign="center"
                maxWidth={400}
              >
                Type a message below to begin chatting with {currentModel}
              </Text>
            </YStack>
          ) : (
            <LegendList
              ref={listRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingVertical: 20,
                maxWidth: isTablet ? 800 : undefined,
                alignSelf: isTablet ? 'center' : undefined,
                width: isTablet ? '100%' : undefined,
              }}
            />
          )}
        </YStack>

        {/* Scroll to Bottom Button */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: isTablet ? 170 : 150,
            alignSelf: 'center',
            opacity: scrollButtonOpacity,
            pointerEvents: showScrollButton ? 'auto' : 'none',
          }}
        >
          <Button
            width={48}
            height={48}
            borderRadius={24}
            backgroundColor="rgba(0, 0, 0, 0.7)"
            icon={ChevronDown}
            scaleIcon={1.2}
            color="white"
            onPress={scrollToBottom}
            pressStyle={{
              scale: 0.9,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }}
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.25}
            shadowRadius={4}
            elevation={5}
          />
        </Animated.View>

        {/* Input Bar */}
        <YStack
          maxWidth={isTablet ? 1200 : undefined}
          alignSelf="center"
          width="100%"
          padding={isTablet ? '$6' : '$4'}
          marginHorizontal={1}
          paddingBottom={insets.bottom}
          backgroundColor="$backgroundHover"
          borderColor="$borderColor"
          borderTopWidth={0.5}
          borderLeftWidth={0.5}
          borderRightWidth={0.5}
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
        >
          <InputBar
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSendMessage}
            onStop={handleStopStreaming}
            onModelSelect={handleModelSelect}
            currentMode={currentMode}
            onModeSelect={setCurrentMode}
            isStreaming={isStreaming}
            currentModel={currentModel}
            placeholder="Type a message..."
            size="$2"
            borderWidth={0}
            focusStyle={{ borderWidth: 0 }}
            paddingHorizontal={0}
            paddingVertical={0}
          />
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}
