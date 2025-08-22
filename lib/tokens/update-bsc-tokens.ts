import { TokenConfig } from './types';
import { bscTokens } from './bsc';
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

// Function to parse token lists and extract BSC tokens
function extractBscTokensFromList(filePath: string): TokenConfig[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const tokenList: TokenList = JSON.parse(content);
    
    return tokenList.tokens
      .filter(token => token.chainId === 56)
      .map(token => ({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.name,
        logoURI: token.logoURI || '',
        isNative: token.symbol === 'BNB'
      }));
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

// Main function to update BSC tokens
function updateBscTokens() {
  console.log('Starting BSC token update...');
  
  const guidesDir = path.join(process.cwd(), 'guides');
  const tokenlist1inch = path.join(guidesDir, 'tokenlist_1inch');
  const tokenlistUniswap = path.join(guidesDir, 'tokenlist_uniswap');
  
  console.log('Current BSC tokens:', bscTokens.length);
  
  // Extract tokens from both sources
  const tokens1inch = extractBscTokensFromList(tokenlist1inch);
  const tokensUniswap = extractBscTokensFromList(tokenlistUniswap);
  
  console.log(`1inch BSC tokens: ${tokens1inch.length}`);
  console.log(`Uniswap BSC tokens: ${tokensUniswap.length}`);
  
  // Merge all tokens
  const allNewTokens = mergeTokens(tokens1inch, tokensUniswap);
  const updatedTokens = mergeTokens(bscTokens, allNewTokens);
  
  console.log(`Total BSC tokens after update: ${updatedTokens.length}`);
  console.log(`New tokens added: ${updatedTokens.length - bscTokens.length}`);
  
  // Generate the updated BSC tokens file content
  const fileContent = `import { TokenConfig } from './types';

export const bscTokens: TokenConfig[] = ${JSON.stringify(updatedTokens, null, 2)};
`;
  
  // Write to the BSC tokens file
  const bscFilePath = path.join(process.cwd(), 'lib', 'tokens', 'bsc.ts');
  fs.writeFileSync(bscFilePath, fileContent);
  
  console.log(`Updated BSC tokens file: ${bscFilePath}`);
  
  // Show some sample new tokens
  const newTokens = updatedTokens.filter(token => 
    !bscTokens.some(existing => existing.address.toLowerCase() === token.address.toLowerCase())
  );
  
  if (newTokens.length > 0) {
    console.log('\nSample new tokens added:');
    newTokens.slice(0, 10).forEach(token => {
      console.log(`  ${token.symbol} (${token.address})`);
    });
  }
}

// Run the update
if (require.main === module) {
  updateBscTokens();
}

export { updateBscTokens };
