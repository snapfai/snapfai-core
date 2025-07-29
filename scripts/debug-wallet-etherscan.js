const axios = require('axios');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const ETHERSCAN_API_KEY = '3MMWY4TKVM1TXXANWG7IUUZFH7JHDYS8BW';

async function debugWalletTokensEtherscan() {
  console.log('🔍 Debugging wallet tokens using Etherscan...');
  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log('');

  try {
    // Get ETH balance
    console.log('📊 Checking native ETH balance...');
    const ethBalanceResponse = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'account',
        action: 'balance',
        address: WALLET_ADDRESS,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (ethBalanceResponse.data.status === '1') {
      const ethBalanceWei = ethBalanceResponse.data.result;
      const ethBalanceEth = parseFloat(ethBalanceWei) / Math.pow(10, 18);
      console.log(`Native ETH balance: ${ethBalanceWei} wei`);
      console.log(`Native ETH balance: ${ethBalanceEth} ETH`);
    } else {
      console.log(`❌ Error getting ETH balance: ${ethBalanceResponse.data.message}`);
    }
    console.log('');

    // Get ERC20 token balances
    console.log('📊 Checking ERC20 token balances...');
    const tokenBalanceResponse = await axios.get(`https://api.etherscan.io/api`, {
      params: {
        module: 'account',
        action: 'tokentx',
        address: WALLET_ADDRESS,
        startblock: 0,
        endblock: 99999999,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });

    if (tokenBalanceResponse.data.status === '1') {
      const transactions = tokenBalanceResponse.data.result;
      console.log(`Found ${transactions.length} token transactions`);
      
      // Get unique tokens from transactions
      const uniqueTokens = new Map();
      
      transactions.forEach(tx => {
        const tokenAddress = tx.contractAddress.toLowerCase();
        const tokenSymbol = tx.tokenSymbol;
        const tokenName = tx.tokenName;
        const decimals = parseInt(tx.tokenDecimal);
        
        if (!uniqueTokens.has(tokenAddress)) {
          uniqueTokens.set(tokenAddress, {
            symbol: tokenSymbol,
            name: tokenName,
            decimals: decimals,
            address: tokenAddress,
            transactions: []
          });
        }
        
        uniqueTokens.get(tokenAddress).transactions.push({
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: tx.timeStamp
        });
      });

      console.log(`\n📊 Found ${uniqueTokens.size} unique tokens:`);
      console.log('');

      // Check balances for each token
      for (const [address, token] of uniqueTokens) {
        console.log(`🔍 Token: ${token.symbol} (${token.name})`);
        console.log(`   Address: ${address}`);
        console.log(`   Decimals: ${token.decimals}`);
        
        // Calculate current balance from transactions
        let balance = 0;
        token.transactions.forEach(tx => {
          const value = parseFloat(tx.value) / Math.pow(10, token.decimals);
          if (tx.to.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
            balance += value;
          }
          if (tx.from.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
            balance -= value;
          }
        });
        
        console.log(`   Calculated balance: ${balance}`);
        
        // Check if token is supported in our list
        const isSupported = checkIfTokenSupported(token.symbol, address);
        console.log(`   Supported in our list: ${isSupported ? '✅ YES' : '❌ NO'}`);
        console.log('');
      }

      // Check specific common tokens
      console.log('🔍 Checking specific common tokens...');
      const commonTokens = [
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC' },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT' },
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH' },
        { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI' },
      ];

      for (const token of commonTokens) {
        const tokenData = uniqueTokens.get(token.address.toLowerCase());
        if (tokenData) {
          console.log(`✅ Found ${token.symbol} in transaction history`);
        } else {
          console.log(`❌ No ${token.symbol} transactions found`);
        }
      }

    } else {
      console.log(`❌ Error getting token transactions: ${tokenBalanceResponse.data.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function checkIfTokenSupported(symbol, address) {
  // Check against common supported tokens
  const supportedTokens = ['USDC', 'USDT', 'WETH', 'DAI', 'ETH'];
  return supportedTokens.includes(symbol?.toUpperCase());
}

debugWalletTokensEtherscan().catch(console.error); 