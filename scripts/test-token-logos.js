const { findTokenByAddress, getTokensForChain } = require('./lib/tokens');

// Test some common tokens to see their logos
const testTokens = [
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', chainId: 1 },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', chainId: 1 },
  { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', chainId: 1 },
  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', chainId: 1 },
];

console.log('🔍 Testing token logos from tokens.ts...');
console.log('');

testTokens.forEach(({ address, symbol, chainId }) => {
  const token = findTokenByAddress(address, chainId);
  if (token) {
    console.log(`✅ ${symbol}:`);
    console.log(`   Address: ${token.address}`);
    console.log(`   Logo: ${token.logoURI || 'No logo'}`);
    console.log(`   Name: ${token.name}`);
    console.log('');
  } else {
    console.log(`❌ ${symbol} not found in tokens.ts`);
    console.log('');
  }
});

// Test getting all tokens for a chain
console.log('📊 All tokens for Ethereum (chain 1):');
const ethereumTokens = getTokensForChain(1);
console.log(`Found ${ethereumTokens.length} tokens`);
console.log('');

// Show first 5 tokens with logos
ethereumTokens.slice(0, 5).forEach(token => {
  console.log(`${token.symbol}: ${token.logoURI ? '✅ Has logo' : '❌ No logo'}`);
}); 