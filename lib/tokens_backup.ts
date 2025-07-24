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
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      decimals: 18,
      name: 'Chainlink',
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink.png'
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      decimals: 18,
      name: 'Uniswap',
      logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
    },
    {
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      symbol: 'AAVE',
      decimals: 18,
      name: 'Aave',
      logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
    },
    {
      address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
      symbol: 'CRV',
      decimals: 18,
      name: 'Curve DAO Token',
      logoURI: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png'
    },
    {
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      symbol: 'MKR',
      decimals: 18,
      name: 'Maker',
      logoURI: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png'
    },
    {
      address: '0x6f40d4A6237C257fff2dB00FA0510DeEECd303eb',
      symbol: 'COMP',
      decimals: 18,
      name: 'Compound',
      logoURI: 'https://assets.coingecko.com/coins/images/10775/small/COMP.png'
    },
    {
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      symbol: 'BUSD',
      decimals: 18,
      name: 'Binance USD',
      logoURI: 'https://assets.coingecko.com/coins/images/9576/small/BUSD.png'
    },
    {
      address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      symbol: 'SHIB',
      decimals: 18,
      name: 'Shiba Inu',
      logoURI: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png'
    },
    {
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608aCafEBB0',
      symbol: 'MATIC',
      decimals: 18,
      name: 'Polygon',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
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
    },
    {
      address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      symbol: 'LINK',
      decimals: 18,
      name: 'Chainlink',
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink.png'
    },
    {
      address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
      symbol: 'UNI',
      decimals: 18,
      name: 'Uniswap',
      logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
    },
    {
      address: '0xba5DdD1f9d7F570dc94a51479a0004EBDf4A8c91',
      symbol: 'AAVE',
      decimals: 18,
      name: 'Aave',
      logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
    },
    {
      address: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978',
      symbol: 'CRV',
      decimals: 18,
      name: 'Curve DAO Token',
      logoURI: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png'
    },
    {
      address: '0x2e9a6Df78E42a30712c10a9Dc4b1C8656f8F2879',
      symbol: 'MKR',
      decimals: 18,
      name: 'Maker',
      logoURI: 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png'
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
    },
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      decimals: 18,
      name: 'Wrapped Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    },
    {
      address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
      symbol: 'cbETH',
      decimals: 18,
      name: 'Coinbase Wrapped Staked ETH',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
    }
  ],

  // Polygon (137)
  137: [
    {
      address: '0x0000000000000000000000000000000000001010',
      symbol: 'POL',
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
    },
    {
      address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      symbol: 'DAI',
      decimals: 18,
      name: 'Dai Stablecoin',
      logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
    },
    {
      address: '0x50b7545627a5162F82A992c33b87aDc75187B218',
      symbol: 'WBTC',
      decimals: 8,
      name: 'Wrapped Bitcoin',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
    },
    {
      address: '0x5947BB275c521040051D82396192181b413227A3',
      symbol: 'LINK',
      decimals: 18,
      name: 'Chainlink',
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink.png'
    },
    {
      address: '0x8eBAf22B6F053dFFeaf46f4Dd9eFA95D89ba8580',
      symbol: 'UNI',
      decimals: 18,
      name: 'Uniswap',
      logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
    },
    {
      address: '0x63a72806098Bd3D9520cC43356dD78afe5D386D9',
      symbol: 'AAVE',
      decimals: 18,
      name: 'Aave',
      logoURI: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png'
    }
  ],

  // Optimism (10)
  10: [
    {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      isNative: true
    },
    {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
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
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      symbol: 'WBTC',
      decimals: 8,
      name: 'Wrapped Bitcoin',
      logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
    },
    {
      address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6',
      symbol: 'LINK',
      decimals: 18,
      name: 'Chainlink',
      logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink.png'
    },
    {
      address: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
      symbol: 'UNI',
      decimals: 18,
      name: 'Uniswap',
      logoURI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png'
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