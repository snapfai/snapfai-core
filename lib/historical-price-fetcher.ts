// Historical price fetching for fixing existing swaps only
// This should ONLY be used to set initial USD values for swaps that were created without them
// Once set, USD values should NEVER be changed

import { priceFetcher } from './price-fetcher'

interface HistoricalPrice {
  symbol: string
  price: number
  timestamp: string
  source: 'historical' | 'current' | 'fallback'
}

export class HistoricalPriceFetcher {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3'
  
  // CoinGecko coin IDs mapping
  private readonly COIN_IDS: Record<string, string> = {
    'eth': 'ethereum',
    'weth': 'ethereum',
    'btc': 'bitcoin',
    'wbtc': 'bitcoin',
    'usdc': 'usd-coin',
    'usdt': 'tether',
    'dai': 'dai',
    'arb': 'arbitrum',
    'matic': 'polygon',
    'avax': 'avalanche-2',
    'op': 'optimism',
    'base': 'base'
  }

  // Fallback prices for when historical data is not available
  private readonly FALLBACK_PRICES: Record<string, number> = {
    'eth': 3000,
    'weth': 3000,
    'usdc': 1,
    'usdt': 1,
    'dai': 1,
    'btc': 60000,
    'wbtc': 60000,
    'arb': 1.5,
    'matic': 0.7,
    'avax': 20,
    'op': 2.5,
    'base': 0.8
  }

  // Get historical price from CoinGecko (limited to last 365 days for free tier)
  private async fetchHistoricalPrice(symbol: string, timestamp: Date): Promise<number | null> {
    try {
      const symbolLower = symbol.toLowerCase()
      const coinId = this.COIN_IDS[symbolLower]
      
      if (!coinId) {
        console.log(`❌ No CoinGecko ID for ${symbol}`)
        return null
      }

      // Format date for CoinGecko API (DD-MM-YYYY)
      const date = timestamp.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      console.log(`🕐 Fetching historical price for ${symbol} on ${date}`)

      const response = await fetch(
        `${this.COINGECKO_API}/coins/${coinId}/history?date=${date}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (!response.ok) {
        console.log(`❌ CoinGecko historical API error: ${response.status}`)
        return null
      }

      const data = await response.json()
      const price = data.market_data?.current_price?.usd

      if (typeof price === 'number') {
        console.log(`✅ Historical price for ${symbol} on ${date}: $${price}`)
        return price
      }

      console.log(`❌ No price data found for ${symbol} on ${date}`)
      return null

    } catch (error) {
      console.error(`❌ Historical price fetch failed for ${symbol}:`, error)
      return null
    }
  }

  // Get price at specific timestamp (with fallbacks)
  async getPriceAtTimestamp(symbol: string, timestamp: Date): Promise<HistoricalPrice> {
    const now = new Date()
    const timeDiff = now.getTime() - timestamp.getTime()
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

    // If timestamp is very recent (< 1 hour), use current price
    if (timeDiff < 60 * 60 * 1000) {
      console.log(`🕐 Using current price for recent timestamp (${Math.round(timeDiff / 60000)} minutes ago)`)
      const currentPrice = await priceFetcher.getTokenPrice(symbol)
      return {
        symbol,
        price: currentPrice.price,
        timestamp: timestamp.toISOString(),
        source: 'current'
      }
    }

    // If timestamp is within last year, try historical API
    if (daysDiff <= 365) {
      const historicalPrice = await this.fetchHistoricalPrice(symbol, timestamp)
      
      if (historicalPrice !== null) {
        return {
          symbol,
          price: historicalPrice,
          timestamp: timestamp.toISOString(),
          source: 'historical'
        }
      }
    }

    // Fallback to estimated price
    const fallbackPrice = this.FALLBACK_PRICES[symbol.toLowerCase()] || 10
    console.log(`⚠️  Using fallback price for ${symbol}: $${fallbackPrice}`)
    
    return {
      symbol,
      price: fallbackPrice,
      timestamp: timestamp.toISOString(),
      source: 'fallback'
    }
  }

  // Calculate USD value at specific timestamp
  async calculateHistoricalUSDValue(
    symbol: string, 
    amount: number, 
    timestamp: Date
  ): Promise<{
    usdValue: number
    price: number
    source: 'historical' | 'current' | 'fallback'
    timestamp: string
  }> {
    const priceData = await this.getPriceAtTimestamp(symbol, timestamp)
    const usdValue = amount * priceData.price

    console.log(`💰 Historical calculation: ${amount} ${symbol} = $${usdValue.toFixed(2)} (${priceData.source} price: $${priceData.price})`)

    return {
      usdValue,
      price: priceData.price,
      source: priceData.source,
      timestamp: priceData.timestamp
    }
  }
}

export const historicalPriceFetcher = new HistoricalPriceFetcher()

// WARNING: This function should only be used ONCE to fix existing swaps
// After initial USD values are set, they should NEVER be changed
export async function setInitialUSDValues(swapId?: string): Promise<{
  updated: number
  errors: number
  warning: string
}> {
  const WARNING = "⚠️  DANGER: This function modifies historical volume data. Use only once to set initial USD values!"
  console.log(WARNING)
  
  // This function should be removed after initial data fix
  return {
    updated: 0,
    errors: 0,
    warning: "Function disabled to prevent historical data corruption. USD values are locked at swap timestamp."
  }
}
