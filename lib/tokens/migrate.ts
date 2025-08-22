/**
 * Migration script to help extract tokens from the old tokens.ts file
 * This script can be run to help migrate the remaining token data
 */

import { TokenConfig } from './types';

// This script helps identify which chains need to be migrated
// Run this to see what chains exist in the old file

export const CHAIN_IDS_TO_MIGRATE = [
  1,        // Ethereum Mainnet - ✅ MIGRATED
  56,       // Binance Smart Chain - ✅ MIGRATED  
  42161,    // Arbitrum One - ⚠️ NEEDS MIGRATION
  8453,     // Base - ⚠️ NEEDS MIGRATION
  137,      // Polygon - ⚠️ NEEDS MIGRATION
  43114,    // Avalanche C-Chain - ⚠️ NEEDS MIGRATION
  10,       // Optimism - ⚠️ NEEDS MIGRATION
  11155111, // Sepolia Testnet - ⚠️ NEEDS MIGRATION
];

export const MIGRATION_STATUS: Record<string, string> = {
  '1': '✅ MIGRATED - ethereum.ts',
  '56': '✅ MIGRATED - bsc.ts',
  '42161': '⚠️ NEEDS MIGRATION - arbitrum.ts (placeholder only)',
  '8453': '⚠️ NEEDS MIGRATION - base.ts (placeholder only)',
  '137': '⚠️ NEEDS MIGRATION - polygon.ts (placeholder only)',
  '43114': '⚠️ NEEDS MIGRATION - avalanche.ts (placeholder only)',
  '10': '⚠️ NEEDS MIGRATION - optimism.ts (placeholder only)',
  '11155111': '⚠️ NEEDS MIGRATION - sepolia.ts (not created yet)',
};

export function getMigrationStatus(): Record<string, string> {
  return MIGRATION_STATUS;
}

export function getChainsNeedingMigration(): number[] {
  return CHAIN_IDS_TO_MIGRATE.filter(chainId => 
    !MIGRATION_STATUS[chainId.toString()].includes('✅ MIGRATED')
  );
}

// Instructions for migration:
/*
1. For each chain that needs migration:
   - Copy the token array from the old tokens.ts file
   - Paste it into the corresponding chain file
   - Update the export name to match the file

2. Example for Arbitrum (chain 42161):
   - Find the array starting with "42161: [" in the old file
   - Copy the entire array
   - Paste it into lib/tokens/arbitrum.ts
   - Update the export name to arbitrumTokens

3. After migration, update the MIGRATION_STATUS above

4. Test that all imports still work correctly
*/
