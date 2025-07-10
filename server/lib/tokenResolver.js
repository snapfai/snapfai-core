const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const { SUPPORTED_CHAINS } = require('../../lib/chains');
const { resolveToken, getTokensForChain } = require('../../lib/tokens');

// Cache for resolved tokens
let tokenCache = {};
let tokenListLoaded = false;

/**
 * Load token list from Uniswap and other sources
 * @returns {Promise<void>}
 */
async function loadTokenList() {
  try {
    // Primary source: Uniswap Token List
    const response = await axios.get('https://gateway.ipfs.io/ipns/tokens.uniswap.org');
    const tokenList = response.data;
    
    // Initialize cache for all supported chains
    Object.keys(SUPPORTED_CHAINS).forEach(chainKey => {
      const chainId = SUPPORTED_CHAINS[chainKey].id;
      if (!tokenCache[chainKey]) tokenCache[chainKey] = {};
    });
    
    // Process tokens from Uniswap list
    tokenList.tokens.forEach(token => {
      const chainId = token.chainId;
      const symbol = token.symbol.toLowerCase();
      const address = token.address.toLowerCase();
      
      // Find the chain key for this chainId
      const chainKey = Object.keys(SUPPORTED_CHAINS).find(
        key => SUPPORTED_CHAINS[key].id === chainId
      );
      
      if (chainKey && !tokenCache[chainKey][symbol]) {
        tokenCache[chainKey][symbol] = {
          address,
          symbol: token.symbol,
          decimals: token.decimals,
          name: token.name,
          logo: token.logoURI
        };
      }
    });
    
    // Secondary source: CoinGecko top tokens
    try {
      const coinGeckoResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1
        }
      });
      
      // Add any missing tokens from CoinGecko (limited info, just for fallback)
      coinGeckoResponse.data.forEach(token => {
        const symbol = token.symbol.toLowerCase();
        
        // Only add to ethereum if not already in cache
        if (!tokenCache.ethereum[symbol]) {
          tokenCache.ethereum[symbol] = {
            symbol: token.symbol.toUpperCase(),
            name: token.name,
            // Missing fields will be populated if/when we get more info
            cgId: token.id
          };
        }
      });
    } catch (error) {
      console.warn('Error loading CoinGecko data:', error.message);
    }
    
    // Save to disk for faster loading next time
    const cacheDir = path.join(__dirname, '../cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(cacheDir, 'tokenCache.json'),
      JSON.stringify(tokenCache, null, 2)
    );
    
    tokenListLoaded = true;
    console.log('Token list loaded successfully');
  } catch (error) {
    console.error('Error loading token list:', error);
    
    // Try to load from local cache as fallback
    try {
      const cachePath = path.join(__dirname, '../cache/tokenCache.json');
      if (fs.existsSync(cachePath)) {
        tokenCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        tokenListLoaded = true;
        console.log('Token list loaded from local cache');
      }
    } catch (fallbackError) {
      console.error('Error loading token cache from disk:', fallbackError);
    }
  }
}

/**
 * Resolve a token symbol or address to token details
 * @param {string} tokenIdentifier - Token symbol or address
 * @param {string} chain - Chain name (ethereum, arbitrum, base, etc.)
 * @returns {Promise<object|null>} - Token details or null if not found
 */
async function resolveTokenSymbol(tokenIdentifier, chain = 'ethereum') {
  // Ensure token list is loaded
  if (!tokenListLoaded) {
    await loadTokenList();
  }
  
  // Normalize inputs
  const normalizedChain = chain.toLowerCase();
  const normalizedIdentifier = tokenIdentifier.toLowerCase();
  
  // First try the centralized token configuration
  const chainConfig = SUPPORTED_CHAINS[normalizedChain];
  if (chainConfig) {
    const tokenFromConfig = resolveToken(tokenIdentifier, chainConfig.id);
    if (tokenFromConfig) {
      return {
        address: tokenFromConfig.address,
        symbol: tokenFromConfig.symbol,
        decimals: tokenFromConfig.decimals,
        name: tokenFromConfig.name,
        logo: tokenFromConfig.logoURI
      };
    }
  }
  
  // Check if it's already an address
  if (ethers.utils.isAddress(normalizedIdentifier)) {
    // Look up by address in our cache
    const chainTokens = tokenCache[normalizedChain] || {};
    for (const [symbol, details] of Object.entries(chainTokens)) {
      if (details.address && details.address.toLowerCase() === normalizedIdentifier) {
        return details;
      }
    }
    
    // If not found in cache, return basic info with the address
    return {
      address: normalizedIdentifier,
      symbol: 'UNKNOWN',
      decimals: 18, // Default to 18 decimals
      name: 'Unknown Token'
    };
  }
  
  // Look up by symbol in cache
  const chainTokens = tokenCache[normalizedChain] || {};
  if (chainTokens[normalizedIdentifier]) {
    return chainTokens[normalizedIdentifier];
  }
  
  // Special case handling for common tokens
  if (normalizedIdentifier === 'eth') {
    return {
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Special address for ETH
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum'
    };
  }
  
  // Handle native tokens for different chains
  if (chainConfig) {
    const nativeSymbol = chainConfig.symbol.toLowerCase();
    if (normalizedIdentifier === nativeSymbol) {
      // Get the native token from our configuration
      const tokens = getTokensForChain(chainConfig.id);
      const nativeToken = tokens.find(token => token.isNative);
      if (nativeToken) {
        return {
          address: nativeToken.address,
          symbol: nativeToken.symbol,
          decimals: nativeToken.decimals,
          name: nativeToken.name,
          logo: nativeToken.logoURI
        };
      }
    }
  }
  
  // Try to fetch from CoinGecko as a last resort (only for Ethereum)
  if (normalizedChain === 'ethereum') {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${normalizedIdentifier}`);
      const tokenData = response.data;
      
      return {
        address: tokenData.contract_address.toLowerCase(),
        symbol: tokenData.symbol.toUpperCase(),
        decimals: tokenData.detail_platforms.ethereum.decimal_place || 18,
        name: tokenData.name,
        logo: tokenData.image.small
      };
    } catch (error) {
      console.warn(`Could not resolve token ${tokenIdentifier} on ${chain}:`, error.message);
    }
  }
  
  return null;
}

// Load token list on startup
loadTokenList();

module.exports = { resolveTokenSymbol }; 