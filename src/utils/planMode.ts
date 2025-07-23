import type { Message } from '../services/types'

/**
 * Detects if a message was sent in plan mode by checking for synthetic system reminder parts
 * @param message The message to check
 * @returns true if the message was sent in plan mode
 */
export function isPlanMode(message: Message): boolean {
  if (!message.parts) return false

  return message.parts.some(part => {
    // Check if this is a synthetic text part with plan mode indicator
    const isTextPart = part.type === 'text'
    const isSynthetic = part.synthetic === true
    const containsSystemReminder = part.content?.includes('<system-reminder>')
    const containsPlanModeText = part.content?.includes('Plan mode is active')

    return (
      isTextPart &&
      isSynthetic &&
      containsSystemReminder &&
      containsPlanModeText
    )
  })
}
/**
 * Formats a timestamp for display with optional plan mode indicator
 * @param timestamp The timestamp to format
 * @param showPlanMode Whether to show the plan mode indicator
 * @returns Formatted time string like "PLAN MODE • 14:21" or "14:21"
 */
export function formatMessageTime(
  timestamp: Date,
  showPlanMode: boolean = false
): string {
  const timeString = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return showPlanMode ? `PLAN MODE • ${timeString}` : timeString
}
