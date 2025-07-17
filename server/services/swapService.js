const axios = require('axios');
const fastJsonParse = require('fast-json-parse');

// API keys
const ZERO_X_API_KEY = process.env.ZERO_X_API_KEY;
const ODOS_API_KEY = process.env.ODOS_API_KEY;
const INFURA_KEY = process.env.INFURA_KEY;

// Base API URLs
const ZERO_X_BASE_URL = 'https://api.0x.org';
const ODOS_BASE_URL = 'https://api.odos.xyz';

// Import the centralized chain configuration
const { getChainId } = require('../../lib/chains');

// Chain ID mappings (keeping for backward compatibility)
const CHAIN_IDS = {
  ethereum: 1,
  arbitrum: 42161,
  sepolia: 11155111,
  base: 8453,
  polygon: 137,
  avalanche: 43114
};

/**
 * Get price quote from 0x API
 * @param {object} params - Swap parameters
 * @returns {Promise<object>} - Price quote
 */
async function getZeroXQuote(params) {
  try {
    const { tokenIn, tokenOut, amount, chain } = params;
    
    // Use the centralized chain resolution with fallback to legacy mapping
    let chainId = getChainId ? getChainId(chain) : null;
    if (!chainId) {
      chainId = CHAIN_IDS[chain.toLowerCase()];
    }
    if (!chainId) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    const url = `${ZERO_X_BASE_URL}/swap/v1/quote`;
    
    const response = await axios.get(url, {
      params: {
        sellToken: tokenIn.address,
        buyToken: tokenOut.address,
        sellAmount: amount * Math.pow(10, tokenIn.decimals), // Convert to token units
        chainId: chainId
      },
      headers: {
        '0x-api-key': ZERO_X_API_KEY
      }
    });
    
    return {
      price: response.data.price,
      guaranteedPrice: response.data.guaranteedPrice,
      estimatedGas: response.data.estimatedGas,
      to: response.data.to,
      data: response.data.data,
      value: response.data.value,
      buyAmount: response.data.buyAmount / Math.pow(10, tokenOut.decimals), // Convert from token units
      protocol: '0x',
      gasPrice: response.data.gasPrice,
      estimatedGasInToken: (response.data.estimatedGas * response.data.gasPrice) / 1e18
    };
  } catch (error) {
    console.error('Error getting 0x quote:', error.message);
    return null;
  }
}

/**
 * Get price quote from Odos API
 * @param {object} params - Swap parameters
 * @returns {Promise<object>} - Price quote
 */
async function getOdosQuote(params) {
  try {
    const { tokenIn, tokenOut, amount, chain } = params;
    
    // Use the centralized chain resolution with fallback to legacy mapping
    let chainId = getChainId ? getChainId(chain) : null;
    if (!chainId) {
      chainId = CHAIN_IDS[chain.toLowerCase()];
    }
    if (!chainId) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    // First get a path quote
    const pathUrl = `${ODOS_BASE_URL}/api/v2/simulate/paths`;
    const inputAmount = (amount * Math.pow(10, tokenIn.decimals)).toString(); // Convert to token units
    
    const pathResponse = await axios.post(pathUrl, {
      chainId: chainId,
      inputTokens: [
        {
          tokenAddress: tokenIn.address,
          amount: inputAmount
        }
      ],
      outputTokens: [
        {
          tokenAddress: tokenOut.address,
          proportion: 1
        }
      ],
      slippageLimitPercent: 1.0,
      userAddress: "0x0000000000000000000000000000000000000000", // Will be replaced with actual address during execution
      referralCode: 0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ODOS_API_KEY
      }
    });
    
    const pathId = pathResponse.data.pathId;
    
    // Now get an assembly quote with the path ID
    const assemblyUrl = `${ODOS_BASE_URL}/api/v2/assemble`;
    const assemblyResponse = await axios.post(assemblyUrl, {
      pathId: pathId,
      userAddr: "0x0000000000000000000000000000000000000000" // Will be replaced with actual address during execution
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ODOS_API_KEY
      }
    });
    
    const transaction = assemblyResponse.data.transaction;
    const outAmount = pathResponse.data.outputTokens[0].amount / Math.pow(10, tokenOut.decimals); // Convert from token units
    const price = outAmount / amount;
    
    return {
      price: price,
      guaranteedPrice: price * 0.99, // Apply 1% slippage
      estimatedGas: transaction.gas,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value || '0',
      buyAmount: outAmount,
      protocol: 'odos',
      gasPrice: transaction.gasPrice,
      estimatedGasInToken: (transaction.gas * transaction.gasPrice) / 1e18
    };
  } catch (error) {
    console.error('Error getting Odos quote:', error.message);
    return null;
  }
}

/**
 * Get the best swap quote from multiple protocols
 * @param {object} params - Swap parameters
 * @returns {Promise<object>} - Best price quote
 */
async function getBestSwapQuote(params) {
  try {
    // Get quotes from both protocols in parallel
    const [zeroXQuote, odosQuote] = await Promise.all([
      getZeroXQuote(params),
      getOdosQuote(params)
    ]);
    
    // Filter out null quotes (failed or unsupported)
    const quotes = [zeroXQuote, odosQuote].filter(quote => quote !== null);
    
    if (quotes.length === 0) {
      throw new Error('Could not get any valid quotes');
    }
    
    // Find the quote with the highest effective output amount (after gas costs if on mainnet)
    return quotes.reduce((best, current) => {
      // Consider gas costs only on Ethereum mainnet
      const bestEffectiveAmount = best.buyAmount - (params.chain.toLowerCase() === 'ethereum' ? best.estimatedGasInToken : 0);
      const currentEffectiveAmount = current.buyAmount - (params.chain.toLowerCase() === 'ethereum' ? current.estimatedGasInToken : 0);
      
      return currentEffectiveAmount > bestEffectiveAmount ? current : best;
    });
  } catch (error) {
    console.error('Error getting best swap quote:', error);
    throw error;
  }
}

/**
 * Confirm a swap by getting the best price
 * @param {object} data - Swap data
 * @param {object} redisClient - Redis client for storing pending swap
 * @returns {Promise<object>} - Confirmation details
 */
async function confirmSwap(data, redisClient) {
  try {
    // If a specific protocol was requested, use only that one
    let quote;
    if (data.protocol) {
      if (data.protocol.toLowerCase() === '0x') {
        quote = await getZeroXQuote(data);
      } else if (data.protocol.toLowerCase() === 'odos') {
        quote = await getOdosQuote(data);
      } else {
        throw new Error(`Unsupported protocol: ${data.protocol}`);
      }
    } else {
      // Otherwise, get the best quote
      quote = await getBestSwapQuote(data);
    }
    
    if (!quote) {
      return {
        success: false,
        message: `I couldn't get a price quote for this swap. Please try again or try a different token pair.`
      };
    }
    
    // Store the full swap details in Redis
    const pendingSwap = {
      ...data,
      quote,
      timestamp: Date.now()
    };
    
    await redisClient.set(`pendingSwap:${data.userId}`, JSON.stringify(pendingSwap), {
      EX: 300 // Expire after 5 minutes
    });
    
    // Return confirmation message
    return {
      success: true,
      message: `I found the best rate on ${quote.protocol}: ${data.amount} ${data.tokenIn.symbol} ≈ ${quote.buyAmount.toFixed(6)} ${data.tokenOut.symbol}. Would you like to proceed with this swap?`,
      details: {
        tokenIn: data.tokenIn.symbol,
        tokenOut: data.tokenOut.symbol,
        amountIn: data.amount,
        amountOut: quote.buyAmount.toFixed(6),
        protocol: quote.protocol,
        chain: data.chain
      }
    };
  } catch (error) {
    console.error('Error confirming swap:', error);
    return {
      success: false,
      message: `I encountered an error while getting price quotes: ${error.message}. Please try again later.`
    };
  }
}

module.exports = { confirmSwap, getBestSwapQuote }; 