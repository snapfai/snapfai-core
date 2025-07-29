#!/usr/bin/env node

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';

console.log(`🔍 Testing ETH balance for wallet: ${WALLET_ADDRESS}`);
console.log('='.repeat(60));

// Simulate the balance calculation
const balanceWei = 10000000000000; // 0.00001 ETH in wei
const balanceEth = balanceWei / Math.pow(10, 18);

console.log(`Balance in wei: ${balanceWei}`);
console.log(`Balance in ETH: ${balanceEth}`);
console.log(`Balance in ETH (fixed): ${balanceEth.toFixed(6)}`);

// Test thresholds
const thresholds = [
  0.0000000001,  // Current ERC20 threshold
  0.00000000001, // New native token threshold
  0.000000000001 // Even lower threshold
];

thresholds.forEach(threshold => {
  const isAbove = balanceEth >= threshold;
  console.log(`Balance ${balanceEth} >= ${threshold}: ${isAbove ? '✅ ABOVE' : '❌ BELOW'}`);
});

console.log('\n✅ Test completed. Check the browser console for actual results.'); 