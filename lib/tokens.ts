import { SUPPORTED_CHAINS } from './chains';

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  isNative?: boolean;
}

// Token configurations by chain ID
export const TOKENS_BY_CHAIN: Record<number, TokenConfig[]> = {
  // Ethereum Mainnet (1)
  1: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    },
    {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      decimals: 8,
      name: 'Wrapped Bitcoin',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
    }
  ],

  // Sepolia Testnet (11155111)
  11155111: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true
    },
    {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin (Sepolia)',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether (Sepolia)',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    }
  ],

  // Arbitrum (42161)
  42161: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true
    },
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    },
    {
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      symbol: 'WBTC',
      decimals: 8,
      name: 'Wrapped Bitcoin',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
    }
  ],

  // Base (8453)
  8453: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true
    },
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    },
    {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    }
  ],

  // Polygon (137)
  137: [
    {
      address: '0x0000000000000000000000000000000000001010',
      symbol: 'MATIC',
      decimals: 18,
      name: 'Polygon',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
      isNative: true
    },
    {
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      symbol: 'WETH',
      decimals: 18,
      name: 'Wrapped Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    }
  ],

  // Avalanche (43114)
  43114: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'AVAX',
      decimals: 18,
      name: 'Avalanche',
      logoURI: 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png',
      isNative: true
    },
    {
      address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
      symbol: 'WETH',
      decimals: 18,
      name: 'Wrapped Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    },
    {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      symbol: 'USDT',
      decimals: 6,
      name: 'Tether',
      logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
    }
  ]
};

/**
 * Get tokens for a specific chain
 */
export function getTokensForChain(chainId: number): TokenConfig[] {
  return TOKENS_BY_CHAIN[chainId] || [];
}

/**
 * Find token by symbol on a specific chain
 */
export function findTokenBySymbol(symbol: string, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(chainId);
  const normalizedSymbol = symbol.toLowerCase();
  
  return tokens.find(token => 
    token.symbol.toLowerCase() === normalizedSymbol
  ) || null;
}

/**
 * Find token by address on a specific chain
 */
export function findTokenByAddress(address: string, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(chainId);
  const normalizedAddress = address.toLowerCase();
  
  return tokens.find(token => 
    token.address.toLowerCase() === normalizedAddress
  ) || null;
}

/**
 * Get native token for a chain
 */
export function getNativeToken(chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(chainId);
  return tokens.find(token => token.isNative) || null;
}

/**
 * Check if a token exists on a chain
 */
export function isTokenSupported(symbolOrAddress: string, chainId: number): boolean {
  return findTokenBySymbol(symbolOrAddress, chainId) !== null || 
         findTokenByAddress(symbolOrAddress, chainId) !== null;
}

/**
 * Resolve token identifier (symbol or address) to token config
 */
export function resolveToken(identifier: string, chainId: number): TokenConfig | null {
  // Try by symbol first
  const bySymbol = findTokenBySymbol(identifier, chainId);
  if (bySymbol) return bySymbol;
  
  // Try by address
  const byAddress = findTokenByAddress(identifier, chainId);
  if (byAddress) return byAddress;
  
  return null;
}

/**
 * Get default token pair for a chain (usually native token + USDC)
 */
export function getDefaultTokenPair(chainId: number): [TokenConfig, TokenConfig] | null {
  const tokens = getTokensForChain(chainId);
  if (tokens.length < 2) return null;
  
  const nativeToken = getNativeToken(chainId);
  const stablecoin = findTokenBySymbol('USDC', chainId) || findTokenBySymbol('USDT', chainId);
  
  if (nativeToken && stablecoin) {
    return [nativeToken, stablecoin];
  }
  
  // Fallback to first two tokens
  return [tokens[0], tokens[1]];
} 