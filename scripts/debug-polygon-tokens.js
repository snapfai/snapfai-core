const axios = require('axios');

const WALLET_ADDRESS = '0xb29ad8207074c554736a4600cB4C84fA43484A32';
const ETHERSCAN_API_KEY = '3MMWY4TKVM1TXXANWG7IUUZFH7JHDYS8BW';

async function debugPolygonTokens() {
  console.log('🔍 Debugging Polygon tokens...');
  console.log(`Wallet: ${WALLET_ADDRESS}`);
  console.log('');

  try {
    // Get Polygon token transactions
    console.log('📊 Checking Polygon ERC20 token transactions...');
    const tokenBalanceResponse = await axios.get(`https://api.polygonscan.com/api`, {
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
      console.log(`Found ${transactions.length} Polygon token transactions`);
      
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

      console.log(`\n📊 Found ${uniqueTokens.size} unique Polygon tokens:`);
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
        
        // Test spam detection
        const isSpam = isSpamOrAirdropToken(token.symbol, token.name);
        console.log(`   Spam detection: ${isSpam ? '🚫 SPAM' : '✅ LEGIT'}`);
        console.log('');
      }

    } else {
      console.log(`❌ Error getting Polygon token transactions: ${tokenBalanceResponse.data.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Copy the spam detection function from alchemy-portfolio.ts
function isSpamOrAirdropToken(symbol, name) {
  const spamKeywords = [
    'airdrop', 'claim', 'rewards', 'free', 'spam', 'scam', 'fake',
    'phishing', 'virus', 'malware', 'honeypot', 'test', 'meme',
    'eligible', 'reward', 'prize', 'bonus', 'gift', 'giveaway',
    '🚀', '💎', '🔥', '⭐', '🎉', '💰', '💸'
  ];
  
  const suspiciousPatterns = [
    /claim.*airdrop/i,
    /rewards?\..*\.com/i,
    /free.*token/i,
    /test.*token/i,
    /meme.*token/i,
    /.*\s+at\s+.*\.(com|org|net|io)/i,
    /.*\s+!\s+eligible/i,
    /.*\s+\$\s+reward/i,
    /reward\s+at\s+.*\.com/i,
    /.*coin\s*$/i,
    /^[0-9]+\s*\$\s+reward/i,
  ];
  
  const combinedText = `${symbol} ${name}`.toLowerCase();
  
  const hasSpamKeywords = spamKeywords.some(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(combinedText)
  );
  
  const hasLongName = name.length > 50 || symbol.length > 20;
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(combinedText);
  const hasWebsiteReference = /\.(com|org|net|io|bar)/i.test(combinedText);
  const hasSuspiciousCaps = /[A-Z]{3,}/.test(symbol) && symbol.length > 5;
  
  return hasSpamKeywords || hasSuspiciousPattern || hasLongName || hasEmojis || hasWebsiteReference || hasSuspiciousCaps;
}

debugPolygonTokens().catch(console.error); 