import { Alchemy, Network, TokenBalanceType } from 'alchemy-sdk'
import { type TokenConfig } from './tokens'
import { SUPPORTED_CHAINS } from './chains'

export interface AlchemyTokenHolding {
  token: TokenConfig
  balance: string
  balanceRaw: string
  valueUSD: number
  chain: string
  chainId: number
}

// Network mapping for Alchemy SDK
export const getAlchemyNetwork = (chainId: number): Network | null => {
  switch (chainId) {
    case 1: return Network.ETH_MAINNET
    case 11155111: return Network.ETH_SEPOLIA
    case 42161: return Network.ARB_MAINNET
    case 8453: return Network.BASE_MAINNET
    case 137: return Network.MATIC_MAINNET
    case 10: return Network.OPT_MAINNET
    case 43114: return Network.AVAX_MAINNET
    default: return null
  }
}

// Create Alchemy instance for a specific network
export const createAlchemyInstance = (chainId: number): Alchemy | null => {
  const network = getAlchemyNetwork(chainId)
  if (!network) return null

  const config = {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo',
    network,
  }
  
  return new Alchemy(config)
}

export const fetchTokenBalancesForChain = async (
  chainId: number, 
  userAddress: string
): Promise<AlchemyTokenHolding[]> => {
  const alchemy = createAlchemyInstance(chainId)
  if (!alchemy) {
    console.warn(`Alchemy not supported for chain ${chainId}`)
    return []
  }

  const chainInfo = Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId)
  if (!chainInfo) return []

  try {
    console.log(`Fetching balances for chain ${chainInfo.name} (${chainId})`)
    
    // Common token addresses to specifically check
    const commonTokens: Record<number, string[]> = {
      1: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'], // USDC on Ethereum
      42161: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831'], // USDC on Arbitrum  
      8453: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'], // USDC on Base
      137: ['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'], // USDC on Polygon
      10: ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'], // USDC on Optimism
    }
    
    // Get all ERC20 token balances using Alchemy's API
    const balances = await alchemy.core.getTokenBalances(userAddress, { type: TokenBalanceType.ERC20 })
    
    // Also get balances for specific common tokens
    let specificTokenBalances = null
    if (commonTokens[chainId]) {
      try {
        specificTokenBalances = await alchemy.core.getTokenBalances(userAddress, commonTokens[chainId])
        console.log(`Specific token check for chain ${chainId}:`, specificTokenBalances?.tokenBalances?.length || 0)
      } catch (error) {
        console.warn(`Failed to get specific token balances for chain ${chainId}:`, error)
      }
    }
    
    if (!balances?.tokenBalances) return []
    
    // Combine general and specific token results
    let allTokenBalances = [...balances.tokenBalances]
    if (specificTokenBalances?.tokenBalances) {
      // Add specific tokens that might not be in the general ERC20 query
      for (const specificToken of specificTokenBalances.tokenBalances) {
        const exists = allTokenBalances.some(token => 
          token.contractAddress.toLowerCase() === specificToken.contractAddress.toLowerCase()
        )
        if (!exists) {
          allTokenBalances.push(specificToken)
        }
      }
    }
    
    console.log(`Combined token balances for chain ${chainId}:`, allTokenBalances.length)

    // Filter out zero balances and invalid tokens
    const nonZeroBalances = allTokenBalances.filter(token => 
      token.tokenBalance && 
      token.tokenBalance !== '0x0' && 
      token.tokenBalance !== '0' &&
      !token.error
    )

    const holdings: AlchemyTokenHolding[] = []

    console.log(`Found ${nonZeroBalances.length} tokens with non-zero balances`)
    
    // Process each token with non-zero balance (increased limit to catch more tokens)
    for (const tokenBalance of nonZeroBalances.slice(0, 200)) {
      try {
        // Get token metadata from Alchemy
        const metadata = await alchemy.core.getTokenMetadata(tokenBalance.contractAddress)
        
        // Skip if essential metadata is missing
        if (!metadata || !metadata.symbol || typeof metadata.decimals !== 'number') {
          console.warn(`Skipping token ${tokenBalance.contractAddress}: missing metadata`)
          continue
        }

        // Convert balance to human readable format
        const balanceWei = parseInt(tokenBalance.tokenBalance || '0', 16)
        const balance = balanceWei / Math.pow(10, metadata.decimals)
        
        // @ts-ignore - Alchemy SDK type issue
        console.log(`Token ${metadata.symbol || 'UNKNOWN'}: balance=${balance}, decimals=${metadata.decimals}, raw=${tokenBalance.tokenBalance}`)
        
        // Skip very small balances (lowered threshold to catch more tokens)
        if (balance < 0.000000001) continue

        // Create token config with safe string handling (metadata.symbol is guaranteed to exist here)
        const token: TokenConfig = {
          symbol: metadata.symbol as string,  // Type assertion - we checked above
          name: (metadata.name || metadata.symbol) as string,  // Type assertion - fallback guaranteed
          decimals: metadata.decimals,
          address: tokenBalance.contractAddress,
          logoURI: metadata.logo as string | undefined
        }

        const holding: AlchemyTokenHolding = {
          token,
          balance: balance.toFixed(6),
          balanceRaw: tokenBalance.tokenBalance || '0',
          valueUSD: 0, // Will be calculated with prices
          chain: chainInfo.name,
          chainId
        }

        holdings.push(holding)
      } catch (error) {
        console.error(`Error processing token ${tokenBalance.contractAddress}:`, error)
      }
    }

    return holdings
  } catch (error) {
    console.error(`Error fetching balances for chain ${chainId}:`, error)
    return []
  }
}

// Price fetching using CoinGecko API
export const fetchTokenPrices = async (symbols: string[]): Promise<Record<string, { price: number, change24h: number }>> => {
  if (symbols.length === 0) return {}
  
  try {
    // Convert symbols to CoinGecko IDs (simplified mapping)
    const symbolToId = (symbol: string): string => {
      const mapping: Record<string, string> = {
        'ETH': 'ethereum',
        'WETH': 'weth',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WBTC': 'wrapped-bitcoin',
        'MATIC': 'matic-network',
        'POL': 'matic-network',
        'AVAX': 'avalanche-2',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'CRV': 'curve-dao-token',
        'COMP': 'compound-governance-token',
        'MKR': 'maker',
        'YFI': 'yearn-finance',
        'SNX': 'havven',
        'SUSHI': 'sushi'
      }
      return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
    }
    
    const ids = [...new Set(symbols.map(symbolToId))].join(',')
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { 
        headers: { 'User-Agent': 'SnapFAI Portfolio App' },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    )
    
    if (!response.ok) {
      console.error('CoinGecko API error:', response.status, response.statusText)
      return getFallbackPrices(symbols)
    }
    
    const data = await response.json()
    const prices: Record<string, { price: number, change24h: number }> = {}
    
    symbols.forEach(symbol => {
      const id = symbolToId(symbol)
      const coinData = data[id]
      
      if (coinData && coinData.usd) {
        prices[symbol.toUpperCase()] = {
          price: coinData.usd,
          change24h: coinData.usd_24h_change || 0
        }
      } else {
        // Fallback for unknown tokens
        prices[symbol.toUpperCase()] = { price: 0, change24h: 0 }
      }
    })
    
    return prices
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error)
    return getFallbackPrices(symbols)
  }
}

// Fallback prices when API fails
const getFallbackPrices = (symbols: string[]): Record<string, { price: number, change24h: number }> => {
  const fallbackPrices: Record<string, { price: number, change24h: number }> = {
    'ETH': { price: 2500, change24h: 3.2 },
    'WETH': { price: 2500, change24h: 3.2 },
    'USDC': { price: 1.00, change24h: 0.1 },
    'USDT': { price: 1.00, change24h: -0.1 },
    'DAI': { price: 1.00, change24h: 0.05 },
    'WBTC': { price: 45000, change24h: 2.1 },
    'MATIC': { price: 0.9, change24h: -1.5 },
    'POL': { price: 0.9, change24h: -1.5 },
    'AVAX': { price: 35, change24h: 1.8 },
    'LINK': { price: 15, change24h: 4.2 },
    'UNI': { price: 8.5, change24h: -0.8 },
    'AAVE': { price: 125, change24h: 5.1 },
    'CRV': { price: 0.75, change24h: -2.3 },
    'COMP': { price: 45, change24h: 1.2 },
    'MKR': { price: 1200, change24h: -0.5 },
    'YFI': { price: 6500, change24h: 4.8 },
    'SNX': { price: 2.5, change24h: -1.2 },
    'SUSHI': { price: 0.8, change24h: 0.3 }
  }
  
  const result: Record<string, { price: number, change24h: number }> = {}
  symbols.forEach(symbol => {
    result[symbol.toUpperCase()] = fallbackPrices[symbol.toUpperCase()] || { price: 0, change24h: 0 }
  })
  
  return result
} 