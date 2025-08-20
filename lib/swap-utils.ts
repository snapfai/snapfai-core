/**
 * Formats token amount with appropriate decimals for the token
 * @param amount Raw amount as a number
 * @param decimals Token decimals (usually 18 for most ERC20 tokens)
 * @returns Formatted amount as a string
 */
export const formatTokenAmount = (amount: number, decimals: number): string => {
  // Use BigInt to handle large numbers precisely
  // Convert to string with fixed decimals to avoid floating point issues
  const fixedAmount = amount.toFixed(decimals);
  const parts = fixedAmount.split('.');
  
  // Handle whole numbers
  if (parts.length === 1 || !parts[1]) {
    return (BigInt(parts[0]) * BigInt(10 ** decimals)).toString();
  }
  
  // Handle decimal numbers
  const wholePart = parts[0];
  const decimalPart = parts[1].substring(0, decimals).padEnd(decimals, '0');
  
  // Combine and convert to BigInt to remove leading zeros
  const combined = wholePart + decimalPart;
  return BigInt(combined).toString();
};

/**
 * Formats token amount from chain format to human-readable format
 * @param amount Raw amount as a string
 * @param decimals Token decimals (usually 18 for most ERC20 tokens)
 * @returns Formatted amount as a number
 */
export const parseTokenAmount = (amount: string, decimals: number = 18): number => {
  return parseFloat(amount) / 10 ** decimals;
};

/**
 * Gets price data from the 0x API
 * @see https://0x.org/docs/swap-api/api-references/get-swap-v1-price
 */
export const getSwapPrice = async (params: {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress?: string; // We keep this in the interface for backward compatibility
  chainId?: number;
}) => {
  try {
    // Convert params to URL search params
    const searchParams = new URLSearchParams();
    
    // Handle special parameter mapping
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        // Convert takerAddress to taker for the 0x API
        if (key === 'takerAddress') {
          if (value) searchParams.append('taker', value.toString());
        } 
        // Convert chainId from number to string if needed
        else if (key === 'chainId') {
          searchParams.append(key, value.toString());
        }
        else {
          searchParams.append(key, value.toString());
        }
      }
    }
    
    console.log(`Calling price API: /api/swap/price?${searchParams.toString()}`);
    
    const response = await fetch(`/api/swap/price?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Price API error (${response.status}):`, errorText);
      
      try {
        // Try to parse the error as JSON
        const errorData = JSON.parse(errorText);
        return { error: errorData };
      } catch {
        // If it's not valid JSON, return a generic error
        return { error: { reason: `API returned ${response.status}` } };
      }
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Price API returned error:', data.error);
      return { error: data.error };
    }
    
    // Return the price data
    return data.data;
  } catch (error) {
    console.error('Error getting swap price:', error);
    return { error: { reason: error instanceof Error ? error.message : 'Unknown error' } };
  }
};

/**
 * Get a swap quote from the 0x API
 * @see https://0x.org/docs/swap-api/api-references/get-swap-v1-quote
 */
export const getSwapQuote = async (params: {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress: string; // We keep this in the interface for backward compatibility
  slippagePercentage?: number;
  chainId?: number;
}) => {
  try {
    // Convert params to URL search params
    const searchParams = new URLSearchParams();
    
    // Handle special parameter mapping
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        // Convert takerAddress to taker for the 0x API
        if (key === 'takerAddress') {
          if (value) searchParams.append('taker', value.toString());
        }
        // Convert chainId from number to string if needed
        else if (key === 'chainId') {
          searchParams.append(key, value.toString());
        }
        else {
          searchParams.append(key, value.toString());
        }
      }
    }
    
    // Add fee parameters for 10 bps (0.1%) fee
    // These will be handled by the API route
    // Note: Fee parameters are now handled server-side in the API route
    // The client just needs to pass the request and the API will add the fees
    
    console.log(`Calling quote API: /api/swap/quote?${searchParams.toString()}`);
    
    const response = await fetch(`/api/swap/quote?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Quote API error (${response.status}):`, errorText);
      
      try {
        // Try to parse the error as JSON
        const errorData = JSON.parse(errorText);
        return { error: errorData };
      } catch {
        // If it's not valid JSON, return a generic error
        return { error: { reason: `API returned ${response.status}` } };
      }
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Quote API returned error:', data.error);
      return { error: data.error };
    }
    
    // Return the quote data
    return data.data;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return { error: { reason: error instanceof Error ? error.message : 'Unknown error' } };
  }
}; 