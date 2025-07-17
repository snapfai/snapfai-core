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
    
    if (path) {
      setRedirectPath(path)
    }
    
    if (redirected === 'true') {
      if (isAuthenticated) {
        // If the user is authenticated and we have redirected=true, send them to their destination
        router.push(path || '/snap')
      } else if (!isConnecting) {
        // Only show prompt if not currently connecting
        setShowPrompt(true)
      }
    }
  }, [searchParams, isAuthenticated, isConnected, router, isConnecting])

  if (showPrompt) {
    return (
      <div className="container py-20">
        <ConnectWalletPrompt 
          message="You need to connect your wallet and sign a message to access the requested feature." 
          redirectPath={redirectPath}
        />
      </div>
    )
  }

  return <>{children}</>
} 