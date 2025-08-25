import React, { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { useSelector } from '@legendapp/state/react'
import { LoadingScreen } from '../src/components/ui/LoadingScreen'
import { APP_CONFIG } from '../src/config/constants'
import { store$ } from '../src/store'

export default function Index() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const serverUrl = useSelector(store$.connection.serverUrl)

  useEffect(() => {
    // Add a small delay to ensure navigation is ready
    const timer = setTimeout(() => {
      if (isNavigating) return // Prevent multiple navigations

      setIsNavigating(true)

      // Check if user has a server URL configured
      if (serverUrl) {
        // Navigate to sessions if already configured
        router.replace('/sessions')
      } else {
        // Navigate to connection screen for first-time setup
        router.replace('/connection')
      }
    }, 100) // Small delay to ensure navigation is mounted

    return () => clearTimeout(timer)
  }, [router, isNavigating, serverUrl])

  return <LoadingScreen message={`Initializing ${APP_CONFIG.name}...`} />
}
