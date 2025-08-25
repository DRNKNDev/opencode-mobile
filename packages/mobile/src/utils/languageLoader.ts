// Language loader for react-syntax-highlighter
// Dynamically imports language definitions to reduce bundle size

const loadedLanguages = new Set<string>()

export const loadLanguage = async (language: string): Promise<void> => {
  if (loadedLanguages.has(language)) {
    return
  }

  try {
    // Note: react-native-code-highlighter handles language loading internally
    // This is kept for compatibility but may not be needed
    loadedLanguages.add(language)
  } catch (error) {
    console.warn(`Failed to load language: ${language}`, error)
  }
}

export const isLanguageLoaded = (language: string): boolean => {
  return loadedLanguages.has(language)
}

// Common languages that should be pre-loaded
export const COMMON_LANGUAGES = [
  'javascript',
  'typescript',
  'json',
  'bash',
  'python',
  'html',
  'css',
] as const

// Pre-load common languages
export const preloadCommonLanguages = async (): Promise<void> => {
  await Promise.all(COMMON_LANGUAGES.map(lang => loadLanguage(lang)))
}
