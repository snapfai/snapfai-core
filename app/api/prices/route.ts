import { NextRequest, NextResponse } from 'next/server';

const binanceSymbolMap: Record<string, string> = {
  "btc": "BTCUSDT",
  "bitcoin": "BTCUSDT",
  "eth": "ETHUSDT",
  "ethereum": "ETHUSDT",
  "usdt": "USDTUSDT",
  "tether": "USDTUSDT",
  "usdc": "USDCUSDT",
  "bnb": "BNBUSDT",
  "binance": "BNBUSDT",
  "ada": "ADAUSDT",
  "cardano": "ADAUSDT",
  "sol": "SOLUSDT",
  "solana": "SOLUSDT",
  "doge": "DOGEUSDT",
  "dogecoin": "DOGEUSDT",
  "matic": "MATICUSDT",
  "polygon": "MATICUSDT",
  "dot": "DOTUSDT",
  "polkadot": "DOTUSDT",
  "link": "LINKUSDT",
  "chainlink": "LINKUSDT",
  "uni": "UNIUSDT",
  "uniswap": "UNIUSDT",
  "ltc": "LTCUSDT",
  "litecoin": "LTCUSDT",
  "bch": "BCHUSDT",
  "bitcoin-cash": "BCHUSDT",
  "xrp": "XRPUSDT",
  "ripple": "XRPUSDT",
  "avax": "AVAXUSDT",
  "avalanche": "AVAXUSDT",
  "atom": "ATOMUSDT",
  "cosmos": "ATOMUSDT",
  "sui": "SUIUSDT",
  "apt": "APTUSDT",
  "aptos": "APTUSDT",
  "near": "NEARUSDT",
  "fil": "FILUSDT",
  "filecoin": "FILUSDT",
  "icp": "ICPUSDT",
  "internet-computer": "ICPUSDT",
  "stx": "STXUSDT",
  "stacks": "STXUSDT",
  "op": "OPUSDT",
  "optimism": "OPUSDT",
  "arb": "ARBUSDT",
  "arbitrum": "ARBUSDT",
  "base": "BASEUSDT",
  "sei": "SEIUSDT",
  "injective": "INJUSDT",
  "inj": "INJUSDT",
  "pepe": "PEPEUSDT",
  "shib": "SHIBUSDT",
  "shiba": "SHIBUSDT",
  "wld": "WLDUSDT",
  "worldcoin": "WLDUSDT",
  "meme": "MEMEUSDT",
  "bonk": "BONKUSDT",
  "floki": "FLOKIUSDT",
  "doge": "DOGEUSDT",
  "dogecoin": "DOGEUSDT",
  "xen": "XENUSDT",
  "peaq": "PEAQUSDT"
};

async function fetchBinancePrice(symbol: string): Promise<number | null> {
  try {
    // Handle stablecoins that are pegged to USD
    const lowerSymbol = symbol.toLowerCase();
    if (lowerSymbol === 'usdt' || lowerSymbol === 'tether') {
      return 1.0; // USDT is pegged to USD
    }
    if (lowerSymbol === 'usdc') {
      return 1.0; // USDC is also pegged to USD
    }
    
    const binanceSymbol = binanceSymbolMap[lowerSymbol];
    if (!binanceSymbol) return null;

    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    if (!response.ok) return null;

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching Binance price for ${symbol}:`, error);
    return null;
  }
}

async function fetchCoinGeckoPrice(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
    if (!response.ok) return null;

    const data = await response.json();
    return data[symbol]?.usd || null;
  } catch (error) {
    console.error(`Error fetching CoinGecko price for ${symbol}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array required' }, { status: 400 });
    }

    const prices: Record<string, number | null> = {};
    
    for (const symbol of symbols) {
      // Try Binance first
      let price = await fetchBinancePrice(symbol);
      
      // Fallback to CoinGecko if Binance fails
      if (price === null) {
        price = await fetchCoinGeckoPrice(symbol);
      }
      
      prices[symbol] = price;
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Error in prices API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
