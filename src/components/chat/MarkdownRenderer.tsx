import React, { useMemo } from 'react'
import Markdown from 'react-native-markdown-display'
import { useTheme } from 'tamagui'
import { CodeBlock } from '../code/CodeBlock'

export interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const theme = useTheme()

  const customRules = useMemo(
    () => ({
      // Handle fenced code blocks (```language)
      fence: (node: any) => {
        return (
          <CodeBlock
            code={node.content}
            language={node.info || 'text'}
            showHeader={false}
          />
        )
      },

      // Handle indented code blocks
      code_block: (node: any) => {
        return (
          <CodeBlock code={node.content} language="text" showHeader={false} />
        )
      },
    }),
    []
  )

  const styles = useMemo(
    () => ({
      body: {
        fontSize: theme.fontSize4?.val,
        lineHeight: theme.lineHeight4?.val,
        color: theme.color?.val,
      },
      heading1: {
        fontSize: theme.fontSize6?.val,
        lineHeight: theme.lineHeight6?.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 8,
      },
      heading2: {
        fontSize: theme.fontSize5?.val,
        lineHeight: theme.lineHeight5?.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 6,
      },
      heading3: {
        fontSize: theme.fontSize4?.val,
        lineHeight: theme.lineHeight4?.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 4,
      },
      heading4: {
        fontSize: theme.fontSize4?.val,
        lineHeight: theme.lineHeight4?.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 4,
      },
      heading5: {
        fontSize: theme.fontSize3?.val,
        lineHeight: theme.lineHeight3?.val,
        fontWeight: 'bold' as const,
        color: theme.color?.val,
        marginVertical: 2,
      },
      heading6: {
        fontSize: theme.fontSize2?.val,
        lineHeight: theme.lineHeight2?.val,
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
