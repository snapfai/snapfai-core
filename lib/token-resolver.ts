import { ethers } from 'ethers';
import { getTokensForChain, TokenConfig } from './tokens';

// Helper: fetch ERC20 metadata on-chain
async function fetchERC20Metadata(address: string, chainId: number): Promise<TokenConfig | null> {
  try {
    const provider = ethers.getDefaultProvider(chainId);
    const ERC20_ABI = [
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
      'function name() view returns (string)'
    ];
    const contract = new ethers.Contract(address, ERC20_ABI, provider);
    const [symbol, decimals, name] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.name()
    ]);
    return {
      address,
      symbol,
      decimals,
      name,
      logoURI: undefined
    };
  } catch (e) {
    return null;
  }
}

// Fast lookup maps per chain
const tokenMapsByChain: Record<number, {
  allowedSymbols: Set<string>,
  addressToToken: Record<string, TokenConfig>,
  tokens: TokenConfig[]
}> = {};

function getTokenMaps(chainId: number) {
  if (!tokenMapsByChain[chainId]) {
    const tokens = getTokensForChain(chainId);
    tokenMapsByChain[chainId] = {
      allowedSymbols: new Set(tokens.map(t => t.symbol.toLowerCase())),
      addressToToken: Object.fromEntries(tokens.map(t => [t.address.toLowerCase(), t])),
      tokens
    };
  }
  return tokenMapsByChain[chainId];
}

// Strict resolver: only allow symbols from our list, but allow any ERC20 address
export async function resolveTokenStrict(identifier: string, chainId: number): Promise<TokenConfig | null> {
  const { allowedSymbols, addressToToken, tokens } = getTokenMaps(chainId);
  if (/^0x[a-fA-F0-9]{40}$/.test(identifier)) {
    // Address: check list, else fetch on-chain
    return addressToToken[identifier.toLowerCase()] || await fetchERC20Metadata(identifier, chainId);
  }
  // Symbol: only allow if in our list
  if (allowedSymbols.has(identifier.toLowerCase())) {
    return tokens.find(t => t.symbol.toLowerCase() === identifier.toLowerCase()) || null;
  }
  return null;
} 