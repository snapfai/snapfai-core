#!/usr/bin/env node

/**
 * Migration Script for Token System Restructuring
 * 
 * This script extracts all token data from the old lib/tokens.ts file
 * and populates the new modular token files in lib/tokens/
 * 
 * Usage: npx tsx lib/tokens/migrate-all.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  isNative?: boolean;
}

interface TokensByChain {
  [chainId: number]: TokenConfig[];
}

// Define the chains we need to migrate
const CHAINS_TO_MIGRATE = [
  { id: 1, name: 'ethereum', file: 'ethereum.ts' },
  { id: 56, name: 'bsc', file: 'bsc.ts' },
  { id: 42161, name: 'arbitrum', file: 'arbitrum.ts' },
  { id: 8453, name: 'base', file: 'base.ts' },
  { id: 10, name: 'optimism', file: 'optimism.ts' },
  { id: 43114, name: 'avalanche', file: 'avalanche.ts' },
  { id: 137, name: 'polygon', file: 'polygon.ts' },
  { id: 11155111, name: 'sepolia', file: 'sepolia.ts' }
];

// Template for chain token files
const CHAIN_FILE_TEMPLATE = (chainName: string, tokens: TokenConfig[]) => `import { TokenConfig } from './types';

export const ${chainName}Tokens: TokenConfig[] = ${JSON.stringify(tokens, null, 2)};
`;

// Function to extract tokens from the old file
function extractTokensFromOldFile(filePath: string): TokensByChain {
  console.log(`Reading old tokens file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Old tokens file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all chain token arrays using regex
  const chainPattern = /(\d+):\s*\[([\s\S]*?)\]/g;
  const tokensByChain: TokensByChain = {};
  
  let match;
  while ((match = chainPattern.exec(content)) !== null) {
    const chainId = parseInt(match[1]);
    const tokensContent = match[2];
    
    try {
      // Parse the tokens array content
      const tokens = eval(`[${tokensContent}]`);
      tokensByChain[chainId] = tokens;
      console.log(`✅ Extracted ${tokens.length} tokens for chain ${chainId}`);
    } catch (error) {
      console.error(`❌ Failed to parse tokens for chain ${chainId}:`, error);
    }
  }
  
  return tokensByChain;
}

// Function to create a new chain token file
function createChainTokenFile(chainName: string, tokens: TokenConfig[], outputPath: string) {
  const content = CHAIN_FILE_TEMPLATE(chainName, tokens);
  fs.writeFileSync(outputPath, content);
  console.log(`✅ Created ${outputPath} with ${tokens.length} tokens`);
}

// Function to update the main index file
function updateMainIndex(tokensByChain: TokensByChain) {
  const indexPath = path.join(__dirname, 'index.ts');
  
  // Read existing index file
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Update TOKENS_BY_CHAIN object
  const tokensByChainContent = `export const TOKENS_BY_CHAIN: TokensByChain = ${JSON.stringify(tokensByChain, null, 2)};`;
  
  // Replace the existing TOKENS_BY_CHAIN export
  const updatedContent = indexContent.replace(
    /export const TOKENS_BY_CHAIN: TokensByChain = \{[\s\S]*?\};/,
    tokensByChainContent
  );
  
  fs.writeFileSync(indexPath, updatedContent);
  console.log(`✅ Updated main index file`);
}

// Function to create sepolia.ts if it doesn't exist
function createSepoliaFile() {
  const sepoliaPath = path.join(__dirname, 'sepolia.ts');
  
  if (!fs.existsSync(sepoliaPath)) {
    const sepoliaTokens: TokenConfig[] = [
      {
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        symbol: "ETH",
        decimals: 18,
        name: "Ether",
        logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
        isNative: true,
      }
    ];
    
    createChainTokenFile('sepolia', sepoliaTokens, sepoliaPath);
  }
}

// Main migration function
function migrateTokens() {
  console.log('🚀 Starting token migration...\n');
  
  const oldTokensPath = path.join(__dirname, '..', 'tokens.ts');
  const tokensByChain = extractTokensFromOldFile(oldTokensPath);
  
  if (Object.keys(tokensByChain).length === 0) {
    console.error('❌ No tokens extracted. Migration failed.');
    return;
  }
  
  console.log(`\n📊 Extracted tokens for ${Object.keys(tokensByChain).length} chains\n`);
  
  // Create/update chain token files
  for (const chain of CHAINS_TO_MIGRATE) {
    const tokens = tokensByChain[chain.id] || [];
    const outputPath = path.join(__dirname, chain.file);
    
    if (tokens.length > 0) {
      createChainTokenFile(chain.name, tokens, outputPath);
    } else {
      console.log(`⚠️  No tokens found for chain ${chain.id} (${chain.name})`);
    }
  }
  
  // Create sepolia file if it doesn't exist
  createSepoliaFile();
  
  // Update main index file
  updateMainIndex(tokensByChain);
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Summary:');
  
  for (const chain of CHAINS_TO_MIGRATE) {
    const tokens = tokensByChain[chain.id] || [];
    const status = tokens.length > 0 ? '✅' : '⚠️';
    console.log(`  ${status} ${chain.name}: ${tokens.length} tokens`);
  }
  
  console.log('\n🔧 Next steps:');
  console.log('  1. Review the generated files');
  console.log('  2. Run: npx tsc --noEmit lib/tokens/');
  console.log('  3. Test the application');
  console.log('  4. Delete the old lib/tokens.ts file when ready');
}

// Run migration if this file is executed directly
if (require.main === module) {
  try {
    migrateTokens();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

export { migrateTokens, extractTokensFromOldFile };
