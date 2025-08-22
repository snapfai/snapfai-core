#!/usr/bin/env node

/**
 * Simple Migration Script for Token System Restructuring
 * 
 * This script manually extracts token data from the old lib/tokens.ts file
 * and populates the new modular token files in lib/tokens/
 * 
 * Usage: npx tsx lib/tokens/migrate-simple.ts
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

// Function to manually extract tokens for a specific chain
function extractChainTokens(content: string, chainId: number): TokenConfig[] {
  const chainPattern = new RegExp(`${chainId}:\\s*\\[([\\s\\S]*?)\\],?\\s*(?=\\d+:|$)`, 'g');
  const match = chainPattern.exec(content);
  
  if (!match) {
    console.log(`⚠️  No tokens found for chain ${chainId}`);
    return [];
  }
  
  const tokensContent = match[1];
  const tokens: TokenConfig[] = [];
  
  // Split by token objects and parse each one
  const tokenPattern = /\{\s*([^}]+)\s*\}/g;
  let tokenMatch;
  
  while ((tokenMatch = tokenPattern.exec(tokensContent)) !== null) {
    const tokenText = tokenMatch[1];
    
    try {
      // Extract individual fields using regex
      const addressMatch = tokenText.match(/address:\s*"([^"]+)"/);
      const symbolMatch = tokenText.match(/symbol:\s*"([^"]+)"/);
      const decimalsMatch = tokenText.match(/decimals:\s*(\d+)/);
      const nameMatch = tokenText.match(/name:\s*"([^"]+)"/);
      const logoURIMatch = tokenText.match(/logoURI:\s*"([^"]+)"/);
      const isNativeMatch = tokenText.match(/isNative:\s*(true|false)/);
      
      if (addressMatch && symbolMatch && decimalsMatch && nameMatch) {
        const token: TokenConfig = {
          address: addressMatch[1],
          symbol: symbolMatch[1],
          decimals: parseInt(decimalsMatch[1]),
          name: nameMatch[1],
          logoURI: logoURIMatch ? logoURIMatch[1] : undefined,
          isNative: isNativeMatch ? isNativeMatch[1] === 'true' : undefined,
        };
        tokens.push(token);
      }
    } catch (error) {
      console.error(`❌ Failed to parse token: ${tokenText}`);
    }
  }
  
  return tokens;
}

// Function to create a chain token file
function createChainTokenFile(chainName: string, tokens: TokenConfig[], outputPath: string) {
  const content = `import { TokenConfig } from './types';

export const ${chainName}Tokens: TokenConfig[] = ${JSON.stringify(tokens, null, 2)};
`;
  
  fs.writeFileSync(outputPath, content);
  console.log(`✅ Created ${outputPath} with ${tokens.length} tokens`);
}

// Main migration function
function migrateTokens() {
  console.log('🚀 Starting simple token migration...\n');
  
  const oldTokensPath = path.join(__dirname, '..', 'tokens.ts');
  
  if (!fs.existsSync(oldTokensPath)) {
    console.error(`❌ Old tokens file not found: ${oldTokensPath}`);
    return;
  }
  
  const content = fs.readFileSync(oldTokensPath, 'utf8');
  console.log(`📖 Read old tokens file (${content.length} characters)\n`);
  
  // Define chains to migrate
  const chains = [
    { id: 1, name: 'ethereum', file: 'ethereum.ts' },
    { id: 56, name: 'bsc', file: 'bsc.ts' },
    { id: 42161, name: 'arbitrum', file: 'arbitrum.ts' },
    { id: 8453, name: 'base', file: 'base.ts' },
    { id: 10, name: 'optimism', file: 'optimism.ts' },
    { id: 43114, name: 'avalanche', file: 'avalanche.ts' },
    { id: 137, name: 'polygon', file: 'polygon.ts' },
  ];
  
  const tokensByChain: { [chainId: number]: TokenConfig[] } = {};
  
  // Extract tokens for each chain
  for (const chain of chains) {
    console.log(`🔍 Extracting tokens for ${chain.name} (chain ${chain.id})...`);
    const tokens = extractChainTokens(content, chain.id);
    tokensByChain[chain.id] = tokens;
    
    if (tokens.length > 0) {
      const outputPath = path.join(__dirname, chain.file);
      createChainTokenFile(chain.name, tokens, outputPath);
    }
  }
  
  // Create sepolia file
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
  
  // Update main index file
  updateMainIndex(tokensByChain);
  
  console.log('\n🎉 Migration completed successfully!');
  console.log('\n📋 Summary:');
  
  for (const chain of chains) {
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

// Function to update the main index file
function updateMainIndex(tokensByChain: { [chainId: number]: TokenConfig[] }) {
  const indexPath = path.join(__dirname, 'index.ts');
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ Index file not found: ${indexPath}`);
    return;
  }
  
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

// Run migration if this file is executed directly
if (require.main === module) {
  try {
    migrateTokens();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

export { migrateTokens, extractChainTokens };
