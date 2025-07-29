// Script to add tokens from wallet to supported tokens list
const fs = require('fs');

// Tokens found in the wallet that we might want to support
const walletTokens = [
  {
    address: "0xec53bf9167f50cdeb3ae105f56099aaab9061f83",
    symbol: "EIGEN",
    decimals: 18,
    name: "Eigen",
    logoURI: "https://assets.coingecko.com/coins/images/35893/standard/eigen.png"
  },
  {
    address: "0xa41d2f8ee4f47d3b860a149765a7df8c3287b7f0",
    symbol: "SYNC",
    decimals: 9,
    name: "Syncus",
    logoURI: "https://assets.coingecko.com/coins/images/35893/standard/sync.png"
  },
  {
    address: "0xa3c534537b2831c1342200061090f962209b168f",
    symbol: "FIRE",
    decimals: 18,
    name: "Fire",
    logoURI: "https://assets.coingecko.com/coins/images/35893/standard/fire.png"
  },
  {
    address: "0x6a6bfdd2174ade27258fe96b9afae3758dec14f2",
    symbol: "SOLAR",
    decimals: 18,
    name: "Solareum",
    logoURI: "https://assets.coingecko.com/coins/images/35893/standard/solar.png"
  }
];

console.log('Tokens to add to supported list:');
walletTokens.forEach(token => {
  console.log(`- ${token.symbol} (${token.address})`);
});

console.log('\nTo add these tokens:');
console.log('1. Open lib/tokens.ts');
console.log('2. Find the TOKENS_BY_CHAIN[1] array (Ethereum)');
console.log('3. Add the token objects above to the array');
console.log('4. Make sure to add proper logoURI and verify the data'); 