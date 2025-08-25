import { LegendList, LegendListRef } from '@legendapp/list'
import { useSelector } from '@legendapp/state/react'
import type { SessionMessageResponse } from '@opencode-ai/sdk'
import { ChevronDown } from '@tamagui/lucide-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { SessionActionsButton } from '../components/ui/SessionActionsButton'
import { MessageSkeleton } from '../components/ui/SkeletonLoader'
import { store$ } from '../store'
import { actions } from '../store/actions'
import {
  currentMessages,
  currentSession,
  isConnected,
  isSendingMessage,
  selectedAgent,
  selectedModel,
} from '../store/computed'
import { debug } from '../utils/debug'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const listRef = useRef<LegendListRef>(null)
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current
  const [inputValue, setInputValue] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const prevMessagesLength = useRef(0)

  // LegendState integration
  const connected = useSelector(isConnected)
  const messages = useSelector(currentMessages)
  const session = useSelector(currentSession)
  const model = useSelector(selectedModel)
  const currentAgent = useSelector(selectedAgent)
  const isSending = useSelector(isSendingMessage)
  const isAborting = useSelector(store$.messages.isAborting)
  const isLoading = useSelector(store$.messages.isLoading)

  // Fix: isStreaming should be false when aborting to prevent button state issues
  const isStreaming = isSending && !isAborting

  const isTablet = width > 768

  // Sort all messages chronologically by timestamp
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => {
      const timeA = a.info.time.created
      const timeB = b.info.time.created

      // Handle placeholder timestamps (epoch time) - keep streaming messages at end
      if (timeA === 0) return 1
      if (timeB === 0) return -1

      return timeA - timeB
    })
  }, [messages])
  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true })
  }, [])

  // Set current session and load messages when id changes
  useEffect(() => {
    if (id) {
      // Load messages asynchronously without blocking UI
      actions.messages.loadMessages(id).catch(error => {
        console.error('Failed to load messages:', error)
      })
    }
  }, [id])

  // Auto-scroll when new assistant messages arrive (only if user was already near bottom)
  useEffect(() => {
    // Only auto-scroll if new messages were added
    if (
      sortedMessages.length > prevMessagesLength.current &&
      sortedMessages.length > 0
    ) {
      const lastMessage = sortedMessages[sortedMessages.length - 1]
      // Capture isNearBottom at the time of message addition
      const wasNearBottom = isNearBottom
      if (lastMessage.info.role === 'assistant' && wasNearBottom) {
        setTimeout(() => scrollToBottom(), 100)
      }
      prevMessagesLength.current = sortedMessages.length
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedMessages, scrollToBottom])

  // Auto-scroll during streaming if user is near bottom
  useEffect(() => {
    const hasStreamingMessage = sortedMessages.some(
      m => m.info.role === 'assistant' && !('completed' in m.info.time)
    )

    if (hasStreamingMessage && isNearBottom) {
      // Smooth scroll during streaming
      const scrollInterval = setInterval(() => {
        scrollToBottom()
      }, 200)

      return () => clearInterval(scrollInterval)
    }
  }, [sortedMessages, isNearBottom, scrollToBottom])

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !id) return

    const messageContent = inputValue.trim()
    setInputValue('')

    // Auto-scroll when user sends a message
    setTimeout(() => scrollToBottom(), 100)

    try {
      await actions.messages.sendMessage(id, messageContent)
    } catch (err) {
      console.error('Failed to send message:', err)
      // Error handling is managed by store actions
    }
  }

  const handleStopStreaming = async () => {
    if (!id) return

    // Check if already aborting to prevent duplicates
    const isAborting = store$.messages.isAborting.get()
    if (isAborting) return

    try {
      debug.log('Stop streaming requested for session:', id)
      await actions.messages.abortSession(id)
      debug.success('Session aborted successfully')
    } catch (error) {
      debug.error('Failed to abort session:', error)
      // Error handling is managed by store actions
    }
  }

  const handleModelSelect = (modelId: string, providerId: string) => {
    actions.models.selectModel(modelId, providerId)
  }

  const handleShareSession = async (): Promise<void> => {
    if (!id) return
    try {
      await actions.sessions.shareSession(id)
    } catch (error) {
      debug.error('Failed to share session:', error)
    }
  }

  const handleUnshareSession = async (): Promise<void> => {
    if (!id) return
    try {
      await actions.sessions.unshareSession(id)
    } catch (error) {
      debug.error('Failed to unshare session:', error)
    }
  }

  const handleDeleteSession = async (): Promise<void> => {
    if (!id) return
    try {
      await actions.sessions.deleteSession(id)
      // Navigate back to session list after successful deletion
      router.back()
    } catch (error) {
      debug.error('Failed to delete session:', error)
    }
  }

  const renderMessage = ({ item }: { item: SessionMessageResponse }) => (
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
          connected={connected}
          rightContent={
            session ? (
              <SessionActionsButton
                sessionId={session.id}
                sessionTitle={session.title}
                isShared={!!session.share}
                shareUrl={session.share?.url}
                onShare={handleShareSession}
                onUnshare={handleUnshareSession}
                onDelete={handleDeleteSession}
                isLoading={store$.sessions.isLoading.get()}
              />
            ) : undefined
          }
        />

        {/* Messages */}
        <YStack
          flex={1}
          maxWidth={isTablet ? 1200 : undefined}
          alignSelf="center"
          width="100%"
        >
          {isLoading ? (
            <MessageSkeleton />
          ) : sortedMessages.length === 0 ? (
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
                Type a message below to begin chatting with{' '}
                {model?.name || 'AI'}
              </Text>
            </YStack>
          ) : (
            <LegendList
              ref={listRef}
              data={sortedMessages}
              renderItem={renderMessage}
              keyExtractor={item => item.info.id}
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
            isStreaming={isStreaming}
            isAborting={isAborting}
            currentModel={model?.id || ''}
            placeholder="Type a message..."
          />
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}
