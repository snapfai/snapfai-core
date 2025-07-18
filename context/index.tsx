'use client'

import { wagmiAdapter, projectId, networks, solanaAdapter, bitcoinAdapter } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, polygon } from '@reown/appkit/networks'
import { WagmiProvider, type Config } from 'wagmi'
import { arbitrumOneChain, baseChain, optimismChain, avalancheChain, sepoliaChain } from '@/config/custom-networks'
import React, { type ReactNode } from 'react'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Create the modal
const modal = createAppKit({
  // Updated to use multi-adapter approach
  adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
  projectId,
  networks: [mainnet, polygon, arbitrumOneChain, baseChain, optimismChain, avalancheChain, sepoliaChain],
  defaultNetwork: mainnet,
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
  
  // Disable SIWE to avoid signature requirements during connection
  // siweConfig: siweConfig,
})

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