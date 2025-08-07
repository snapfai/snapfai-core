'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import ConnectWalletPrompt from './ConnectWalletPrompt'
import { useEffect, useState } from 'react'
import useAuthStatus from '@/hooks/useAuthStatus'

export default function HomeClientWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isConnected, isConnecting } = useAuthStatus()
  const [showPrompt, setShowPrompt] = useState(false)
  const [redirectPath, setRedirectPath] = useState('/snap')
  
  // Check if we need to show the wallet prompt or redirect
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const redirected = searchParams.get('redirected')
    const path = searchParams.get('path')
    
    console.log('🏠 HomeClientWrapper - URL params:', { redirected, path, isAuthenticated, isConnecting })
    
    if (path) {
      setRedirectPath(path)
    }
    
    if (redirected === 'true') {
      if (isAuthenticated) {
        // If the user is authenticated and we have redirected=true, send them to their destination
        const targetPath = path || redirectPath || '/snap'
        console.log('✅ Authenticated, redirecting to:', targetPath)
        router.push(targetPath)
      } else if (!isConnecting) {
        // Only show prompt if not currently connecting
        console.log('❌ Not authenticated, showing connect prompt')
        setShowPrompt(true)
      }
    }
  }, [searchParams, isAuthenticated, isConnected, router, isConnecting, redirectPath])

  if (showPrompt) {
    return (
      <div className="container py-20">
        <ConnectWalletPrompt />
      </div>
    )
  }

  return <>{children}</>
} 