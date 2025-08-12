const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVolumeTracking() {
  try {
    console.log('🔍 Testing volume tracking...\n');

    // 1. Check total swaps
    const { data: swaps, error: swapsError } = await supabase
      .from('swaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (swapsError) {
      console.error('❌ Error fetching swaps:', swapsError);
      return;
    }

    console.log(`📊 Total swaps in database: ${swaps.length}`);
    
    if (swaps.length > 0) {
      console.log('\n📋 Recent swaps:');
      swaps.forEach((swap, i) => {
        console.log(`  ${i + 1}. ${swap.token_in_symbol} → ${swap.token_out_symbol}`);
        console.log(`     Amount: ${swap.token_in_amount} ${swap.token_in_symbol}`);
        console.log(`     USD Value: $${swap.token_in_value_usd || 'NULL'}`);
        console.log(`     Status: ${swap.status}`);
        console.log(`     Chain: ${swap.chain_name}`);
        console.log(`     Created: ${swap.created_at}`);
        console.log('');
      });
    }

    // 2. Check volume by status
    const { data: volumeByStatus, error: volumeError } = await supabase
      .from('swaps')
      .select('status, token_in_value_usd')
      .not('token_in_value_usd', 'is', null);

    if (volumeError) {
      console.error('❌ Error fetching volume by status:', volumeError);
      return;
    }

    const volumeMap = volumeByStatus.reduce((acc, swap) => {
      acc[swap.status] = (acc[swap.status] || 0) + (swap.token_in_value_usd || 0);
      return acc;
    }, {});

    console.log('💰 Volume by status:');
    Object.entries(volumeMap).forEach(([status, volume]) => {
      console.log(`  ${status}: $${volume.toLocaleString()}`);
    });

    const totalVolume = Object.values(volumeMap).reduce((a, b) => a + b, 0);
    console.log(`\n💵 Total volume: $${totalVolume.toLocaleString()}`);

    // 3. Check daily metrics
    const { data: dailyMetrics, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('*')
      .order('date', { ascending: false })
      .limit(7);

    if (metricsError) {
      console.error('❌ Error fetching daily metrics:', metricsError);
      return;
    }

    console.log('\n📅 Daily metrics (last 7 days):');
    dailyMetrics.forEach(metric => {
      console.log(`  ${metric.date}: $${metric.total_volume_usd?.toLocaleString() || 0} volume, ${metric.total_swaps} swaps`);
    });

    // 4. Check if there are any swaps with NULL values
    const { data: nullValueSwaps, error: nullError } = await supabase
      .from('swaps')
      .select('id, token_in_symbol, token_in_amount, token_in_value_usd')
      .is('token_in_value_usd', null);

    if (nullError) {
      console.error('❌ Error checking for NULL values:', nullError);
      return;
    }

    if (nullValueSwaps.length > 0) {
      console.log(`\n⚠️  Found ${nullValueSwaps.length} swaps with NULL USD values:`);
      nullValueSwaps.forEach(swap => {
        console.log(`  - ${swap.token_in_symbol}: ${swap.token_in_amount} (ID: ${swap.id})`);
      });
    } else {
      console.log('\n✅ All swaps have USD values');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVolumeTracking();
