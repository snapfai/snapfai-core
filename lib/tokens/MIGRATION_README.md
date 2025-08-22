# Token System Migration Guide

This directory contains migration scripts to help you restructure the old monolithic `tokens.ts` file into the new modular system.

## 🚀 Quick Start

### Option 1: Simple Migration (Recommended)
```bash
# Run the simple migration script
npx tsx lib/tokens/migrate-simple.ts
```

### Option 2: Full Migration
```bash
# Run the comprehensive migration script
npx tsx lib/tokens/migrate-all.ts
```

## 📋 What the Scripts Do

1. **Read** the old `lib/tokens.ts` file
2. **Extract** all token data for each supported chain
3. **Create** individual chain token files (e.g., `ethereum.ts`, `bsc.ts`)
4. **Update** the main `index.ts` file with the new structure
5. **Create** missing files like `sepolia.ts`

## 🔧 Prerequisites

- Node.js installed
- `tsx` package available (install with `npm install -g tsx` if needed)
- Old `lib/tokens.ts` file exists

## 📁 Files Created/Updated

- `ethereum.ts` - Ethereum Mainnet tokens
- `bsc.ts` - Binance Smart Chain tokens  
- `arbitrum.ts` - Arbitrum One tokens
- `base.ts` - Base tokens
- `optimism.ts` - Optimism tokens
- `avalanche.ts` - Avalanche C-Chain tokens
- `polygon.ts` - Polygon tokens
- `sepolia.ts` - Sepolia testnet tokens
- `index.ts` - Main index file (updated)

## ✅ After Migration

1. **Review** the generated files
2. **Test** compilation: `npx tsc --noEmit lib/tokens/`
3. **Test** your application
4. **Delete** the old `lib/tokens.ts` file when ready

## 🐛 Troubleshooting

### Script fails to run
- Ensure you have Node.js installed
- Install tsx: `npm install -g tsx`
- Check that the old `tokens.ts` file exists

### No tokens extracted
- Verify the old file format matches expected structure
- Check console output for specific error messages

### TypeScript errors
- Run `npx tsc --noEmit lib/tokens/` to see compilation errors
- Ensure all required files exist and are properly formatted

## 🔄 Manual Migration

If the scripts don't work, you can manually copy token data:

1. Open the old `lib/tokens.ts` file
2. Find the section for each chain (e.g., `1: [`, `56: [`, etc.)
3. Copy the token array content
4. Paste into the corresponding new chain file
5. Update the main index file manually

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify file paths and permissions
3. Ensure the old tokens file structure is correct
