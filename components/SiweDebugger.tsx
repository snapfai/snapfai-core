'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function SiweDebugger() {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const [sessionData, setSessionData] = useState<any>(null)
  const [lastCheck, setLastCheck] = useState<string>('')

  const checkSession = async () => {
    try {
      const sessionId = localStorage.getItem('siwe-session-id')
      const siweAddress = localStorage.getItem('siwe-address')
      const siweTimestamp = localStorage.getItem('siwe-timestamp')
      
      let serverSession = null
      if (sessionId) {
        try {
          const response = await fetch(`/api/auth/session?sessionId=${sessionId}`)
          if (response.ok) {
            const data = await response.json()
            serverSession = data.session
          }
        } catch (e) {
          console.log('Server session check failed')
        }
      }
      
      setSessionData({
        localStorage: {
          sessionId,
          siweAddress,
          siweTimestamp,
          age: siweTimestamp ? Math.floor((Date.now() - parseInt(siweTimestamp)) / 1000 / 60) : null
        },
        serverSession,
        wallet: {
          isConnected,
          address,
          chainId: caipNetwork?.id,
          chainName: caipNetwork?.name
        }
      })
      
      setLastCheck(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Debug check failed:', error)
    }
  }

  useEffect(() => {
    checkSession()
  }, [isConnected, address, caipNetwork])

  useEffect(() => {
    // Auto-refresh every 5 seconds
    const interval = setInterval(checkSession, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!isConnected) return null

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">SIWE Debug Info</CardTitle>
          <Button variant="ghost" size="sm" onClick={checkSession}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Last Check:</strong> {lastCheck}
        </div>
        
        <div>
          <strong>Wallet:</strong>
          <div className="ml-2">
            <div>Connected: <Badge variant={isConnected ? "default" : "secondary"}>{isConnected ? 'Yes' : 'No'}</Badge></div>
            <div>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</div>
            <div>Chain: {caipNetwork?.name} ({caipNetwork?.id})</div>
          </div>
        </div>

        <div>
          <strong>localStorage:</strong>
          <div className="ml-2">
            <div>Session ID: {sessionData?.localStorage?.sessionId ? '✅' : '❌'}</div>
            <div>SIWE Address: {sessionData?.localStorage?.siweAddress ? '✅' : '❌'}</div>
            <div>Age: {sessionData?.localStorage?.age ? `${sessionData.localStorage.age}m` : 'N/A'}</div>
          </div>
        </div>

        <div>
          <strong>Server Session:</strong>
          <div className="ml-2">
            <div>Valid: <Badge variant={sessionData?.serverSession ? "default" : "destructive"}>{sessionData?.serverSession ? 'Yes' : 'No'}</Badge></div>
            {sessionData?.serverSession && (
              <div>Address: {sessionData.serverSession.address?.slice(0, 6)}...{sessionData.serverSession.address?.slice(-4)}</div>
            )}
          </div>
        </div>

        <div>
          <strong>Address Match:</strong>
          <Badge variant={sessionData?.localStorage?.siweAddress?.toLowerCase() === address?.toLowerCase() ? "default" : "destructive"}>
            {sessionData?.localStorage?.siweAddress?.toLowerCase() === address?.toLowerCase() ? 'Match' : 'Mismatch'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
} 