import { Alchemy, Network, TokenBalanceType } from 'alchemy-sdk'
import { type TokenConfig, getNativeToken } from './tokens'
import { SUPPORTED_CHAINS } from './chains'
import { 
  findSpecialTokenByAddress, 
  findSpecialTokenBySymbol,
  specialTokenToTokenConfig,
  getSpecialTokenPrice,
  isSpecialToken,
  type SpecialTokenConfig 
} from './special-tokens'

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
    
    // Get native token balance first
    let nativeTokenHolding: AlchemyTokenHolding | null = null
    try {
      const nativeBalance = await alchemy.core.getBalance(userAddress)
      console.log(`Raw native balance for ${userAddress}:`, nativeBalance?.toString())
      
      if (nativeBalance && nativeBalance.gt(0)) {
        const nativeToken = getNativeToken(chainId)
        console.log(`Native token for chain ${chainId}:`, nativeToken)
        
        if (nativeToken) {
          const balanceInEth = parseFloat(nativeBalance.toString()) / Math.pow(10, 18)
          console.log(`Native token ${nativeToken.symbol}: balance=${balanceInEth}`)
          
          nativeTokenHolding = {
            token: nativeToken,
            balance: balanceInEth.toFixed(6),
            balanceRaw: nativeBalance.toString(),
            valueUSD: 0, // Will be calculated with prices
            chain: chainInfo.name,
            chainId
          }
        } else {
          console.warn(`No native token found for chain ${chainId}`)
        }
      } else {
        console.log(`No native token balance found for ${userAddress} on chain ${chainId}`)
      }
    } catch (error) {
      console.warn(`Failed to get native token balance for chain ${chainId}:`, error)
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
        let token: TokenConfig | null = null
        let balance = 0
        
        // First, check if this is a special token
        const specialToken = findSpecialTokenByAddress(tokenBalance.contractAddress, chainId)
        
        if (specialToken) {
          // Use special token data
          console.log(`Found special token: ${specialToken.symbol} at ${specialToken.address}`)
          token = specialTokenToTokenConfig(specialToken)
          
          // Convert balance using special token decimals
          const balanceWei = parseInt(tokenBalance.tokenBalance || '0', 16)
          balance = balanceWei / Math.pow(10, specialToken.decimals)
          
          console.log(`Special token ${specialToken.symbol}: balance=${balance}, decimals=${specialToken.decimals}`)
        } else {
          // Get token metadata from Alchemy for regular tokens
          const metadata = await alchemy.core.getTokenMetadata(tokenBalance.contractAddress)
          
          // Skip if essential metadata is missing
          if (!metadata || !metadata.symbol || typeof metadata.decimals !== 'number') {
            console.warn(`Skipping token ${tokenBalance.contractAddress}: missing metadata`)
            continue
          }

          // Convert balance to human readable format
          const balanceWei = parseInt(tokenBalance.tokenBalance || '0', 16)
          balance = balanceWei / Math.pow(10, metadata.decimals)
          
          // @ts-ignore - Alchemy SDK type issue
          console.log(`Token ${metadata.symbol || 'UNKNOWN'}: balance=${balance}, decimals=${metadata.decimals}, raw=${tokenBalance.tokenBalance}`)
          
          // Create token config with safe string handling
          token = {
            symbol: metadata.symbol as string,
            name: (metadata.name || metadata.symbol) as string,
            decimals: metadata.decimals,
            address: tokenBalance.contractAddress,
            logoURI: metadata.logo as string | undefined
          }
        }
        
        // Skip very small balances (lowered threshold to catch more tokens)
        if (balance < 0.000000001) continue

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

    // Add native token to holdings if it exists
    if (nativeTokenHolding) {
      holdings.unshift(nativeTokenHolding) // Add to beginning of array
      console.log(`Added native token ${nativeTokenHolding.token.symbol} to holdings`)
    }

    return holdings
  } catch (error) {
    console.error(`Error fetching balances for chain ${chainId}:`, error)
    return []
  }
}

// Price fetching using Etherscan API + CoinGecko hybrid approach
export const fetchTokenPrices = async (symbols: string[]): Promise<Record<string, { price: number, change24h: number }>> => {
  if (symbols.length === 0) return {}
  
  const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourApiKeyToken'
  
  try {
    // First, try to get prices from CoinGecko (more reliable for price data)
    const coinGeckoPrices = await fetchCoinGeckoPrices(symbols)
    
    // For tokens not found in CoinGecko, verify them using Etherscan and use fallback prices
    const verifiedPrices = await verifyTokensWithEtherscan(symbols, coinGeckoPrices, ETHERSCAN_API_KEY)
    
    return verifiedPrices
  } catch (error) {
    console.error('Error in hybrid price fetching:', error)
    return getFallbackPrices(symbols)
  }
}

// Fetch prices from CoinGecko API
const fetchCoinGeckoPrices = async (symbols: string[]): Promise<Record<string, { price: number, change24h: number }>> => {
  try {
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
        next: { revalidate: 60 }
      }
    )
    
    if (!response.ok) {
      console.warn('CoinGecko API error, falling back to Etherscan verification')
      return {}
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
      }
    })
    
    return prices
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error)
    return {}
  }
}

// Verify tokens using Etherscan API and provide fallback prices
const verifyTokensWithEtherscan = async (
  symbols: string[], 
  coinGeckoPrices: Record<string, { price: number, change24h: number }>,
  apiKey: string
): Promise<Record<string, { price: number, change24h: number }>> => {
  const symbolToAddress = (symbol: string): string => {
    const mapping: Record<string, string> = {
      'ETH': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      'LINK': '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      'CRV': '0xD533a949740bb3306d119CC777fa900bA034cd52',
      'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      'MKR': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      'YFI': '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad9eC',
      'SNX': '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
      'SUSHI': '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2'
    }
    return mapping[symbol.toUpperCase()] || ''
  }
  
  const finalPrices = { ...coinGeckoPrices }
  
  // For tokens not found in CoinGecko, check special tokens first, then verify with Etherscan
  for (const symbol of symbols) {
    if (!finalPrices[symbol.toUpperCase()]) {
      // First, check if it's a special token
      const specialTokenPrice = getSpecialTokenPrice(symbol)
      if (specialTokenPrice) {
        finalPrices[symbol.toUpperCase()] = specialTokenPrice
        console.log(`Using special token price for ${symbol}: $${specialTokenPrice.price}`)
        continue
      }
      
      const address = symbolToAddress(symbol)
      
      if (address && address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        try {
          // Verify token exists on Etherscan
          const response = await fetch(
            `https://api.etherscan.io/api?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${apiKey}`,
            { 
              headers: { 'User-Agent': 'SnapFAI Portfolio App' },
              next: { revalidate: 300 } // Cache for 5 minutes
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            // If contract exists (code is not 0x), use fallback price
            if (data.result && data.result !== '0x') {
              const fallbackPrice = getFallbackPrice(symbol)
              finalPrices[symbol.toUpperCase()] = {
                price: fallbackPrice,
                change24h: 0
              }
              console.log(`Verified token ${symbol} with Etherscan, using fallback price: $${fallbackPrice}`)
            }
          }
        } catch (error) {
          console.warn(`Failed to verify ${symbol} with Etherscan:`, error)
        }
      } else if (symbol.toUpperCase() === 'ETH') {
        // Native ETH
        finalPrices['ETH'] = {
          price: 2500,
          change24h: 0
        }
      }
    }
  }
  
  return finalPrices
}

// Helper function to get fallback prices for tokens
const getFallbackPrice = (symbol: string): number => {
  // First check special tokens
  const specialPrice = getSpecialTokenPrice(symbol)
  if (specialPrice) {
    return specialPrice.price
  }
  
  const fallbackPrices: Record<string, number> = {
    'ETH': 2500,
    'WETH': 2500,
    'USDC': 1.00,
    'USDT': 1.00,
    'DAI': 1.00,
    'WBTC': 45000,
    'LINK': 15.00,
    'UNI': 8.00,
    'AAVE': 120.00,
    'CRV': 0.50,
    'COMP': 60.00,
    'MKR': 1500.00,
    'YFI': 8000.00,
    'SNX': 3.00,
    'SUSHI': 1.20,
    'MATIC': 0.85,
    'AVAX': 25.50
  }
  
  return fallbackPrices[symbol.toUpperCase()] || 0
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