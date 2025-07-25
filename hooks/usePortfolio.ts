import { useState, useEffect } from 'react'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { type TokenConfig } from '@/lib/tokens'
import { fetchTokenBalancesForChain, fetchTokenPrices, type AlchemyTokenHolding } from '@/lib/alchemy-portfolio'

export interface TokenHolding {
  token: TokenConfig
  balance: string
  balanceRaw: string
  value: string
  valueUSD: number
  chain: string
  chainId: number
  change24h?: number
  price?: number
  isHidden?: boolean // New field to mark hidden tokens
  riskLevel?: 'low' | 'medium' | 'high' // Risk assessment
}

export interface PortfolioStats {
  totalValue: string
  totalValueUSD: number
  change24h: number
  changePercent: number
  totalAssets: number
  activeChains: number
  hiddenAssets: number // Count of hidden tokens
  hiddenValue: number // Total value of hidden tokens
}

interface PortfolioData {
  stats: PortfolioStats
  holdings: TokenHolding[]
  hiddenHoldings: TokenHolding[] // Separate array for hidden tokens
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Formatting utility functions
export const formatCurrency = (value: number): string => {
  if (value === 0) return '$0.00000'
  
  // For values >= $1, show 2 decimal places like normal currency
  if (value >= 1) {
    return `$${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }
  
  // For values < $1, show up to 5 decimal places
  return `$${value.toFixed(5)}`
}

export const formatPercentage = (value: number): string => {
  return value.toFixed(2)
}

export const formatChange24h = (value: number): string => {
  return value.toFixed(2)
}

// Token filtering logic - determine if token should be hidden
const shouldHideToken = (holding: TokenHolding): boolean => {
  const { valueUSD, token, balance } = holding
  
  // NEVER hide native tokens (ETH, MATIC, AVAX, etc.) - they are always important
  const nativeTokens = ['ETH', 'MATIC', 'AVAX', 'BNB', 'SOL', 'ARB', 'OP', 'BASE']
  if (nativeTokens.includes(token.symbol.toUpperCase())) {
    return false
  }
  
  // Hide if value is too low (dust) - but allow native tokens
  if (valueUSD < 0.10) return true
  
  // Hide if no price data available and very small balance
  if (holding.price === 0 && parseFloat(balance) < 0.001) return true
  
  // Hide common spam/airdrop tokens (add more as needed)
  const spamTokens = [
    'SPAM', 'AIRDROP', 'FREE', 'TEST', 'SCAM', 'FAKE',
    'PHISHING', 'VIRUS', 'MALWARE', 'HONEYPOT'
  ]
  
  const isSpamToken = spamTokens.some(spam => 
    token.symbol.toUpperCase().includes(spam) || 
    token.name.toUpperCase().includes(spam)
  )
  
  if (isSpamToken) return true
  
  // Hide tokens with suspicious characteristics
  if (token.symbol.length > 20) return true // Very long symbols
  if (token.symbol.includes('🚀') || token.symbol.includes('💎')) return true // Emoji tokens
  if (/^\d+$/.test(token.symbol)) return true // Pure number symbols
  
  return false
}

// Assess risk level of a token
const assessRiskLevel = (holding: TokenHolding): 'low' | 'medium' | 'high' => {
  const { valueUSD, token, price } = holding
  
  // Native tokens are always low risk, regardless of value
  const nativeTokens = ['ETH', 'MATIC', 'AVAX', 'BNB', 'SOL', 'ARB', 'OP', 'BASE']
  if (nativeTokens.includes(token.symbol.toUpperCase())) {
    return 'low'
  }
  
  // High risk indicators
  if (price === 0) return 'high'
  if (valueUSD < 1) return 'high'
  if (token.symbol.length > 10) return 'high'
  
  // Medium risk indicators  
  if (valueUSD < 10) return 'medium'
  if (!token.logoURI) return 'medium'
  
  // Low risk for established tokens
  const establishedTokens = ['WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'UNI', 'AAVE']
  if (establishedTokens.includes(token.symbol.toUpperCase())) return 'low'
  
  return 'medium'
}


export function usePortfolio(): PortfolioData {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [hiddenHoldings, setHiddenHoldings] = useState<TokenHolding[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: '$0.00',
    totalValueUSD: 0,
    change24h: 0,
    changePercent: 0,
    totalAssets: 0,
    activeChains: 0,
    hiddenAssets: 0,
    hiddenValue: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const convertAlchemyToTokenHolding = (alchemyHolding: AlchemyTokenHolding, priceData: { price: number, change24h: number }): TokenHolding => {
    const valueUSD = parseFloat(alchemyHolding.balance) * priceData.price
    
    const holding: TokenHolding = {
      ...alchemyHolding,
      value: formatCurrency(valueUSD),
      valueUSD,
      change24h: priceData.change24h,
      price: priceData.price
    }
    
    // Add risk assessment
    holding.riskLevel = assessRiskLevel(holding)
    holding.isHidden = shouldHideToken(holding)
    
    return holding
  }

  const loadPortfolioData = async () => {
    if (!isConnected || !address) {
      setHoldings([])
      setHiddenHoldings([])
      setStats({
        totalValue: '$0.00',
        totalValueUSD: 0,
        change24h: 0,
        changePercent: 0,
        totalAssets: 0,
        activeChains: 0,
        hiddenAssets: 0,
        hiddenValue: 0
      })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('Loading portfolio data for address:', address)
      
      // Define chains to fetch data from
      const supportedChainIds = [1, 42161, 8453, 137, 10, 43114] // Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche
      
      // Fetch token balances from all supported chains in parallel
      const portfolioPromises = supportedChainIds.map(chainId => 
        fetchTokenBalancesForChain(chainId, address)
      )
      
      const results = await Promise.allSettled(portfolioPromises)
      
      // Combine all holdings from different chains
      let alchemyHoldings: AlchemyTokenHolding[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          alchemyHoldings = [...alchemyHoldings, ...result.value]
        } else {
          console.error(`Failed to fetch data for chain ${supportedChainIds[index]}:`, result.reason)
        }
      })

      // Get unique token symbols for price fetching
      const uniqueSymbols = Array.from(new Set(alchemyHoldings.map(h => h.token.symbol)))
      const prices = await fetchTokenPrices(uniqueSymbols)

      // Convert Alchemy holdings to TokenHoldings with price data
      let allHoldings: TokenHolding[] = alchemyHoldings.map(holding => {
        const priceData = prices[holding.token.symbol] || { price: 0, change24h: 0 }
        const tokenHolding = convertAlchemyToTokenHolding(holding, priceData)
        
        // Log tokens with zero price for debugging
        if (priceData.price === 0) {
          console.warn(`Token ${holding.token.symbol} has no price data available`)
        }
        
        return tokenHolding
      })

      // Sort by value descending
      allHoldings.sort((a, b) => b.valueUSD - a.valueUSD)

      // Add some fallback demo data if no real holdings found
      if (allHoldings.length === 0 && process.env.NEXT_PUBLIC_ALCHEMY_API_KEY === 'demo') {
        console.log('No real holdings found, adding demo data')
        allHoldings = [
          {
            token: { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
            balance: '2.4500',
            balanceRaw: '0x21e19e0c9bab2400000',
            value: formatCurrency(6125.50),
            valueUSD: 6125.50,
            chain: 'Ethereum',
            chainId: 1,
            change24h: 3.2,
            price: 2500
          },
          {
            token: { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
            balance: '1,250.00',
            balanceRaw: '0x4a817c800',
            value: formatCurrency(1250.00),
            valueUSD: 1250.00,
            chain: 'Arbitrum',
            chainId: 42161,
            change24h: 0.1,
            price: 1.00
          }
        ]
      }

      // Filter out hidden tokens
      const filteredHoldings = allHoldings.filter(holding => !shouldHideToken(holding))
      const filteredHiddenHoldings = allHoldings.filter(holding => shouldHideToken(holding))

      setHoldings(filteredHoldings)
      setHiddenHoldings(filteredHiddenHoldings)

      // Calculate portfolio stats
      const totalValueUSD = filteredHoldings.reduce((sum, holding) => sum + holding.valueUSD, 0)
      const totalChange24h = filteredHoldings.reduce((sum, holding) => {
        return sum + (holding.valueUSD * (holding.change24h || 0) / 100)
      }, 0)
      const changePercent = totalValueUSD > 0 ? (totalChange24h / totalValueUSD) * 100 : 0
      
      const uniqueChains = new Set(filteredHoldings.map(h => h.chainId))

              setStats({
          totalValue: formatCurrency(totalValueUSD),
          totalValueUSD,
          change24h: parseFloat(formatChange24h(totalChange24h)),
          changePercent: parseFloat(formatPercentage(changePercent)),
          totalAssets: allHoldings.length, // Total count of all tokens (visible + hidden)
          activeChains: uniqueChains.size,
          hiddenAssets: filteredHiddenHoldings.length,
          hiddenValue: filteredHiddenHoldings.reduce((sum, holding) => sum + holding.valueUSD, 0)
        })

      console.log(`Portfolio loaded: ${filteredHoldings.length} assets across ${uniqueChains.size} chains`)

    } catch (error) {
      console.error('Error loading portfolio data:', error)
      setError('Failed to load portfolio data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = async () => {
    await loadPortfolioData()
  }

  useEffect(() => {
    loadPortfolioData()
  }, [isConnected, address, caipNetwork])

  return {
    stats,
    holdings,
    hiddenHoldings,
    isLoading,
    error,
    refresh
  }
} 