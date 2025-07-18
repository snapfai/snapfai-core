import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, bitcoin } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { avalancheChain, arbitrumOneChain, baseChain, optimismChain, sepoliaChain } from './custom-networks'
import { solanaMainnet } from './solana-networks'

// Get projectId from environment variable
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Use a fallback project ID to prevent connection issues
// This is a temporary solution - you should set up your own project ID in .env
const safeProjectId = projectId || '2a0157d0f9537e2a921453f3d3cb5f73'

// Include custom networks along with standard ones
export const networks = [
  // EVM networks
  mainnet, 
  polygon, 
  avalancheChain, 
  arbitrumOneChain,
  baseChain,
  optimismChain,
  sepoliaChain,
  // Solana mainnet only
  solanaMainnet, 
  // Bitcoin network
  bitcoin
]

// Custom RPC URLs for improved performance
const customRpcUrls = {
  'eip155:1': [{ url: 'https://ethereum.publicnode.com' }],
  'eip155:137': [{ url: 'https://polygon-rpc.com' }],
  'eip155:43114': [{ url: 'https://api.avax.network/ext/bc/C/rpc' }],
  'eip155:42161': [{ url: 'https://arb1.arbitrum.io/rpc' }],
  'eip155:8453': [{ url: 'https://mainnet.base.org' }],
  'eip155:10': [{ url: 'https://mainnet.optimism.io' }],
  'eip155:11155111': [{ url: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' }],
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': [{ url: 'https://api.mainnet-beta.solana.com' }]
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

// Set up the Solana Adapter
export const solanaAdapter = new SolanaAdapter()

// Set up the Bitcoin Adapter with projectId
export const bitcoinAdapter = new BitcoinAdapter({
  projectId: safeProjectId
})

export const config = wagmiAdapter.wagmiConfig 