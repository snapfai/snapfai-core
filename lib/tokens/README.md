# Token Management System

This directory contains the restructured token management system, broken down into manageable files for better maintainability.

## Structure

```
lib/tokens/
├── types.ts           # Type definitions and interfaces
├── utils.ts           # Utility functions for token operations
├── index.ts           # Main export file combining all chains
├── ethereum.ts        # Ethereum Mainnet tokens (chain 1)
├── bsc.ts            # Binance Smart Chain tokens (chain 56)
├── arbitrum.ts       # Arbitrum One tokens (chain 42161)
├── base.ts           # Base tokens (chain 8453)
├── optimism.ts       # Optimism tokens (chain 10)
├── avalanche.ts      # Avalanche C-Chain tokens (chain 43114)
├── polygon.ts        # Polygon tokens (chain 137)
└── README.md         # This file
```

## Usage

### Import the main token system
```typescript
import { TOKENS_BY_CHAIN, getTokensForChain, findTokenBySymbol } from '@/lib/tokens';
```

### Access tokens for a specific chain
```typescript
import { ethereumTokens, bscTokens } from '@/lib/tokens';

// Get all Ethereum tokens
const ethTokens = ethereumTokens;

// Get all BSC tokens
const bscTokens = bscTokens;
```

### Use utility functions
```typescript
import { getTokensForChain, findTokenBySymbol } from '@/lib/tokens';

// Get all tokens for Ethereum (chain 1)
const tokens = getTokensForChain(TOKENS_BY_CHAIN, 1);

// Find a specific token by symbol
const usdc = findTokenBySymbol(TOKENS_BY_CHAIN, 'USDC', 1);
```

## Adding New Tokens

1. **For existing chains**: Add tokens to the respective chain file (e.g., `ethereum.ts`)
2. **For new chains**: Create a new file following the naming convention and add it to `index.ts`

### Example: Adding a new token to Ethereum
```typescript
// In lib/tokens/ethereum.ts
export const ethereumTokens: TokenConfig[] = [
  // ... existing tokens
  {
    address: "0x1234...",
    symbol: "NEW",
    decimals: 18,
    name: "New Token",
    logoURI: "https://...",
  }
];
```

## Benefits of This Structure

1. **Maintainability**: Each chain's tokens are in separate files
2. **Readability**: Easier to find and modify specific chain tokens
3. **Scalability**: Simple to add new chains or tokens
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Modularity**: Import only what you need
6. **Testing**: Easier to test individual chain token lists

## Migration Notes

The old `lib/tokens.ts` file has been replaced with this modular structure. All existing functionality is preserved through the main `index.ts` export, so no changes are needed in consuming code.

## Future Enhancements

- Add token validation schemas
- Implement token metadata caching
- Add token list versioning
- Support for dynamic token loading
