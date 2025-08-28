import { useState, useCallback } from 'react'
import type { ContextItem } from '../components/modals/ContextSelector'

export function useContextSelection() {
  const [selectedContextItems, setSelectedContextItems] = useState<
    ContextItem[]
  >([])

  const handleContextItemSelect = useCallback((item: ContextItem) => {
    setSelectedContextItems(current => {
      // Check if item already exists to prevent duplicates
      const exists = current.some(existing => {
        if (existing.type !== item.type) return false
        if (existing.type === 'file' && item.type === 'file') {
          return existing.path === item.path
        }
        if (existing.type === 'text' && item.type === 'text') {
          return (
            existing.path === item.path &&
            existing.start === item.start &&
            existing.end === item.end
          )
        }
        return false
      })

      if (exists) return current

      const newItems = [...current, item]
      return newItems
    })
  }, [])

  const handleContextItemDeselect = useCallback((item: ContextItem) => {
    setSelectedContextItems(current => {
      const filtered = current.filter(existing => {
        if (existing.type !== item.type) return true
        if (existing.type === 'file' && item.type === 'file') {
          return existing.path !== item.path
        }
        if (existing.type === 'text' && item.type === 'text') {
          return !(
            existing.path === item.path &&
            existing.start === item.start &&
            existing.end === item.end
          )
        }
        return true
      })
      return filtered
    })
  }, [])

  const clearContextSelection = useCallback(() => {
    setSelectedContextItems([])
  }, [])

  return {
    selectedContextItems,
    handleContextItemSelect,
    handleContextItemDeselect,
    clearContextSelection,
  }
}
