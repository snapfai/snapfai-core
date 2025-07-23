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
}



export function usePortfolio(): PortfolioData {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: '$0.00',
    totalValueUSD: 0,
    change24h: 0,
    changePercent: 0,
    totalAssets: 0,
    activeChains: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const convertAlchemyToTokenHolding = (alchemyHolding: AlchemyTokenHolding, priceData: { price: number, change24h: number }): TokenHolding => {
    const valueUSD = parseFloat(alchemyHolding.balance) * priceData.price
    
    return {
      ...alchemyHolding,
      value: valueUSD > 0 ? `$${valueUSD.toLocaleString()}` : '$0.00',
      valueUSD,
      change24h: priceData.change24h,
      price: priceData.price
    }
  }

  const loadPortfolioData = async () => {
    if (!isConnected || !address) {
      setHoldings([])
      setStats({
        totalValue: '$0.00',
        totalValueUSD: 0,
        change24h: 0,
        changePercent: 0,
        totalAssets: 0,
        activeChains: 0
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
            value: '$6,125.50',
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
            value: '$1,250.00',
            valueUSD: 1250.00,
            chain: 'Arbitrum',
            chainId: 42161,
            change24h: 0.1,
            price: 1.00
          }
        ]
      }

      setHoldings(allHoldings)

      // Calculate portfolio stats
      const totalValueUSD = allHoldings.reduce((sum, holding) => sum + holding.valueUSD, 0)
      const totalChange24h = allHoldings.reduce((sum, holding) => {
        return sum + (holding.valueUSD * (holding.change24h || 0) / 100)
      }, 0)
      const changePercent = totalValueUSD > 0 ? (totalChange24h / totalValueUSD) * 100 : 0
      
      const uniqueChains = new Set(allHoldings.map(h => h.chainId))

      setStats({
        totalValue: `$${totalValueUSD.toLocaleString()}`,
        totalValueUSD,
        change24h: totalChange24h,
        changePercent,
        totalAssets: allHoldings.length,
        activeChains: uniqueChains.size
      })

      console.log(`Portfolio loaded: ${allHoldings.length} assets across ${uniqueChains.size} chains`)

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
    isLoading,
    error,
    refresh
  }
} 