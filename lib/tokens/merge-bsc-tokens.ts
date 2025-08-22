import { TokenConfig } from './types';
import { bscTokens } from './bsc';

// Extract BSC tokens from 1inch and Uniswap lists
// This script will help us identify missing tokens

const EXISTING_ADDRESSES = new Set(bscTokens.map(t => t.address.toLowerCase()));

// Function to check if a token already exists
function tokenExists(address: string): boolean {
  return EXISTING_ADDRESSES.has(address.toLowerCase());
}

// Function to add new tokens
function addNewTokens(newTokens: TokenConfig[]): TokenConfig[] {
  const added: TokenConfig[] = [];
  
  for (const token of newTokens) {
    if (!tokenExists(token.address)) {
      added.push(token);
      EXISTING_ADDRESSES.add(token.address.toLowerCase());
    }
  }
  
  return added;
}

// Sample new tokens to add (you would extract these from the actual lists)
const NEW_BSC_TOKENS: TokenConfig[] = [
  // Add tokens that are missing from our current list
  // This would be populated by parsing the actual 1inch and Uniswap lists
];

console.log('Current BSC tokens:', bscTokens.length);
console.log('New tokens to add:', NEW_BSC_TOKENS.length);

const updatedTokens = [...bscTokens, ...NEW_BSC_TOKENS];
console.log('Total BSC tokens after merge:', updatedTokens.length);

export { updatedTokens as mergedBscTokens };
