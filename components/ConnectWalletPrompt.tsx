'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppKit } from '@reown/appkit/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, CheckCircle, Clock, Loader2, Shield, AlertCircle } from 'lucide-react'
import useAuthStatus from '@/hooks/useAuthStatus'

export default function ConnectWalletPrompt() {
  const { open } = useAppKit()
  const router = useRouter()
  const { isAuthenticated, isConnected, address } = useAuthStatus()
  const [hasTriedConnect, setHasTriedConnect] = useState(false)
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false)
  const [redirectAttempted, setRedirectAttempted] = useState(false)
  const [showSignPrompt, setShowSignPrompt] = useState(false)
  const [signAttempts, setSignAttempts] = useState(0)
  const [lastSignAttempt, setLastSignAttempt] = useState(0)

  console.log('🔍 ConnectWalletPrompt state:', {
    isAuthenticated,
    isConnected,
    hasTriedConnect,
    isWaitingForAuth,
    redirectAttempted,
    showSignPrompt,
    signAttempts,
    address
  })

  // Handle authentication success - only redirect once
  useEffect(() => {
    if (isAuthenticated && !redirectAttempted) {
      console.log('✅ Authentication detected, preparing redirect...')
      setRedirectAttempted(true)
      
      // Small delay to ensure state is stable
      setTimeout(() => {
        console.log('🚀 Redirecting to snap page...')
        router.push('/snap')
      }, 500)
    }
  }, [isAuthenticated, redirectAttempted, router])

  // Handle when wallet is already connected but not authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated && !hasTriedConnect) {
      console.log('🔗 Wallet already connected, showing sign prompt...')
      setShowSignPrompt(true)
      setHasTriedConnect(true)
      
      // Auto-trigger SIWE sign after a brief delay
      const autoSignTimer = setTimeout(() => {
        if (!isAuthenticated) {
          console.log('🖊️ Auto-triggering SIWE sign...')
          handleSign()
        }
      }, 1000)
      
      return () => clearTimeout(autoSignTimer)
    }
  }, [isConnected, isAuthenticated, hasTriedConnect])

  // Handle connection state changes
  useEffect(() => {
    if (isConnected && hasTriedConnect && !isAuthenticated && !showSignPrompt) {
      console.log('🔗 Connected but not authenticated, starting wait period...')
      setIsWaitingForAuth(true)
      setShowSignPrompt(true)
      
      // Wait for SIWE authentication to complete
      const authTimeout = setTimeout(() => {
        console.log('⏰ Auth timeout reached, checking status...')
        setIsWaitingForAuth(false)
        
        // If still not authenticated after timeout, show manual sign option
        if (!isAuthenticated) {
          console.log('🔄 Still not authenticated after connection')
        }
      }, 8000) // Increased to 8 seconds for better UX
      
      return () => clearTimeout(authTimeout)
    }
  }, [isConnected, hasTriedConnect, isAuthenticated, showSignPrompt])

  const handleConnect = async () => {
    console.log('🔗 Connect button clicked')
    setHasTriedConnect(true)
    setIsWaitingForAuth(false)
    setRedirectAttempted(false) // Reset redirect flag
    setShowSignPrompt(false)
    
    try {
      await open()
    } catch (error) {
      console.error('❌ Error opening wallet:', error)
    }
  }

  const handleSign = async () => {
    const now = Date.now()
    
    // Prevent rapid sign attempts
    if (now - lastSignAttempt < 3000) {
      console.log('⏳ Preventing rapid sign attempts')
      return
    }
    
    console.log('🖊️ Manual sign button clicked')
    setLastSignAttempt(now)
    setSignAttempts(prev => prev + 1)
    setIsWaitingForAuth(true)
    
    try {
      // Trigger AppKit modal to show SIWE signing
      await open({ view: 'Account' })
    } catch (error) {
      console.error('❌ Error opening sign modal:', error)
      setIsWaitingForAuth(false)
    }
  }

  const handleRetryConnection = async () => {
    console.log('🔄 Retry connection clicked')
    setHasTriedConnect(false)
    setShowSignPrompt(false)
    setIsWaitingForAuth(false)
    setSignAttempts(0)
    setRedirectAttempted(false)
    
    // Clear any problematic localStorage items
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('walletconnect') || key.includes('wc@')
    )
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    await handleConnect()
  }

  // Don't render anything if we're already authenticated and redirect was attempted
  if (isAuthenticated && redirectAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting to SnapFAI...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  const getStatusInfo = () => {
    if (isAuthenticated) {
      return {
        title: "Authentication Complete",
        description: "Welcome to SnapFAI! Redirecting you now...",
        icon: <CheckCircle className="h-6 w-6 text-green-500" />,
        color: "text-green-600"
      }
    }
    
    if (isWaitingForAuth && isConnected) {
      return {
        title: "Waiting for signature...",
        description: "Please check your wallet and sign the message to verify account ownership.",
        icon: <Clock className="h-6 w-6 text-blue-500 animate-pulse" />,
        color: "text-blue-600"
      }
    }
    
    if (showSignPrompt && isConnected) {
      return {
        title: "Sign to verify your account",
        description: "Your wallet is connected. Now sign a message to prove account ownership and access SnapFAI.",
        icon: <Shield className="h-6 w-6 text-orange-500" />,
        color: "text-orange-600"
      }
    }
    
    if (isConnected && hasTriedConnect) {
      return {
        title: "Almost there!",
        description: "Your wallet is connected. We're setting up your secure session...",
        icon: <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />,
        color: "text-blue-600"
      }
    }
    
    return {
      title: "Connect Your Wallet",
      description: "Connect your wallet and sign a message to access SnapFAI's DeFi features.",
      icon: <Wallet className="h-6 w-6 text-gray-500" />,
      color: "text-gray-600"
    }
  }

  const status = getStatusInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status.icon}
          </div>
          <CardTitle className={`text-xl font-semibold ${status.color}`}>
            {status.title}
          </CardTitle>
          <CardDescription className="text-center">
            {status.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!isAuthenticated && (
            <>
              {/* Security notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Secure Authentication</p>
                    <p>This signature proves wallet ownership without any gas fees or blockchain transactions.</p>
                  </div>
                </div>
              </div>

              {/* Main action button */}
              {!isConnected ? (
                <Button 
                  onClick={handleConnect}
                  className="w-full"
                  size="lg"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              ) : isWaitingForAuth ? (
                <Button 
                  disabled
                  className="w-full"
                  size="lg"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for signature...
                </Button>
              ) : showSignPrompt ? (
                <div className="space-y-3">
                  <Button 
                    onClick={handleSign}
                    className="w-full"
                    size="lg"
                    disabled={isWaitingForAuth}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Sign Message to Continue
                  </Button>
                  
                  {signAttempts > 0 && (
                    <p className="text-xs text-center text-gray-500">
                      If the signing window didn't appear, try clicking the button again.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Setting up connection...</p>
                </div>
              )}

              {/* Troubleshooting */}
              {(signAttempts > 2 || (isConnected && hasTriedConnect && !isWaitingForAuth && !showSignPrompt)) && (
                <div className="border-t pt-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400">Having trouble?</p>
                      <p className="text-gray-600 dark:text-gray-400">Try refreshing your connection.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleRetryConnection}
                    className="w-full"
                    size="sm"
                  >
                    Retry Connection
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 