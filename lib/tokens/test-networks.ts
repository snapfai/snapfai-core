/**
 * Test file to verify network configuration
 * Run this to check if all networks are properly set up
 */

import { networks } from '@/config'
import { SUPPORTED_CHAINS } from '../chains'

console.log('🔍 Testing Network Configuration...\n')

console.log('📋 Networks from config:')
console.log(networks)

console.log('\n📋 SUPPORTED_CHAINS from chains.ts:')
console.log(SUPPORTED_CHAINS)

console.log('\n🔍 Checking specific networks:')

// Check if BSC is properly configured
const bscNetwork = networks.find(n => n.id === 56)
console.log('\nBSC Network (Chain 56):', bscNetwork ? '✅ Found' : '❌ Missing')
if (bscNetwork) {
  console.log('  Name:', bscNetwork.name)
  console.log('  RPC URLs:', bscNetwork.rpcUrls)
  console.log('  Block Explorer:', bscNetwork.blockExplorers?.default)
}

// Check if Polygon is properly configured
const polygonNetwork = networks.find(n => n.id === 137)
console.log('\nPolygon Network (Chain 137):', polygonNetwork ? '✅ Found' : '❌ Missing')
if (polygonNetwork) {
  console.log('  Name:', polygonNetwork.name)
  console.log('  RPC URLs:', polygonNetwork.rpcUrls)
  console.log('  Block Explorer:', polygonNetwork.blockExplorers?.default)
}

// Check all chain IDs
const chainIds = networks.map(n => n.id).sort((a, b) => a - b)
console.log('\n📊 All Chain IDs:', chainIds)

console.log('\n✅ Network configuration test completed!')
