import React, { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  GitBranch,
} from '@tamagui/lucide-icons'
import { diffLines } from 'diff'
import { ScrollView, StyleSheet } from 'react-native'
import CodeHighlighter from 'react-native-code-highlighter'
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { Button, Text, XStack, YStack, useTheme } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { DiffViewerProps } from '../../types/code'
import { loadLanguage } from '../../utils/languageLoader'

export function DiffViewer({
  oldString,
  newString,
  filename,
  language = 'text',
  copyable = true,
  collapsible = false,
  modeToggleable = true,
  viewMode: externalViewMode,
  title,
}: DiffViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsible)
  const [internalViewMode, setInternalViewMode] = useState<
    'unified' | 'split' | 'before' | 'after'
  >('unified')
  const viewMode = externalViewMode || internalViewMode
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)
  const { copyToClipboard } = useCopyToClipboard()
  const theme = useTheme()

  const diff = useMemo(
    () => diffLines(oldString, newString),
    [oldString, newString]
  )

  // Create custom hljs style with theme background
  const customHljsStyle = useMemo(
    () => ({
      ...atomOneDarkReasonable,
      hljs: {
        ...atomOneDarkReasonable.hljs,
        background: theme.background.val,
        backgroundColor: theme.background.val,
      },
    }),
    [theme.background.val]
  )

  const stats = useMemo(() => {
    let additions = 0
    let deletions = 0
    diff.forEach(change => {
      if (change.added) additions += change.count || 0
      if (change.removed) deletions += change.count || 0
    })
    return { additions, deletions }
  }, [diff])

  useEffect(() => {
    if (language !== 'text') {
      loadLanguage(language).then(() => setIsLanguageLoaded(true))
    } else {
      setIsLanguageLoaded(true)
    }
  }, [language])

  // Styles for react-native-code-highlighter
  const codeStyles = StyleSheet.create({
    codeContainer: {
      padding: 8,
      minWidth: '100%',
    },
    codeText: {
      fontSize: 14,
      fontFamily: 'monospace',
    },
  })

  const renderUnifiedDiff = () => {
    const unifiedContent = diff
      .map(change => {
        const prefix = change.added ? '+' : change.removed ? '-' : ' '
        const lines = change.value.split('\n')
        // Only remove empty last line if it exists (common with diff output)
        if (lines.length > 0 && lines[lines.length - 1] === '') {
          lines.pop()
        }
        return lines.map(line => `${prefix}${line}`).join('\n')
      })
      .join('\n')

    if (isLanguageLoaded && language !== 'text') {
      return (
        <ScrollView
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{
              ...codeStyles.codeContainer,
              backgroundColor: theme.background.val,
            }}
          >
            <CodeHighlighter
              hljsStyle={customHljsStyle}
              textStyle={codeStyles.codeText}
              language="diff"
              scrollViewProps={{ scrollEnabled: false }}
              wrapLines={true}
              lineProps={lineNumber => {
                const line = unifiedContent.split('\n')[lineNumber - 1]
                if (!line) return {}

                if (line.startsWith('+')) {
                  return {
                    style: { backgroundColor: 'rgba(46, 160, 67, 0.2)' },
                  }
                } else if (line.startsWith('-')) {
                  return {
                    style: { backgroundColor: 'rgba(248, 81, 73, 0.2)' },
                  }
                }
                return {}
              }}
            >
              {unifiedContent}
            </CodeHighlighter>
          </ScrollView>
        </ScrollView>
      )
    }

    // Fallback implementation
    const lines = unifiedContent ? unifiedContent.split('\n') : []

    // If no unified content, show a simple before/after comparison
    if (lines.length === 0) {
      return (
        <YStack gap="$2">
          <Text fontSize="$2" color="$color11" padding="$2">
            No differences found or content generation failed. Showing raw
            comparison:
          </Text>
          <XStack gap="$2">
            <YStack
              flex={1}
              backgroundColor="$red2"
              padding="$2"
              borderRadius="$2"
            >
              <Text fontSize="$2" color="$red10" fontWeight="600">
                Before:
              </Text>
              <Text fontFamily="$mono" fontSize="$2" color="$color12">
                {oldString}
              </Text>
            </YStack>
            <YStack
              flex={1}
              backgroundColor="$green2"
              padding="$2"
              borderRadius="$2"
            >
              <Text fontSize="$2" color="$green10" fontWeight="600">
                After:
              </Text>
              <Text fontFamily="$mono" fontSize="$2" color="$color12">
                {newString}
              </Text>
            </YStack>
          </XStack>
        </YStack>
      )
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <YStack padding="$4" backgroundColor="$background">
          {lines.map((line, index) => (
            <XStack key={index} alignItems="flex-start">
              <Text
                fontFamily="$mono"
                fontSize="$2"
                color="$color11"
                width={40}
                textAlign="right"
                marginRight="$2"
              >
                {index + 1}
              </Text>
              <Text
                fontFamily="$mono"
                fontSize="$3"
                color={
                  line.startsWith('+')
                    ? '$green10'
                    : line.startsWith('-')
                      ? '$red10'
                      : '$color12'
                }
                backgroundColor={
                  line.startsWith('+')
                    ? '$green2'
                    : line.startsWith('-')
                      ? '$red2'
                      : 'transparent'
                }
                flex={1}
                paddingHorizontal="$1"
              >
                {line || ' '}
              </Text>
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    )
  }

  const renderSplitDiff = () => {
    return (
      <XStack flex={1}>
        {/* Before (Old) */}
        <YStack flex={1} borderRightWidth={1} borderRightColor="$borderColor">
          <XStack
            padding="$2"
            backgroundColor="$red2"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text fontSize="$2" color="$red10" fontWeight="600">
              Before
            </Text>
          </XStack>
          <YStack maxHeight={250}>
            {isLanguageLoaded && language !== 'text' ? (
              <ScrollView
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
              >
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{
                    ...codeStyles.codeContainer,
                    backgroundColor: theme.background.val,
                  }}
                >
                  <CodeHighlighter
                    hljsStyle={customHljsStyle}
                    textStyle={codeStyles.codeText}
                    language={language}
                    scrollViewProps={{ scrollEnabled: false }}
                  >
                    {oldString}
                  </CodeHighlighter>
                </ScrollView>
              </ScrollView>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text
                  fontFamily="$mono"
                  fontSize="$3"
                  color="$color12"
                  padding="$2"
                >
                  {oldString}
                </Text>
              </ScrollView>
            )}
          </YStack>
        </YStack>

        {/* After (New) */}
        <YStack flex={1}>
          <XStack
            padding="$2"
            backgroundColor="$green2"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Text fontSize="$2" color="$green10" fontWeight="600">
              After
            </Text>
          </XStack>
          <YStack maxHeight={250}>
            {isLanguageLoaded && language !== 'text' ? (
              <ScrollView
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
              >
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  contentContainerStyle={{
                    ...codeStyles.codeContainer,
                    backgroundColor: theme.background.val,
                  }}
                >
                  <CodeHighlighter
                    hljsStyle={customHljsStyle}
                    textStyle={codeStyles.codeText}
                    language={language}
                    scrollViewProps={{ scrollEnabled: false }}
                  >
                    {newString}
                  </CodeHighlighter>
                </ScrollView>
              </ScrollView>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text
                  fontFamily="$mono"
                  fontSize="$3"
                  color="$color12"
                  padding="$2"
                >
                  {newString}
                </Text>
              </ScrollView>
            )}
          </YStack>
        </YStack>
      </XStack>
    )
  }

  const renderSingleView = (content: string, label: string) => {
    return (
      <YStack>
        <XStack
          padding="$2"
          backgroundColor="$backgroundPress"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text fontSize="$2" color="$color11" fontWeight="600">
            {label}
          </Text>
        </XStack>
        <YStack maxHeight={250}>
          {isLanguageLoaded && language !== 'text' ? (
            <ScrollView
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
            >
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                contentContainerStyle={{
                  ...codeStyles.codeContainer,
                  backgroundColor: theme.background.val,
                }}
              >
                <CodeHighlighter
                  hljsStyle={customHljsStyle}
                  textStyle={codeStyles.codeText}
                  language={language}
                  scrollViewProps={{ scrollEnabled: false }}
                >
                  {content}
                </CodeHighlighter>
              </ScrollView>
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                fontFamily="$mono"
                fontSize="$3"
                color="$color12"
                padding="$4"
              >
                {content}
              </Text>
            </ScrollView>
          )}
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderRadius="$2"
      borderWidth={0.5}
      borderColor="$borderColor"
      overflow="hidden"
    >
      {/* Header */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$3"
        backgroundColor="$backgroundPress"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack alignItems="center" gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color">
            {title || filename || 'File diff'}
          </Text>
          <XStack alignItems="center" gap="$1">
            <Text fontSize="$2" color="$green10">
              +{stats.additions}
            </Text>
            <Text fontSize="$2" color="$red10">
              -{stats.deletions}
            </Text>
          </XStack>
        </XStack>

        <XStack alignItems="center" gap="$2">
          {/* View Mode Toggle */}
          {modeToggleable && (
            <Button
              size="$2"
              chromeless
              icon={viewMode === 'unified' ? GitBranch : Eye}
              onPress={() => {
                const modes: ('unified' | 'split' | 'before' | 'after')[] = [
                  'unified',
                  'split',
                  'before',
                  'after',
                ]
                const currentIndex = modes.indexOf(viewMode)
                const nextIndex = (currentIndex + 1) % modes.length
                setInternalViewMode(modes[nextIndex])
              }}
              color="$color11"
            />
          )}

          {copyable && (
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={() =>
                copyToClipboard(viewMode === 'before' ? oldString : newString)
              }
              color="$color11"
            />
          )}

          {collapsible && (
            <Button
              size="$2"
              chromeless
              icon={isCollapsed ? ChevronDown : ChevronUp}
              onPress={() => setIsCollapsed(!isCollapsed)}
              color="$color11"
            />
          )}
        </XStack>
      </XStack>

      {/* Content */}
      {!isCollapsed && (
        <YStack minHeight={250} backgroundColor="$background">
          {viewMode === 'unified' && renderUnifiedDiff()}
          {viewMode === 'split' && renderSplitDiff()}
          {viewMode === 'before' && renderSingleView(oldString, 'Before')}
          {viewMode === 'after' && renderSingleView(newString, 'After')}
        </YStack>
      )}
    </YStack>
  )
}
