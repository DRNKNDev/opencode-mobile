# AGENTS.md - Mobile App Development Guide

## Build/Lint/Test Commands

- `npm run lint` - Run ESLint with Expo config
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without making changes
- `npm start` - Start Expo development server
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator
- `npm run web` - Start web version
- `npm run reset-project` - Reset project to clean state
- **No test framework configured** - no single test command available

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

## Commit Message Guidelines

Follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification:

**Format**: `<type>[optional scope]: <description>`

**Required Types**:
- `feat:` - New feature (correlates with MINOR in SemVer)
- `fix:` - Bug fix (correlates with PATCH in SemVer)

**Additional Types**:
- `build:` - Build system or external dependencies
- `chore:` - Maintenance tasks, no production code change
- `ci:` - CI configuration files and scripts
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semicolons, etc)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Performance improvements
- `test:` - Adding missing tests or correcting existing tests
- `config:` - Configuration changes
- `deps:` - Dependency updates

**Breaking Changes**: Use `!` after type/scope or `BREAKING CHANGE:` footer (correlates with MAJOR in SemVer)

**Examples**:
- `feat: add user authentication`
- `fix(api): resolve timeout issue in user login`
- `feat!: migrate to new authentication system`
- `docs: update installation instructions`
- `deps: upgrade react-native to 0.79`

## Framework Notes

- Built with Expo Router v5+ and React Native 0.79+
- Uses Tamagui v1.132+ for UI components and theming
- TypeScript strict mode with expo/tsconfig.base
- MMKV for storage, React Navigation for routing
- Prettier configured for React Native/Expo with single quotes, no semicolons
- No Cursor rules or Copilot instructions found
