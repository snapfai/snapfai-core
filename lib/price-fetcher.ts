// Real-time token price fetching service
// Supports multiple price sources for reliability

interface TokenPrice {
  symbol: string
  address?: string
  price: number
  source: string
  timestamp: number
}

interface PriceCache {
  [key: string]: {
    price: number
    timestamp: number
    source: string
  }
}

class PriceFetcher {
  private cache: PriceCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3'
  private readonly BACKUP_PRICES: Record<string, number> = {
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

  private getCacheKey(symbol: string, address?: string): string {
    return address ? `${symbol.toLowerCase()}_${address.toLowerCase()}` : symbol.toLowerCase()
  }

  private isCacheValid(cacheEntry: any): boolean {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.CACHE_DURATION
  }

  // Get token price from CoinGecko
  private async fetchFromCoinGecko(symbol: string, address?: string): Promise<number | null> {
    try {
      const symbolLower = symbol.toLowerCase()
      
      // Map common symbols to CoinGecko IDs
      const coinGeckoIds: Record<string, string> = {
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

      const coinId = coinGeckoIds[symbolLower]
      if (!coinId) {
        console.log(`No CoinGecko ID found for ${symbol}`)
        return null
      }

      const response = await fetch(
        `${this.COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const data = await response.json()
      const price = data[coinId]?.usd

      if (typeof price === 'number') {
        console.log(`✅ CoinGecko price for ${symbol}: $${price}`)
        return price
      }

      return null
    } catch (error) {
      console.error(`❌ CoinGecko fetch failed for ${symbol}:`, error)
      return null
    }
  }

  // Get backup price from hardcoded values
  private getBackupPrice(symbol: string): number {
    const symbolLower = symbol.toLowerCase()
    return this.BACKUP_PRICES[symbolLower] || 10 // Default fallback
  }

  // Main function to get token price
  async getTokenPrice(symbol: string, address?: string): Promise<TokenPrice> {
    const cacheKey = this.getCacheKey(symbol, address)
    const cached = this.cache[cacheKey]

    // Return cached price if valid
    if (this.isCacheValid(cached)) {
      console.log(`📦 Using cached price for ${symbol}: $${cached.price}`)
      return {
        symbol,
        address,
        price: cached.price,
        source: cached.source,
        timestamp: cached.timestamp
      }
    }

    // Try to fetch real-time price
    let price = await this.fetchFromCoinGecko(symbol, address)
    let source = 'coingecko'

    // Fallback to backup prices if API fails
    if (price === null) {
      price = this.getBackupPrice(symbol)
      source = 'backup'
      console.log(`⚠️  Using backup price for ${symbol}: $${price}`)
    }

    // Cache the result
    this.cache[cacheKey] = {
      price,
      source,
      timestamp: Date.now()
    }

    return {
      symbol,
      address,
      price,
      source,
      timestamp: Date.now()
    }
  }

  // Get multiple token prices at once
  async getMultipleTokenPrices(tokens: Array<{symbol: string, address?: string}>): Promise<TokenPrice[]> {
    const promises = tokens.map(token => this.getTokenPrice(token.symbol, token.address))
    return Promise.all(promises)
  }

  // Calculate USD value for a token amount
  async calculateUSDValue(symbol: string, amount: number, address?: string): Promise<{
    usdValue: number
    price: number
    source: string
  }> {
    const tokenPrice = await this.getTokenPrice(symbol, address)
    const usdValue = amount * tokenPrice.price

    console.log(`💰 ${amount} ${symbol} = $${usdValue.toFixed(2)} (price: $${tokenPrice.price}, source: ${tokenPrice.source})`)

    return {
      usdValue,
      price: tokenPrice.price,
      source: tokenPrice.source
    }
  }

  // Clear cache (useful for testing)
  clearCache(): void {
    this.cache = {}
    console.log('🗑️  Price cache cleared')
  }

  // Get cache stats
  getCacheStats(): { entries: number, oldest: number, newest: number } {
    const entries = Object.keys(this.cache).length
    const timestamps = Object.values(this.cache).map(entry => entry.timestamp)
    
    return {
      entries,
      oldest: entries > 0 ? Math.min(...timestamps) : 0,
      newest: entries > 0 ? Math.max(...timestamps) : 0
    }
  }
}

// Export singleton instance
export const priceFetcher = new PriceFetcher()
export type { TokenPrice }
