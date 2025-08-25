import React, { useMemo } from 'react'
import Markdown from 'react-native-markdown-display'
import { getTokens, ScrollView, Text, useTheme } from 'tamagui'

export interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme()
  const tokens = getTokens()

  const customRules = useMemo(
    () => ({
      // Handle fenced code blocks (```language)
      fence: (
        node: any,
        children: any,
        parent: any,
        styles: any,
        inheritedStyles: any = {}
      ) => {
        return (
          <ScrollView
            key={node.key || `fence-${Math.random()}`}
            maxHeight={200}
            backgroundColor="$background"
            marginVertical="$2"
            padding="$2"
            borderRadius="$2"
            borderWidth={0.5}
            borderColor="$borderColor"
          >
            <Text fontSize="$2" fontFamily="$mono" color="$color12">
              {node.content}
            </Text>
          </ScrollView>
        )
      },

      // Handle indented code blocks
      code_block: (
        node: any,
        children: any,
        parent: any,
        styles: any,
        inheritedStyles: any = {}
      ) => {
        return (
          <ScrollView
            key={node.key || `code-block-${Math.random()}`}
            maxHeight={200}
            backgroundColor="$background"
            padding="$2"
            borderRadius="$2"
          >
            <Text fontSize="$2" fontFamily="$mono" color="$color12">
              {node.content}
            </Text>
          </ScrollView>
        )
      },
    }),
    []
  )

  const styles = useMemo(
    () => ({
      body: {
        fontSize: theme.fontSize4?.val,
        lineHeight: tokens.size['$1.5'].val,
        color: theme.color?.val,
      },
      heading1: {
        fontSize: theme.fontSize6?.val,
        lineHeight: tokens.size.$2.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 8,
      },
      heading2: {
        fontSize: theme.fontSize5?.val,
        lineHeight: tokens.size.$2.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 6,
      },
      heading3: {
        fontSize: theme.fontSize4?.val,
        lineHeight: tokens.size['$1.5'].val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 4,
      },
      heading4: {
        fontSize: theme.fontSize4?.val,
        lineHeight: tokens.size['$1.5'].val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 4,
      },
      heading5: {
        fontSize: theme.fontSize3?.val,
        lineHeight: tokens.size.$1.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 2,
      },
      heading6: {
        fontSize: theme.fontSize2?.val,
        lineHeight: tokens.size.$1.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 2,
      },
      paragraph: {
        marginVertical: 0,
      },
      strong: {
        fontWeight: 'bold' as const,
        color: theme.color?.val,
      },
      em: {
        fontStyle: 'italic' as const,
        color: theme.color?.val,
      },
      link: {
        color: theme.blue10?.val,
        textDecorationLine: 'underline' as const,
      },
      code_inline: {
        backgroundColor: theme.backgroundHover?.val,
        color: theme.color?.val,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontFamily: 'monospace',
      },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: theme.borderColor?.val,
        paddingLeft: 12,
        marginLeft: 8,
        backgroundColor: theme.backgroundHover?.val,
        paddingVertical: 8,
        borderRadius: 4,
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
      list_item: {
        color: theme.color?.val,
      },
      hr: {
        backgroundColor: theme.borderColor?.val,
        height: 1,
        marginVertical: 16,
      },
    }),
    [theme]
  )

  return (
    <Markdown style={styles} rules={customRules} mergeStyle={true}>
      {content}
    </Markdown>
  )
}
