'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Declare the custom elements for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'appkit-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        balance?: 'show' | 'hide';
        size?: 'md' | 'sm';
        label?: string;
        loadingLabel?: string;
        namespace?: 'eip155' | 'solana' | 'bip122';
      }, HTMLElement>;
      'appkit-account-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        balance?: 'show' | 'hide';
      }, HTMLElement>;
      'appkit-connect-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        size?: 'md' | 'sm';
        label?: string;
        loadingLabel?: string;
      }, HTMLElement>;
      'appkit-network-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
      }, HTMLElement>;
      'appkit-wallet-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        wallet: string;
      }, HTMLElement>;
    }
  }
}

export default function AppKitWebComponents() {
  // Dynamically load the wallet button package
  useEffect(() => {
    const loadWalletButton = async () => {
      try {
        await import('@reown/appkit-wallet-button/react')
      } catch (error) {
        console.error('Failed to load wallet button package:', error)
      }
    }
    
    loadWalletButton()
  }, [])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Web Components</CardTitle>
        <CardDescription>
          Pre-built web components for easy integration with AppKit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buttons" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="direct">Direct Connect</TabsTrigger>
            <TabsTrigger value="custom">Custom Usage</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buttons" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Standard Button</h3>
                <div className="h-12">
                  <appkit-button></appkit-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">With Balance</h3>
                <div className="h-12">
                  <appkit-button balance="show"></appkit-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Small Size</h3>
                <div className="h-12">
                  <appkit-button size="sm"></appkit-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Custom Label</h3>
                <div className="h-12">
                  <appkit-button label="Connect with AppKit" loadingLabel="Connecting..."></appkit-button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Account Button</h3>
                <div className="h-12">
                  <appkit-account-button></appkit-account-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Network Button</h3>
                <div className="h-12">
                  <appkit-network-button></appkit-network-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Connect Button</h3>
                <div className="h-12">
                  <appkit-connect-button></appkit-connect-button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="direct" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">MetaMask</h3>
                <appkit-wallet-button wallet="metamask"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Coinbase</h3>
                <appkit-wallet-button wallet="coinbase"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Google</h3>
                <appkit-wallet-button wallet="google"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Github</h3>
                <appkit-wallet-button wallet="github"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">WalletConnect</h3>
                <appkit-wallet-button wallet="walletConnect"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Trust</h3>
                <appkit-wallet-button wallet="trust"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Rainbow</h3>
                <appkit-wallet-button wallet="rainbow"></appkit-wallet-button>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-medium mb-2">Phantom</h3>
                <appkit-wallet-button wallet="phantom"></appkit-wallet-button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">EVM Only Button</h3>
                <div className="h-12">
                  <appkit-button namespace="eip155"></appkit-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Solana Only Button</h3>
                <div className="h-12">
                  <appkit-button namespace="solana"></appkit-button>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium">Bitcoin Only Button</h3>
                <div className="h-12">
                  <appkit-button namespace="bip122"></appkit-button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 