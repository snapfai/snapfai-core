#!/usr/bin/env node

const { Alchemy, Network } = require('alchemy-sdk');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

console.log(`🔍 Testing Alchemy ETH balance for wallet: ${WALLET_ADDRESS}`);
console.log(`Using API key: ${ALCHEMY_API_KEY.substring(0, 10)}...`);
console.log('='.repeat(60));

async function testEthBalance() {
  try {
    const alchemy = new Alchemy({
      apiKey: ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    });

    console.log('📊 Fetching native ETH balance...');
    const nativeBalance = await alchemy.core.getBalance(WALLET_ADDRESS);
    
    console.log(`Raw balance: ${nativeBalance?.toString()}`);
    
    if (nativeBalance) {
      const balanceEth = parseFloat(nativeBalance.toString()) / Math.pow(10, 18);
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
      
      if (balanceEth > 0) {
        console.log('✅ ETH balance found and should be displayed');
      } else {
        console.log('❌ No ETH balance found');
      }
    } else {
      console.log('❌ No balance returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error fetching ETH balance:', error.message);
    console.log('This might be due to using demo API key. Try with a real Alchemy API key.');
  }
}

testEthBalance().catch(console.error); 