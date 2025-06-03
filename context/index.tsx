'use client'

import { wagmiAdapter, projectId, solanaAdapter, bitcoinAdapter } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, polygon, bitcoin } from '@reown/appkit/networks'
import React, { type ReactNode, useEffect, useState } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { siweConfig } from '@/lib/siwe-config'
import { avalancheChain, arbitrumNovaChain } from '@/config/custom-networks'
import { solanaMainnet } from '@/config/solana-networks'
import { useTheme } from 'next-themes'

// Set up queryClient
const queryClient = new QueryClient()

// Ensure projectId is defined for type safety
const safeProjectId = projectId || 'missing-project-id'

// Set up metadata
const metadata = {
  name: 'SnapFAI',
  description: 'AI-Powered DeFi Snap App',
  url: 'https://snapfai.com', // Update with your actual domain
  icons: ['https://snapfai.com/icon.png'] // Update with your actual icon
}

// Define minimal theme variables - just keeping the border radius and font
type ThemeVariables = {
  [key: string]: string | number;
}

// Minimal theme variables - just border radius and font
const themeVariables: ThemeVariables = {
  '--w3m-border-radius-master': '12px',
  '--w3m-font-family': 'Inter, sans-serif'
}

// Create AppKit with theme sync
function createAppKitWithThemeSync() {
  // Theme is synchronized with site's theme
  return createAppKit({
    adapters: [wagmiAdapter, solanaAdapter, bitcoinAdapter],
    projectId: safeProjectId,
    networks: [
      // EVM networks
      mainnet, 
      polygon, 
      avalancheChain, 
      arbitrumNovaChain,
      // Solana mainnet only
      solanaMainnet,
      // Bitcoin network
      bitcoin
    ],
    defaultNetwork: mainnet,
    metadata: metadata,
    defaultAccountTypes: { eip155: "smartAccount" },
    featuredWalletIds: [
      "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
      "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0"
    ],
    enableNetworkSwitch: true,
    allWallets: "SHOW",
    features: {
      analytics: true,
      swaps: true,
      onramp: true,
      email: true,
      socials: [
        "google",
        "github",
        "discord"
      ],
      emailShowWallets: true,
      connectMethodsOrder: ["wallet", "email", "social"],
      legalCheckbox: true
    },
    termsConditionsUrl: "https://snapfai.com/terms",
    privacyPolicyUrl: "https://snapfai.com/privacy",
    
    // SIWE Configuration
    siweConfig: siweConfig,
    
    // Custom chain images
    chainImages: {
      43114: '/images/avax-logo.png', // Avalanche
      42170: '/images/arbitrum-nova-logo.png', // Arbitrum Nova
      101: '/images/solana-logo.png', // Solana Mainnet
      0: '/images/bitcoin-logo.png', // Bitcoin
    },
    
    // Theme configuration - Will be set dynamically in the component
    themeMode: undefined, // undefined means it will follow system preference
    themeVariables: themeVariables
  })
}

// Export the initial modal instance
export let modal = createAppKitWithThemeSync()

// Component to sync AppKit theme with the site theme
export function ThemeSyncProvider({ children }: { children: ReactNode }) {
  const { theme, systemTheme } = useTheme()
  const [isClient, setIsClient] = useState(false)

  // Only run on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Update AppKit theme when site theme changes
  useEffect(() => {
    if (!isClient) return

    // Determine current effective theme
    const currentTheme = theme === 'system' ? systemTheme : theme
    const isDarkMode = currentTheme === 'dark'

    // Update AppKit with current theme - just the mode, no custom colors
    modal.setThemeMode(isDarkMode ? 'dark' : 'light')
  }, [theme, systemTheme, isClient])

  return <>{children}</>
}

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ThemeSyncProvider>{children}</ThemeSyncProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider 