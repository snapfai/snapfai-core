// Test analytics data and public API
const { createClient } = require('@supabase/supabase-js');

// Read .env.local file manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables not found!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyticsData() {
  console.log('📊 Testing Analytics Data & Public API\n');

  try {
    // Test 1: Check users data
    console.log('1️⃣ USERS DATA:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('wallet_address, first_connected_at, total_swaps_count, total_volume_usd')
      .limit(5);

    if (usersError) {
      console.error('❌ Error:', usersError.message);
    } else {
      users.forEach((user, i) => {
        console.log(`   User ${i+1}: ${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}`);
        console.log(`           Connected: ${new Date(user.first_connected_at).toLocaleString()}`);
        console.log(`           Swaps: ${user.total_swaps_count}, Volume: $${user.total_volume_usd}`);
      });
    }

    // Test 2: Check sessions data
    console.log('\n2️⃣ SESSIONS DATA:');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('wallet_address, chain_name, created_at, duration_seconds')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error:', sessionsError.message);
    } else {
      sessions.forEach((session, i) => {
        console.log(`   Session ${i+1}: ${session.wallet_address.slice(0, 8)}...${session.wallet_address.slice(-6)}`);
        console.log(`             Chain: ${session.chain_name}, Created: ${new Date(session.created_at).toLocaleString()}`);
        console.log(`             Duration: ${session.duration_seconds ? `${session.duration_seconds}s` : 'Active'}`);
      });
    }

    // Test 3: Check swaps data
    console.log('\n3️⃣ SWAPS DATA:');
    const { data: swaps, error: swapsError } = await supabase
      .from('swaps')
      .select('wallet_address, token_in_symbol, token_out_symbol, status, token_in_value_usd, created_at')
      .limit(5);

    if (swapsError) {
      console.error('❌ Error:', swapsError.message);
    } else {
      if (swaps.length === 0) {
        console.log('   📝 No swaps recorded yet');
      } else {
        swaps.forEach((swap, i) => {
          console.log(`   Swap ${i+1}: ${swap.wallet_address.slice(0, 8)}...${swap.wallet_address.slice(-6)}`);
          console.log(`           ${swap.token_in_symbol} → ${swap.token_out_symbol}`);
          console.log(`           Status: ${swap.status}, Value: $${swap.token_in_value_usd || 0}`);
          console.log(`           Date: ${new Date(swap.created_at).toLocaleString()}`);
        });
      }
    }

    // Test 4: Check chat interactions
    console.log('\n4️⃣ CHAT INTERACTIONS:');
    const { data: chats, error: chatsError } = await supabase
      .from('chat_interactions')
      .select('wallet_address, message_type, intent, led_to_swap, created_at')
      .limit(5);

    if (chatsError) {
      console.error('❌ Error:', chatsError.message);
    } else {
      if (chats.length === 0) {
        console.log('   📝 No chat interactions recorded yet');
      } else {
        chats.forEach((chat, i) => {
          console.log(`   Chat ${i+1}: ${chat.wallet_address ? chat.wallet_address.slice(0, 8) + '...' + chat.wallet_address.slice(-6) : 'Anonymous'}`);
          console.log(`           Type: ${chat.message_type}, Intent: ${chat.intent || 'N/A'}`);
          console.log(`           Led to Swap: ${chat.led_to_swap}, Date: ${new Date(chat.created_at).toLocaleString()}`);
        });
      }
    }

    // Test 5: Check analytics events
    console.log('\n5️⃣ ANALYTICS EVENTS:');
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('event_type, event_category, wallet_address, created_at')
      .limit(5);

    if (eventsError) {
      console.error('❌ Error:', eventsError.message);
    } else {
      if (events.length === 0) {
        console.log('   📝 No analytics events recorded yet');
      } else {
        events.forEach((event, i) => {
          console.log(`   Event ${i+1}: ${event.event_type} (${event.event_category})`);
          console.log(`            Wallet: ${event.wallet_address ? event.wallet_address.slice(0, 8) + '...' + event.wallet_address.slice(-6) : 'N/A'}`);
          console.log(`            Date: ${new Date(event.created_at).toLocaleString()}`);
        });
      }
    }

    // Test 6: Test Public API endpoint
    console.log('\n6️⃣ TESTING PUBLIC API:');
    try {
      const response = await fetch('http://localhost:3000/api/analytics/public');
      if (response.ok) {
        const publicData = await response.json();
        console.log('   ✅ Public API Response:');
        console.log(`      Total Users: ${publicData.totalUsers}`);
        console.log(`      Active Today: ${publicData.activeUsersToday}`);
        console.log(`      Total Swaps: ${publicData.totalSwaps}`);
        console.log(`      Success Rate: ${publicData.swapSuccessRate}%`);
        console.log(`      Total Volume: $${publicData.totalVolumeUsd}`);
        console.log(`      Chat Messages: ${publicData.chatMessages}`);
        console.log(`      Chain Distribution: ${publicData.chainDistribution.length} chains`);
        console.log(`      Top Tokens: ${publicData.topTokens.length} tokens`);
        console.log(`      Last Updated: ${new Date(publicData.lastUpdated).toLocaleString()}`);
      } else {
        console.log(`   ❌ Public API failed: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`   ❌ Public API error: ${apiError.message}`);
    }

    // Test 7: Filter swaps for BRETT/TOSHI on Base
    console.log('\n7️⃣ FILTER: BRETT/TOSHI on Base (recent 20):');
    const { data: memeSwaps, error: memeError } = await supabase
      .from('swaps')
      .select('id, wallet_address, chain_name, token_in_symbol, token_out_symbol, token_in_value_usd, status, created_at, tx_hash')
      .or('token_in_symbol.eq.BRETT,token_out_symbol.eq.BRETT,token_in_symbol.eq.TOSHI,token_out_symbol.eq.TOSHI')
      .eq('chain_name', 'base')
      .order('created_at', { ascending: false })
      .limit(20);

    if (memeError) {
      console.error('❌ Error:', memeError.message);
    } else if (!memeSwaps || memeSwaps.length === 0) {
      console.log('   📝 No BRETT/TOSHI swaps found on Base');
    } else {
      memeSwaps.forEach((swap, i) => {
        console.log(`   ${i+1}. ${swap.token_in_symbol} → ${swap.token_out_symbol} | ${swap.chain_name}`);
        console.log(`       Status: ${swap.status}, USD: $${swap.token_in_value_usd || 0}`);
        console.log(`       Tx: ${swap.tx_hash ? swap.tx_hash.slice(0,10)+'...' : 'N/A'} | ${new Date(swap.created_at).toLocaleString()}`);
        console.log(`       ID: ${swap.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAnalyticsData();
