export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  logoURI?: string;
  isNative?: boolean;
}

export type TokensByChain = Record<number, TokenConfig[]>;
