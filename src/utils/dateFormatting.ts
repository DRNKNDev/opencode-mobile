import { TimePeriod } from './sessionGrouping'

/**
 * Main function for context-aware date formatting based on group type
 */
export function formatContextualDate(
  timestamp: number,
  groupType?: TimePeriod
): string {
  const date = new Date(timestamp)
  const now = new Date()

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  switch (groupType) {
    case TimePeriod.TODAY:
      return formatRelativeTime(date, now)
    case TimePeriod.YESTERDAY:
      return formatTime(date)
    case TimePeriod.LAST_7_DAYS:
      return formatDayAndTime(date)
    case TimePeriod.LAST_30_DAYS:
      return formatShortDateAndTime(date)
    case TimePeriod.MONTH:
      return formatDayOfMonth(date)
    case TimePeriod.YEAR:
      return formatMonthAndDay(date)
    default:
      // Fallback to the original format logic
      return formatFallback(date, now)
  }
}

/**
 * Formats time only (e.g., "3:45 PM", "9:30 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats day and time (e.g., "Monday 3:45 PM")
 */
export function formatDayAndTime(date: Date): string {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const time = formatTime(date)
  return `${dayName} ${time}`
}

/**
 * Formats short date and time (e.g., "Jan 15, 3:45 PM")
 */
export function formatShortDateAndTime(date: Date): string {
  const shortDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const time = formatTime(date)
  return `${shortDate}, ${time}`
}

/**
 * Formats day of month with ordinal suffix (e.g., "15th", "23rd")
 */
export function formatDayOfMonth(date: Date): string {
  const day = date.getDate()
  const ordinal = getOrdinalSuffix(day)
  return `${day}${ordinal}`
}

/**
 * Formats month and day (e.g., "Dec 15", "Nov 8")
 */
export function formatMonthAndDay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Formats relative time for today's items (e.g., "Just now", "5m ago", "3h ago")
 */
export function formatRelativeTime(date: Date, now: Date): string {
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`

  // Fallback for edge cases where it's still today but more than 24h (shouldn't happen)
  return formatTime(date)
}

/**
 * Gets ordinal suffix for day numbers
 */
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }

  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Fallback formatting function (matches original SessionCard logic)
 */
function formatFallback(date: Date, now: Date): string {
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return date.toLocaleDateString()
}
