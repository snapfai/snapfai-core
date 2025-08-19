import { Alchemy, Network, TokenBalanceType } from 'alchemy-sdk'
import { type TokenConfig, getNativeToken, isTokenSupported, findTokenByAddress, getTokensForChain } from './tokens'
import { SUPPORTED_CHAINS } from './chains'
import { 
  findSpecialTokenByAddress, 
  findSpecialTokenBySymbol,
  specialTokenToTokenConfig,
  getSpecialTokenPrice,
  isSpecialToken,
  type SpecialTokenConfig,
  SPECIAL_TOKENS
} from './special-tokens'
import { TokenHolding } from '@/hooks/usePortfolio'

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
    
    // Common token addresses to specifically check (including stablecoins)
    const commonTokens: Record<number, string[]> = {
      1: ['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '0xdAC17F958D2ee523a2206206994597C13D831ec7'], // USDC, USDT on Ethereum
      42161: ['0xaf88d065e77c8cC2239327C5EDb3A432268e5831', '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'], // USDC, USDT on Arbitrum  
      8453: [
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC (native Base USDC)
        '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', // USDbC (bridged USDC)
        '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'  // USDT
      ],
      137: ['0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'], // USDC, USDT on Polygon
      10: ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'], // USDC, USDT on Optimism
    }
    
    // Expanded stablecoin support across chains
    const stablecoinSymbols = [
      'USDC','USDT','DAI','USDC.E','USDCe','USDbC', // core variations
      'USDE','FRAX','TUSD','USDP','PYUSD','LUSD','GUSD','SUSD','CRVUSD','FDUSD','USDS'
    ]
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const stableSet = new Set(stablecoinSymbols.map(normalize))
    
    // Add any stablecoins from our token config for this chain to the specific check list
    const configStableAddresses = getTokensForChain(chainId)
      .filter(t => stableSet.has(normalize(t.symbol)))
      .map(t => t.address)
    
    
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
          
          // Try to get logo from our supported tokens list first
          const supportedNativeToken = findTokenByAddress(nativeToken.address, chainId);
          if (supportedNativeToken && supportedNativeToken.logoURI) {
            nativeToken.logoURI = supportedNativeToken.logoURI;
            console.log(`🎨 Using logo from tokens.ts for native token ${nativeToken.symbol}: ${nativeToken.logoURI}`);
          }
          
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
    
    // Also get balances for specific tokens (common + all stables discovered in config)
    let specificTokenBalances = null
    const specificAddresses = Array.from(new Set([...(commonTokens[chainId] || []), ...configStableAddresses]))
    if (specificAddresses.length > 0) {
      try {
        specificTokenBalances = await alchemy.core.getTokenBalances(userAddress, specificAddresses)
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
    console.log('Token addresses found:', nonZeroBalances.map(t => t.contractAddress).slice(0, 10))
    
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
          
          // Try to get logo from our supported tokens list first
          const supportedToken = findTokenByAddress(specialToken.address, chainId);
          if (supportedToken && supportedToken.logoURI) {
            token.logoURI = supportedToken.logoURI;
            console.log(`🎨 Using logo from tokens.ts for special token ${token.symbol}: ${token.logoURI}`);
          }
          
          // Check if special token is supported
          if (!isTokenSupported(specialToken.symbol, chainId) && !isTokenSupported(specialToken.address, chainId)) {
            console.log(`Skipping unsupported special token: ${specialToken.symbol} (${specialToken.address}) on chain ${chainId}`)
            continue
          }
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
          
          // Try to get logo from our supported tokens list first
          const supportedToken = findTokenByAddress(tokenBalance.contractAddress, chainId);
          if (supportedToken && supportedToken.logoURI) {
            token.logoURI = supportedToken.logoURI;
            console.log(`🎨 Using logo from tokens.ts for ${token.symbol}: ${token.logoURI}`);
          }
        }
        
        // Skip very small balances and tokens with no real value
        if (balance < 0.000000001) continue

        // Filter out spam/airdrop tokens and tokens with suspicious names
        const isSpamToken = isSpamOrAirdropToken(token.symbol, token.name);
        const isSupported = isTokenSupported(token.symbol, chainId) || isTokenSupported(token.address, chainId);
        
        // Skip tokens with suspiciously large balances (often spam)
        if (balance > 1000000000 && !isSupported) {
          console.log(`🚫 Skipping token with suspiciously large balance: ${token.symbol} (${balance})`)
          continue
        }
        
        if (isSpamToken) {
          console.log(`🚫 Skipping spam/airdrop token: ${token.symbol} (${token.address}) on chain ${chainId}`)
          continue
        } else if (isSupported) {
          console.log(`✅ Supported token found: ${token.symbol} (${token.address}) on chain ${chainId}`)
        } else {
          // Include unsupported tokens so they can appear under hidden/unsupported holdings
          console.log(`ℹ️ Including unsupported token for visibility: ${token.symbol} (${token.address}) on chain ${chainId}`)
        }

        const holding: AlchemyTokenHolding = {
          token,
          balance: balance.toFixed(6),
          balanceRaw: tokenBalance.tokenBalance || '0',
          valueUSD: 0, // Will be calculated with prices
          chain: chainInfo.name,
          chainId
        }

        console.log(`📊 Created holding for ${token.symbol}: balance=${balance.toFixed(6)}, address=${token.address}, supported=${isSupported}`)
        holdings.push(holding)
      } catch (error) {
        console.error(`Error processing token ${tokenBalance.contractAddress}:`, error)
      }
    }

    // Add native token to holdings if it exists and is supported
    if (nativeTokenHolding) {
      // Check if native token is supported
      if (isTokenSupported(nativeTokenHolding.token.symbol, chainId) || isTokenSupported(nativeTokenHolding.token.address, chainId)) {
        holdings.unshift(nativeTokenHolding) // Add to beginning of array
        console.log(`Added native token ${nativeTokenHolding.token.symbol} to holdings`)
      } else {
        console.log(`Skipping unsupported native token: ${nativeTokenHolding.token.symbol} on chain ${chainId}`)
      }
    }

    return holdings
  } catch (error) {
    console.error(`Error fetching balances for chain ${chainId}:`, error)
    return []
  }
}

// Helper function to detect spam/airdrop tokens
function isSpamOrAirdropToken(symbol: string, name: string): boolean {
  const spamKeywords = [
    'airdrop', 'claim', 'rewards', 'free', 'spam', 'scam', 'fake',
    'phishing', 'virus', 'malware', 'honeypot', 'test', 'meme',
    'eligible', 'reward', 'prize', 'bonus', 'gift', 'giveaway',
    '🚀', '💎', '🔥', '⭐', '🎉', '💰', '💸'
  ];
  
  const suspiciousPatterns = [
    /claim.*airdrop/i,
    /rewards?\..*\.com/i,
    /free.*token/i,
    /test.*token/i,
    /meme.*token/i,
    /.*\s+at\s+.*\.(com|org|net|io)/i,
    /.*\s+!\s+eligible/i,
    /.*\s+\$\s+reward/i,
    /reward\s+at\s+.*\.com/i,
    /.*coin\s*$/i, // Ends with "coin"
    /^[0-9]+\s*\$\s+reward/i, // Starts with number + $ + reward
  ];
  
  const combinedText = `${symbol} ${name}`.toLowerCase();
  
  // Check for spam keywords
  const hasSpamKeywords = spamKeywords.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
  
  // Check for suspicious patterns
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(combinedText)
  );
  
  // Check for very long names (often spam)
  const hasLongName = name.length > 50 || symbol.length > 20;
  
  // Check for emoji tokens
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(combinedText);
  
  // Check for website references in token names
  const hasWebsiteReference = /\.(com|org|net|io|bar)/i.test(combinedText);
  
  // Check for suspicious capitalization patterns
  const hasSuspiciousCaps = /[A-Z]{3,}/.test(symbol) && symbol.length > 5;
  
  return hasSpamKeywords || hasSuspiciousPattern || hasLongName || hasEmojis || hasWebsiteReference || hasSuspiciousCaps;
}

// Helper function to convert symbol to address
function symbolToAddress(symbol: string): string {
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

// Enhanced price fetching using Binance + CoinGecko strategy (like Snap chat interface)
export async function fetchTokenPrices(
  input: TokenHolding[] | string[]
): Promise<Record<string, { price: number; change24h: number }>> {
  try {
    if (input.length === 0) return {}

    // Check if input is TokenHolding[] or string[]
    if (typeof input[0] === 'string') {
      // Handle string[] input (old implementation)
      const symbols = input as string[]
      const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourApiKeyToken'
      
      // Convert symbols to TokenHolding[] format for enhanced pricing
      const tokens: TokenHolding[] = symbols.map(symbol => ({
        token: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          decimals: 18,
          address: symbolToAddress(symbol)
        },
        balance: '0',
        balanceRaw: '0',
        value: '$0.00',
        valueUSD: 0,
        chain: 'Ethereum',
        chainId: 1,
        change24h: 0,
        price: 0
      }))

      // Use enhanced pricing strategy
      const enhancedPrices = await fetchEnhancedTokenPrices(tokens)
      
      // For tokens not found, verify them using Etherscan and use fallback prices
      return await verifyTokensWithEtherscan(symbols, enhancedPrices, ETHERSCAN_API_KEY)
    } else {
      // Handle TokenHolding[] input (enhanced implementation)
      const tokens = input as TokenHolding[]
      const prices = await fetchEnhancedTokenPrices(tokens)
      
      // If we got any valid prices, return them
      if (Object.keys(prices).length > 0) {
        return prices
      }

      // If all pricing failed, return default prices
      return tokens.reduce((acc, token) => {
        acc[token.token.symbol] = { price: 0, change24h: 0 }
        return acc
      }, {} as Record<string, { price: number; change24h: number }>)
    }
  } catch (error) {
    console.error('Error in fetchTokenPrices:', error)
    // Return default prices on error
    if (typeof input[0] === 'string') {
      return getFallbackPrices(input as string[])
    } else {
      return (input as TokenHolding[]).reduce((acc, token) => {
        acc[token.token.symbol] = { price: 0, change24h: 0 }
        return acc
      }, {} as Record<string, { price: number; change24h: number }>)
    }
  }
}

// Enhanced token pricing using Binance + CoinGecko strategy (similar to Snap chat interface)
async function fetchEnhancedTokenPrices(tokens: TokenHolding[]): Promise<Record<string, { price: number; change24h: number }>> {
  const prices: Record<string, { price: number; change24h: number }> = {}
  
  console.log(`🚀 Using enhanced pricing strategy (Binance + CoinGecko) for ${tokens.length} tokens`)
  
  // Token mappings from Snap chat interface
  const tokenIdMap: Record<string, string> = {
    "btc": "bitcoin", "bitcoin": "bitcoin",
    "eth": "ethereum", "ethereum": "ethereum", 
    "sol": "solana", "solana": "solana",
    "link": "chainlink", "chainlink": "chainlink",
    "uni": "uniswap", "uniswap": "uniswap",
    "bnb": "binancecoin", "binance coin": "binancecoin",
    "doge": "dogecoin", "dogecoin": "dogecoin",
    "usdt": "tether", "tether": "tether",
    "usdc": "usd-coin", "usdbc": "usd-coin",
    "usde": "ethena-usde", "frax": "frax", "tusd": "true-usd", "usdp": "paxos-standard",
    "pyusd": "paypal-usd", "lusd": "liquity-usd", "gusd": "gemini-dollar", "susd": "nusd",
    "crvusd": "crvusd", "fdusd": "first-digital-usd", "usds": "usds",
    "ada": "cardano", "cardano": "cardano",
    "dot": "polkadot", "polkadot": "polkadot",
    "matic": "matic-network", "polygon": "matic-network",
    "avax": "avalanche-2", "avalanche": "avalanche-2",
    "ltc": "litecoin", "litecoin": "litecoin",
    "xrp": "ripple", "ripple": "ripple"
  }
  
  const binanceSymbolMap: Record<string, string> = {
    "btc": "BTCUSDT", "bitcoin": "BTCUSDT",
    "eth": "ETHUSDT", "ethereum": "ETHUSDT",
    "sol": "SOLUSDT", "solana": "SOLUSDT", 
    "link": "LINKUSDT", "chainlink": "LINKUSDT",
    "uni": "UNIUSDT", "uniswap": "UNIUSDT",
    "bnb": "BNBUSDT", "binance coin": "BNBUSDT",
    "doge": "DOGEUSDT", "dogecoin": "DOGEUSDT",
    // Stablecoins - removed USDT/USDC as they're handled specially in the API
    "usdbc": "USDCUSDT",
    // Most stables are not on Binance pairs directly; rely on CoinGecko fallback
    "ada": "ADAUSDT", "cardano": "ADAUSDT",
    "dot": "DOTUSDT", "polkadot": "DOTUSDT",
    "matic": "MATICUSDT", "polygon": "MATICUSDT",
    "avax": "AVAXUSDT", "avalanche": "AVAXUSDT",
    "ltc": "LTCUSDT", "litecoin": "LTCUSDT",
    "xrp": "XRPUSDT", "ripple": "XRPUSDT"
  }
  
  // Process tokens in batches to avoid rate limits
  const batchSize = 5
  const batches = []
  for (let i = 0; i < tokens.length; i += batchSize) {
    batches.push(tokens.slice(i, i + batchSize))
  }
  
  for (const batch of batches) {
    const pricePromises = batch.map(async (token) => {
      try {
        const symbol = token.token.symbol.toLowerCase()
        
        // Handle stablecoins directly - they're always $1
        if (symbol === 'usdt' || symbol === 'usdc' || symbol === 'dai' || symbol === 'busd' || symbol === 'tusd') {
          console.log(`💵 Stablecoin ${token.token.symbol}: $1.00`)
          return {
            symbol: token.token.symbol,
            price: 1.0,
            change24h: 0
          }
        }
        
        // Try Binance API first for major tokens
        if (binanceSymbolMap[symbol]) {
          try {
            const binancePrice = await fetchBinancePrice(symbol, binanceSymbolMap)
            if (binancePrice.success) {
              console.log(`✅ Got Binance price for ${token.token.symbol}: $${binancePrice.price.toFixed(4)}`)
              return {
                symbol: token.token.symbol,
                price: binancePrice.price,
                change24h: binancePrice.change24h
              }
            }
          } catch (binanceError) {
            console.warn(`Binance API failed for ${symbol}, falling back to CoinGecko`)
          }
        }
        
        // Fallback to CoinGecko
        if (tokenIdMap[symbol]) {
          try {
            const coinGeckoPrice = await fetchCoinGeckoPrice(symbol, tokenIdMap)
            if (coinGeckoPrice.success) {
              console.log(`✅ Got CoinGecko price for ${token.token.symbol}: $${coinGeckoPrice.price.toFixed(4)}`)
              return {
                symbol: token.token.symbol,
                price: coinGeckoPrice.price,
                change24h: coinGeckoPrice.change24h
              }
            }
          } catch (coinGeckoError) {
            console.warn(`CoinGecko API failed for ${symbol}`)
          }
        }
        
        console.warn(`No price found for ${token.token.symbol}`)
        return null
      } catch (error) {
        console.warn(`Error fetching price for ${token.token.symbol}:`, error)
        return null
      }
    })
    
    const results = await Promise.all(pricePromises)
    
    // Process results
    results.forEach(result => {
      if (result) {
        prices[result.symbol] = {
          price: result.price,
          change24h: result.change24h
        }
      }
    })
    
    // Add a small delay between batches to respect rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  console.log(`📊 Enhanced pricing completed: ${Object.keys(prices).length}/${tokens.length} tokens priced`)
  return prices
}

// Binance price fetching (adapted from Snap chat interface)
async function fetchBinancePrice(symbol: string, binanceSymbolMap: Record<string, string>): Promise<{
  price: number; change24h: number; success: boolean;
}> {
  try {
    // Use server-side API to avoid CORS issues
    const response = await fetch('/api/prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols: [symbol] })
    })
    
    if (response.ok) {
      const data = await response.json()
      const price = data.prices[symbol]
      
      if (price !== null && price !== undefined) {
        return {
          price: price,
          change24h: 0, // We'll need to implement 24h change separately if needed
          success: true
        }
      }
    }
    
    // Don't throw error, just return failure - let other tokens continue
    console.warn(`No price found for ${symbol}, returning 0`)
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return { price: 0, change24h: 0, success: false }
  }
  
  return { price: 0, change24h: 0, success: false }
}

// CoinGecko price fetching (adapted from Snap chat interface)
async function fetchCoinGeckoPrice(symbol: string, tokenIdMap: Record<string, string>): Promise<{
  price: number; change24h: number; success: boolean;
}> {
  try {
    const coinGeckoId = tokenIdMap[symbol]
    if (!coinGeckoId) {
      throw new Error(`No CoinGecko ID mapping found for ${symbol}`)
    }
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data[coinGeckoId]) {
        return {
          price: data[coinGeckoId].usd || 0,
          change24h: data[coinGeckoId].usd_24h_change || 0,
          success: true
        }
      }
    }
    
    throw new Error(`No data for ${coinGeckoId}`)
  } catch (error) {
    return { price: 0, change24h: 0, success: false }
  }
}

// Legacy CoinGecko function (fallback for contract-based pricing)
async function fetchCoinGeckoPrices(tokens: TokenHolding[]): Promise<Record<string, { price: number; change24h: number }>> {
  const prices: Record<string, { price: number; change24h: number }> = {}
  
  try {
    // Batch tokens into groups of 100 to avoid URL length limits
    const batchSize = 100
    const batches = []
    for (let i = 0; i < tokens.length; i += batchSize) {
      batches.push(tokens.slice(i, i + batchSize))
    }

    // Process each batch
    for (const batch of batches) {
      // First try contract-based endpoint
      const addresses = batch
        .map(token => token.token.address)
        .filter(addr => addr && addr !== '0x0000000000000000000000000000000000000000')
        .join(',')

      if (!addresses) continue

      try {
        // Try the contract-based endpoint first
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses}&vs_currencies=usd&include_24hr_change=true`,
          {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            next: { revalidate: 60 } // Cache for 1 minute
          }
        )

        if (response.ok) {
          const data = await response.json()
          
          // Map response data to our price format
          for (const token of batch) {
            const addr = token.token.address?.toLowerCase()
            if (addr && data[addr]) {
              prices[token.token.symbol] = {
                price: data[addr].usd || 0,
                change24h: data[addr].usd_24h_change || 0
              }
            }
          }
        } else {
          console.warn(`CoinGecko contract API error: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.warn('Error with contract-based endpoint:', error)
      }

      // For tokens without prices, try the ID-based endpoint
      const tokensWithoutPrices = batch.filter(token => !prices[token.token.symbol])
      if (tokensWithoutPrices.length > 0) {
        try {
          const ids = tokensWithoutPrices
            .map(token => getCoinGeckoId(token.token.symbol))
            .filter(Boolean)
            .join(',')

          if (ids) {
            const response = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
              {
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache'
                },
                next: { revalidate: 60 }
              }
            )

            if (response.ok) {
              const data = await response.json()
              
              for (const token of tokensWithoutPrices) {
                const id = getCoinGeckoId(token.token.symbol)
                if (id && data[id]) {
                  prices[token.token.symbol] = {
                    price: data[id].usd || 0,
                    change24h: data[id].usd_24h_change || 0
                  }
                }
              }
            } else {
              console.warn(`CoinGecko ID API error: ${response.status} ${response.statusText}`)
            }
          }
        } catch (error) {
          console.warn('Error with ID-based endpoint:', error)
        }
      }

      // For any remaining tokens without prices, set default values
      for (const token of batch) {
        if (!prices[token.token.symbol]) {
          // Check special tokens first
          const specialPrice = getSpecialTokenPrice(token.token.symbol)
          if (specialPrice) {
            prices[token.token.symbol] = specialPrice
          } else {
            // Use fallback price or default to 0
            const fallbackPrice = getFallbackPrice(token.token.symbol)
            prices[token.token.symbol] = {
              price: fallbackPrice,
              change24h: 0
            }
          }
        }
      }

      // Add small delay between batches to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return prices
  } catch (error) {
    console.error('Error fetching CoinGecko prices:', error)
    // Return empty prices object instead of throwing
    return tokens.reduce((acc, token) => {
      // Check special tokens first
      const specialPrice = getSpecialTokenPrice(token.token.symbol)
      if (specialPrice) {
        acc[token.token.symbol] = specialPrice
      } else {
        // Use fallback price or default to 0
        const fallbackPrice = getFallbackPrice(token.token.symbol)
        acc[token.token.symbol] = {
          price: fallbackPrice,
          change24h: 0
        }
      }
      return acc
    }, {} as Record<string, { price: number; change24h: number }>)
  }
}

// Helper function to get CoinGecko IDs for common tokens
function getCoinGeckoId(symbol: string): string {
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
  return mapping[symbol.toUpperCase()] || ''
}

// Verify tokens using Etherscan API and provide fallback prices
const verifyTokensWithEtherscan = async (
  symbols: string[], 
  coinGeckoPrices: Record<string, { price: number, change24h: number }>,
  apiKey: string
): Promise<Record<string, { price: number, change24h: number }>> => {
  
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
    'AVAX': 25.50,
    // Avalanche tokens
    'PNG': 0.15,
    'JOE': 0.25,
    'DYP': 0.05,
    'WAVAX': 25.50,
    // Other common tokens
    'ARB': 1.2,
    'OP': 2.5,
    'BASE': 0.0001
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
    'WAVAX': { price: 35, change24h: 1.8 },
    'LINK': { price: 15, change24h: 4.2 },
    'UNI': { price: 8.5, change24h: -0.8 },
    'AAVE': { price: 125, change24h: 5.1 },
    'CRV': { price: 0.75, change24h: -2.3 },
    'COMP': { price: 45, change24h: 1.2 },
    'MKR': { price: 1200, change24h: -0.5 },
    'YFI': { price: 6500, change24h: 4.8 },
    'SNX': { price: 2.5, change24h: -1.2 },
    'SUSHI': { price: 0.8, change24h: 0.3 },
    // Avalanche tokens
    'PNG': { price: 0.15, change24h: 2.1 },
    'JOE': { price: 0.25, change24h: -1.5 },
    'DYP': { price: 0.05, change24h: 0.8 },
    // Other common tokens
    'ARB': { price: 1.2, change24h: 1.5 },
    'OP': { price: 2.5, change24h: -0.8 },
    'BASE': { price: 0.0001, change24h: 0.0 }
  }
  
  const result: Record<string, { price: number, change24h: number }> = {}
  symbols.forEach(symbol => {
    result[symbol.toUpperCase()] = fallbackPrices[symbol.toUpperCase()] || { price: 0, change24h: 0 }
  })
  
  return result
} 