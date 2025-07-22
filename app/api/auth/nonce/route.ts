import { NextRequest, NextResponse } from 'next/server';

// Simple nonce generator (alphanumeric string)
function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    const nonce = generateNonce();
    
    return NextResponse.json({ 
      nonce 
    }, { 
      status: 200 
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json({ 
      error: 'Failed to generate nonce' 
    }, { 
      status: 500 
    });
  }
} 