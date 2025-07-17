import { defineChain } from '@reown/appkit/networks';

// Define Solana Mainnet
export const solanaMainnet = defineChain({
  id: 101,
  caipNetworkId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  chainNamespace: 'solana',
  name: 'Solana',
  nativeCurrency: {
    decimals: 9,
    name: 'Solana',
    symbol: 'SOL',
  },
  rpcUrls: {
    default: {
      http: ['https://api.mainnet-beta.solana.com']
    }
  },
  blockExplorers: {
    default: { name: 'Solana Explorer', url: 'https://explorer.solana.com' },
  },
});

// Define Solana Testnet
export const solanaTestnet = defineChain({
  id: 102,
  caipNetworkId: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
  chainNamespace: 'solana',
  name: 'Solana Testnet',
  nativeCurrency: {
    decimals: 9,
    name: 'Solana Testnet',
    symbol: 'SOL',
  },
  rpcUrls: {
    default: {
      http: ['https://api.testnet.solana.com']
    }
  },
  blockExplorers: {
    default: { name: 'Solana Explorer', url: 'https://explorer.solana.com/?cluster=testnet' },
  },
});

// Define Solana Devnet
export const solanaDevnet = defineChain({
  id: 103,
  caipNetworkId: 'solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K',
  chainNamespace: 'solana',
  name: 'Solana Devnet',
  nativeCurrency: {
    decimals: 9,
    name: 'Solana Devnet',
    symbol: 'SOL',
  },
  rpcUrls: {
    default: {
      http: ['https://api.devnet.solana.com']
    }
  },
  blockExplorers: {
    default: { name: 'Solana Explorer', url: 'https://explorer.solana.com/?cluster=devnet' },
  },
}); 