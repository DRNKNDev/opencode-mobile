# AGENTS.md - Monorepo Development Guide

## Project Structure

This is a monorepo managed with Bun workspaces containing:

- `/packages/mobile` - React Native/Expo mobile application (@patjoe/mobile)

## Available Commands

Run these from the project root:

### Mobile Workspace Commands

- `bun run mobile:start` - Start Expo development server for mobile app
- `bun run mobile:android` - Run mobile app on Android device/emulator
- `bun run mobile:ios` - Run mobile app on iOS device/simulator

### All Workspaces Commands

- `bun run build` - Run build scripts in all workspaces
- `bun run lint` - Run ESLint in all workspaces
- `bun run test` - Run tests in all workspaces
- `bun run format` - Format all files with Prettier
- `bun run format:check` - Check formatting without making changes

## Package Manager

- **Bun** v1.2.20+ - Primary package manager
- Using Bun workspaces for monorepo management
- Install dependencies: `bun install`
- Add packages to workspace: `bun add <package> --filter @patjoe/mobile`
- Remove packages from workspace: `bun remove <package> --filter @patjoe/mobile`

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
- `feat(mobile): add dark mode toggle`
- `fix(mobile): resolve connection timeout issue`

## General Development Guidelines

- All workspaces use TypeScript with strict mode enabled
- Prettier configuration is shared across all workspaces
- Follow conventional commits for all changes
- Use workspace-specific scopes in commit messages when appropriate
- Each workspace maintains its own AGENTS.md for package-specific guidelines
