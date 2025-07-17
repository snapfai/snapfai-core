'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import WalletInfo from '@/components/WalletInfo'
import SmartAccountInfo from '@/components/SmartAccountInfo'
import { Button } from '@/components/ui/button'
import { useAppKit } from '@reown/appkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

export default function WalletPage() {
  const { isConnected } = useAppKitAccount()
  const { open } = useAppKit()

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Your Wallet</h1>
      </div>

      {isConnected ? (
        <div className="max-w-2xl mx-auto grid gap-8">
          <WalletInfo />
          <SmartAccountInfo />
          
          <div className="flex justify-center mt-4">
            <Link href="/components">
              <Button variant="outline">
                Explore AppKit Components
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your wallet to view your account details, balance, and transaction history.
          </p>
          <div className="flex flex-col gap-4 items-center">
            <Button 
              onClick={() => open({ view: 'Connect' })}
              className="bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
            >
              Connect Wallet
            </Button>
            
            <p className="text-sm text-muted-foreground mt-2">
              Or try our pre-built web components:
            </p>
            
            <Link href="/components">
              <Button variant="outline" size="sm">
                Explore AppKit Components
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 