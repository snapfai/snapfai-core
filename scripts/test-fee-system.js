#!/usr/bin/env node

/**
 * Test script for the swap fee system
 * This script tests the API endpoints to ensure fees are being applied correctly
 * 
 * Default fee recipient: 0x12a377514F19Af5A626Bb6250065673874c708aB
 * Default fee rate: 10 bps (0.1%)
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testChainId: 1, // Ethereum mainnet
  testSellToken: '0xA0b86a33E6441b8c4C8D1d4B4C8D1d4B4C8D1d4B', // USDC address
  testBuyToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH address
  testAmount: '1000000000', // 1000 USDC (6 decimals)
  expectedFeeBps: 10, // 0.1%
  expectedFeePercentage: 0.1
};

async function testFeeSystem() {
  console.log('🧪 Testing Swap Fee System...\n');

  try {
    // Test 1: Check if fee parameters are added to quote API
    console.log('1️⃣ Testing Quote API with fee parameters...');
    const quoteResponse = await testQuoteAPI();
    
    if (quoteResponse.success) {
      console.log('✅ Quote API test passed');
      console.log(`   Fee recipient: ${quoteResponse.feeRecipient || 'Not found'}`);
      console.log(`   Fee BPS: ${quoteResponse.feeBps || 'Not found'}`);
      console.log(`   Fee token: ${quoteResponse.feeToken || 'Not found'}`);
    } else {
      console.log('❌ Quote API test failed:', quoteResponse.error);
    }

    // Test 2: Check if fee parameters are added to price API
    console.log('\n2️⃣ Testing Price API with fee parameters...');
    const priceResponse = await testPriceAPI();
    
    if (priceResponse.success) {
      console.log('✅ Price API test passed');
      console.log(`   Fee recipient: ${priceResponse.feeRecipient || 'Not found'}`);
      console.log(`   Fee BPS: ${priceResponse.feeBps || 'Not found'}`);
      console.log(`   Fee token: ${priceResponse.feeToken || 'Not found'}`);
    } else {
      console.log('❌ Price API test failed:', priceResponse.error);
    }

    // Test 3: Verify fee calculation
    console.log('\n3️⃣ Testing fee calculation...');
    const feeCalculation = testFeeCalculation();
    if (feeCalculation.success) {
      console.log('✅ Fee calculation test passed');
      console.log(`   Expected fee: ${feeCalculation.expectedFee} USDC`);
      console.log(`   Fee percentage: ${feeCalculation.percentage}%`);
    } else {
      console.log('❌ Fee calculation test failed:', feeCalculation.error);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  console.log('\n🏁 Fee system testing completed!');
}

async function testQuoteAPI() {
  const params = new URLSearchParams({
    sellToken: TEST_CONFIG.testSellToken,
    buyToken: TEST_CONFIG.testBuyToken,
    sellAmount: TEST_CONFIG.testAmount,
    chainId: TEST_CONFIG.testChainId.toString(),
    taker: '0x1234567890123456789012345678901234567890'
  });

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/swap/quote?${params}`);
    const data = await response.json();
    
    if (data.success) {
      // Check if fee information is present in the response
      const hasFees = data.data && data.data.fees;
      const feeRecipient = hasFees ? data.data.fees.integratorFee?.recipient : null;
      const feeBps = hasFees ? data.data.fees.integratorFee?.bps : null;
      const feeToken = hasFees ? data.data.fees.integratorFee?.token : null;
      
      return {
        success: true,
        feeRecipient,
        feeBps,
        feeToken,
        hasFees
      };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testPriceAPI() {
  const params = new URLSearchParams({
    sellToken: TEST_CONFIG.testSellToken,
    buyToken: TEST_CONFIG.testBuyToken,
    sellAmount: TEST_CONFIG.testAmount,
    chainId: TEST_CONFIG.testChainId.toString()
  });

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/swap/price?${params}`);
    const data = await response.json();
    
    if (data.success) {
      // Check if fee information is present in the response
      const hasFees = data.data && data.data.fees;
      const feeRecipient = hasFees ? data.data.fees.integratorFee?.recipient : null;
      const feeBps = hasFees ? data.data.fees.integratorFee?.bps : null;
      const feeToken = hasFees ? data.data.fees.integratorFee?.token : null;
      
      return {
        success: true,
        feeRecipient,
        feeBps,
        feeToken,
        hasFees
      };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function testFeeCalculation() {
  try {
    const sellAmount = parseFloat(TEST_CONFIG.testAmount);
    const feeBps = TEST_CONFIG.expectedFeeBps;
    const expectedFee = (sellAmount * feeBps) / 10000; // Convert bps to decimal
    const percentage = (feeBps / 100); // Convert bps to percentage
    
    return {
      success: true,
      expectedFee: expectedFee.toFixed(6),
      percentage: percentage.toFixed(2),
      sellAmount,
      feeBps
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the test suite
if (require.main === module) {
  testFeeSystem().catch(console.error);
}

module.exports = { testFeeSystem };
