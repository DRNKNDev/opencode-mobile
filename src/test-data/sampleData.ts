import type { Message } from '../services/types'
import type { TodoItem } from '../types/todo'
import type { ToolPart } from '../types/tools'

// ===== ENHANCED TODO EXAMPLES =====
export const sampleTodos: TodoItem[] = [
  {
    id: '1',
    content: 'Implement user authentication system',
    status: 'completed',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: '2',
    content: 'Add dark mode support with theme persistence',
    status: 'in_progress',
    priority: 'medium',
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(Date.now() - 1800000), // 30 min ago
  },
  {
    id: '3',
    content: 'Write comprehensive unit tests for components',
    status: 'pending',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: '4',
    content: 'Optimize bundle size and implement code splitting',
    status: 'pending',
    priority: 'low',
    createdAt: new Date(Date.now() - 1800000), // 30 min ago
    updatedAt: new Date(Date.now() - 1800000),
  },
  {
    id: '5',
    content: 'Setup CI/CD pipeline with automated testing',
    status: 'pending',
    priority: 'medium',
    createdAt: new Date(Date.now() - 900000), // 15 min ago
    updatedAt: new Date(Date.now() - 900000),
  },
  {
    id: '6',
    content: 'Research and integrate analytics tracking',
    status: 'completed',
    priority: 'low',
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
  },
]

// ===== COMPREHENSIVE TOOL EXAMPLES (ALL 7 RENDERERS) =====
export const sampleToolParts: ToolPart[] = [
  // 1. READ TOOL - Reading existing screen component
  {
    id: 'tool-1',
    tool: 'read',
    type: 'read',
    state: {
      status: 'completed',
      input: { filePath: 'src/screens/ProfileScreen.tsx' },
      output:
        'import React, { useState, useEffect } from \'react\'\nimport { YStack, XStack, Text, Image, Spinner } from \'tamagui\'\nimport { useLocalSearchParams } from \'expo-router\'\nimport AsyncStorage from \'@react-native-async-storage/async-storage\'\n\ninterface User {\n  id: string\n  name: string\n  email: string\n  avatar?: string\n  createdAt: string\n}\n\nexport default function ProfileScreen() {\n  const { userId } = useLocalSearchParams<{ userId: string }>()\n  const [user, setUser] = useState<User | null>(null)\n  const [loading, setLoading] = useState(true)\n\n  useEffect(() => {\n    const fetchUser = async () => {\n      try {\n        const token = await AsyncStorage.getItem(\'auth_token\')\n        const response = await fetch(`/api/users/${userId}`, {\n          headers: { Authorization: `Bearer ${token}` }\n        })\n        const userData = await response.json()\n        setUser(userData)\n      } catch (error) {\n        console.error(\'Failed to fetch user:\', error)\n      } finally {\n        setLoading(false)\n      }\n    }\n\n    if (userId) fetchUser()\n  }, [userId])\n\n  if (loading) {\n    return (\n      <YStack flex={1} justifyContent="center" alignItems="center">\n        <Spinner size="large" />\n        <Text marginTop="$4">Loading profile...</Text>\n      </YStack>\n    )\n  }\n\n  if (!user) {\n    return (\n      <YStack flex={1} justifyContent="center" alignItems="center">\n        <Text fontSize="$6">User not found</Text>\n      </YStack>\n    )\n  }\n\n  return (\n    <YStack flex={1} padding="$4" gap="$4">\n      <XStack alignItems="center" gap="$4">\n        {user.avatar && (\n          <Image\n            source={{ uri: user.avatar }}\n            width={80}\n            height={80}\n            borderRadius={40}\n          />\n        )}\n        <YStack flex={1}>\n          <Text fontSize="$8" fontWeight="bold">{user.name}</Text>\n          <Text fontSize="$4" color="$color11">{user.email}</Text>\n          <Text fontSize="$3" color="$color10">\n            Joined {new Date(user.createdAt).toLocaleDateString()}\n          </Text>\n        </YStack>\n      </XStack>\n    </YStack>\n  )\n}',
      metadata: { duration: '67ms' },
    },
  },

  // 2. BASH TOOL - Running Expo development server
  {
    id: 'tool-2',
    tool: 'bash',
    type: 'bash',
    state: {
      status: 'completed',
      input: { command: 'npm start' },
      output:
        'Starting project at /Users/dev/patjoe-mobile\n\n› Metro waiting on exp://192.168.1.100:8081\n› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)\n\n› Press a │ open Android\n› Press i │ open iOS simulator\n› Press w │ open web\n\n› Press r │ reload app\n› Press m │ toggle menu\n› Press d │ show developer tools\n› Press shift+d │ toggle auto opening developer tools on startup (disabled)\n\n› Press ? │ show all commands\n\nLogs for your project will appear below. Press Ctrl+C to exit.\n\n✓ Metro bundler is ready\n✓ Development server running on http://localhost:8081\n✓ Expo DevTools running on http://localhost:19002',
      metadata: { duration: '3.2s' },
    },
  },

  // 3. EDIT TOOL - Fixing navigation and adding proper types
  {
    id: 'tool-3',
    tool: 'edit',
    type: 'edit',
    state: {
      status: 'completed',
      input: {
        filePath: 'app/_layout.tsx',
        oldString:
          'import { Stack } from \'expo-router\'\n\nexport default function RootLayout() {\n  return (\n    <Stack>\n      <Stack.Screen name="index" />\n      <Stack.Screen name="chat/[id]" />\n    </Stack>\n  )\n}',
        newString:
          'import { Stack } from \'expo-router\'\nimport { TamaguiProvider } from \'tamagui\'\nimport { ThemeProvider } from \'../src/contexts/ThemeContext\'\nimport config from \'../tamagui.config\'\n\nexport default function RootLayout() {\n  return (\n    <TamaguiProvider config={config}>\n      <ThemeProvider>\n        <Stack screenOptions={{ headerShown: false }}>\n          <Stack.Screen name="index" />\n          <Stack.Screen name="sessions" />\n          <Stack.Screen name="connection" />\n          <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />\n        </Stack>\n      </ThemeProvider>\n    </TamaguiProvider>\n  )\n}',
      },
      output:
        'Updated app layout with proper Tamagui and theme providers, added missing screen routes.',
      metadata: { duration: '89ms' },
    },
  },

  // 4. WRITE TOOL - Creating mobile storage utility
  {
    id: 'tool-4',
    tool: 'write',
    type: 'write',
    state: {
      status: 'completed',
      input: {
        filePath: 'src/services/opencode.ts',
        content:
          "import AsyncStorage from '@react-native-async-storage/async-storage'\nimport { Session, Message } from './types'\n\nconst OPENCODE_SERVER_URL = 'ws://localhost:8080'\nconst STORAGE_KEYS = {\n  sessions: 'opencode_sessions',\n  currentSession: 'opencode_current_session',\n  serverUrl: 'opencode_server_url',\n  connectionStatus: 'opencode_connection_status'\n} as const\n\nclass OpenCodeClient {\n  private ws: WebSocket | null = null\n  private reconnectAttempts = 0\n  private maxReconnectAttempts = 5\n\n  async connect(serverUrl: string = OPENCODE_SERVER_URL): Promise<boolean> {\n    try {\n      this.ws = new WebSocket(serverUrl)\n      \n      return new Promise((resolve, reject) => {\n        if (!this.ws) return reject(new Error('WebSocket not initialized'))\n        \n        this.ws.onopen = () => {\n          console.log('Connected to OpenCode server')\n          this.reconnectAttempts = 0\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'connected')\n          resolve(true)\n        }\n        \n        this.ws.onerror = (error) => {\n          console.error('WebSocket error:', error)\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'error')\n          reject(error)\n        }\n        \n        this.ws.onclose = () => {\n          console.log('Disconnected from OpenCode server')\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'disconnected')\n          this.handleReconnect()\n        }\n      })\n    } catch (error) {\n      console.error('Failed to connect:', error)\n      return false\n    }\n  }\n\n  async sendMessage(content: string, sessionId: string): Promise<void> {\n    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {\n      throw new Error('WebSocket not connected')\n    }\n\n    const message = {\n      type: 'message',\n      sessionId,\n      content,\n      timestamp: new Date().toISOString()\n    }\n\n    this.ws.send(JSON.stringify(message))\n  }\n}\n\nexport const openCodeClient = new OpenCodeClient()\nexport default openCodeClient",
      },
      output:
        "import AsyncStorage from '@react-native-async-storage/async-storage'\nimport { Session, Message } from './types'\n\nconst OPENCODE_SERVER_URL = 'ws://localhost:8080'\nconst STORAGE_KEYS = {\n  sessions: 'opencode_sessions',\n  currentSession: 'opencode_current_session',\n  serverUrl: 'opencode_server_url',\n  connectionStatus: 'opencode_connection_status'\n} as const\n\nclass OpenCodeClient {\n  private ws: WebSocket | null = null\n  private reconnectAttempts = 0\n  private maxReconnectAttempts = 5\n\n  async connect(serverUrl: string = OPENCODE_SERVER_URL): Promise<boolean> {\n    try {\n      this.ws = new WebSocket(serverUrl)\n      \n      return new Promise((resolve, reject) => {\n        if (!this.ws) return reject(new Error('WebSocket not initialized'))\n        \n        this.ws.onopen = () => {\n          console.log('Connected to OpenCode server')\n          this.reconnectAttempts = 0\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'connected')\n          resolve(true)\n        }\n        \n        this.ws.onerror = (error) => {\n          console.error('WebSocket error:', error)\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'error')\n          reject(error)\n        }\n        \n        this.ws.onclose = () => {\n          console.log('Disconnected from OpenCode server')\n          AsyncStorage.setItem(STORAGE_KEYS.connectionStatus, 'disconnected')\n          this.handleReconnect()\n        }\n      })\n    } catch (error) {\n      console.error('Failed to connect:', error)\n      return false\n    }\n  }\n\n  async sendMessage(content: string, sessionId: string): Promise<void> {\n    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {\n      throw new Error('WebSocket not connected')\n    }\n\n    const message = {\n      type: 'message',\n      sessionId,\n      content,\n      timestamp: new Date().toISOString()\n    }\n\n    this.ws.send(JSON.stringify(message))\n  }\n}\n\nexport const openCodeClient = new OpenCodeClient()\nexport default openCodeClient",
      metadata: { duration: '156ms' },
    },
  },

  // 5. WEBFETCH TOOL - Fetching Expo documentation
  {
    id: 'tool-5',
    tool: 'webfetch',
    type: 'webfetch',
    state: {
      status: 'completed',
      input: {
        url: 'https://docs.expo.dev/router/introduction/',
        format: 'markdown',
      },
      output:
        "# Expo Router\n\nExpo Router is a file-based router for React Native and web applications. It allows you to manage navigation between screens in your app, bringing the best routing concepts from the web to native.\n\n## Quick start\n\nThe fastest way to get started is to use the `create-expo-app` command:\n\n```bash\nnpx create-expo-app@latest --template tabs\n```\n\n## File-based routing\n\nExpo Router uses a file-based routing system. This means that the structure of your `app` directory determines the navigation structure of your app.\n\n```\napp/\n  _layout.tsx\n  index.tsx\n  settings.tsx\n  users/\n    [id].tsx\n    index.tsx\n```\n\n### Dynamic routes\n\nYou can create dynamic routes by using square brackets in your file names:\n\n- `app/users/[id].tsx` matches `/users/123`\n- `app/posts/[...slug].tsx` matches `/posts/hello/world`\n\n### Layouts\n\nLayouts are shared UI elements that wrap around your screens. Create a `_layout.tsx` file to define a layout:\n\n```tsx\nimport { Stack } from 'expo-router'\n\nexport default function Layout() {\n  return <Stack />\n}\n```\n\n## Navigation\n\nUse the `Link` component or `router` object to navigate:\n\n```tsx\nimport { Link, router } from 'expo-router'\n\n// Using Link component\n<Link href=\"/settings\">Go to Settings</Link>\n\n// Using router object\nrouter.push('/settings')\n```",
      metadata: { duration: '1.8s' },
    },
  },

  // 6. TODOWRITE TOOL - Project planning and task management
  {
    id: 'tool-6',
    tool: 'todowrite',
    type: 'todowrite',
    state: {
      status: 'completed',
      input: {
        todos: [
          {
            id: 'todo-1',
            content: 'Setup authentication system',
            status: 'completed',
            priority: 'high',
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 3600000),
          },
          {
            id: 'todo-2',
            content: 'Add user profile page with avatar upload',
            status: 'in_progress',
            priority: 'high',
            createdAt: new Date(Date.now() - 7200000),
            updatedAt: new Date(Date.now() - 1800000),
          },
          {
            id: 'todo-3',
            content: 'Implement real-time notifications',
            status: 'pending',
            priority: 'medium',
            createdAt: new Date(Date.now() - 3600000),
            updatedAt: new Date(Date.now() - 3600000),
          },
          {
            id: 'todo-4',
            content: 'Add comprehensive error handling',
            status: 'pending',
            priority: 'high',
            createdAt: new Date(Date.now() - 1800000),
            updatedAt: new Date(Date.now() - 1800000),
          },
        ],
      },
      output:
        'Todo list updated with 4 items. 1 completed, 1 in progress, 2 pending. High priority items: 3/4',
      metadata: { duration: '89ms' },
    },
  },

  // 7. GREP TOOL - Searching for connection-related code
  {
    id: 'tool-7',
    tool: 'grep',
    type: 'grep',
    state: {
      status: 'completed',
      input: {
        pattern: 'WebSocket|connection|opencode',
        include: '*.tsx,*.ts',
        path: 'src/',
      },
      output:
        "Found 12 matches in 6 files:\n\nsrc/services/opencode.ts:8:const OPENCODE_SERVER_URL = 'ws://localhost:8080'\nsrc/services/opencode.ts:15:class OpenCodeClient {\nsrc/services/opencode.ts:16:  private ws: WebSocket | null = null\nsrc/services/opencode.ts:21:  async connect(serverUrl: string = OPENCODE_SERVER_URL): Promise<boolean> {\nsrc/services/opencode.ts:23:      this.ws = new WebSocket(serverUrl)\n\nsrc/screens/ConnectionScreen.tsx:4:import { openCodeClient } from '../services/opencode'\nsrc/screens/ConnectionScreen.tsx:12:  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')\nsrc/screens/ConnectionScreen.tsx:25:    const success = await openCodeClient.connect(serverUrl)\n\nsrc/components/ui/ConnectionStatus.tsx:3:import { openCodeClient } from '../../services/opencode'\nsrc/components/ui/ConnectionStatus.tsx:8:  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')\n\nsrc/contexts/ThemeContext.tsx:1:// No WebSocket references found\n\napp/connection.tsx:2:import ConnectionScreen from '../src/screens/ConnectionScreen'",
      metadata: { duration: '187ms' },
    },
  },

  // 8. ERROR STATE EXAMPLE - Expo build failure
  {
    id: 'tool-8',
    tool: 'bash',
    type: 'bash',
    state: {
      status: 'error',
      input: { command: 'npx expo run:ios' },
      output:
        "› Building iOS app...\n› Resolving project...\n› Compiling TypeScript...\n\nTypeScript compilation failed:\n\nsrc/screens/ProfileScreen.tsx:15:7 - error TS2322: Type 'string | string[]' is not assignable to type 'string'.\n  Type 'string[]' is not assignable to type 'string'.\n\n15   const { userId } = useLocalSearchParams<{ userId: string }>()\n         ~~~~~~\n\nsrc/components/ui/ConnectionStatus.tsx:23:5 - error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction<\"connected\" | \"disconnected\" | \"error\">'.\n\n23     setStatus(newStatus)\n       ~~~~~~~~~",
      error:
        'Build failed due to TypeScript errors. Please fix the type issues and try again.',
      metadata: { duration: '4.3s' },
    },
  },

  // 9. RUNNING STATE EXAMPLE - Expo prebuild process
  {
    id: 'tool-9',
    tool: 'bash',
    type: 'bash',
    state: {
      status: 'running',
      input: { command: 'npx expo prebuild --clean' },
      output:
        '› Cleaning native directories...\n› Removed ios directory\n› Removed android directory\n\n› Installing CocoaPods...\n› Running pod install in ios directory...\n\n[1/4] 🔍  Resolving packages...\n[2/4] 🚚  Fetching packages...\n[3/4] 🔗  Linking dependencies...\n[4/4] 🔨  Building fresh packages...\n\n› Generating native code...\n› Configuring iOS project...\n› Configuring Android project...\n\nProgress: 67% (Configuring Gradle wrapper...)',
      metadata: { duration: '12.8s' },
    },
  },
]

// ===== REALISTIC CONVERSATION EXAMPLES =====
export const sampleMessages: Message[] = [
  // === CONVERSATION 1: Mobile App Development Session ===
  {
    id: 'msg-1',
    sessionId: 'session-1',
    role: 'user',
    content:
      "Hey! I'm working on this React Native app with Expo Router and having some issues. Can you help me debug a profile screen?",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-2',
    sessionId: 'session-1',
    role: 'assistant',
    content:
      "I'd be happy to help debug your profile screen! Let me take a look at your current implementation first.",
    timestamp: new Date(Date.now() - 1740000), // 29 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content:
          "I'd be happy to help debug your profile screen! Let me take a look at your current implementation first.",
      },
      {
        type: 'tool_execution',
        content: 'Reading profile screen...',
        toolName: 'read',
        toolResult: {
          input: sampleToolParts[0].state.input,
          output: sampleToolParts[0].state.output,
          error: sampleToolParts[0].state.error,
        },
      },
      {
        type: 'text',
        content:
          "I can see you're using Expo Router with Tamagui. The code looks good overall, but I notice you might want to add some error handling. Let me also check if your connection service is set up properly:",
      },
      {
        type: 'tool_execution',
        content: 'Searching for connection code...',
        toolName: 'grep',
        toolResult: {
          input: sampleToolParts[6].state.input,
          output: sampleToolParts[6].state.output,
          error: sampleToolParts[6].state.error,
        },
      },
    ],
  },
  {
    id: 'msg-3',
    sessionId: 'session-1',
    role: 'user',
    content:
      "Nice! The connection setup looks good. I'm actually trying to improve the app layout and add proper navigation. Can you help me fix the _layout.tsx file?",
    timestamp: new Date(Date.now() - 1680000), // 28 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-4',
    sessionId: 'session-1',
    role: 'assistant',
    content:
      'Absolutely! Let me update your app layout to include proper Tamagui providers and navigation structure.',
    timestamp: new Date(Date.now() - 1620000), // 27 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content:
          'Absolutely! Let me update your app layout to include proper Tamagui providers and navigation structure.',
      },
      {
        type: 'tool_execution',
        content: 'Updating app layout...',
        toolName: 'edit',
        toolResult: {
          input: sampleToolParts[2].state.input,
          output: sampleToolParts[2].state.output,
          error: sampleToolParts[2].state.error,
        },
      },
      {
        type: 'text',
        content:
          'Great! Now let me create a proper OpenCode client service for your WebSocket connections:',
      },
      {
        type: 'tool_execution',
        content: 'Creating OpenCode service...',
        toolName: 'write',
        toolResult: {
          input: sampleToolParts[3].state.input,
          output: sampleToolParts[3].state.output,
          error: sampleToolParts[3].state.error,
        },
      },
    ],
  },

  // === CONVERSATION 2: Development and Testing ===
  {
    id: 'msg-5',
    sessionId: 'session-1',
    role: 'user',
    content:
      'Perfect! Now let me start the dev server to test these changes. Can you run the Expo dev server for me?',
    timestamp: new Date(Date.now() - 1560000), // 26 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-6',
    sessionId: 'session-1',
    role: 'assistant',
    content: 'Sure! Let me start the Expo development server for you.',
    timestamp: new Date(Date.now() - 1500000), // 25 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content: 'Sure! Let me start the Expo development server for you.',
      },
      {
        type: 'tool_execution',
        content: 'Starting Expo dev server...',
        toolName: 'bash',
        toolResult: {
          input: sampleToolParts[1].state.input,
          output: sampleToolParts[1].state.output,
          error: sampleToolParts[1].state.error,
        },
      },
      {
        type: 'text',
        content:
          "Great! Your dev server is running. You can scan the QR code with Expo Go or press 'i' for iOS simulator. The Metro bundler is ready and your app should be accessible.",
      },
    ],
  },

  // === CONVERSATION 3: Research and Documentation ===
  {
    id: 'msg-7',
    sessionId: 'session-1',
    role: 'user',
    content:
      "Awesome! I'm still learning Expo Router. Can you fetch the latest documentation to make sure I'm using it correctly?",
    timestamp: new Date(Date.now() - 1440000), // 24 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-8',
    sessionId: 'session-1',
    role: 'assistant',
    content:
      'Good idea! Let me fetch the latest Expo Router documentation for you.',
    timestamp: new Date(Date.now() - 1380000), // 23 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content:
          'Good idea! Let me fetch the latest Expo Router documentation for you.',
      },
      {
        type: 'tool_execution',
        content: 'Fetching Expo Router docs...',
        toolName: 'webfetch',
        toolResult: {
          input: sampleToolParts[4].state.input,
          output: sampleToolParts[4].state.output,
          error: sampleToolParts[4].state.error,
        },
      },
      {
        type: 'text',
        content:
          'Perfect! Based on the documentation, your file-based routing structure looks correct. The `_layout.tsx` file we just updated follows the recommended patterns for Expo Router with proper Stack navigation setup.',
      },
    ],
  },

  // === CONVERSATION 4: Build Issues ===
  {
    id: 'msg-9',
    sessionId: 'session-1',
    role: 'user',
    content:
      'Thanks! Now I want to test this on iOS. Can you try building the iOS app?',
    timestamp: new Date(Date.now() - 1320000), // 22 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-10',
    sessionId: 'session-1',
    role: 'assistant',
    content: 'Sure! Let me try building the iOS app for you.',
    timestamp: new Date(Date.now() - 1260000), // 21 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content: 'Sure! Let me try building the iOS app for you.',
      },
      {
        type: 'tool_execution',
        content: 'Building iOS app...',
        toolName: 'bash',
        toolResult: {
          input: sampleToolParts[7].state.input,
          output: sampleToolParts[7].state.output,
          error: sampleToolParts[7].state.error,
        },
      },
      {
        type: 'text',
        content:
          'I see there are some TypeScript errors that need to be fixed before the build can succeed. The main issues are with type definitions in the ProfileScreen and ConnectionStatus components. Would you like me to help fix these type errors?',
      },
    ],
  },

  // === CONVERSATION 5: Current Activity ===
  {
    id: 'msg-11',
    sessionId: 'session-1',
    role: 'user',
    content:
      'Yes please! But first, I think I need to clean and rebuild the native code. Can you run expo prebuild?',
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-12',
    sessionId: 'session-1',
    role: 'assistant',
    content:
      'Good thinking! Let me run expo prebuild with the clean flag to regenerate the native directories.',
    timestamp: new Date(Date.now() - 540000), // 9 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content:
          'Good thinking! Let me run expo prebuild with the clean flag to regenerate the native directories.',
      },
      {
        type: 'tool_execution',
        content: 'Running expo prebuild...',
        toolName: 'bash',
        toolResult: {
          input: sampleToolParts[8].state.input,
          output: sampleToolParts[8].state.output,
          error: sampleToolParts[8].state.error,
        },
      },
      {
        type: 'text',
        content:
          "The prebuild process is running and cleaning up the native directories. This will regenerate the iOS and Android projects with the latest configuration. It's currently at 67% - configuring the Gradle wrapper for Android.",
      },
    ],
  },

  // === CONVERSATION 6: Todo Management ===
  {
    id: 'msg-13',
    sessionId: 'session-1',
    role: 'user',
    content:
      "Great! While that's running, I want to organize my development tasks. Can you help me create a todo list for the remaining work?",
    timestamp: new Date(Date.now() - 480000), // 8 minutes ago
    status: 'sent',
  },
  {
    id: 'msg-14',
    sessionId: 'session-1',
    role: 'assistant',
    content:
      'Absolutely! Let me create a comprehensive todo list to help you track your development progress.',
    timestamp: new Date(Date.now() - 420000), // 7 minutes ago
    status: 'sent',
    parts: [
      {
        type: 'text',
        content:
          'Absolutely! Let me create a comprehensive todo list to help you track your development progress.',
      },
      {
        type: 'tool_execution',
        content: 'Creating todo list...',
        toolName: 'todowrite',
        toolResult: {
          input: sampleToolParts[5].state.input,
          output: sampleToolParts[5].state.output,
          error: sampleToolParts[5].state.error,
        },
      },
      {
        type: 'text',
        content:
          "Perfect! I've created a todo list with 4 key tasks for your React Native app development. You have 1 completed task (authentication), 1 in progress (user profile), and 2 pending high-priority items. This should help you stay organized as you continue building your app.",
      },
    ],
  },
]
