const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Minimal RPC mapping for supported chains
const CHAIN_RPC = {
  ethereum: 'https://rpc.ankr.com/eth',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  base: 'https://mainnet.base.org',
  optimism: 'https://mainnet.optimism.io',
  avalanche: 'https://api.avax.network/ext/bc/C/rpc',
  polygon: 'https://polygon-rpc.com'
};

function getProvider(chainName) {
  const rpcUrl = CHAIN_RPC[chainName.toLowerCase()];
  if (!rpcUrl) return null;
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

async function reconcile() {
  console.log('🔄 Reconciling pending swaps with on-chain receipts...');

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: pending, error } = await supabase
    .from('swaps')
    .select('id, chain_name, tx_hash, status, created_at')
    .eq('status', 'pending')
    .not('tx_hash', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching pending swaps:', error.message);
    process.exit(1);
  }

  if (!pending || pending.length === 0) {
    console.log('✅ No recent pending swaps with tx hash.');
    return;
  }

  console.log(`📦 Found ${pending.length} pending swaps to check`);

  for (const s of pending) {
    const provider = getProvider(s.chain_name);
    if (!provider) {
      console.warn(`⚠️ No provider for chain ${s.chain_name}, skipping ${s.id}`);
      continue;
    }

    try {
      const receipt = await provider.getTransactionReceipt(s.tx_hash);
      if (!receipt) {
        console.log(`⏳ Still pending on-chain: ${s.id} (${s.chain_name})`);
        continue;
      }

      if (receipt.status === 1) {
        console.log(`✅ Confirmed on-chain: ${s.id} (${s.chain_name})`);
        await supabase
          .from('swaps')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', s.id);
      } else {
        console.log(`❌ Failed on-chain: ${s.id} (${s.chain_name})`);
        await supabase
          .from('swaps')
          .update({ status: 'failed', failed_at: new Date().toISOString(), error_message: 'Transaction reverted' })
          .eq('id', s.id);
      }
    } catch (e) {
      console.warn(`⚠️ Error checking receipt for ${s.id}:`, e.message);
    }
  }

  console.log('🏁 Reconciliation complete.');
}

reconcile();


