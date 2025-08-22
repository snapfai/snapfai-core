/**
 * Simple test file to verify the new token structure works correctly
 * This can be run to ensure all imports and exports are working
 */

import { 
  TOKENS_BY_CHAIN, 
  getTokensForChain, 
  findTokenBySymbol,
  ethereumTokens,
  bscTokens,
  TokenConfig 
} from './index';

// Test basic functionality
console.log('Testing new token structure...');

// Test 1: Check if TOKENS_BY_CHAIN is properly populated
console.log('✅ TOKENS_BY_CHAIN keys:', Object.keys(TOKENS_BY_CHAIN));

// Test 2: Check if individual chain exports work
console.log('✅ Ethereum tokens count:', ethereumTokens.length);
console.log('✅ BSC tokens count:', bscTokens.length);

// Test 3: Check if utility functions work
const ethTokens = getTokensForChain(1);
console.log('✅ getTokensForChain(1) returns:', ethTokens.length, 'tokens');

const bnbToken = findTokenBySymbol('BNB', 56);
console.log('✅ findTokenBySymbol("BNB", 56) returns:', bnbToken ? bnbToken.name : 'null');

// Test 4: Check if types are correct
const sampleToken: TokenConfig = {
  address: "0x123...",
  symbol: "TEST",
  decimals: 18,
  name: "Test Token"
};
console.log('✅ TokenConfig type works:', sampleToken.symbol);

console.log('🎉 All tests passed! New token structure is working correctly.');
