const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  // JavaScript/TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  mjs: 'javascript',
  cjs: 'javascript',

  // Python
  py: 'python',
  pyw: 'python',
  pyi: 'python',

  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',

  // Systems
  go: 'go',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',

  // Shell
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  fish: 'bash',

  // Config
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',

  // Markdown
  md: 'markdown',
  mdx: 'markdown',

  // Other
  sql: 'sql',
  dockerfile: 'dockerfile',
  gitignore: 'gitignore',
}

export const detectLanguage = (filename?: string): string | undefined => {
  if (!filename) {
    return undefined
  }

  // File extension mapping
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext && EXTENSION_TO_LANGUAGE[ext]) {
    return EXTENSION_TO_LANGUAGE[ext]
  }

  // Special cases for files without extensions
  const basename = filename.toLowerCase()
  if (basename === 'dockerfile') return 'dockerfile'
  if (basename === 'makefile') return 'makefile'
  if (basename.includes('gitignore')) return 'gitignore'

  return undefined
}
