export interface ChainConfig {
  id: number;
  name: string;
  symbol: string;
  aliases: string[];
  isTestnet?: boolean;
  rpcUrls?: string[];
  blockExplorer?: string;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    aliases: ['eth', 'mainnet', 'ethereum mainnet'],
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorer: 'https://etherscan.io'
  },
  sepolia: {
    id: 11155111,
    name: 'Sepolia',
    symbol: 'ETH',
    aliases: ['sepolia testnet', 'eth testnet', 'ethereum testnet'],
    isTestnet: true,
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  arbitrum: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    aliases: ['arb', 'arbitrum one', 'arbitrum mainnet'],
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorer: 'https://arbiscan.io'
  },
  base: {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    aliases: ['base mainnet', 'coinbase base'],
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorer: 'https://basescan.org'
  },
  optimism: {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    aliases: ['op', 'optimism mainnet', 'optimistic ethereum'],
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorer: 'https://optimistic.etherscan.io'
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    symbol: 'POL',
    aliases: ['matic', 'poly', 'polygon mainnet'],
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorer: 'https://polygonscan.com'
  },
  avalanche: {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    aliases: ['avax', 'avalanche c-chain', 'avalanche mainnet'],
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorer: 'https://snowtrace.io'
  }
};

/**
 * Get the native token symbol for a chain ID
 */
export function getNativeTokenSymbol(chainId: number): string {
  const chainConfig = Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId);
  return chainConfig?.symbol || 'ETH'; // Default to ETH if chain not found
}

/**
 * Extract chain ID from CAIP network ID format
 * Handles formats like:
 * - "eip155:42161" -> 42161
 * - "0xa4b1" -> 42161
 * - "42161" -> 42161
 * - 42161 -> 42161
 */
export function extractChainIdFromCAIP(caipNetworkId: string | number): number | null {
  if (typeof caipNetworkId === 'number') {
    return caipNetworkId;
  }
  
  const caipString = caipNetworkId.toString();
  
  // Handle CAIP format like "eip155:42161"
  if (caipString.includes(':')) {
    const parts = caipString.split(':');
    if (parts.length >= 2) {
      const chainId = parseInt(parts[1]);
      return isNaN(chainId) ? null : chainId;
    }
  }
  
  // Handle hex format like "0xa4b1" (Arbitrum)
  if (caipString.startsWith('0x')) {
    const chainId = parseInt(caipString, 16);
    return isNaN(chainId) ? null : chainId;
  }
  
  // Fallback: try to parse as number
  const parsed = parseInt(caipString);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Get chain configuration by name or alias
 */
export function getChainByName(chainName: string): ChainConfig | null {
  const normalizedName = chainName.toLowerCase().trim();
  
  // First try exact match
  if (SUPPORTED_CHAINS[normalizedName]) {
    return SUPPORTED_CHAINS[normalizedName];
  }
  
  // Then try aliases
  for (const [key, config] of Object.entries(SUPPORTED_CHAINS)) {
    if (config.aliases.some(alias => alias.toLowerCase() === normalizedName)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): ChainConfig | null {
  for (const config of Object.values(SUPPORTED_CHAINS)) {
    if (config.id === chainId) {
      return config;
    }
  }
  return null;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(SUPPORTED_CHAINS).map(chain => chain.id);
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainName: string): boolean {
  return getChainByName(chainName) !== null;
}

/**
 * Get chain ID from chain name
 */
export function getChainId(chainName: string): number | null {
  const chain = getChainByName(chainName);
  return chain ? chain.id : null;
}

/**
 * Convert legacy chain name to standardized format
 */
export function normalizeChainName(chainName: string): string {
  const chain = getChainByName(chainName);
  return chain ? Object.keys(SUPPORTED_CHAINS).find(key => SUPPORTED_CHAINS[key] === chain) || chainName : chainName;
} 