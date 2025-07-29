#!/usr/bin/env node

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';

console.log(`🔍 Testing wallet: ${WALLET_ADDRESS}`);
console.log('='.repeat(60));

// Test the special tokens that should be found
const specialTokens = [
  { symbol: 'KUMA', address: '0x48c276e8d03813224bb1e55f953adb6d02fd3e02' },
  { symbol: 'FORCE', address: '0x357D655b7a69634D46BEad5ee13362AD3926Fb1c' },
  { symbol: 'SYNC', address: '0xa41d2f8Ee4F47D3B860A149765A7dF8c3287b7F0' },
  { symbol: 'CHEW', address: '0x5e2aCeb24041E11E0eddf3a79154C60ab8cfa3e1' },
  { symbol: 'POL', address: '0x455e53aaBb28e001ae1657c3442C87FaE3d4cfC8' },
  { symbol: 'DOGEN', address: '0x3832d2F059EaFd8281c4a9a6c7b1b5c7b2c7b1b5' }
];

console.log('\n📋 Special tokens to check:');
specialTokens.forEach(token => {
  console.log(`  ${token.symbol}: ${token.address}`);
});

console.log('\n✅ Test script ready. Check the browser console for debug output.');
console.log('   Navigate to http://localhost:3000/portfolio to see the results.'); 