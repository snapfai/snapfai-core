# Special Tokens System

The Special Tokens system provides a manually curated list of tokens with accurate metadata and pricing information. This is particularly useful for tokens that are not well-covered by standard APIs like CoinGecko or have specific requirements.

## Overview

The system consists of:
- **Special token list** (`lib/special-tokens.ts`) - Manually maintained token database
- **Integration with portfolio system** - Automatic detection and handling
- **Price management** - Custom pricing for special tokens
- **Utility script** - Easy way to add new tokens

## Currently Supported Special Tokens

| Symbol | Name | Chain | Address | Decimals |
|--------|------|-------|---------|----------|
| SYNC | SYNC Network | Ethereum | `0xB6ff96B8A8d214544Ca0dBc9B33f7AD6503eFD32` | 18 |
| FORCE | ForceDAO | Ethereum | `0x2F85E502a988AF76f7ee6D83b7db8d6c0A823bf9` | 18 |
| KUMA | Kuma Inu | Ethereum | `0x48c276e8d03813224bb1e55f953adb6d02fd3e02` | 18 |
| CHEW | Chew | Ethereum | `0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98` | 18 |
| KURO | Kuro Shiba | Ethereum | `0x78A0A62Fba6Fb21A83FE8a3433d44C73a4017A6f` | 9 |

## How It Works

### 1. Token Detection
When fetching portfolio data, the system first checks if a token address matches any special token:

```typescript
const specialToken = findSpecialTokenByAddress(tokenAddress, chainId)
if (specialToken) {
  // Use special token metadata instead of API call
}
```

### 2. Price Fetching
Special tokens have their own price data that takes priority over external APIs:

```typescript
const specialPrice = getSpecialTokenPrice(symbol)
if (specialPrice) {
  // Use manually maintained price
}
```

### 3. Metadata Accuracy
Special tokens include verified metadata:
- Exact contract address
- Correct decimals
- Official name and symbol
- Logo URI
- Website and description
- Manual verification status

## Adding New Tokens

### Method 1: Using the Utility Script (Recommended)

```bash
node scripts/add-special-token.js
```

The script will prompt you for:
- Token symbol
- Token name
- Contract address
- Decimals
- Chain ID
- Logo URI (optional)
- Description (optional)
- Website (optional)
- Current price
- 24h change %

### Method 2: Manual Addition

1. Edit `lib/special-tokens.ts`
2. Add the token to the `SPECIAL_TOKENS` array:

```typescript
{
  symbol: 'TOKEN',
  name: 'Token Name',
  address: '0x...',
  decimals: 18,
  chainId: 1,
  logoURI: 'https://...',
  description: 'Token description',
  website: 'https://...',
  verified: true,
  addedDate: '2024-01-01'
}
```

3. Add price data to the `getSpecialTokenPrice` function:

```typescript
'TOKEN': { price: 0.025, change24h: 2.5 }
```

## API Reference

### Functions

#### `findSpecialTokenByAddress(address, chainId?)`
Find a special token by contract address.

#### `findSpecialTokenBySymbol(symbol, chainId?)`
Find a special token by symbol.

#### `getSpecialTokensForChain(chainId)`
Get all special tokens for a specific blockchain.

#### `isSpecialToken(address, chainId?)`
Check if an address is a special token.

#### `getSpecialTokenPrice(symbol)`
Get price data for a special token.

#### `specialTokenToTokenConfig(specialToken)`
Convert special token to standard TokenConfig format.

### Interface

```typescript
interface SpecialTokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  description?: string;
  website?: string;
  verified: boolean;
  addedDate: string;
}
```

## Integration with Portfolio System

The special tokens system is automatically integrated with:

1. **Token Balance Fetching** - Prioritizes special token metadata
2. **Price Fetching** - Uses special token prices when available
3. **Portfolio Display** - Shows accurate information for special tokens
4. **Etherscan Verification** - Falls back to verification for unknown tokens

## Benefits

✅ **Accurate Metadata** - Manually verified token information
✅ **Reliable Pricing** - Custom price data for tokens not covered by APIs
✅ **Fast Performance** - No API calls needed for known special tokens
✅ **Easy Management** - Simple utility script for adding new tokens
✅ **Flexible System** - Supports tokens from multiple chains
✅ **Quality Control** - Manual verification ensures data accuracy

## Maintenance

### Regular Tasks
1. **Update Prices** - Review and update token prices periodically
2. **Add New Tokens** - Add tokens as requested by users or community
3. **Verify Information** - Ensure contract addresses and metadata are correct
4. **Monitor Changes** - Watch for token migrations or updates

### Price Updates
Prices can be updated by modifying the `getSpecialTokenPrice` function in `lib/special-tokens.ts`. Consider updating prices:
- Weekly for volatile tokens
- Monthly for stable tokens
- When significant price movements occur

## Examples

### Finding a Token
```typescript
import { findSpecialTokenByAddress } from '@/lib/special-tokens'

const token = findSpecialTokenByAddress('0xB6ff96B8A8d214544Ca0dBc9B33f7AD6503eFD32')
// Returns SYNC token info
```

### Getting Price Data
```typescript
import { getSpecialTokenPrice } from '@/lib/special-tokens'

const price = getSpecialTokenPrice('SYNC')
// Returns { price: 0.025, change24h: 2.5 }
```

### Adding a Token Programmatically
```typescript
import { addSpecialToken } from '@/lib/special-tokens'

const newToken = addSpecialToken({
  symbol: 'NEW',
  name: 'New Token',
  address: '0x...',
  decimals: 18,
  chainId: 1,
  verified: true
})
``` 