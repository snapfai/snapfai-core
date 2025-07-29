import { useState } from 'react'
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { type TokenConfig } from '@/lib/tokens'
import { fetchTokenBalancesForChain, fetchAlchemyPriceForSymbol, type AlchemyTokenHolding } from '@/lib/alchemy-portfolio'
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
  riskLevel?: 'low' | 'medium' | 'high' // Risk assessment
}

export interface PortfolioStats {
  totalValue: string
  totalValueUSD: number
  change24h: number
  changePercent: number
  totalAssets: number
  activeChains: number
}

interface PortfolioData {
  stats: PortfolioStats
  holdings: TokenHolding[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshToken: (symbol: string) => Promise<void>
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
  
  return holding
}

export function usePortfolio(): PortfolioData {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  
  const [error, setError] = useState<string | null>(null)
  const [lastTokenCount, setLastTokenCount] = useState<number>(0)

  // Define chains to fetch data from
  const supportedChainIds = [1, 42161, 8453, 137, 10, 43114] // Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche

  // Fetch balances for each chain in parallel using useQueries
  const chainQueries = useQueries({
    queries: supportedChainIds.map(chainId => ({
      queryKey: ['tokenBalances', chainId, address],
      queryFn: () => fetchTokenBalancesForChain(chainId, address || ''),
      enabled: !!address && isConnected,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in garbage collection for 10 minutes
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
  
  // Check if token list has changed
  const tokenCountChanged = uniqueSymbols.length !== lastTokenCount
  if (tokenCountChanged) {
    console.log(`🔄 Token count changed: ${lastTokenCount} -> ${uniqueSymbols.length}`)
    setLastTokenCount(uniqueSymbols.length)
  }

  // Type for price data
  type PriceData = Record<string, { price: number, change24h: number }>

  // Fetch prices using Alchemy API with individual token caching
  const priceQueries = useQueries({
    queries: uniqueSymbols.map(symbol => ({
      queryKey: ['alchemyPrice', symbol],
      queryFn: () => fetchAlchemyPriceForSymbol(symbol),
      enabled: !!symbol && uniqueSymbols.length > 0,
      staleTime: 2 * 60 * 1000, // Consider price data fresh for 2 minutes
      gcTime: 5 * 60 * 1000, // Keep in garbage collection for 5 minutes
      retry: 2
    }))
  })

  // Convert Alchemy holdings to TokenHoldings with price data
  const allHoldings: TokenHolding[] = alchemyHoldings.map(holding => {
    const symbolIndex = uniqueSymbols.indexOf(holding.token.symbol)
    const priceQuery = priceQueries[symbolIndex]
    const priceData = priceQuery?.data || { price: 0, change24h: 0 }
    return convertAlchemyToTokenHolding(holding, priceData)
  })

  // Sort by value descending
  allHoldings.sort((a, b) => b.valueUSD - a.valueUSD)

  // All holdings are now visible (no hidden tokens)
  const filteredHoldings = allHoldings

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
    activeChains: uniqueChains.size
  }

  const isLoading = chainQueries.some(query => query.isLoading) || priceQueries.some(query => query.isLoading)

  return {
    stats,
    holdings: filteredHoldings,
    isLoading,
    error,
    refresh: async () => {
      console.log('🔄 Refreshing all portfolio data...')
      await Promise.all([
        ...chainQueries.map(query => query.refetch()),
        ...priceQueries.map(query => query.refetch())
      ])
    },
    refreshToken: async (symbol: string) => {
      console.log(`🔄 Refreshing specific token: ${symbol}`)
      const symbolIndex = uniqueSymbols.indexOf(symbol)
      if (symbolIndex >= 0) {
        await priceQueries[symbolIndex]?.refetch()
      }
    }
  }
} 