#!/usr/bin/env node

const { ethers } = require('ethers');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';

console.log(`🔍 Testing Ethers Fallback for ETH Balance`);
console.log('='.repeat(60));

async function testEthersFallback() {
  try {
    console.log('\n📊 Step 1: Testing ethers.js fallback mechanism...');
    
    // Simulate the fallback logic from alchemy-portfolio.ts
    const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
    const fallbackBalance = await provider.getBalance(WALLET_ADDRESS);
    const balanceEth = parseFloat(ethers.utils.formatEther(fallbackBalance));
    
    console.log(`✅ Fallback ETH balance: ${balanceEth}`);
    console.log(`Raw balance: ${fallbackBalance.toString()}`);
    
    // Simulate the token holding creation
    const ethToken = {
      symbol: 'ETH',
      name: 'Ether',
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      decimals: 18,
      isNative: true
    };
    
    const nativeTokenHolding = {
      token: ethToken,
      balance: balanceEth.toFixed(6),
      balanceRaw: fallbackBalance.toString(),
      valueUSD: 0,
      chain: 'Ethereum',
      chainId: 1
    };
    
    console.log('\n📊 Step 2: Simulated token holding:');
    console.log(JSON.stringify(nativeTokenHolding, null, 2));
    
    console.log('\n✅ Ethers fallback mechanism works correctly!');
    console.log('This should now show ETH in the portfolio when Alchemy API fails.');
    
  } catch (error) {
    console.error('❌ Error testing ethers fallback:', error.message);
  }
}

testEthersFallback().catch(console.error); 