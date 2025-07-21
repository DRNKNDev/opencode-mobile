import { forwardRef } from 'react'
import type { InputProps } from 'tamagui'
import { Input, styled } from 'tamagui'

export interface TextAreaProps extends Omit<InputProps, 'multiline'> {
  maxLines?: number
  minLines?: number
  size?: '$2' | '$3' | '$4'
}

const StyledTextArea = styled(Input, {
  multiline: true,
  textAlignVertical: 'top',
  borderRadius: '$2',
  borderWidth: 0.5,
  borderColor: '$borderColor',
  backgroundColor: '$backgroundHover',
  placeholderTextColor: '$placeholderColor',

  focusStyle: {
    borderColor: '$blue10',
    borderWidth: 2,
  },

  variants: {
    size: {
      $2: {
        minHeight: '$4',
        maxHeight: '$16',
        fontSize: '$3',
        lineHeight: '$3',
        paddingVertical: '$2',
        paddingHorizontal: '$3',
      },
      $3: {
        minHeight: '$6',
        maxHeight: '$20',
        fontSize: '$4',
        lineHeight: '$4',
        paddingVertical: '$3',
        paddingHorizontal: '$4',
      },
      $4: {
        minHeight: '$10',
        maxHeight: '$24',
        fontSize: '$4',
        lineHeight: '$4',
        paddingVertical: '$3',
        paddingHorizontal: '$4',
      },
    },
  } as const,

  defaultVariants: {
    size: '$3',
  },
})

export const TextArea = forwardRef<any, TextAreaProps>(
  ({ maxLines = 4, minLines = 1, ...props }, ref) => {
    return <StyledTextArea ref={ref} {...props} />
  }
)

TextArea.displayName = 'TextArea'
