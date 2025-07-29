#!/usr/bin/env node

const { ethers } = require('ethers');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';

console.log(`🔍 Manual ETH Balance Check for wallet: ${WALLET_ADDRESS}`);
console.log('='.repeat(60));

async function checkEthBalance() {
  try {
    console.log('\n📊 Step 1: Using ethers.js to check ETH balance...');
    
    // Use a public RPC endpoint as fallback
    const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
    
    console.log('✅ Connected to Ethereum network');
    
    console.log('\n📊 Step 2: Fetching ETH balance...');
    const balance = await provider.getBalance(WALLET_ADDRESS);
    
    console.log(`Raw balance: ${balance.toString()}`);
    console.log(`Balance in wei: ${balance.toString()}`);
    
    const balanceEth = parseFloat(ethers.utils.formatEther(balance));
    console.log(`Balance in ETH: ${balanceEth}`);
    console.log(`Balance in ETH (fixed): ${balanceEth.toFixed(6)}`);
    
    if (balanceEth > 0) {
      console.log('✅ ETH balance found!');
      console.log(`Expected: 0.00001 ETH`);
      console.log(`Actual: ${balanceEth} ETH`);
      
      if (Math.abs(balanceEth - 0.00001) < 0.000001) {
        console.log('✅ Balance matches expected value');
      } else {
        console.log('⚠️  Balance differs from expected value');
      }
    } else {
      console.log('❌ No ETH balance found');
    }
    
    console.log('\n📊 Step 3: Testing with different RPC endpoints...');
    
    const rpcEndpoints = [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://cloudflare-eth.com'
    ];
    
    for (const endpoint of rpcEndpoints) {
      try {
        const testProvider = new ethers.providers.JsonRpcProvider(endpoint);
        const testBalance = await testProvider.getBalance(WALLET_ADDRESS);
        const testBalanceEth = parseFloat(ethers.utils.formatEther(testBalance));
        console.log(`${endpoint}: ${testBalanceEth} ETH`);
      } catch (error) {
        console.log(`${endpoint}: ❌ Failed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking ETH balance:', error.message);
  }
}

checkEthBalance().catch(console.error); 