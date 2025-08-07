import { useState } from 'react'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { type TokenConfig } from '@/lib/tokens'
import { fetchTokenBalancesForChain, fetchTokenPrices, type AlchemyTokenHolding } from '@/lib/alchemy-portfolio'
import { useQuery, useQueries, type UseQueryOptions } from '@tanstack/react-query'

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

// Helper function to convert Alchemy holding to TokenHolding
const convertAlchemyToTokenHolding = (
  alchemyHolding: AlchemyTokenHolding, 
  priceData: { price: number, change24h: number }
): TokenHolding => {
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

export function usePortfolio(): PortfolioData {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  
  const [error, setError] = useState<string | null>(null)

  // Define chains to fetch data from
  const supportedChainIds = [1, 42161, 8453, 137, 10, 43114] // Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche

  // Fetch balances for each chain in parallel using useQueries
  const chainQueries = useQueries({
    queries: supportedChainIds.map(chainId => ({
      queryKey: ['tokenBalances', chainId, address],
      queryFn: () => fetchTokenBalancesForChain(chainId, address || ''),
      enabled: !!address && isConnected,
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep in garbage collection for 5 minutes
      retry: 2
    }))
  })

  // Combine all holdings from different chains
  const alchemyHoldings = chainQueries.reduce<AlchemyTokenHolding[]>((acc, query) => {
    if (query.data) {
      return [...acc, ...query.data]
    }
    return acc
  }, [])

  // Get unique token symbols for price fetching
  const uniqueSymbols = Array.from(new Set(alchemyHoldings.map(h => h.token.symbol)))

  // Type for price data
  type PriceData = Record<string, { price: number, change24h: number }>

  // Fetch prices using React Query
  const priceQuery = useQuery<PriceData, Error>({
    queryKey: ['tokenPrices', uniqueSymbols.join(',')],
    queryFn: () => fetchTokenPrices(uniqueSymbols),
    enabled: uniqueSymbols.length > 0,
    staleTime: 10000, // Consider price data fresh for 10 seconds
    gcTime: 30000, // Keep in garbage collection for 30 seconds
    retry: 2
  })

  // Convert Alchemy holdings to TokenHoldings with price data
  const allHoldings: TokenHolding[] = alchemyHoldings.map(holding => {
    const priceData = (priceQuery.data?.[holding.token.symbol]) || { price: 0, change24h: 0 }
    return convertAlchemyToTokenHolding(holding, priceData)
  })

  // Sort by value descending
  allHoldings.sort((a, b) => b.valueUSD - a.valueUSD)

  // Filter out hidden tokens
  const filteredHoldings = allHoldings.filter(holding => !shouldHideToken(holding))
  const filteredHiddenHoldings = allHoldings.filter(holding => shouldHideToken(holding))
  
  // Portfolio summary logging
  const ethHoldings = allHoldings.filter(h => h.token.symbol.toUpperCase() === 'ETH')
  console.log('📊 Portfolio Summary:', {
    totalHoldings: allHoldings.length,
    visibleHoldings: filteredHoldings.length,
    hiddenHoldings: filteredHiddenHoldings.length,
    ethHoldingsCount: ethHoldings.length,
    totalValueUSD: allHoldings.reduce((sum, h) => sum + h.valueUSD, 0).toFixed(2)
  })
  
  // ETH holdings summary
  if (ethHoldings.length > 0) {
    console.log('✅ ETH Holdings Found:', ethHoldings.map(eth => 
      `${eth.chain}: ${parseFloat(eth.balance).toFixed(4)} ETH ($${eth.valueUSD.toFixed(2)})`
    ).join(', '))
  }

  // Calculate portfolio stats
  const totalValueUSD = filteredHoldings.reduce((sum, holding) => sum + holding.valueUSD, 0)
  const totalChange24h = filteredHoldings.reduce((sum, holding) => {
    return sum + (holding.valueUSD * (holding.change24h || 0) / 100)
  }, 0)
  const changePercent = totalValueUSD > 0 ? (totalChange24h / totalValueUSD) * 100 : 0
  
  const uniqueChains = new Set(filteredHoldings.map(h => h.chainId))

  const stats: PortfolioStats = {
    totalValue: formatCurrency(totalValueUSD),
    totalValueUSD,
    change24h: parseFloat(formatChange24h(totalChange24h)),
    changePercent: parseFloat(formatPercentage(changePercent)),
    totalAssets: allHoldings.length,
    activeChains: uniqueChains.size,
    hiddenAssets: filteredHiddenHoldings.length,
    hiddenValue: filteredHiddenHoldings.reduce((sum, holding) => sum + holding.valueUSD, 0)
  }

  const isLoading = chainQueries.some(query => query.isLoading) || priceQuery.isLoading

  return {
    stats,
    holdings: filteredHoldings,
    hiddenHoldings: filteredHiddenHoldings,
    isLoading,
    error,
    refresh: async () => {
      await Promise.all([
        ...chainQueries.map(query => query.refetch()),
        priceQuery.refetch()
      ])
    }
  }
} 