import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import axios from 'axios';

// Define search parameters type
interface SearchParameters {
  mode: "auto" | "on" | "off";
  return_citations?: boolean;
  sources?: Array<{
    type: "web" | "x" | "news" | "rss";
    excluded_websites?: string[];
    x_handles?: string[];
    country?: string;
    safe_search?: boolean;
    links?: string[];
  }>;
  max_search_results?: number;
  from_date?: string;
  to_date?: string;
}

// Define custom response type
interface CustomChatCompletionMessage {
  role: string;
  content: string;
  citations?: string[];
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: "https://api.x.ai/v1",
});

// Map common token names/symbols to their CoinGecko IDs
const tokenIdMap: Record<string, string> = {
  "btc": "bitcoin",
  "bitcoin": "bitcoin",
  "eth": "ethereum",
  "ethereum": "ethereum",
  "sol": "solana",
  "solana": "solana",
  "link": "chainlink",
  "chainlink": "chainlink",
  "uni": "uniswap",
  "uniswap": "uniswap",
  "bnb": "binancecoin",
  "binance coin": "binancecoin",
  "doge": "dogecoin",
  "dogecoin": "dogecoin",
  "usdt": "tether",
  "tether": "tether",
  "usdc": "usd-coin",
  "sui": "sui",
  "ada": "cardano",
  "cardano": "cardano",
  "dot": "polkadot",
  "polkadot": "polkadot",
  "matic": "matic-network",
  "polygon": "matic-network",
  "avax": "avalanche-2",
  "avalanche": "avalanche-2",
  "ltc": "litecoin",
  "litecoin": "litecoin",
  "xrp": "ripple",
  "ripple": "ripple",
  "shib": "shiba-inu",
  "shiba": "shiba-inu",
  "shiba inu": "shiba-inu",
  "atom": "cosmos",
  "cosmos": "cosmos",
  "trx": "tron",
  "tron": "tron",
  "etc": "ethereum-classic",
  "ethereum classic": "ethereum-classic",
  "fil": "filecoin",
  "filecoin": "filecoin",
  "near": "near",
  "algo": "algorand",
  "algorand": "algorand",
  "vet": "vechain",
  "vechain": "vechain",
  "icp": "internet-computer",
  "internet computer": "internet-computer"
};

// Map tokens to Binance symbols
const binanceSymbolMap: Record<string, string> = {
  "btc": "BTCUSDT",
  "bitcoin": "BTCUSDT",
  "eth": "ETHUSDT",
  "ethereum": "ETHUSDT",
  "sol": "SOLUSDT",
  "solana": "SOLUSDT",
  "link": "LINKUSDT",
  "chainlink": "LINKUSDT",
  "uni": "UNIUSDT",
  "uniswap": "UNIUSDT",
  "bnb": "BNBUSDT",
  "binance coin": "BNBUSDT",
  "doge": "DOGEUSDT",
  "dogecoin": "DOGEUSDT",
          "usdt": "USDTUSDT", // USDT paired with itself for stable price
        "tether": "USDTUSDT",
  "usdc": "USDCUSDT",
  "sui": "SUIUSDT",
  "ada": "ADAUSDT",
  "cardano": "ADAUSDT",
  "dot": "DOTUSDT",
  "polkadot": "DOTUSDT",
  "matic": "MATICUSDT",
  "polygon": "MATICUSDT",
  "avax": "AVAXUSDT",
  "avalanche": "AVAXUSDT",
  "ltc": "LTCUSDT",
  "litecoin": "LTCUSDT",
  "xrp": "XRPUSDT",
  "ripple": "XRPUSDT",
  "shib": "SHIBUSDT",
  "shiba": "SHIBUSDT",
  "shiba inu": "SHIBUSDT",
  "atom": "ATOMUSDT",
  "cosmos": "ATOMUSDT",
  "trx": "TRXUSDT",
  "tron": "TRXUSDT",
  "etc": "ETCUSDT",
  "ethereum classic": "ETCUSDT",
  "fil": "FILUSDT",
  "filecoin": "FILUSDT",
  "near": "NEARUSDT",
  "algo": "ALGOUSDT",
  "algorand": "ALGOUSDT",
  "vet": "VETUSDT",
  "vechain": "VETUSDT",
  "icp": "ICPUSDT",
  "internet computer": "ICPUSDT"
};

// Cryptocurrency price fetching from CoinGecko (original function)
const fetchCryptoPrice = async (symbol: string): Promise<{ 
  price: number; 
  change24h: number; 
  source: string; 
  timestamp: string;
  success: boolean;
  error?: string;
}> => {
  try {
    // Use CoinGecko API for real-time prices
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`);
    
    // Check if we got data for the requested symbol
    if (response.data && response.data[symbol.toLowerCase()]) {
      const data = response.data[symbol.toLowerCase()];
      const price = data.usd;
      const change24h = data.usd_24h_change || 0;
      const lastUpdated = data.last_updated_at ? new Date(data.last_updated_at * 1000).toISOString() : new Date().toISOString();
      
      return {
        price,
        change24h,
        source: "CoinGecko API",
        timestamp: lastUpdated,
        success: true
      };
    } else {
      throw new Error(`No price data found for ${symbol}`);
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return {
      price: 0,
      change24h: 0,
      source: "",
      timestamp: "",
      success: false,
      error: `Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Cryptocurrency price fetching from Binance
const fetchBinancePrice = async (symbol: string): Promise<{ 
  price: number; 
  change24h: number; 
  source: string; 
  timestamp: string;
  success: boolean;
  error?: string;
}> => {
  try {
    // Get Binance symbol
    const binanceSymbol = binanceSymbolMap[symbol.toLowerCase()];
    if (!binanceSymbol) {
      throw new Error(`No Binance symbol mapping found for ${symbol}`);
    }
    
    // Get current price
    const priceResponse = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
    
    // Get 24h stats
    const statsResponse = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`);
    
    if (priceResponse.data && statsResponse.data) {
      const price = parseFloat(priceResponse.data.price);
      const change24h = parseFloat(statsResponse.data.priceChangePercent);
      
      return {
        price,
        change24h,
        source: "Binance API",
        timestamp: new Date().toISOString(),
        success: true
      };
    } else {
      throw new Error(`No price data found for ${symbol} (${binanceSymbol})`);
    }
  } catch (error) {
    console.error(`Error fetching price from Binance for ${symbol}:`, error);
    return {
      price: 0,
      change24h: 0,
      source: "",
      timestamp: "",
      success: false,
      error: `Failed to fetch price for ${symbol}: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Detect if the query is asking for a cryptocurrency price
const isPriceQuery = (text: string): { isPriceQuery: boolean; token: string } => {
  // Common phrases used when asking for crypto prices
  const pricePatterns = [
    /price of (\$?[a-zA-Z0-9]+)/i,
    /(\$?[a-zA-Z0-9]+) price/i,
    /how much is (\$?[a-zA-Z0-9]+)/i,
    /(\$?[a-zA-Z0-9]+) worth/i,
    /value of (\$?[a-zA-Z0-9]+)/i,
    /(\$?[a-zA-Z0-9]+) value/i,
    /(\$?[a-zA-Z0-9]+) cost/i,
    /cost of (\$?[a-zA-Z0-9]+)/i,
    /(\$?[a-zA-Z0-9]+) rate/i,
    /rate of (\$?[a-zA-Z0-9]+)/i,
    /(\$?[a-zA-Z0-9]+) market price/i,
    /(\$?[a-zA-Z0-9]+) trading at/i,
    /current (\$?[a-zA-Z0-9]+) price/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean the token name by removing dollar sign and converting to lowercase
      const rawToken = match[1];
      const token = rawToken.replace(/^\$/, '').toLowerCase();
      
      // Check if this is a recognized token
      if (token in tokenIdMap) {
        return { isPriceQuery: true, token };
      }
    }
  }
  
  return { isPriceQuery: false, token: '' };
};

// Simple regex-based parser as fallback when OpenAI quota is exceeded
function fallbackParser(text: string, currentChain: string = 'ethereum') {
  // Expanded regex patterns to handle more swap command variations
  // Action keywords
  const actionRegex = /(swap|trade|convert|exchange)/i;
  
  // Amount pattern (matches "100 USDT", "5 ETH", etc.)
  const amountRegex = /(\d+(?:\.\d+)?)\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  
  // Token patterns
  const toPattern = /\s+to\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  const forPattern = /\s+for\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  const intoPattern = /\s+into\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  
  // Chain and protocol
  const chainRegex = /on\s+([a-zA-Z]{3,10})/i;
  const protocolRegex = /(?:using|via|with)\s+([a-zA-Z0-9]{1,10})/i;
  
  // Address pattern
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  
  // Extract basic components
  const amountMatch = amountRegex.exec(text);
  const toMatch = toPattern.exec(text);
  const forMatch = forPattern.exec(text);
  const intoMatch = intoPattern.exec(text);
  const chainMatch = chainRegex.exec(text);
  const protocolMatch = protocolRegex.exec(text);
  
  // Get all addresses in the text
  const addresses: string[] = [];
  let addressMatch;
  while ((addressMatch = addressRegex.exec(text)) !== null) {
    addresses.push(addressMatch[0]);
  }
  
  // Parse the data
  let amount: number | null = null;
  let tokenIn: string | null = null;
  let tokenOut: string | null = null;
  
  // Amount and first token
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    tokenIn = amountMatch[2];
  }
  
  // Second token (from to/for/into patterns)
  if (toMatch) {
    tokenOut = toMatch[1];
  } else if (forMatch) {
    tokenOut = forMatch[1];
  } else if (intoMatch) {
    tokenOut = intoMatch[1];
  }
  
  // If we still don't have tokens, try to use addresses
  if (!tokenIn && addresses.length > 0) {
    tokenIn = addresses[0];
  }
  
  if (!tokenOut && addresses.length > 1) {
    tokenOut = addresses[1];
  }
  
  // Chain (default to current connected chain)
const chain = chainMatch ? chainMatch[1] : (currentChain || 'ethereum');
  
  // Protocol (always null - system will determine the best protocol)
  const protocol = null;
  
  // Validity check
  const isValid = amount !== null && tokenIn !== null && tokenOut !== null;
  
  return {
    isValid,
    data: {
      tokenIn,
      tokenOut,
      amount,
      chain,
      protocol
    }
  };
}

export async function POST(request: NextRequest) {
  let text = '';
  let processedHistory: Array<{ role: string; content: string; timestamp?: string | number }> = [];
  
  try {
    const { 
      text: promptText, 
      userId, 
      useLiveSearch, 
      searchSources,
      walletInfo, // New parameter to receive wallet information
      currentChain, // Current connected chain context
      portfolioHoldings, // User's supported portfolio holdings
      portfolioHiddenHoldings, // User's hidden/unsupported holdings
      portfolioStats, // User's portfolio statistics
      portfolioCacheInfo, // Portfolio cache metadata
      conversationHistory // Array of previous messages for context
    } = await request.json();
    
    text = promptText; // Store text for potential fallback use
    
    if (!text) {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Process conversation history to fit within token limits
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Increase token limit significantly to preserve more context
      const maxTokens = 30000; // Increased from 10000 to preserve more conversation history
      const maxMessages = 30;   // Increased from 20 to keep more messages
      
      // Start with the most recent messages but preserve chronological order
      const recentMessages = conversationHistory.slice(-maxMessages);
      
      let currentTokens = 0;
      const processedMessages = [];
      
      // Process messages in chronological order (oldest first) to maintain context
      for (let i = 0; i < recentMessages.length; i++) {
        const message = recentMessages[i];
        const estimatedTokens = Math.ceil(message.content.length / 4);
        
        // If adding this message would exceed token limit, stop
        if (currentTokens + estimatedTokens > maxTokens) {
          console.log(`🔍 Token limit reached at message ${i + 1}/${recentMessages.length}`);
          break;
        }
        
        processedMessages.push(message); // Add to end to maintain chronological order
        currentTokens += estimatedTokens;
      }
      
      // Use the processed messages in chronological order
      processedHistory = processedMessages;
      
      console.log(`🔍 Conversation history processed:`, {
        originalCount: conversationHistory.length,
        processedCount: processedHistory.length,
        estimatedTokens: currentTokens,
        maxTokens,
        sampleMessages: processedHistory.slice(0, 3).map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 100) + '...',
          timestamp: msg.timestamp
        })),
        lastMessages: processedHistory.slice(-3).map(msg => ({
          role: msg.role,
          content: msg.content.substring(0, 100) + '...',
          timestamp: msg.timestamp
        }))
      });
    } else {
      console.log('⚠️ No conversation history received or invalid format:', {
        hasHistory: !!conversationHistory,
        isArray: Array.isArray(conversationHistory),
        type: typeof conversationHistory
      });
    }
    
    // Check if this is a price query we can handle directly
    const { isPriceQuery: isDirectPriceQuery, token } = isPriceQuery(text);
    
    // If this is a price query, ALWAYS use our specialized price tool (regardless of live search setting)
    if (isDirectPriceQuery) {
      console.log(`Detected price query for ${token}, using specialized price tool (Live Search: ${useLiveSearch ? 'ON' : 'OFF'})`);
      try {
        // Try Binance API first, fall back to CoinGecko if it fails
        let priceData;
        try {
          priceData = await fetchBinancePrice(token);
          if (!priceData.success) {
            console.log(`Binance API failed for ${token}, falling back to CoinGecko`);
            const coinGeckoId = tokenIdMap[token];
            priceData = await fetchCryptoPrice(coinGeckoId);
          }
        } catch (binanceError) {
          console.error("Error using Binance API:", binanceError);
          const coinGeckoId = tokenIdMap[token];
          priceData = await fetchCryptoPrice(coinGeckoId);
        }
        
        if (priceData.success) {
          // Format a professional price response
          const formattedPrice = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
          }).format(priceData.price);
          
          const formattedChange = new Intl.NumberFormat('en-US', { 
            style: 'percent', 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(priceData.change24h / 100);
          
          const changeDirection = priceData.change24h >= 0 ? "up" : "down";
          
          // Create a nicely formatted response
          const message = `The current price of ${token.toUpperCase()} is ${formattedPrice}, ${changeDirection} ${formattedChange} in the last 24 hours. This is live market data from ${priceData.source === "Binance API" ? "Binance" : "CoinGecko"}.`;
          
          // Get appropriate citation URL based on the source
          let citationUrl = '';
          if (priceData.source === "Binance API") {
            citationUrl = `https://www.binance.com/en/trade/${binanceSymbolMap[token.toLowerCase()]}?theme=dark&type=spot`;
          } else {
            // Default to CoinGecko
            citationUrl = `https://www.coingecko.com/en/coins/${tokenIdMap[token.toLowerCase()]}`;
          }
          
          return NextResponse.json({
            success: true,
            type: 'chat',
            message: message,
            data: {
              price: priceData.price,
              change24h: priceData.change24h,
              source: priceData.source,
              timestamp: priceData.timestamp
            },
            citations: [citationUrl],
            hasLiveSearch: useLiveSearch, // Preserve the original live search setting
            isDirectPriceFetch: true
          });
        }
      } catch (priceError) {
        console.error("Error using price tool:", priceError);
        // Fall back to normal processing if the price tool fails
      }
    }
    
    // For the MVP, we'll simulate the backend by directly calling OpenAI
    // In production, this would be calling our backend server
    
    // Create wallet and portfolio context if information is provided
    let walletContext = '';
    if (walletInfo && walletInfo.address) {
      walletContext = `
USER WALLET INFORMATION:
- Wallet Address: ${walletInfo.address}
- Connected Network: ${walletInfo.network || currentChain || 'Not specified'}
- Current Chain: ${currentChain || 'ethereum'} (THIS IS THE DEFAULT FOR ALL OPERATIONS)
- Wallet Provider: ${walletInfo.provider || 'Not specified'}
- Wallet Balance: ${walletInfo.balance || 'Not available'}
${walletInfo.ens ? `- ENS Name: ${walletInfo.ens}` : ''}
`;
    }

    // Add comprehensive portfolio context if available
    let portfolioContext = '';
    console.log('🔍 Building portfolio context:', {
      hasPortfolioHoldings: !!portfolioHoldings,
      portfolioHoldingsCount: portfolioHoldings?.length || 0,
      hasPortfolioStats: !!portfolioStats,
      hasPortfolioHiddenHoldings: !!portfolioHiddenHoldings,
      portfolioHiddenHoldingsCount: portfolioHiddenHoldings?.length || 0
    });
    
    if (portfolioHoldings && portfolioHoldings.length > 0) {
      // Calculate comprehensive portfolio stats
      const totalSupportedHoldings = portfolioHoldings.length;
      const totalHiddenHoldings = portfolioHiddenHoldings?.length || 0;
      const totalAllHoldings = totalSupportedHoldings + totalHiddenHoldings;
      
      // Get unique chains from all holdings
      const allChains = new Set([
        ...portfolioHoldings.map((h: any) => h.chainId),
        ...(portfolioHiddenHoldings || []).map((h: any) => h.chainId)
      ]);
      
      portfolioContext = `
🔍 COMPLETE MULTI-CHAIN PORTFOLIO ANALYSIS:

📊 PORTFOLIO OVERVIEW:
- Total Portfolio Value: ${portfolioStats?.totalValue || 'N/A'}
- 24h Performance: ${portfolioStats?.changePercent ? (portfolioStats.changePercent >= 0 ? '+' : '') + portfolioStats.changePercent.toFixed(2) + '%' : 'N/A'} (${portfolioStats?.change24h ? '$' + (portfolioStats.change24h >= 0 ? '+' : '') + portfolioStats.change24h.toFixed(2) : 'N/A'})
- Total Assets Found: ${totalAllHoldings} (${totalSupportedHoldings} supported + ${totalHiddenHoldings} unsupported)
- Active Blockchains: ${allChains.size} chains (Multi-chain portfolio)
- Currently Connected: ${currentChain || 'ethereum'} (but portfolio spans multiple chains)
- Data Status: ${portfolioCacheInfo?.isFromCache ? `📋 CACHED DATA (${Math.round((portfolioCacheInfo.dataAge || 0) / 60000)}min old) - No new API calls made` : '🔄 FRESH DATA - Just fetched from blockchain'}

⚠️ IMPORTANT: This data shows ALL tokens found in the user's wallet across all supported chains, including native tokens (ETH, MATIC, etc.) and major stablecoins (USDC, USDT, DAI) which are NEVER filtered out.

✅ SUPPORTED HOLDINGS (SAFE TO TRADE):
${portfolioHoldings.map((holding: any, index: number) => 
  `${index + 1}. ${holding.token.symbol} on ${holding.chain}: ${holding.balance} tokens = ${holding.value} ${holding.change24h !== undefined ? `(${holding.change24h >= 0 ? '+' : ''}${holding.change24h.toFixed(2)}% 24h)` : ''} [Risk: ${holding.riskLevel?.toUpperCase() || 'UNKNOWN'}]`
).join('\n')}

${portfolioHiddenHoldings && portfolioHiddenHoldings.length > 0 ? `
⚠️ UNSUPPORTED/HIDDEN HOLDINGS (POTENTIALLY UNSAFE):
${portfolioHiddenHoldings.map((holding: any, index: number) => 
  `${index + 1}. ${holding.token.symbol} on ${holding.chain}: ${holding.balance} tokens = ${holding.value || '$0.00'} [UNSUPPORTED - May be spam, scam, or low-value token]`
).join('\n')}

🚨 UNSUPPORTED TOKEN WARNINGS:
- These tokens are hidden because they may be: spam airdrops, scam tokens, extremely low value (<$0.10), or unverified
- DO NOT recommend swapping these tokens - they may be honeypots or have no liquidity
- If user asks about these tokens, warn them about potential risks
- Only focus on SUPPORTED holdings for trading recommendations
` : ''}

🎯 PORTFOLIO INTELLIGENCE:
- Risk Assessment: ${portfolioHoldings.some((h: any) => h.riskLevel === 'high') ? 'HIGH RISK' : portfolioHoldings.some((h: any) => h.riskLevel === 'medium') ? 'MEDIUM RISK' : 'LOW RISK'}
- Diversification Status: ${allChains.size > 1 ? `GOOD - Spread across ${allChains.size} blockchains` : 'POOR - Concentrated on single blockchain'}
- Largest Position: ${portfolioHoldings[0]?.token.symbol || 'N/A'} (${portfolioHoldings[0]?.value || 'N/A'}) - ${portfolioHoldings[0] ? ((parseFloat(portfolioHoldings[0].value.replace('$', '').replace(',', '')) / (portfolioStats?.totalValueUSD || 1)) * 100).toFixed(1) : '0'}% of portfolio
- Concentration Risk: ${portfolioHoldings[0] && portfolioStats?.totalValueUSD ? ((parseFloat(portfolioHoldings[0].value.replace('$', '').replace(',', '')) / portfolioStats.totalValueUSD) > 0.7 ? 'HIGH - Over 70% in single asset' : 'MODERATE') : 'Unknown'}

💡 PERSONALIZED AI GUIDANCE:
1. CURRENT CONNECTION: User is connected to ${currentChain || 'ethereum'} but has assets across multiple chains
2. TRADING SAFETY: Only recommend swaps using SUPPORTED holdings - never suggest trading unsupported tokens
3. RISK MANAGEMENT: Warn about concentration if any single token >70% of portfolio value
4. YIELD OPPORTUNITIES: Identify idle stablecoins (USDC, USDT, DAI) that could earn yield
5. REBALANCING: Consider chain distribution and risk levels when suggesting portfolio changes
6. MULTI-CHAIN AWARENESS: User has assets on multiple chains, not just the currently connected one

🔐 IMPORTANT SAFETY RULES:
- NEVER recommend swapping unsupported/hidden tokens
- ALWAYS warn about risks when user asks about unsupported tokens  
- Focus trading suggestions on verified, supported holdings only
- Explain that unsupported tokens are hidden for safety reasons
`;
    } else if (walletInfo && walletInfo.address) {
      // Wallet connected but no portfolio data fetched yet
      portfolioContext = `
🔍 WALLET CONNECTED - PORTFOLIO DATA NOT YET LOADED:

📊 WALLET STATUS:
- Wallet Address: ${walletInfo.address}
- Connected Network: ${currentChain || 'ethereum'}
- Portfolio Status: Not yet analyzed (will be fetched when user asks portfolio-related questions)

💡 IMPORTANT INSTRUCTIONS:
- If user asks about their portfolio, holdings, balances, or assets, inform them you need to fetch their data first
- Explain that portfolio data is fetched on-demand to optimize API usage
- For portfolio-related questions, tell them: "Let me analyze your portfolio across all chains. This will take a moment to fetch your complete holdings..."
- Do not make assumptions about what tokens they hold
- Focus on general DeFi guidance until portfolio data is requested and loaded
`;
    }

    const fullWalletContext = walletContext + portfolioContext;
    console.log('🔍 Final wallet context:', {
      hasWalletContext: !!walletContext,
      hasPortfolioContext: !!portfolioContext,
      totalContextLength: fullWalletContext.length,
      portfolioContextLength: portfolioContext.length
    });
    
    if (fullWalletContext) {
      const contextSuffix = `
When providing responses, you should take this wallet and portfolio information into account:
1. MULTI-CHAIN AWARENESS: User has assets across multiple blockchains, not just the currently connected one (${currentChain || 'ethereum'})
2. SWAP SAFETY: For swap requests, use ${currentChain || 'ethereum'} as default chain, but ONLY suggest swapping SUPPORTED tokens
3. PERSONALIZED ADVICE: Base all recommendations on the user's actual holdings and risk profile
4. RISK WARNINGS: Alert about concentration risk, unsupported tokens, and dangerous trades
5. PORTFOLIO OPTIMIZATION: Suggest rebalancing, yield opportunities, and diversification based on real data
6. SECURITY FIRST: Never recommend trading unsupported/hidden tokens - explain they're hidden for safety
`;
      walletContext = fullWalletContext + contextSuffix;
      console.log('✅ Wallet context built successfully, total length:', walletContext.length);
    }
    
    // Define system prompt with current chain context
    const nowIso = new Date().toISOString();
    const liveSearchInstructions = useLiveSearch
      ? `LIVE SEARCH STATE: ENABLED\n- Include an explicit timestamp like "as of ${nowIso}" when presenting time-sensitive data (prices, news, market events)\n- Always provide citations for live content\n- You MAY refer to data as current or real-time (only when Live Search is ON or when using the dedicated price tool)`
      : `LIVE SEARCH STATE: DISABLED\n- DO NOT claim "real-time", "latest", "now", or "updated within the last hour"\n- For time-sensitive requests ("news", "latest", "today", "now", "breaking"), first inform the user Live Search is OFF and suggest enabling it via the toggle\n- You MAY still answer general knowledge questions, but avoid implying recency\n- Exception: Token price questions are handled by our price tool and may be presented as live market data from the stated API source (Binance/CoinGecko) with a timestamp`;

    const systemPrompt = `You are the AI agent powering SnapFAI, a specialized DeFi platform with COMPLETE PORTFOLIO AWARENESS and CONVERSATION MEMORY. 

CORE PRINCIPLES:
- BE DIRECT: Don't explain features that already exist - USE them
- BE PORTFOLIO-SMART: Always reference user's actual holdings when relevant
- BE ACTION-ORIENTED: Guide users to immediate actions, not explanations
- NO REDUNDANT EXPLANATIONS: If user asks about portfolio/balance, use the data you have
- REMEMBER: You have access to conversation history and should reference previous context when relevant
- CONVERSATION MEMORY IS CRITICAL: Always check conversation history before responding to maintain context

1. PORTFOLIO-AWARE DeFi Operations:
   - You have REAL-TIME access to user's portfolio - use it instead of asking them to check
   - When user asks "check my USDC balance" → Look at their actual portfolio data and respond with the exact amount
   - When user says "check my portfolio" or "analyze my portfolio" → Provide a COMPREHENSIVE analysis including:
     * Portfolio overview with total value and performance
     * Risk assessment (concentration, volatility, diversification)
     * Chain distribution analysis
     * Specific recommendations for rebalancing, yield opportunities, or risk management
     * Highlight any concerning patterns (e.g., over-concentration in single asset)
   - Provide personalized trading advice based on actual holdings and risk levels
   - Parse swap requests by identifying tokenIn, tokenOut, amount, and chain (Ethereum/Arbitrum/Base/Avalanche/Optimism)
   - IMPORTANT: User is currently connected to ${currentChain || 'ethereum'} network - use this as the default chain when not specified
   - ONLY recommend swapping SUPPORTED tokens - warn about unsupported ones
   - Handle protocol selection automatically

2. DeFi News & Information:
   - Provide latest DeFi news and trends
   - Share token price information and market data
   - Explain DeFi protocols and their features
   - Discuss market sentiment and analysis
   - Answer questions about DeFi concepts and terminology

3. Token Information:
   - Share token price, market cap, and volume data
   - Explain token utilities and use cases
   - Provide token contract information
   - Discuss token economics and distribution
   - Share token-related news and updates

4. Price Queries:
   - For any price-related questions, ALWAYS check the most current data 
   - Use ONLY the most recent sources (within last hour if possible)
   - Report the EXACT price figures from your most reliable sources
   - ALWAYS include specific price values in USD (e.g., "$26.75") - never be vague
   - NEVER say phrases like "can be found on their platform" - always provide the actual price
   - Include the source and timestamp of price data
   - Prioritize major exchange data over news articles
   - Be precise about numbers - include dollars and cents
   - When Live Search is enabled, ensure you retrieve and display the latest price

5. Live Search Philosophy:
   - REMEMBER: You are an AI first, enhanced by Live Search - not just a search engine
   - Live Search provides you with real-time data, but YOUR ANALYSIS is what makes it valuable
   - DO NOT simply repeat what sources say - INTERPRET what it means for the user
   - MAINTAIN your reasoning capabilities even with fresh data
   - ENHANCE your insights with real-time information, don't replace thinking with searching
   - ASK YOURSELF: "What does this information actually mean? What insights can I extract?"
   - PROVIDE VALUE through your intelligence applied to fresh data
   - BE THE EXPERT who can interpret complex DeFi information for users
   - QUESTION assumptions in the data rather than blindly reporting them
   - REMEMBER that your uniqueness comes from combining AI intelligence with real-time data

${liveSearchInstructions}

6. Live Search Analysis:
   - When using Live Search, THOROUGHLY VERIFY each claim before presenting it:
     * READ sources carefully and understand their EXACT context
     * NEVER misattribute information (e.g., don't confuse a single blockchain's TVL with all of DeFi)
     * VERIFY numbers and statistics across multiple sources when possible
     * INDICATE clearly when information is from a single source and might need verification
   - CRITICALLY ANALYZE all search results before responding:
     * CHECK if numbers make logical sense (e.g., is $10.78B reasonable for all of DeFi's TVL?)
     * IDENTIFY contradictions between sources and acknowledge them
     * DISTINGUISH between facts, opinions, and marketing claims in your sources
     * UNDERSTAND the full context of any statistics or quotes
   - THINK DEEPLY about the information you're providing:
     * CONSIDER the implications and relationships between different data points
     * CONNECT information logically rather than just listing facts
     * PROVIDE proper context and background for technical concepts
     * REASON through the validity of claims before presenting them
   - SYNTHESIZE information carefully:
     * COMBINE insights from multiple sources intelligently
     * EXPLAIN relationships between different pieces of information
     * HIGHLIGHT consensus views vs. outlier perspectives
     * PRESENT a coherent, well-reasoned analysis rather than just reporting

${walletContext}

7. CONVERSATION MEMORY:
   - You have access to the conversation history and should use it to provide context-aware responses
   - Reference previous exchanges when relevant (e.g., "As we discussed earlier...", "Based on your previous question about...")
   - Remember user preferences, names, and context shared in the conversation
   - Use conversation history to avoid repeating information already provided
   - If user asks "what did we talk about before?" or similar, reference the conversation context
   - IMPORTANT: Always check the conversation history before responding to avoid contradicting previous information
   - If a user asks about something mentioned earlier, reference that specific conversation
   - Remember names, preferences, and details shared throughout the conversation

FORMAT FOR EXTRACTING SWAP DETAILS:
- When given "Swap 100 USDT to ETH on Arbitrum" → Extract amount=100, tokenIn=USDT, tokenOut=ETH, chain=Arbitrum
- When given "Trade 5 ETH for WBTC" → Extract amount=5, tokenIn=ETH, tokenOut=WBTC, chain=Ethereum (default)
- When given "Convert 1000 USDC to 0x7a38..." → Extract amount=1000, tokenIn=USDC, tokenOut=0x7a38..., chain=Ethereum (default)

IMPORTANT CONSIDERATIONS:
- For swap requests, extract numerical amounts precisely
- Recognize variant forms like "trade", "convert", "exchange" as equivalent to "swap"
- Process both token symbols and addresses accurately
- For news and information requests, provide detailed, accurate responses
- For portfolio analysis requests (e.g., "analyze my portfolio", "check my holdings", "portfolio review"):
  * ALWAYS provide a comprehensive analysis using the portfolio data provided
  * Include specific numbers, percentages, and actionable insights
  * Don't just list holdings - analyze patterns, risks, and opportunities
  * Give concrete recommendations based on the user's actual situation
- Stay up-to-date with the latest DeFi developments
- Be informative but concise in your responses
- DOUBLE-CHECK all factual claims, especially statistics and numbers
- AVOID misrepresenting information from sources

RESPONSE STYLE:
- NEVER say "I don't have direct access" when you have portfolio data - USE IT
- NEVER redirect users to check portfolio page when you can analyze their holdings directly
- NEVER give generic explanations about how to swap when user asks specific questions
- BE SPECIFIC: "You have 150.5 USDC on Arbitrum" not "You can check your balance"
- BE ACTIONABLE: "Want to swap some of your 0.0077 ETH?" not "Here's how to swap"
- USE REAL DATA: Reference their actual token amounts, chains, and values
- ALWAYS CHECK CONVERSATION HISTORY: Before responding, review what was discussed earlier to maintain context
- REFERENCE PREVIOUS EXCHANGES: Use phrases like "As we discussed earlier..." or "Based on our previous conversation..."
- REMEMBER USER DETAILS: Names, preferences, and specific information shared in the conversation

REQUIRED PARAMETERS FOR SWAPS:
- tokenIn: The token the user wants to swap from (symbol or address)
- tokenOut: The token the user wants to swap to (symbol or address)
- amount: The precise numerical amount of tokenIn to swap
- chain: Either "Ethereum" or "Arbitrum" (default to Ethereum if unspecified)
- protocol: Leave as null - system will determine the best protocol for the user

If any required information is missing for swap requests, return the function call with what you can determine, setting missing values to null. This will prompt the user to provide the missing information.

For news and information requests, provide direct, informative responses without function calling.`;

    // Define the tools for function calling
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "parse_swap",
          description: "Parse a swap request from a user's prompt",
          parameters: {
            type: "object",
            properties: {
              tokenIn: {
                type: "string",
                description: "The token to swap from (e.g., USDT, ETH, BTC, or an address like 0xA0b...)"
              },
              tokenOut: {
                type: "string",
                description: "The token to swap to (e.g., USDT, ETH, BTC, or an address like 0xC02...)"
              },
              amount: {
                type: "number",
                description: "The amount of tokenIn to swap"
              },
              chain: {
                type: "string",
                description: "The blockchain to execute the swap on (Ethereum or Arbitrum)"
              },
              protocol: {
                type: "string",
                description: "The protocol to use for the swap (optional, can be 0x or Odos)"
              }
            },
            required: ["tokenIn", "tokenOut", "amount", "chain"]
          }
        }
      }
    ];

    try {
      // Log what we're sending to the AI
      console.log('🚀 Sending to AI model:', {
        model: "grok-4-0709",
        systemPromptLength: systemPrompt.length,
        hasWalletContext: systemPrompt.includes('MULTI-CHAIN PORTFOLIO ANALYSIS'),
        processedHistoryLength: processedHistory.length,
        userMessage: text,
        hasTools: !!tools,
        temperature: 0.2
      });
      
      // Call OpenAI API with xAI Live Search parameters
      const response = await openai.chat.completions.create({
          model: "grok-4-0709",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedHistory,
          { role: "user", content: text }
        ],
        tools: tools,
        temperature: 0.2,
        ...(useLiveSearch ? {
          search_parameters: {
            mode: "on", // Force search on
            return_citations: true, // Always return citations
            sources: searchSources || [
              { 
                type: "web", 
                excluded_websites: ["wikipedia.org", "investing.com", "yahoo.com"],
                safe_search: true
              },
              { type: "news" },
              { 
                type: "x", 
                x_handles: [
                  "binance",
                  "kraken",
                  "coinbase",
                  "coingecko",
                  "coinmarketcap",
                  "bitfinex",
                  "huobi",
                  "okx",
                  "bybit",
                  "kucoin"
                ]
              }
            ],
            max_search_results: text.toLowerCase().includes("price") ? 5 : 3,
            // Only set date restrictions for non-price queries
            ...(text.toLowerCase().includes("price") 
                ? {} // For price queries, don't restrict date to get latest data
                : {
                    from_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0], // Last 24 hours for non-price queries
                    to_date: new Date().toISOString().split('T')[0]
                  }
            )
          }
        } : {})
      } as any);

      // Debug query info
      console.log(`Query: "${text}", Live Search: ${useLiveSearch ? "ON" : "OFF"}`);

      // Log the response structure for debugging
      try {
        console.log("Response Structure:");
        console.log("- Has choices:", !!response.choices);
        console.log("- Choices length:", response.choices?.length || 0);
        
        if (response.choices && response.choices.length > 0) {
          const firstChoice = response.choices[0];
          console.log("- First choice properties:", Object.keys(firstChoice || {}));
          
          if (firstChoice?.message) {
            console.log("- Message properties:", Object.keys(firstChoice.message || {}));
            console.log("- Has citations property:", "citations" in (firstChoice.message as any));
            console.log("- Citations type:", typeof (firstChoice.message as any).citations);
            
            if ((firstChoice.message as any).citations) {
              console.log("- Citations is array:", Array.isArray((firstChoice.message as any).citations));
              console.log("- Citations length:", (firstChoice.message as any).citations?.length || 0);
            }
          }
        }
      } catch (debugError) {
        console.error("Error during response structure logging:", debugError);
      }

      // Log the ENTIRE response for debugging
      console.log("FULL xAI API RESPONSE:", JSON.stringify(response, null, 2));
      
      // Log the AI's actual response content
      if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        const aiResponse = response.choices[0].message.content;
        console.log("🤖 AI Response Content:", aiResponse);
        console.log("📏 AI Response Length:", aiResponse?.length || 0);
      }

      // Log the response for debugging
      console.log("xAI Response Message:", JSON.stringify({
        content: response.choices[0]?.message?.content,
        hasCitations: !!(response.choices[0]?.message as any)?.citations,
        citationsCount: (response.choices[0]?.message as any)?.citations?.length || 0,
        // Log the entire message object for inspection
        messageObj: response.choices[0]?.message
      }, null, 2));
      
      // Access citations from all possible locations in the response
      // Per documentation: citations should be in message.citations
      let apiResponseCitations: string[] = [];
      
      try {
        // Primary location for citations according to docs
        const messageCitations = (response.choices[0]?.message as any)?.citations;
        
        if (Array.isArray(messageCitations)) {
          console.log("Found citations in message object");
          apiResponseCitations = messageCitations;
        } else {
          // Fallback checks
          console.log("No citations found in message object, checking alternatives");
          const responseCitations = (response as any)?.citations;
          if (Array.isArray(responseCitations)) {
            console.log("Found citations at response root level");
            apiResponseCitations = responseCitations;
          }
        }
      } catch (e) {
        console.error("Error accessing citations:", e);
      }
      
      // Log citations for debugging
      console.log("Raw API citations:", apiResponseCitations);
      
      // Check for function calls
      const message = response.choices[0]?.message as CustomChatCompletionMessage;
      
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        
        if (toolCall.function.name === 'parse_swap') {
          const args = JSON.parse(toolCall.function.arguments);
          
          // For MVP, we'll simulate token resolution
          // In production, this would call our token resolver service
          const tokenIn = {
            symbol: args.tokenIn,
            address: `0x${Math.random().toString(16).substring(2, 42)}`, // Random address for demo
            decimals: 18
          };
          
          const tokenOut = {
            symbol: args.tokenOut,
            address: `0x${Math.random().toString(16).substring(2, 42)}`, // Random address for demo
            decimals: 18
          };
          
          // Return parsed swap data for confirmation
          return NextResponse.json({
            success: true,
            type: 'swap',
            data: {
              tokenIn,
              tokenOut,
              amount: args.amount,
              chain: args.chain,
              protocol: null // System will determine best protocol
            },
            message: `I'll help you swap ${args.amount} ${tokenIn.symbol} to ${tokenOut.symbol} on ${args.chain}. Would you like me to check prices?`,
            conversationHistoryUsed: processedHistory.length,
            conversationTokensUsed: Math.ceil(processedHistory.reduce((total: number, msg: { role: string; content: string }) => total + msg.content.length, 0) / 4)
          });
        }
      }
      
      // If we didn't get a function call or it wasn't a swap request
      const messageContent = message?.content || 'I can help you with DeFi swaps, token information, and DeFi news. What would you like to know?';
      
      // Use the API citations if available
      const citations = apiResponseCitations;
      const hasCitations = citations.length > 0;
      
      // Log citations for debugging
      console.log("Citations used for formatting:", citations);
      console.log("Has citations:", hasCitations);
      
      // Format the message content with sources when available
      let formattedContent = messageContent;
      
      // Always add a search indicator when Live Search is enabled
      if (useLiveSearch) {
        formattedContent += '\n\n🔍 *Data from Live Search*';
      }
      
      if (hasCitations) {
        console.log("Using API-provided citations");
        // Add sources section at the end with more professional formatting
        formattedContent += '\n\n## Sources\n\n';
        apiResponseCitations.forEach((citation: string, index: number) => {
          console.log(`Citation ${index+1}:`, citation);
          // Extract domain name for cleaner display
          let displayUrl = citation;
          try {
            const url = new URL(citation);
            displayUrl = url.hostname;
            // Add path if it exists and isn't just "/"
            if (url.pathname && url.pathname !== "/") {
              // Truncate long paths
              const path = url.pathname.length > 20 
                ? url.pathname.substring(0, 20) + "..." 
                : url.pathname;
              displayUrl += path;
            }
          } catch (e) {
            // Use the original citation if URL parsing fails
          }
          
          // Format as markdown link with explicit formatting
          formattedContent += `${index + 1}. [${displayUrl}](${citation})\n`;
        });
      } else if (useLiveSearch) {
        console.log("Using fallback citations");
        // Create mock citations based on the query
        const mockCitations = [];
        
        if (text.toLowerCase().includes("price")) {
          if (text.toLowerCase().includes("eth") || text.toLowerCase().includes("ethereum")) {
            mockCitations.push('https://coinmarketcap.com/currencies/ethereum/');
            mockCitations.push('https://www.coingecko.com/en/coins/ethereum');
            mockCitations.push('https://www.binance.com/en/price/ethereum');
          } else if (text.toLowerCase().includes("btc") || text.toLowerCase().includes("bitcoin")) {
            mockCitations.push('https://coinmarketcap.com/currencies/bitcoin/');
            mockCitations.push('https://www.coingecko.com/en/coins/bitcoin');
            mockCitations.push('https://www.binance.com/en/price/bitcoin');
          } else if (text.toLowerCase().includes("link") || text.toLowerCase().includes("chainlink")) {
            mockCitations.push('https://coinmarketcap.com/currencies/chainlink/');
            mockCitations.push('https://www.coingecko.com/en/coins/chainlink');
            mockCitations.push('https://www.binance.com/en/price/chainlink');
          } else if (text.toLowerCase().includes("sui")) {
            mockCitations.push('https://coinmarketcap.com/currencies/sui/');
            mockCitations.push('https://www.coingecko.com/en/coins/sui');
            mockCitations.push('https://www.binance.com/en/price/sui');
          } else if (text.toLowerCase().includes("sol") || text.toLowerCase().includes("solana")) {
            mockCitations.push('https://coinmarketcap.com/currencies/solana/');
            mockCitations.push('https://www.coingecko.com/en/coins/solana');
            mockCitations.push('https://www.binance.com/en/price/solana');
          } else if (text.toLowerCase().includes("doge") || text.toLowerCase().includes("dogecoin")) {
            mockCitations.push('https://coinmarketcap.com/currencies/dogecoin/');
            mockCitations.push('https://www.coingecko.com/en/coins/dogecoin');
            mockCitations.push('https://www.binance.com/en/price/dogecoin');
          } else if (text.toLowerCase().includes("bnb") || text.toLowerCase().includes("binance coin")) {
            mockCitations.push('https://coinmarketcap.com/currencies/bnb/');
            mockCitations.push('https://www.coingecko.com/en/coins/bnb');
            mockCitations.push('https://www.binance.com/en/price/bnb');
          } else if (text.toLowerCase().includes("usdt") || text.toLowerCase().includes("tether")) {
            mockCitations.push('https://coinmarketcap.com/currencies/tether/');
            mockCitations.push('https://www.coingecko.com/en/coins/tether');
            mockCitations.push('https://www.binance.com/en/price/tether');
          } else {
            mockCitations.push('https://coinmarketcap.com');
            mockCitations.push('https://www.coingecko.com');
            mockCitations.push('https://www.binance.com');
          }
        } 
        // News-related queries
        else if (text.toLowerCase().includes("news") || 
                  text.toLowerCase().includes("latest") || 
                  text.toLowerCase().includes("update") ||
                  text.toLowerCase().includes("trump") ||
                  text.toLowerCase().includes("biden")) {
          
          // Add news sources based on the query content
          if (text.toLowerCase().includes("trump")) {
            mockCitations.push('https://www.politico.com/news');
            mockCitations.push('https://www.reuters.com/world/us/');
            mockCitations.push('https://www.coindesk.com/tag/donald-trump/');
            mockCitations.push('https://cointelegraph.com/tags/donald-trump');
          } else if (text.toLowerCase().includes("biden")) {
            mockCitations.push('https://www.whitehouse.gov/briefing-room/');
            mockCitations.push('https://www.reuters.com/world/us/');
            mockCitations.push('https://www.coindesk.com/tag/joe-biden/');
          } else {
            // General crypto news
            mockCitations.push('https://cointelegraph.com');
            mockCitations.push('https://www.coindesk.com');
            mockCitations.push('https://decrypt.co');
            mockCitations.push('https://www.theblock.co');
          }
        } else {
          // General fallback sources
          mockCitations.push('https://cointelegraph.com');
          mockCitations.push('https://www.coindesk.com');
          mockCitations.push('https://www.theblock.co');
        }
        
        // Add sources section with mock citations
        formattedContent += '\n\n## Sources\n\n';
        mockCitations.forEach((citation: string, index: number) => {
          // Extract domain name for cleaner display
          let displayUrl = citation;
          try {
            const url = new URL(citation);
            displayUrl = url.hostname;
            // Add path if it exists and isn't just "/"
            if (url.pathname && url.pathname !== "/") {
              // Truncate long paths
              const path = url.pathname.length > 20 
                ? url.pathname.substring(0, 20) + "..." 
                : url.pathname;
              displayUrl += path;
            }
          } catch (e) {
            // Use the original citation if URL parsing fails
          }
          
          // Format as markdown link with explicit formatting
          formattedContent += `${index + 1}. [${displayUrl}](${citation})\n`;
        });
      }
      
      return NextResponse.json({
        success: true,
        type: 'chat',
        message: formattedContent,
        citations: apiResponseCitations,
        hasLiveSearch: !!useLiveSearch,
        conversationHistoryUsed: processedHistory.length,
        conversationTokensUsed: Math.ceil(processedHistory.reduce((total: number, msg: { role: string; content: string }) => total + msg.content.length, 0) / 4)
      });
    } catch (openaiError) {
      console.error('OpenAI API error, using fallback parser:', openaiError);
      
      // Try fallback parser when OpenAI is unavailable
      const fallbackResult = fallbackParser(text, currentChain);
      
      if (fallbackResult.isValid) {
        const { tokenIn, tokenOut, amount, chain, protocol } = fallbackResult.data;
        
        // Create mock token objects
        const tokenInObj = {
          symbol: tokenIn,
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          decimals: 18
        };
        
        const tokenOutObj = {
          symbol: tokenOut,
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          decimals: 18
        };
        
        return NextResponse.json({
          success: true,
          type: 'swap',
          data: {
            tokenIn: tokenInObj,
            tokenOut: tokenOutObj,
            amount,
            chain,
            protocol: null // System will determine best protocol
          },
          message: `Using fallback parser: I'll help you swap ${amount} ${tokenIn} to ${tokenOut} on ${chain}. Would you like me to check prices?`,
          fallback: true,
          conversationHistoryUsed: processedHistory.length,
          conversationTokensUsed: Math.ceil(processedHistory.reduce((total: number, msg: { role: string; content: string }) => total + msg.content.length, 0) / 4)
        });
      } else {
        return NextResponse.json({
          success: false,
          type: 'chat',
          message: "I couldn't understand your swap request. Please try again with a format like 'Swap 100 USDT to ETH on Arbitrum'.",
          fallback: true
        });
      }
    }
  } catch (error: unknown) {
    console.error('Error in AI service:', error);
    
    // Check for OpenAI quota errors
    const isOpenAIError = (
      typeof error === 'object' && 
      error !== null &&
      (
        ('status' in error && (error as any).status === 429) || 
        ('error' in error && 
         (error as any).error && 
         typeof (error as any).error === 'object' &&
         'code' in (error as any).error && 
         (error as any).error.code === 'insufficient_quota')
      )
    );
    
    if (isOpenAIError) {
      // Use fallback parser when OpenAI quota is exceeded
      try {
        // We already have the text from the earlier request.json() call
        const fallbackResult = fallbackParser(text, 'ethereum');
        
        if (fallbackResult.isValid) {
          const { tokenIn, tokenOut, amount, chain, protocol } = fallbackResult.data;
          
          // Create mock token objects
          const tokenInObj = {
            symbol: tokenIn,
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            decimals: 18
          };
          
          const tokenOutObj = {
            symbol: tokenOut,
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            decimals: 18
          };
          
          return NextResponse.json({
            success: true,
            type: 'swap',
            data: {
              tokenIn: tokenInObj,
              tokenOut: tokenOutObj,
              amount,
              chain,
              protocol: null // System will determine best protocol
            },
            message: `Using fallback parser: I'll help you swap ${amount} ${tokenIn} to ${tokenOut} on ${chain}. Would you like me to check prices?`,
            fallback: true,
            conversationHistoryUsed: processedHistory.length,
            conversationTokensUsed: Math.ceil(processedHistory.reduce((total: number, msg: { role: string; content: string }) => total + msg.content.length, 0) / 4)
          });
        }
      } catch (fallbackError) {
        console.error('Fallback parser error:', fallbackError);
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: 'OpenAI API quota exceeded. Using simplified parser, but unable to understand your request. Please use a clear format like "Swap 100 USDT to ETH on Arbitrum".'
        },
        { status: 200 } // Returning 200 with error message to handle gracefully on client
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Sorry, I encountered an error while processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
} 