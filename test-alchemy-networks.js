// Test file to check available Alchemy Network enum values
import { Network } from 'alchemy-sdk';

console.log('Available Alchemy Network enum values:');
console.log(Object.keys(Network));

// Check for BSC-related networks
const bscNetworks = Object.keys(Network).filter(key => 
  key.includes('BSC') || key.includes('BNB') || key.includes('BINANCE')
);
console.log('\nBSC/BNB related networks:', bscNetworks);

// Check for network 56
const network56 = Object.values(Network).find(network => network === 56);
console.log('\nNetwork with ID 56:', network56);
