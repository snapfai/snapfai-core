#!/usr/bin/env node

/**
 * Utility script to add new special tokens to the special-tokens.ts file
 * Usage: node scripts/add-special-token.js
 * 
 * This script provides an interactive way to add new tokens to the special tokens list
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function addSpecialToken() {
  console.log('🪙 Adding a new special token to the list...\n');
  
  try {
    // Collect token information
    const symbol = await question('Token Symbol (e.g., SYNC): ');
    const name = await question('Token Name (e.g., SYNC Network): ');
    const address = await question('Contract Address (0x...): ');
    const decimals = parseInt(await question('Decimals (e.g., 18): '));
    const chainId = parseInt(await question('Chain ID (e.g., 1 for Ethereum): '));
    const logoURI = await question('Logo URI (optional, press enter to skip): ');
    const description = await question('Description (optional): ');
    const website = await question('Website (optional): ');
    const price = parseFloat(await question('Current Price in USD (e.g., 0.025): ') || '0');
    const change24h = parseFloat(await question('24h Change % (optional, e.g., 2.5): ') || '0');
    
    // Validate required fields
    if (!symbol || !name || !address || isNaN(decimals) || isNaN(chainId)) {
      console.error('❌ Error: Symbol, name, address, decimals, and chainId are required.');
      rl.close();
      return;
    }
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.error('❌ Error: Invalid contract address format.');
      rl.close();
      return;
    }
    
    console.log('\n📋 Token Information:');
    console.log(`Symbol: ${symbol}`);
    console.log(`Name: ${name}`);
    console.log(`Address: ${address}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Logo URI: ${logoURI || 'None'}`);
    console.log(`Description: ${description || 'None'}`);
    console.log(`Website: ${website || 'None'}`);
    console.log(`Price: $${price}`);
    console.log(`24h Change: ${change24h}%`);
    
    const confirm = await question('\n✅ Add this token? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Token addition cancelled.');
      rl.close();
      return;
    }
    
    // Create token object
    const newToken = {
      symbol: symbol.toUpperCase(),
      name,
      address,
      decimals,
      chainId,
      ...(logoURI && { logoURI }),
      ...(description && { description }),
      ...(website && { website }),
      verified: true,
      addedDate: new Date().toISOString().split('T')[0]
    };
    
    // Add to special-tokens.ts file
    const specialTokensPath = path.join(__dirname, '../lib/special-tokens.ts');
    let content = fs.readFileSync(specialTokensPath, 'utf8');
    
    // Find the closing bracket of SPECIAL_TOKENS array
    const insertIndex = content.lastIndexOf('];');
    if (insertIndex === -1) {
      console.error('❌ Error: Could not find SPECIAL_TOKENS array in special-tokens.ts');
      rl.close();
      return;
    }
    
    // Create the token entry string
    const tokenEntry = `  {
    symbol: '${newToken.symbol}',
    name: '${newToken.name}',
    address: '${newToken.address}',
    decimals: ${newToken.decimals},
    chainId: ${newToken.chainId}, // ${getChainName(newToken.chainId)}${newToken.logoURI ? `\n    logoURI: '${newToken.logoURI}',` : ''}${newToken.description ? `\n    description: '${newToken.description}',` : ''}${newToken.website ? `\n    website: '${newToken.website}',` : ''}
    verified: true,
    addedDate: '${newToken.addedDate}'
  },`;
    
    // Insert the new token before the closing bracket
    const beforeClosing = content.substring(0, insertIndex);
    const afterClosing = content.substring(insertIndex);
    const newContent = beforeClosing + tokenEntry + '\n' + afterClosing;
    
    // Write back to file
    fs.writeFileSync(specialTokensPath, newContent);
    
    // Also update the price mapping if price was provided
    if (price > 0) {
      const priceMapping = `    '${newToken.symbol}': { price: ${price}, change24h: ${change24h} },`;
      const priceIndex = content.indexOf("'KURO': { price:");
      if (priceIndex !== -1) {
        const priceInsertIndex = content.indexOf('\n', priceIndex) + 1;
        const beforePrice = newContent.substring(0, priceInsertIndex);
        const afterPrice = newContent.substring(priceInsertIndex);
        const finalContent = beforePrice + priceMapping + '\n' + afterPrice;
        fs.writeFileSync(specialTokensPath, finalContent);
      }
    }
    
    console.log(`\n🎉 Successfully added ${symbol} to special tokens list!`);
    console.log(`📁 Updated file: ${specialTokensPath}`);
    
    if (price > 0) {
      console.log(`💰 Added price: $${price} with ${change24h}% 24h change`);
    }
    
  } catch (error) {
    console.error('❌ Error adding token:', error.message);
  } finally {
    rl.close();
  }
}

function getChainName(chainId) {
  const chainNames = {
    1: 'Ethereum',
    42161: 'Arbitrum',
    8453: 'Base', 
    137: 'Polygon',
    10: 'Optimism',
    43114: 'Avalanche'
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

// Run the script
addSpecialToken(); 