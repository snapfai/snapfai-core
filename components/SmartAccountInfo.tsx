'use client'

import { useAppKitAccount, useWalletInfo } from '@reown/appkit/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { InfoIcon } from 'lucide-react'

export default function SmartAccountInfo() {
  const { isConnected, embeddedWalletInfo } = useAppKitAccount()
  const { walletInfo } = useWalletInfo()

  // Only show for connected wallets
  if (!isConnected) {
    return null
  }

  // Determine if this is a smart account
  const isSmartAccount = embeddedWalletInfo?.accountType === 'smartAccount'
  const authProvider = embeddedWalletInfo?.authProvider
  const isDeployed = embeddedWalletInfo?.isSmartAccountDeployed

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Account Information</span>
          {isSmartAccount && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              Smart Account
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSmartAccount ? (
          <>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">Account Type</span>
              <span className="flex items-center">
                Smart Account (ERC-4337)
              </span>
            </div>

            {authProvider && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Authentication Method</span>
                <span className="capitalize">{authProvider}</span>
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">Deployment Status</span>
              {isDeployed ? (
                <Badge className="w-fit bg-green-500">Deployed</Badge>
              ) : (
                <Badge className="w-fit bg-amber-500">Counterfactual (Not Deployed)</Badge>
              )}
            </div>

            {!isDeployed && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>Counterfactual Address</AlertTitle>
                <AlertDescription>
                  This Smart Account will be deployed automatically when you make your first transaction.
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-2">Smart Account Benefits</h3>
              <ul className="space-y-1 text-sm">
                <li>• No seed phrases to remember</li>
                <li>• Batch multiple transactions</li>
                <li>• Enhanced security features</li>
                <li>• Same address across supported networks</li>
                <li>• Signature verification with ERC-1271</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">Account Type</span>
              <span>EOA (Externally Owned Account)</span>
            </div>

            {walletInfo?.name && (
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Wallet</span>
                <span className="flex items-center gap-2">
                  {walletInfo.icon && (
                    <img src={walletInfo.icon} alt={walletInfo.name} className="h-4 w-4" />
                  )}
                  {walletInfo.name}
                </span>
              </div>
            )}

            <Alert className="mt-2">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Standard Account</AlertTitle>
              <AlertDescription>
                This is a standard EOA wallet. Consider using a Smart Account for enhanced features.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  )
} 