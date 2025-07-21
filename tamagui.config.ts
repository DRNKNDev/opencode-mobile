import { config } from '@tamagui/config/v3'
import { createTamagui } from '@tamagui/core'
import { tokyoNightDark, tokyoNightLight } from './src/config/themes'

const customConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    // Tokyo Night Dark Theme
    'tokyonight-dark': {
      ...config.themes.dark,
      ...tokyoNightDark,
    },
    // Tokyo Night Light Theme
    'tokyonight-light': {
      ...config.themes.light,
      ...tokyoNightLight,
    },
  },
})

export default customConfig

export type Conf = typeof customConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
