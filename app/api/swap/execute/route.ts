import { NextRequest, NextResponse } from 'next/server';

// For MVP, we'll simulate the swap execution API
// In production, this would call our backend service

export async function POST(request: NextRequest) {
  try {
    const { userId, confirm } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    if (confirm !== 'Yes' && confirm !== 'yes') {
      return NextResponse.json({ 
        success: true,
        message: 'Swap cancelled. Is there anything else I can help you with?' 
      });
    }
    
    // In production, we would fetch the pending swap from Redis/session store
    // For MVP, we'll simulate the transaction creation
    
    // Simulate backend processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a mock transaction
    const transaction = {
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap Router address
      data: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      value: '0',
      gasLimit: '250000',
      chainId: 1
    };
    
    // Return transaction data that would be sent to the wallet for signing
    return NextResponse.json({
      success: true,
      message: 'Your swap is ready to be executed. Please sign the transaction in your wallet.',
      transaction: {
        ...transaction,
        // Add simulated swap details for the frontend
        tokenIn: 'ETH',
        tokenOut: 'USDT',
        amountIn: 1.0,
        estimatedAmountOut: 3000,
        protocol: '0x'
      }
    });
  } catch (error) {
    console.error('Error executing swap:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Sorry, I encountered an error while preparing your swap. Please try again later.'
      },
      { status: 500 }
    );
  }
} 