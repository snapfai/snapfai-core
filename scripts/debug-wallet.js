#!/usr/bin/env node

const { Alchemy, Network } = require('alchemy-sdk');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

async function debugWallet() {
  console.log(`🔍 Debugging wallet: ${WALLET_ADDRESS}`);
  console.log('='.repeat(60));

  // Test Ethereum mainnet
  const alchemy = new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  });

  try {
    console.log('\n📊 Fetching native ETH balance...');
    const nativeBalance = await alchemy.core.getBalance(WALLET_ADDRESS);
    console.log(`Native ETH balance: ${nativeBalance.toString()} wei`);
    console.log(`Native ETH balance: ${parseFloat(nativeBalance.toString()) / Math.pow(10, 18)} ETH`);

    console.log('\n📊 Fetching all ERC20 token balances...');
    const tokenBalances = await alchemy.core.getTokenBalances(WALLET_ADDRESS);
    
    console.log(`Total tokens found: ${tokenBalances.tokenBalances?.length || 0}`);
    
    if (tokenBalances.tokenBalances) {
      console.log('\n🔍 Non-zero balances:');
      let nonZeroCount = 0;
      
      for (const token of tokenBalances.tokenBalances) {
        if (token.tokenBalance && token.tokenBalance !== '0x0' && token.tokenBalance !== '0') {
          nonZeroCount++;
          console.log(`\nToken ${nonZeroCount}:`);
          console.log(`  Contract: ${token.contractAddress}`);
          console.log(`  Raw Balance: ${token.tokenBalance}`);
          
          try {
            const metadata = await alchemy.core.getTokenMetadata(token.contractAddress);
            if (metadata) {
              const balanceWei = parseInt(token.tokenBalance, 16);
              const balance = balanceWei / Math.pow(10, metadata.decimals || 18);
              
              console.log(`  Symbol: ${metadata.symbol || 'UNKNOWN'}`);
              console.log(`  Name: ${metadata.name || 'UNKNOWN'}`);
              console.log(`  Decimals: ${metadata.decimals || 18}`);
              console.log(`  Balance: ${balance}`);
              console.log(`  Logo: ${metadata.logo || 'N/A'}`);
            } else {
              console.log(`  ❌ No metadata available`);
            }
          } catch (error) {
            console.log(`  ❌ Error fetching metadata: ${error.message}`);
          }
        }
      }
      
      console.log(`\n✅ Found ${nonZeroCount} tokens with non-zero balances`);
    }

    // Test specific common tokens
    console.log('\n🔍 Checking specific common tokens...');
    const commonTokens = [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    ];

    for (const tokenAddress of commonTokens) {
      try {
        const balance = await alchemy.core.getTokenBalances(WALLET_ADDRESS, [tokenAddress]);
        if (balance.tokenBalances && balance.tokenBalances.length > 0) {
          const token = balance.tokenBalances[0];
          if (token.tokenBalance && token.tokenBalance !== '0x0') {
            const metadata = await alchemy.core.getTokenMetadata(tokenAddress);
            const balanceWei = parseInt(token.tokenBalance, 16);
            const balanceValue = balanceWei / Math.pow(10, metadata.decimals || 18);
            console.log(`  ${metadata.symbol}: ${balanceValue}`);
          }
        }
      } catch (error) {
        console.log(`  Error checking ${tokenAddress}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugWallet().catch(console.error); 