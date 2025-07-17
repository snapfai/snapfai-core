'use client'

import { useEffect, useState } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, KeyRound, LogIn, LogOut } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function SiweDemo() {
  const { isConnected, address } = useAppKitAccount()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [sessionAddress, setSessionAddress] = useState<string | null>(null)
  
  // Mock SIWE sign-in process
  const handleSignIn = async () => {
    if (!isConnected || !address) return
    
    setIsSigningIn(true)
    
    try {
      // In a real app, this would trigger the SIWE flow automatically
      // through the AppKit configuration.
      // For this demo, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setIsSignedIn(true)
      setSessionAddress(address)
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setIsSigningIn(false)
    }
  }
  
  // Mock sign-out process
  const handleSignOut = async () => {
    // In a real app, this would trigger the SIWE signOut method
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsSignedIn(false)
    setSessionAddress(null)
  }
  
  // Reset signed-in state if wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setIsSignedIn(false)
      setSessionAddress(null)
    }
  }, [isConnected])
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Sign In With Ethereum (SIWE)
        </CardTitle>
        <CardDescription>
          Authenticate using your Ethereum wallet signature
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Alert>
            <AlertTitle>Connect your wallet first</AlertTitle>
            <AlertDescription>
              You need to connect your wallet before you can sign in with Ethereum.
            </AlertDescription>
          </Alert>
        ) : isSignedIn ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">Authenticated</Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Authenticated Address</h3>
              <p className="font-mono text-xs">{sessionAddress}</p>
            </div>
            
            <Alert>
              <AlertTitle>SIWE Authentication Active</AlertTitle>
              <AlertDescription>
                You are now authenticated using Sign In With Ethereum. Your signature proves ownership of your address.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              Sign In With Ethereum (SIWE) allows you to authenticate by signing a message with your wallet,
              proving ownership of your address without sharing your private key.
            </p>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Not Authenticated</Badge>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Connected Address</h3>
              <p className="font-mono text-xs">{address}</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isConnected && (
          isSignedIn ? (
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Button 
              onClick={handleSignIn} 
              disabled={isSigningIn}
              className="flex items-center gap-2"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In With Ethereum
                </>
              )}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
} 