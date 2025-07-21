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

export const detectLanguage = (filename?: string, content?: string): string => {
  // 1. File extension mapping
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext && EXTENSION_TO_LANGUAGE[ext]) {
      return EXTENSION_TO_LANGUAGE[ext]
    }

    // Special cases for files without extensions
    const basename = filename.toLowerCase()
    if (basename === 'dockerfile') return 'dockerfile'
    if (basename === 'makefile') return 'makefile'
    if (basename.includes('gitignore')) return 'gitignore'
  }

  // 2. Content analysis (basic patterns)
  if (content) {
    const firstLine = content.split('\n')[0]

    // Shebang detection
    if (
      firstLine.startsWith('#!/bin/bash') ||
      firstLine.startsWith('#!/bin/sh')
    ) {
      return 'bash'
    }
    if (
      firstLine.startsWith('#!/usr/bin/env python') ||
      firstLine.startsWith('#!/usr/bin/python')
    ) {
      return 'python'
    }
    if (
      firstLine.startsWith('#!/usr/bin/env node') ||
      firstLine.startsWith('#!/usr/bin/node')
    ) {
      return 'javascript'
    }

    // Content patterns
    if (content.includes('import ') && content.includes('from ')) {
      if (content.includes('React') || content.includes('useState'))
        return 'javascript'
      return 'python'
    }
    if (content.includes('def ') && content.includes(':')) return 'python'
    if (content.includes('package ') && content.includes('func ')) return 'go'
    if (content.includes('fn ') && content.includes('->')) return 'rust'
    if (
      content.includes('function ') ||
      content.includes('const ') ||
      content.includes('let ')
    )
      return 'javascript'
  }

  return 'text'
}
