import { TokenConfig, TokensByChain } from './types';
import { TOKENS_BY_CHAIN } from './index';

export function getTokensForChain(tokensByChain: TokensByChain, chainId: number): TokenConfig[] {
  return tokensByChain[chainId] || [];
}

export function findTokenBySymbol(tokensByChain: TokensByChain, symbol: string, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(tokensByChain, chainId);
  return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase()) || null;
}

export function findTokenByAddress(tokensByChain: TokensByChain, address: string, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(tokensByChain, chainId);
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase()) || null;
}

export function getNativeToken(tokensByChain: TokensByChain, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(tokensByChain, chainId);
  return tokens.find(token => token.isNative) || null;
}

export function isTokenSupported(tokensByChain: TokensByChain, symbolOrAddress: string, chainId: number): boolean {
  const tokens = getTokensForChain(tokensByChain, chainId);
  return tokens.some(token => 
    token.symbol.toLowerCase() === symbolOrAddress.toLowerCase() ||
    token.address.toLowerCase() === symbolOrAddress.toLowerCase()
  );
}

export function resolveToken(tokensByChain: TokensByChain, identifier: string, chainId: number): TokenConfig | null {
  const tokens = getTokensForChain(tokensByChain, chainId);
  return tokens.find(token => 
    token.symbol.toLowerCase() === identifier.toLowerCase() ||
    token.address.toLowerCase() === identifier.toLowerCase()
  ) || null;
}

export function getDefaultTokenPair(tokensByChain: TokensByChain, chainId: number): [TokenConfig, TokenConfig] | null {
  const tokens = getTokensForChain(tokensByChain, chainId);
  if (tokens.length < 2) return null;
  
  const nativeToken = tokens.find(token => token.isNative);
  const usdcToken = tokens.find(token => token.symbol === 'USDC');
  const usdtToken = tokens.find(token => token.symbol === 'USDT');
  
  if (nativeToken && (usdcToken || usdtToken)) {
    return [nativeToken, usdcToken || usdtToken!];
  }
  
  return [tokens[0], tokens[1]];
}

// Convenience functions that use the default TOKENS_BY_CHAIN
export function getTokensForChainDefault(chainId: number): TokenConfig[] {
  return getTokensForChain(TOKENS_BY_CHAIN, chainId);
}

export function findTokenBySymbolDefault(symbol: string, chainId: number): TokenConfig | null {
  return findTokenBySymbol(TOKENS_BY_CHAIN, symbol, chainId);
}

export function findTokenByAddressDefault(address: string, chainId: number): TokenConfig | null {
  return findTokenByAddress(TOKENS_BY_CHAIN, address, chainId);
}

export function getNativeTokenDefault(chainId: number): TokenConfig | null {
  return getNativeToken(TOKENS_BY_CHAIN, chainId);
}

export function isTokenSupportedDefault(symbolOrAddress: string, chainId: number): boolean {
  return isTokenSupported(TOKENS_BY_CHAIN, symbolOrAddress, chainId);
}

export function resolveTokenDefault(identifier: string, chainId: number): TokenConfig | null {
  return resolveToken(TOKENS_BY_CHAIN, identifier, chainId);
}

export function getDefaultTokenPairDefault(chainId: number): [TokenConfig, TokenConfig] | null {
  return getDefaultTokenPair(TOKENS_BY_CHAIN, chainId);
}
