'use client'

import { wagmiAdapter, projectId, networks } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider, type Config } from 'wagmi'
import { mainnet, polygon } from '@reown/appkit/networks'
import { arbitrumOneChain, baseChain, optimismChain, avalancheChain, bscChain } from '@/config/custom-networks'
import { siweConfig } from '@/lib/siwe-config'
import React, { type ReactNode } from 'react'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create the modal
const modal = createAppKit({
  // Updated to use only wagmiAdapter since we removed Solana and Bitcoin
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrumOneChain, baseChain, optimismChain, avalancheChain, bscChain, polygon], // Explicitly list all networks
  defaultNetwork: mainnet, // Use mainnet as default
  metadata: {
    name: 'SnapFAI',
    description: 'Smart DeFi Trading Assistant',
    url: 'https://snapfai.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  },
  // Disable features that might interfere with direct wallet interactions
  features: {
    analytics: true, // Optional
    email: false, // Disable email login
    socials: [], // Disable social logins
    emailShowWallets: false, // Don't show wallets in email flow
    // Disable AppKit's built-in swaps and onramp to avoid conflicts
    swaps: false, // Disable to prevent conflicts with our custom swap logic
    onramp: false, // Disable to avoid confusion with DeFi protocols
    // History disabled to avoid conflicts
    history: false,
  },
  // Optional: Add terms & privacy policy
  termsConditionsUrl: 'https://snapfai.com/terms',
  privacyPolicyUrl: 'https://snapfai.com/privacy',
  
  // Enable SIWE for proper connect and sign flow - chain agnostic
  siweConfig: siweConfig,
})

// Add SIWE event debugging
if (typeof window !== 'undefined') {
  // Listen for AppKit events to debug SIWE behavior
  modal.subscribeEvents((event) => {
    console.log('🎯 AppKit Event:', event)
    
    // Check for specific event properties that might indicate SIWE or network changes
    if (event.data?.event === 'CONNECT_SUCCESS') {
      console.log('🔗 AppKit: Wallet connected')
    } else if (event.data?.event === 'DISCONNECT_SUCCESS') {
      console.log('👋 AppKit: Wallet disconnected')
    } else if (event.data?.event === 'SWITCH_NETWORK') {
      console.log('🌐 AppKit: Network switch detected')
    }
  })
}

export function ContextProvider({ children, cookies }: { children: ReactNode, cookies?: string }) {
  // Add error handling for wallet connections
  const [connectionError, setConnectionError] = React.useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Handle connection errors
  React.useEffect(() => {
    if (connectionError && !isRetrying) {
      console.error('WalletConnect connection error:', connectionError);
      
      // Clear any stored connection data that might be causing issues
      if (typeof window !== 'undefined') {
        // Clear WalletConnect related items from localStorage
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('walletconnect') || 
          key.includes('wagmi') || 
          key.includes('appkit') ||
          key.includes('wc@')
        );
        
        console.log('Clearing problematic localStorage items:', keysToRemove);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Set retry flag to prevent multiple retries
        setIsRetrying(true);
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, [connectionError, isRetrying]);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 