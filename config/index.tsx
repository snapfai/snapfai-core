import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet } from '@reown/appkit/networks'
import { avalancheChain, arbitrumOneChain, baseChain, optimismChain } from './custom-networks'

// Get projectId from environment variable
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Use a fallback project ID to prevent connection issues
// This is a temporary solution - you should set up your own project ID in .env
const safeProjectId = projectId || '2a0157d0f9537e2a921453f3d3cb5f73'

// Include custom networks along with standard ones
export const networks = [
  // EVM networks - only those supported by both 0x and Rabby
  mainnet, 
  avalancheChain, 
  arbitrumOneChain,
  baseChain,
  optimismChain
  // Removed: polygon (Rabby doesn't support)
  // Removed: sepoliaChain (0x doesn't support)
  // Removed: solanaMainnet (0x doesn't support)
  // Removed: bitcoin (0x doesn't support)
]

// Custom RPC URLs for improved performance
const customRpcUrls = {
  'eip155:1': [{ url: 'https://ethereum.publicnode.com' }],
  'eip155:43114': [{ url: 'https://api.avax.network/ext/bc/C/rpc' }],
  'eip155:42161': [{ url: 'https://arb1.arbitrum.io/rpc' }],
  'eip155:8453': [{ url: 'https://mainnet.base.org' }],
  'eip155:10': [{ url: 'https://mainnet.optimism.io' }]
}

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId: safeProjectId,
  networks,
  customRpcUrls
})

export const config = wagmiAdapter.wagmiConfig 