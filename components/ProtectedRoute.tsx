'use client'

import useAuthStatus from '@/hooks/useAuthStatus'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function ProtectedRoute({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { 
    isConnected, 
    isConnecting, 
    isAuthenticated, 
    authStatus,
    requestSignature 
  } = useAuthStatus()
  
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [needsSignature, setNeedsSignature] = useState(false)

  // Request signature if connected but not authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated && needsSignature) {
      const askForSignature = async () => {
        try {
          console.log('Requesting signature...');
          const success = await requestSignature();
          console.log('Signature request result:', success);
          
          if (success) {
            console.log('Signature successful, now authenticated');
            setNeedsSignature(false);
            setIsLoading(false);
          } else {
            console.log('Signature failed or was rejected');
          }
        } catch (error) {
          console.error('Error requesting signature:', error);
        }
      }
      
      askForSignature();
    }
  }, [isConnected, isAuthenticated, requestSignature, needsSignature]);

  useEffect(() => {
    // Force refresh if we become authenticated
    if (isAuthenticated && isLoading) {
      console.log('Authentication detected, stopping loading state');
      setIsLoading(false);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    // Only check on client-side
    if (typeof window !== 'undefined') {
      const checkAuth = async () => {
        // Wait for wallet connection status to settle
        if (isConnecting) {
          console.log("ProtectedRoute: Wallet is connecting, waiting...")
          return
        }
        
        console.log(`ProtectedRoute: Auth state - Connected: ${isConnected}, Authenticated: ${isAuthenticated}, Status: ${authStatus}`)
        
        if (!isConnected) {
          // Redirect to home if not connected
          console.log(`ProtectedRoute: Not connected, redirecting to home`)
          router.replace(`/?redirected=true&path=${pathname}`)
        } else if (!isAuthenticated) {
          // Connected but not signed - show signature prompt
          console.log(`ProtectedRoute: Connected but not authenticated, requesting signature`)
          setNeedsSignature(true)
          // Keep loading state true to prevent showing content
          setIsLoading(true)
        } else {
          // Connected and signed - allow access
          console.log(`ProtectedRoute: Fully authenticated, showing protected content`)
          setIsLoading(false)
        }
      }
      
      checkAuth()
    }
  }, [isConnected, isAuthenticated, isConnecting, authStatus, router, pathname])

  // Show loading or signature request UI when not fully authenticated
  if (isLoading || isConnecting || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{needsSignature ? 'Waiting for signature...' : 'Verifying wallet connection...'}</p>
          {needsSignature && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Please sign the message in your wallet to verify ownership and access the application.
              <br />
              <span className="font-semibold mt-1 block">This signature doesn't cost any gas fees.</span>
            </p>
          )}
        </div>
      </div>
    )
  }

  // Only show content when fully authenticated (connected AND signed)
  return <>{children}</>
} 