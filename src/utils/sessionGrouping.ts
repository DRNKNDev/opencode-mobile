import type { Session } from '@opencode-ai/sdk'

// Time period enum for grouping logic
export enum TimePeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days',
  MONTH = 'month', // For older items in current year
  YEAR = 'year', // For items from previous years
}

// Session group interface
export interface SessionGroup {
  id: string
  title: string
  sessions: Session[]
  order: number // For sorting groups
  timePeriod: TimePeriod // To pass context to SessionCard
}

// List item interface for flat list rendering
export interface ListItem {
  type: 'header' | 'session'
  data: SessionGroup | Session
  key: string
  groupType?: TimePeriod // Context for session items
}

/**
 * Determines the time period for a session based on its updated timestamp
 */
export function getTimePeriod(updatedAt: number): TimePeriod {
  const now = new Date()
  const sessionDate = new Date(updatedAt)

  // Set times to start of day for accurate day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sessionDay = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate()
  )

  const diffInMs = today.getTime() - sessionDay.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return TimePeriod.TODAY
  } else if (diffInDays === 1) {
    return TimePeriod.YESTERDAY
  } else if (diffInDays <= 7) {
    return TimePeriod.LAST_7_DAYS
  } else if (diffInDays <= 30) {
    return TimePeriod.LAST_30_DAYS
  } else if (sessionDate.getFullYear() === now.getFullYear()) {
    return TimePeriod.MONTH
  } else {
    return TimePeriod.YEAR
  }
}

/**
 * Generates human-readable group titles based on time period and date
 */
export function getGroupTitle(period: TimePeriod, date?: Date): string {
  switch (period) {
    case TimePeriod.TODAY:
      return 'Today'
    case TimePeriod.YESTERDAY:
      return 'Yesterday'
    case TimePeriod.LAST_7_DAYS:
      return 'Last 7 days'
    case TimePeriod.LAST_30_DAYS:
      return 'Last 30 days'
    case TimePeriod.MONTH:
      if (date) {
        return date.toLocaleDateString('en-US', { month: 'long' })
      }
      return 'This year'
    case TimePeriod.YEAR:
      if (date) {
        return date.getFullYear().toString()
      }
      return 'Older'
    default:
      return 'Other'
  }
}

/**
 * Groups sessions by time periods
 */
export function groupSessionsByTime(sessions: Session[]): SessionGroup[] {
  // Group sessions by time period
  const grouped = new Map<
    string,
    { period: TimePeriod; sessions: Session[]; sampleDate?: Date }
  >()

  sessions.forEach(session => {
    const period = getTimePeriod(session.time.updated)
    const sessionDate = new Date(session.time.updated)

    let groupKey: string

    if (period === TimePeriod.MONTH) {
      // Group by month and year
      groupKey = `${period}-${sessionDate.getFullYear()}-${sessionDate.getMonth()}`
    } else if (period === TimePeriod.YEAR) {
      // Group by year
      groupKey = `${period}-${sessionDate.getFullYear()}`
    } else {
      // Use period as key for relative periods
      groupKey = period
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        period,
        sessions: [],
        sampleDate: sessionDate,
      })
    }

    grouped.get(groupKey)!.sessions.push(session)
  })

  // Convert to SessionGroup array and sort
  const groups: SessionGroup[] = []

  grouped.forEach(({ period, sessions, sampleDate }, key) => {
    if (sessions.length === 0) return // Skip empty groups

    // Sort sessions within group by most recent first
    const sortedSessions = [...sessions].sort(
      (a, b) => b.time.updated - a.time.updated
    )

    groups.push({
      id: key,
      title: getGroupTitle(period, sampleDate),
      sessions: sortedSessions,
      order: getGroupOrder(period, sampleDate),
      timePeriod: period,
    })
  })

  // Sort groups by order (most recent first)
  return groups.sort((a, b) => a.order - b.order)
}

/**
 * Helper function to determine sort order for groups
 */
function getGroupOrder(period: TimePeriod, date?: Date): number {
  const now = new Date()

  switch (period) {
    case TimePeriod.TODAY:
      return 1
    case TimePeriod.YESTERDAY:
      return 2
    case TimePeriod.LAST_7_DAYS:
      return 3
    case TimePeriod.LAST_30_DAYS:
      return 4
    case TimePeriod.MONTH:
      if (date) {
        // Sort months by recency (most recent month first)
        const monthsFromNow =
          (now.getFullYear() - date.getFullYear()) * 12 +
          (now.getMonth() - date.getMonth())
        return 100 + monthsFromNow
      }
      return 100
    case TimePeriod.YEAR:
      if (date) {
        // Sort years by recency (most recent year first)
        const yearsFromNow = now.getFullYear() - date.getFullYear()
        return 1000 + yearsFromNow
      }
      return 1000
    default:
      return 9999
  }
}

/**
 * Transforms grouped sessions into a flat array suitable for LegendList
 */
export function flattenGroupsForList(groups: SessionGroup[]): ListItem[] {
  const items: ListItem[] = []

  groups.forEach(group => {
    // Add section header
    items.push({
      type: 'header',
      data: group,
      key: `header-${group.id}`,
    })

    // Add sessions in this group
    group.sessions.forEach(session => {
      items.push({
        type: 'session',
        data: session,
        key: `session-${session.id}`,
        groupType: group.timePeriod,
      })
    })
  })

  return items
}
