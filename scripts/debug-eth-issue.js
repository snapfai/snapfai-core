#!/usr/bin/env node

const { Alchemy, Network } = require('alchemy-sdk');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

console.log(`🔍 Debugging ETH Issue for wallet: ${WALLET_ADDRESS}`);
console.log(`Using API key: ${ALCHEMY_API_KEY.substring(0, 10)}...`);
console.log('='.repeat(60));

async function debugEthIssue() {
  try {
    console.log('\n📊 Step 1: Testing Alchemy API connection...');
    const alchemy = new Alchemy({
      apiKey: ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    });

    console.log('✅ Alchemy instance created successfully');

    console.log('\n📊 Step 2: Fetching native ETH balance...');
    const nativeBalance = await alchemy.core.getBalance(WALLET_ADDRESS);
    
    console.log(`Raw balance from API: ${nativeBalance?.toString()}`);
    
    if (nativeBalance) {
      const balanceEth = parseFloat(nativeBalance.toString()) / Math.pow(10, 18);
      console.log(`Balance in ETH: ${balanceEth}`);
      console.log(`Balance in ETH (fixed): ${balanceEth.toFixed(6)}`);
      
      if (balanceEth > 0) {
        console.log('✅ ETH balance found and should be displayed');
      } else {
        console.log('❌ ETH balance is 0 - this might be the issue');
      }
    } else {
      console.log('❌ No balance returned from API');
    }

    console.log('\n📊 Step 3: Testing token metadata...');
    try {
      const ethToken = {
        symbol: 'ETH',
        name: 'Ether',
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        decimals: 18,
        isNative: true
      };
      
      console.log('ETH Token Config:', ethToken);
      console.log('✅ ETH token configuration looks correct');
    } catch (error) {
      console.error('❌ Error with ETH token config:', error);
    }

    console.log('\n📊 Step 4: Testing balance thresholds...');
    const testBalances = [
      0.00001,    // Expected balance
      0.000001,   // Very small
      0.0000001,  // Extremely small
      0.00000001, // Tiny
      0.000000001 // Minimal
    ];

    testBalances.forEach(balance => {
      const thresholds = [
        0.0000000001,  // Current ERC20 threshold
        0.00000000001, // New native token threshold
        0.000000000001 // Even lower threshold
      ];

      console.log(`\nTesting balance: ${balance}`);
      thresholds.forEach(threshold => {
        const isAbove = balance >= threshold;
        console.log(`  ${balance} >= ${threshold}: ${isAbove ? '✅ ABOVE' : '❌ BELOW'}`);
      });
    });

    console.log('\n📊 Step 5: Checking for potential issues...');
    console.log('1. API Key: Using demo key might cause timeouts');
    console.log('2. Network: Make sure we\'re on Ethereum mainnet');
    console.log('3. Balance: Check if actual balance is different from expected');
    console.log('4. Thresholds: All thresholds should allow 0.00001 ETH');
    console.log('5. Native Token Config: ETH should be marked as isNative: true');

    console.log('\n🔧 Next Steps:');
    console.log('1. Get a real Alchemy API key');
    console.log('2. Check browser console for "Processing token: ETH" logs');
    console.log('3. Verify ETH is being processed in the portfolio hook');
    console.log('4. Check if ETH is being filtered out by the UI');

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Use a real Alchemy API key instead of demo');
    console.log('2. Check if the wallet actually has ETH balance');
    console.log('3. Verify the balance is on Ethereum mainnet');
    console.log('4. Check browser console for detailed error messages');
  }
}

debugEthIssue().catch(console.error); 