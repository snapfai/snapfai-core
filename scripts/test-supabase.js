// Test Supabase connection and analytics
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
  console.log('Make sure you have these in .env.local:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can query users table
    console.log('\n📊 Testing database connection...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Error querying users:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${users?.length || 0} users`);
    }

    // Test 2: Check sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error querying sessions:', sessionsError.message);
    } else {
      console.log('✅ Sessions table accessible');
      console.log(`   Found ${sessions?.length || 0} sessions`);
    }

    // Test 3: Check swaps
    const { data: swaps, error: swapsError } = await supabase
      .from('swaps')
      .select('*')
      .limit(5);

    if (swapsError) {
      console.error('❌ Error querying swaps:', swapsError.message);
    } else {
      console.log('✅ Swaps table accessible');
      console.log(`   Found ${swaps?.length || 0} swaps`);
    }

    // Test 4: Try to insert a test event
    console.log('\n🧪 Testing write access...');
    const { data: event, error: eventError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: 'test_connection',
        event_category: 'system',
        properties: { test: true, timestamp: new Date().toISOString() }
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Error inserting test event:', eventError.message);
    } else {
      console.log('✅ Successfully wrote test event');
      console.log('   Event ID:', event.id);
      
      // Clean up test event
      await supabase
        .from('analytics_events')
        .delete()
        .eq('id', event.id);
      console.log('   Test event cleaned up');
    }

    console.log('\n🎉 Supabase connection test complete!');
    console.log('Your analytics system is ready to track data.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();
