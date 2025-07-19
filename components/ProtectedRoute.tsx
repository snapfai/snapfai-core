'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStatus from '@/hooks/useAuthStatus'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isConnected, isConnecting } = useAuthStatus()
  const [isInitialized, setIsInitialized] = useState(false)
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  console.log('🛡️ ProtectedRoute state:', {
    isAuthenticated,
    isConnected,
    isConnecting,
    isInitialized,
    redirectAttempted
  })

  // Initialize after a brief delay to let auth status settle
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Handle redirection for unauthenticated users
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !redirectAttempted && !isConnecting) {
      console.log('❌ Not authenticated, redirecting to connect page...')
      setRedirectAttempted(true)
      
      // Add a query param to prevent redirect loops
      const currentPath = window.location.pathname
      router.push(`/?redirected=true&path=${encodeURIComponent(currentPath)}`)
    }
  }, [isInitialized, isAuthenticated, redirectAttempted, isConnecting, router])

  // Reset redirect flag if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && redirectAttempted) {
      console.log('✅ User authenticated, resetting redirect flag')
      setRedirectAttempted(false)
    }
  }, [isAuthenticated, redirectAttempted])

  // Show loading while initializing or connecting
  if (!isInitialized || isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isConnecting ? 'Connecting wallet...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Show loading if redirect was attempted but we're still here
  if (redirectAttempted && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show the protected content
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Default loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
      </div>
    </div>
  )
} 