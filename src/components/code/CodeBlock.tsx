import { ChevronDown, ChevronUp, Copy } from '@tamagui/lucide-icons'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import CodeHighlighter from 'react-native-code-highlighter'
import { atomOneDarkReasonable } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { Button, Text, XStack, YStack, useTheme } from 'tamagui'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import type { CodeBlockProps } from '../../types/code'
import { loadLanguage } from '../../utils/languageLoader'

export function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = true,
  copyable = true,
  collapsible = false,
  title,
}: CodeBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsible)
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false)
  const { copyToClipboard } = useCopyToClipboard()
  const theme = useTheme()

  const lines = useMemo(() => code.split('\n'), [code])

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
        borderBottomWidth={0.5}
        borderBottomColor="$borderColor"
      >
        <XStack alignItems="center" gap="$2">
          <Text fontSize="$3" fontWeight="600" color="$color">
            {title || filename || `${language} code`}
          </Text>
          {lines.length > 1 && (
            <Text fontSize="$2" color="$color11">
              ({lines.length} lines)
            </Text>
          )}
        </XStack>

        <XStack alignItems="center" gap="$2">
          {copyable && (
            <Button
              size="$2"
              chromeless
              icon={Copy}
              onPress={() => copyToClipboard(code)}
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

      {/* Code Content */}
      {!isCollapsed && (
        <YStack maxHeight={250}>
          {isLanguageLoaded && language !== 'text' ? (
            // Wrap CodeHighlighter with nested ScrollViews for bidirectional scrolling
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
                  {code}
                </CodeHighlighter>
              </ScrollView>
            </ScrollView>
          ) : (
            // Fallback implementation
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <YStack padding="$4" backgroundColor="$background">
                {showLineNumbers ? (
                  <YStack>
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
                          color="$color12"
                          flex={1}
                        >
                          {line || ' '}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                ) : (
                  <Text fontFamily="$mono" fontSize="$3" color="$color12">
                    {code}
                  </Text>
                )}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      )}
    </YStack>
  )
}
