import { tokyoNightDark } from './tokyonight-dark'
import { tokyoNightLight } from './tokyonight-light'

export { tokyoNightDark, tokyoNightLight }

export type ThemeName = 'tokyonight-dark' | 'tokyonight-light'

export const themes = {
  'tokyonight-dark': tokyoNightDark,
  'tokyonight-light': tokyoNightLight,
} as const
