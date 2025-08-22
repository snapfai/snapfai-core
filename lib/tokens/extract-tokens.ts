import { TokenConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface TokenListToken {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenList {
  tokens: TokenListToken[];
}

// Function to parse token lists and extract tokens for specific chains
function extractTokensFromList(filePath: string, targetChainId: number): TokenConfig[] {
  console.log(`Reading file: ${filePath}`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`File size: ${content.length} characters`);
    
    const tokenList: TokenList = JSON.parse(content);
    console.log(`Total tokens in list: ${tokenList.tokens?.length || 0}`);
    
    const filteredTokens = tokenList.tokens
      .filter(token => token.chainId === targetChainId)
      .map(token => ({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.name,
        logoURI: token.logoURI || '',
        isNative: token.symbol === 'BNB' && targetChainId === 56
      }));
    
    console.log(`Filtered tokens for chain ${targetChainId}: ${filteredTokens.length}`);
    return filteredTokens;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return [];
  }
}

// Function to merge tokens and remove duplicates
function mergeTokens(existingTokens: TokenConfig[], newTokens: TokenConfig[]): TokenConfig[] {
  const addressSet = new Set(existingTokens.map(t => t.address.toLowerCase()));
  const merged = [...existingTokens];
  
  for (const token of newTokens) {
    if (!addressSet.has(token.address.toLowerCase())) {
      merged.push(token);
      addressSet.add(token.address.toLowerCase());
    }
  }
  
  return merged;
}

// Main function to process all chains
function processAllChains() {
  console.log('Starting token extraction...');
  console.log('Current working directory:', process.cwd());
  
  const guidesDir = path.join(process.cwd(), 'guides');
  const tokenlist1inch = path.join(guidesDir, 'tokenlist_1inch');
  const tokenlistUniswap = path.join(guidesDir, 'tokenlist_uniswap');
  
  console.log('1inch file path:', tokenlist1inch);
  console.log('Uniswap file path:', tokenlistUniswap);
  console.log('Files exist:', {
    '1inch': fs.existsSync(tokenlist1inch),
    'uniswap': fs.existsSync(tokenlistUniswap)
  });
  
  const chains = [1, 56, 137, 42161, 8453, 10, 43114]; // Supported chains
  
  for (const chainId of chains) {
    console.log(`\nProcessing chain ${chainId}...`);
    
    const tokens1inch = extractTokensFromList(tokenlist1inch, chainId);
    const tokensUniswap = extractTokensFromList(tokenlistUniswap, chainId);
    
    console.log(`1inch tokens: ${tokens1inch.length}`);
    console.log(`Uniswap tokens: ${tokensUniswap.length}`);
    
    // Merge tokens from both sources
    const allTokens = mergeTokens(tokens1inch, tokensUniswap);
    console.log(`Total unique tokens: ${allTokens.length}`);
    
    // Here you would write the tokens to the appropriate chain file
    // For now, just log the first few tokens as examples
    if (allTokens.length > 0) {
      console.log('Sample tokens:');
      allTokens.slice(0, 3).forEach(token => {
        console.log(`  ${token.symbol} (${token.address})`);
      });
    }
  }
}

// Run the extraction
if (require.main === module) {
  processAllChains();
}

export { extractTokensFromList, mergeTokens };
