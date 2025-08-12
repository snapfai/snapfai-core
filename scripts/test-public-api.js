// Test public API endpoint
async function testPublicAPI() {
  try {
    console.log('🧪 Testing Public Analytics API...\n');
    
    const response = await fetch('http://localhost:3000/api/analytics/public');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testPublicAPI();
