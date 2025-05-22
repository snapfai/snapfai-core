import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, polygon, bitcoin } from '@reown/appkit/networks'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { avalancheChain, arbitrumNovaChain } from './custom-networks'
import { solanaMainnet } from './solana-networks'

// Get projectId from https://cloud.reown.com
export const projectId = "process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"

// Ensure projectId is defined for type safety
const safeProjectId = projectId || 'missing-project-id'

// Include custom networks along with standard ones
export const networks = [
  // EVM networks
  mainnet, 
  polygon, 
  avalancheChain, 
  arbitrumNovaChain,
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
  'eip155:42170': [{ url: 'https://nova.arbitrum.io/rpc' }],
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