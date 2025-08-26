# AGENTS.md - Mobile App Development Guide

## Available Commands

Run these from the mobile package directory (`/packages/mobile`):

- `bun start` - Start Expo development server
- `bun run android` - Run on Android device/emulator
- `bun run ios` - Run on iOS device/simulator
- `bun run web` - Start web version
- `bun run lint` - Run ESLint with Expo config

**Note**: You can also run mobile commands from the root using `bun run mobile:*` (see `/AGENTS.md` for root commands)

## Code Style Guidelines

- **TypeScript**: Strict mode enabled, use proper typing with interfaces
- **Imports**: Use single quotes, import from "react-native", "expo-router", and "tamagui"
- **Components**: Use default exports for screen components, named exports for utilities
- **Naming**: PascalCase for components/interfaces, camelCase for functions/variables
- **Paths**: Use `@/*` alias for relative imports (configured in tsconfig.json)
- **Formatting**: Prettier enforces no semicolons, single quotes, trailing commas (es5), 2-space tabs
- **ESLint**: Follow Expo config rules (expo/flat config) integrated with Prettier
- **State**: Use React hooks (useState, useEffect) with proper TypeScript typing
- **UI**: Use Tamagui components (Card, Text, XStack, YStack) for consistent styling
- **Error Handling**: Use optional chaining, proper error boundaries, status fields in interfaces
- **Debug Logging**: Use `@/src/utils/debug.ts` for all debug logging instead of console.log/warn/error

## Mobile-Specific Guidelines

For general commit message guidelines and monorepo information, see `/AGENTS.md`.

Use `mobile` scope for mobile-specific commits:

- `feat(mobile): add dark mode toggle`
- `fix(mobile): resolve connection timeout issue`
- `style(mobile): update button component styling`

## Mobile Framework Notes

- **React Native**: v0.79+ with Expo Router v5+
- **UI Library**: Tamagui v1.132+ for components and theming
- **Storage**: MMKV for local data persistence
- **Navigation**: React Navigation with Expo Router
- **State Management**: React hooks with proper TypeScript typing
- **TypeScript**: Strict mode with expo/tsconfig.base
- **Testing**: No test framework currently configured
- **Build Tool**: Expo CLI for development and building
