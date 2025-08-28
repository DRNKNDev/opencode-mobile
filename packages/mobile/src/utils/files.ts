/**
 * Unified file type utilities
 * Centralizes all file extension and language detection logic
 */

// Centralized file type definitions
const FILE_TYPES = {
  // JavaScript variants
  javascript: {
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    language: 'javascript',
  },
  typescript: {
    extensions: ['ts', 'tsx'],
    language: 'typescript',
  },

  // Python
  python: {
    extensions: ['py', 'pyw', 'pyi'],
    language: 'python',
  },

  // Web technologies
  html: {
    extensions: ['html', 'htm'],
    language: 'html',
  },
  css: {
    extensions: ['css'],
    language: 'css',
  },
  scss: {
    extensions: ['scss'],
    language: 'scss',
  },
  sass: {
    extensions: ['sass'],
    language: 'sass',
  },
  less: {
    extensions: ['less'],
    language: 'less',
  },
  vue: {
    extensions: ['vue'],
    language: 'vue',
  },
  svelte: {
    extensions: ['svelte'],
    language: 'svelte',
  },
  astro: {
    extensions: ['astro'],
    language: 'astro',
  },

  // Systems programming
  c: {
    extensions: ['c', 'h'],
    language: 'c',
  },
  cpp: {
    extensions: ['cpp', 'cc', 'cxx', 'hpp', 'hxx'],
    language: 'cpp',
  },
  csharp: {
    extensions: ['cs'],
    language: 'csharp',
  },
  go: {
    extensions: ['go'],
    language: 'go',
  },
  rust: {
    extensions: ['rs'],
    language: 'rust',
  },
  java: {
    extensions: ['java'],
    language: 'java',
  },
  kotlin: {
    extensions: ['kt', 'kts'],
    language: 'kotlin',
  },
  swift: {
    extensions: ['swift'],
    language: 'swift',
  },

  // Scripting languages
  ruby: {
    extensions: ['rb'],
    language: 'ruby',
  },
  php: {
    extensions: ['php'],
    language: 'php',
  },
  perl: {
    extensions: ['pl', 'pm'],
    language: 'perl',
  },
  lua: {
    extensions: ['lua'],
    language: 'lua',
  },

  // Shell scripts
  shell: {
    extensions: ['sh', 'bash', 'zsh', 'fish'],
    language: 'bash',
  },
  powershell: {
    extensions: ['ps1', 'psd1', 'psm1'],
    language: 'powershell',
  },

  // Data & Config
  json: {
    extensions: ['json', 'jsonc'],
    language: 'json',
  },
  yaml: {
    extensions: ['yaml', 'yml'],
    language: 'yaml',
  },
  toml: {
    extensions: ['toml'],
    language: 'toml',
  },
  xml: {
    extensions: ['xml'],
    language: 'xml',
  },
  ini: {
    extensions: ['ini', 'cfg', 'conf'],
    language: 'ini',
  },
  csv: {
    extensions: ['csv'],
    language: 'csv',
  },
  sql: {
    extensions: ['sql'],
    language: 'sql',
  },

  // Documentation
  markdown: {
    extensions: ['md', 'mdx', 'markdown'],
    language: 'markdown',
  },
  restructuredtext: {
    extensions: ['rst'],
    language: 'rst',
  },
  asciidoc: {
    extensions: ['adoc', 'asciidoc'],
    language: 'asciidoc',
  },
  plaintext: {
    extensions: ['txt', 'text'],
    language: 'plaintext',
  },

  // Special files
  dockerfile: {
    extensions: ['dockerfile'],
    language: 'dockerfile',
  },
  makefile: {
    extensions: ['makefile', 'mk'],
    language: 'makefile',
  },
  gitignore: {
    extensions: ['gitignore'],
    language: 'gitignore',
  },
  env: {
    extensions: ['env'],
    language: 'bash',
  },
  dockerignore: {
    extensions: ['dockerignore'],
    language: 'gitignore',
  },
} as const

// Build reverse lookup map for extensions at module load time
const extensionToType = new Map<string, keyof typeof FILE_TYPES>()
for (const [key, type] of Object.entries(FILE_TYPES)) {
  for (const ext of type.extensions) {
    extensionToType.set(ext, key as keyof typeof FILE_TYPES)
  }
}

/**
 * Extract file extension from filepath
 */
export const getExtension = (filepath: string): string | undefined => {
  if (!filepath) return undefined
  const parts = filepath.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase()
  }
  return undefined
}

/**
 * Detect programming language from filepath
 */
export const detectLanguage = (filepath: string): string | undefined => {
  if (!filepath) return undefined

  const ext = getExtension(filepath)
  if (ext) {
    const typeKey = extensionToType.get(ext)
    if (typeKey) {
      return FILE_TYPES[typeKey].language
    }
  }

  // Check for special filenames without extensions
  const basename = filepath.toLowerCase().split('/').pop() || ''
  if (basename === 'dockerfile') return 'dockerfile'
  if (basename === 'makefile' || basename.startsWith('makefile.'))
    return 'makefile'
  if (basename.includes('.gitignore')) return 'gitignore'
  if (basename.includes('.dockerignore')) return 'gitignore'

  return undefined
}

/**
 * Extract filename from full filepath
 */
export const getFileName = (filepath: string): string => {
  if (!filepath) return 'Unknown file'
  return filepath.split('/').pop() || filepath
}
