#!/usr/bin/env node

/**
 * Utility script to check token prices using various APIs
 * Usage: node scripts/check-token-price.js 0xE90cC7d807712b2b41632f3900c8bd19BdC502b1
 */

const https = require('https');
const readline = require('readline');

// API configuration
const APIS = {
  coingecko: {
    url: 'api.coingecko.com',
    path: '/api/v3/simple/token_price/ethereum',
    name: 'CoinGecko'
  },
  etherscan: {
    url: 'api.etherscan.io',
    path: '/api',
    name: 'Etherscan'
  }
};

// Helper function to make HTTPS requests
function makeRequest(hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'SnapFAI Token Price Checker',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          resolve({ error: 'Invalid JSON response', raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

// Check token price using CoinGecko API
async function checkCoinGeckoPrice(tokenAddress) {
  console.log(`\n🦎 Checking CoinGecko API...`);
  
  try {
    const path = `${APIS.coingecko.path}?contract_addresses=${tokenAddress}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    const data = await makeRequest(APIS.coingecko.url, path);
    
    if (data.error) {
      console.log(`❌ CoinGecko Error: ${data.error}`);
      return null;
    }
    
    const tokenData = data[tokenAddress.toLowerCase()];
    if (tokenData) {
      console.log(`✅ CoinGecko Price Found:`);
      console.log(`   Price: $${tokenData.usd}`);
      console.log(`   24h Change: ${tokenData.usd_24h_change?.toFixed(2) || 'N/A'}%`);
      console.log(`   Market Cap: $${tokenData.usd_market_cap || 'N/A'}`);
      console.log(`   24h Volume: $${tokenData.usd_24h_vol || 'N/A'}`);
      return tokenData;
    } else {
      console.log(`❌ Token not found on CoinGecko`);
      return null;
    }
  } catch (error) {
    console.log(`❌ CoinGecko API Error: ${error.message}`);
    return null;
  }
}

// Verify token exists using Etherscan
async function verifyTokenWithEtherscan(tokenAddress, apiKey = 'YourApiKeyToken') {
  console.log(`\n🔍 Verifying token with Etherscan...`);
  
  try {
    // Check if contract exists
    const codePath = `${APIS.etherscan.path}?module=proxy&action=eth_getCode&address=${tokenAddress}&tag=latest&apikey=${apiKey}`;
    const codeData = await makeRequest(APIS.etherscan.url, codePath);
    
    if (codeData.result && codeData.result !== '0x') {
      console.log(`✅ Contract exists on Ethereum`);
      
      // Get token symbol and name
      try {
        const symbolPath = `${APIS.etherscan.path}?module=proxy&action=eth_call&to=${tokenAddress}&data=0x95d89b41&tag=latest&apikey=${apiKey}`;
        const symbolData = await makeRequest(APIS.etherscan.url, symbolPath);
        
        console.log(`   Contract Address: ${tokenAddress}`);
        console.log(`   Contract Code: ${codeData.result.slice(0, 50)}...`);
        
        return true;
      } catch (error) {
        console.log(`⚠️  Could not fetch token metadata: ${error.message}`);
        return true; // Contract exists but metadata fetch failed
      }
    } else {
      console.log(`❌ Contract does not exist or is not verified`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Etherscan API Error: ${error.message}`);
    return false;
  }
}

// Check DEX price using 1inch API
async function checkDexPrice(tokenAddress) {
  console.log(`\n💱 Checking DEX prices...`);
  
  try {
    // This is a simplified example - in practice you'd need to query liquidity pools
    console.log(`   Checking Uniswap V2/V3 pools for ${tokenAddress}`);
    console.log(`   Note: DEX price checking requires more complex pool queries`);
    console.log(`   Recommended: Use Uniswap subgraph or 1inch API`);
    
    // Example URLs for manual checking:
    console.log(`\n📊 Manual price check URLs:`);
    console.log(`   Etherscan: https://etherscan.io/token/${tokenAddress}`);
    console.log(`   DexScreener: https://dexscreener.com/ethereum/${tokenAddress}`);
    console.log(`   Uniswap: https://app.uniswap.org/#/tokens/ethereum/${tokenAddress}`);
    
  } catch (error) {
    console.log(`❌ DEX price check error: ${error.message}`);
  }
}

// Main function
async function checkTokenPrice() {
  const tokenAddress = process.argv[2] || '0xE90cC7d807712b2b41632f3900c8bd19BdC502b1';
  
  console.log(`🪙 KUMA Token Price Checker`);
  console.log(`📍 Token Address: ${tokenAddress}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  
  // 1. Check CoinGecko
  const coingeckoPrice = await checkCoinGeckoPrice(tokenAddress);
  
  // 2. Verify with Etherscan
  const etherscanVerified = await verifyTokenWithEtherscan(tokenAddress);
  
  // 3. Check DEX prices
  await checkDexPrice(tokenAddress);
  
  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   CoinGecko: ${coingeckoPrice ? `$${coingeckoPrice.usd}` : 'Not found'}`);
  console.log(`   Etherscan: ${etherscanVerified ? 'Verified' : 'Not found'}`);
  
  if (coingeckoPrice) {
    console.log(`\n💡 Recommended price to use: $${coingeckoPrice.usd}`);
    console.log(`   This should be added to your special-tokens.ts file`);
  } else {
    console.log(`\n💡 Recommendation: Use fallback price in special-tokens.ts`);
    console.log(`   Consider manually setting a price based on DEX data`);
  }
  
  // Code example
  console.log(`\n🔧 Code to add to special-tokens.ts:`);
  console.log(`'KUMA': { price: ${coingeckoPrice?.usd || '0.000000015'}, change24h: ${coingeckoPrice?.usd_24h_change?.toFixed(2) || '0'} }`);
}

// Run the script
if (require.main === module) {
  checkTokenPrice().catch(console.error);
}

module.exports = { checkCoinGeckoPrice, verifyTokenWithEtherscan, checkDexPrice }; 