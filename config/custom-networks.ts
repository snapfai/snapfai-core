import { defineChain } from '@reown/appkit/networks';

// Define a custom network - This is an example for Avalanche C-Chain
export const avalancheChain = defineChain({
  id: 43114,
  caipNetworkId: 'eip155:43114',
  chainNamespace: 'eip155',
  name: 'Avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: ['https://api.avax.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'SnowTrace', url: 'https://snowtrace.io' },
  },
});

// Define another custom network - This is an example for Arbitrum Nova
export const arbitrumNovaChain = defineChain({
  id: 42170,
  caipNetworkId: 'eip155:42170',
  chainNamespace: 'eip155',
  name: 'Arbitrum Nova',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://nova.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: { name: 'Arbiscan', url: 'https://nova.arbiscan.io' },
  },
}); 