const ethers = require('ethers');
const { getBestSwapQuote } = require('./swapService');

// Chain RPC URLs
const RPC_URLS = {
  ethereum: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
  arbitrum: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`
};

/**
 * Execute a swap transaction
 * @param {object} swapData - Data for the swap to execute
 * @returns {Promise<object>} - Result of the execution
 */
async function executeSwap(swapData) {
  try {
    const { tokenIn, tokenOut, amount, chain, quote, userId } = swapData;
    
    // In a real implementation, we would connect to the user's wallet using Web3Modal
    // and sign the transaction. For the MVP, we'll just return the transaction data
    // that would be sent to the user's wallet for signing.
    
    // Get chain RPC URL
    const rpcUrl = RPC_URLS[chain.toLowerCase()];
    if (!rpcUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    // Create a read-only provider for transaction validation
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // If the quote is expired (>2 min), get a new one
    const quoteTimestamp = swapData.timestamp || Date.now();
    const quoteAge = Date.now() - quoteTimestamp;
    
    let finalQuote = quote;
    if (quoteAge > 120000) { // 2 minutes
      console.log('Quote expired, getting a new one');
      finalQuote = await getBestSwapQuote({
        tokenIn,
        tokenOut,
        amount,
        chain
      });
    }
    
    // Prepare transaction data
    const transactionData = {
      to: finalQuote.to,
      data: finalQuote.data,
      value: finalQuote.value || '0',
      gasLimit: Math.ceil(finalQuote.estimatedGas * 1.2), // Add 20% buffer
      chainId: chain.toLowerCase() === 'ethereum' ? 1 : 42161
    };
    
    // Format transaction for frontend
    return {
      success: true,
      message: `Your swap is ready to be executed. Please sign the transaction in your wallet.`,
      transaction: {
        ...transactionData,
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountIn: amount,
        estimatedAmountOut: finalQuote.buyAmount,
        protocol: finalQuote.protocol
      }
    };
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      message: `I encountered an error while preparing your swap: ${error.message}. Please try again later.`
    };
  }
}

/**
 * Setup a price trigger for automated swaps
 * @param {object} triggerData - Data for the price trigger
 * @param {object} redisClient - Redis client for storing trigger
 * @returns {Promise<object>} - Result of setting up the trigger
 */
async function setupPriceTrigger(triggerData, redisClient) {
  try {
    const { userId, tokenIn, tokenOut, amount, chain, triggerPrice, triggerCondition } = triggerData;
    
    // Store trigger in Redis
    const triggerId = `trigger:${Date.now()}:${userId}`;
    const triggerKey = `priceTrigger:${userId}:${triggerId}`;
    
    await redisClient.set(triggerKey, JSON.stringify({
      userId,
      tokenIn,
      tokenOut,
      amount,
      chain,
      triggerPrice,
      triggerCondition, // 'above' or 'below'
      status: 'active',
      createdAt: Date.now()
    }), {
      EX: 86400 * 7 // Expire after 7 days
    });
    
    // Add to user's trigger list
    const userTriggerListKey = `priceTriggers:${userId}`;
    await redisClient.sAdd(userTriggerListKey, triggerId);
    
    return {
      success: true,
      message: `I've set up a price trigger to swap ${amount} ${tokenIn.symbol} to ${tokenOut.symbol} when the price is ${triggerCondition} ${triggerPrice}. I'll notify you when the trigger is executed.`,
      triggerId
    };
  } catch (error) {
    console.error('Error setting up price trigger:', error);
    return {
      success: false,
      message: `I encountered an error while setting up your price trigger: ${error.message}. Please try again later.`
    };
  }
}

module.exports = { executeSwap, setupPriceTrigger }; 