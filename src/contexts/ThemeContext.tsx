import React, { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../services/storage'
import type { ThemeName } from '../config/themes'

interface ThemeContextType {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('tokyonight-dark')

  useEffect(() => {
    // Load theme from storage on app start
    const preferences = storage.getUserPreferences()
    setCurrentTheme(preferences.theme)
  }, [])

  const setTheme = (newTheme: ThemeName) => {
    setCurrentTheme(newTheme)
    // Save to storage
    const preferences = storage.getUserPreferences()
    storage.setUserPreferences({
      ...preferences,
      theme: newTheme,
    })
  }

  const toggleTheme = () => {
    const newTheme =
      currentTheme === 'tokyonight-dark'
        ? 'tokyonight-light'
        : 'tokyonight-dark'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
