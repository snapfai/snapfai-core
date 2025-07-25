// Special token list for manually curated tokens
// This list contains tokens that need specific handling or are not well-covered by standard APIs
// Updated manually to ensure accuracy of token information

export interface SpecialTokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  description?: string;
  website?: string;
  verified: boolean; // Manual verification flag
  addedDate: string; // When token was added to this list
}

export const SPECIAL_TOKENS: SpecialTokenConfig[] = [
  {
    symbol: 'SYNC',
    name: 'SYNC Network',
    address: '0xa41d2f8Ee4F47D3B860A149765A7dF8c3287b7F0',
    decimals: 18,
    chainId: 1, // Ethereum
    logoURI: 'https://assets.coingecko.com/coins/images/13271/small/sync.png',
    description: 'SYNC Network token for decentralized applications',
    website: 'https://syncnetwork.io',
    verified: true,
    addedDate: '2024-01-01'
  },
  {
    symbol: 'FORCE',
    name: 'ForceDAO',
    address: '0x357D655b7a69634D46BEad5ee13362AD3926Fb1c',
    decimals: 18,
    chainId: 1, // Ethereum
    logoURI: 'https://assets.coingecko.com/coins/images/14443/small/force.png',
    description: 'ForceDAO governance token',
    website: 'https://forcedao.com',
    verified: true,
    addedDate: '2024-01-01'
  },
  {
    symbol: 'KUMA',
    name: 'Kuma Inu',
    address: '0xE90cC7d807712b2b41632f3900c8bd19BdC502b1',
    decimals: 18,
    chainId: 1, // Ethereum
    logoURI: 'https://assets.coingecko.com/coins/images/19423/small/kuma.png',
    description: 'Kuma Inu meme token',
    website: 'https://kumainu.io',
    verified: true,
    addedDate: '2024-01-01'
  },
  {
    symbol: 'CHEW',
    name: 'Chew',
    address: '0x5e2aCeb24041E11E0eddf3a79154C60ab8cfa3e1',
    decimals: 18,
    chainId: 1, // Ethereum
    logoURI: 'https://assets.coingecko.com/coins/images/28357/small/chew.png',
    description: 'Chew token for gaming ecosystem',
    website: 'https://chew.gg',
    verified: true,
    addedDate: '2024-01-01'
  },
  {
    symbol: 'KURO',
    name: 'Kuro Shiba',
    address: '0x8eF777553a697334b93560E0a435023BC128BAff',
    decimals: 9,
    chainId: 1, // Ethereum
    logoURI: 'https://assets.coingecko.com/coins/images/20074/small/kuro.png',
    description: 'Kuro Shiba community token',
    website: 'https://kuroshiba.io',
    verified: true,
    addedDate: '2024-01-01'
  }
];

// Helper functions for working with special tokens

/**
 * Find a special token by address (case-insensitive)
 */
export const findSpecialTokenByAddress = (address: string, chainId?: number): SpecialTokenConfig | null => {
  const normalizedAddress = address.toLowerCase();
  return SPECIAL_TOKENS.find(token => 
    token.address.toLowerCase() === normalizedAddress &&
    (chainId === undefined || token.chainId === chainId)
  ) || null;
};

/**
 * Find a special token by symbol (case-insensitive)
 */
export const findSpecialTokenBySymbol = (symbol: string, chainId?: number): SpecialTokenConfig | null => {
  const normalizedSymbol = symbol.toUpperCase();
  return SPECIAL_TOKENS.find(token => 
    token.symbol.toUpperCase() === normalizedSymbol &&
    (chainId === undefined || token.chainId === chainId)
  ) || null;
};

/**
 * Get all special tokens for a specific chain
 */
export const getSpecialTokensForChain = (chainId: number): SpecialTokenConfig[] => {
  return SPECIAL_TOKENS.filter(token => token.chainId === chainId);
};

/**
 * Check if an address is a special token
 */
export const isSpecialToken = (address: string, chainId?: number): boolean => {
  return findSpecialTokenByAddress(address, chainId) !== null;
};

/**
 * Convert special token to standard TokenConfig format
 */
export const specialTokenToTokenConfig = (specialToken: SpecialTokenConfig) => {
  return {
    symbol: specialToken.symbol,
    name: specialToken.name,
    address: specialToken.address,
    decimals: specialToken.decimals,
    logoURI: specialToken.logoURI
  };
};

/**
 * Get fallback price for special tokens (manually maintained)
 */
export const getSpecialTokenPrice = (symbol: string): { price: number, change24h: number } | null => {
  const specialPrices: Record<string, { price: number, change24h: number }> = {
    'SYNC': { price: 0.025, change24h: 2.5 },
    'FORCE': { price: 0.012, change24h: -1.2 },
    'KUMA': { price: 0.000000003281, change24h: -2.54 }, // Updated from CoinMarketCap data
    'CHEW': { price: 0.000045, change24h: -0.8 },
    'KURO': { price: 0.000000008, change24h: 3.2 }
  };
  
  return specialPrices[symbol.toUpperCase()] || null;
};

/**
 * Add a new special token (for manual updates)
 * This function would typically be used in admin interface or scripts
 */
export const addSpecialToken = (token: Omit<SpecialTokenConfig, 'addedDate'>): SpecialTokenConfig => {
  const newToken: SpecialTokenConfig = {
    ...token,
    addedDate: new Date().toISOString().split('T')[0]
  };
  
  // In a real application, this would update the database or file
  console.log('New special token to be added:', newToken);
  
  return newToken;
};

// Export the list for external use
export default SPECIAL_TOKENS; 