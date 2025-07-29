const { Alchemy, Network } = require('alchemy-sdk');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const CHAIN_ID = 1; // Ethereum mainnet

async function debugWalletTokens() {
  console.log('🔍 Debugging wallet tokens...');
  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log(`Chain: ${CHAIN_ID} (Ethereum)`);
  console.log('');

  // Create Alchemy instance
  const alchemy = new Alchemy({
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo',
    network: Network.ETH_MAINNET,
  });

  try {
    // Get native ETH balance
    console.log('📊 Checking native ETH balance...');
    const nativeBalance = await alchemy.core.getBalance(WALLET_ADDRESS);
    console.log(`Native ETH balance: ${nativeBalance.toString()} wei`);
    console.log(`Native ETH balance: ${parseFloat(nativeBalance.toString()) / Math.pow(10, 18)} ETH`);
    console.log('');

    // Get all ERC20 token balances
    console.log('📊 Checking ERC20 token balances...');
    const balances = await alchemy.core.getTokenBalances(WALLET_ADDRESS, { type: 'ERC20' });
    
    if (!balances?.tokenBalances) {
      console.log('❌ No token balances found');
      return;
    }

    console.log(`Found ${balances.tokenBalances.length} tokens with balances`);
    console.log('');

    // Filter non-zero balances
    const nonZeroBalances = balances.tokenBalances.filter(token => 
      token.tokenBalance && 
      token.tokenBalance !== '0x0' && 
      token.tokenBalance !== '0' &&
      !token.error
    );

    console.log(`Non-zero balances: ${nonZeroBalances.length}`);
    console.log('');

    // Check first 10 tokens in detail
    for (let i = 0; i < Math.min(10, nonZeroBalances.length); i++) {
      const tokenBalance = nonZeroBalances[i];
      console.log(`\n🔍 Token ${i + 1}:`);
      console.log(`Address: ${tokenBalance.contractAddress}`);
      console.log(`Raw balance: ${tokenBalance.tokenBalance}`);
      
      try {
        // Get token metadata
        const metadata = await alchemy.core.getTokenMetadata(tokenBalance.contractAddress);
        console.log(`Symbol: ${metadata.symbol || 'N/A'}`);
        console.log(`Name: ${metadata.name || 'N/A'}`);
        console.log(`Decimals: ${metadata.decimals || 'N/A'}`);
        
        // Calculate human readable balance
        if (metadata.decimals && tokenBalance.tokenBalance) {
          const balanceWei = parseInt(tokenBalance.tokenBalance, 16);
          const balance = balanceWei / Math.pow(10, metadata.decimals);
          console.log(`Human balance: ${balance}`);
        }
        
        // Check if this token is in our supported list
        const isSupported = await checkIfTokenSupported(metadata.symbol, tokenBalance.contractAddress);
        console.log(`Supported in our list: ${isSupported ? '✅ YES' : '❌ NO'}`);
        
      } catch (error) {
        console.log(`Error getting metadata: ${error.message}`);
      }
    }

    // Check specific common tokens
    console.log('\n🔍 Checking specific common tokens...');
    const commonTokens = [
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    ];

    for (const tokenAddress of commonTokens) {
      try {
        const specificBalance = await alchemy.core.getTokenBalances(WALLET_ADDRESS, [tokenAddress]);
        const balance = specificBalance.tokenBalances?.[0];
        
        if (balance && balance.tokenBalance && balance.tokenBalance !== '0x0') {
          console.log(`✅ Found balance for ${tokenAddress}`);
          console.log(`   Balance: ${balance.tokenBalance}`);
        } else {
          console.log(`❌ No balance for ${tokenAddress}`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${tokenAddress}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkIfTokenSupported(symbol, address) {
  // This would normally check against our tokens.ts file
  // For now, just check against common tokens
  const supportedTokens = ['USDC', 'USDT', 'WETH', 'DAI', 'ETH'];
  return supportedTokens.includes(symbol?.toUpperCase());
}

debugWalletTokens().catch(console.error); 