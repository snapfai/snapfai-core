import { NextRequest, NextResponse } from 'next/server';

// Persistent session storage that survives API route recompiles
declare global {
  var __sessions: Map<string, { address: string; chainId: number; expiresAt: number }> | undefined;
}

// Initialize persistent session storage
if (!global.__sessions) {
  global.__sessions = new Map<string, { address: string; chainId: number; expiresAt: number }>();
}

const sessions = global.__sessions;

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();
    
    console.log('🔐 SIWE verification request received');
    console.log('📝 Message length:', message?.length);
    console.log('✍️ Signature length:', signature?.length);
    
    if (!message || !signature) {
      console.log('❌ Missing message or signature');
      return NextResponse.json({ 
        error: 'Message and signature are required' 
      }, { 
        status: 400 
      });
    }

    // In a real implementation, you would:
    // 1. Parse the SIWE message
    // 2. Verify the signature against the message
    // 3. Check the nonce, expiration, etc.
    // 4. Store the session securely
    
    // For demo purposes, we'll extract the address from the message
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    const address = addressMatch ? addressMatch[0] : null;
    
    console.log('🔍 Extracted address from message:', address);
    
    if (!address) {
      console.log('❌ Could not extract valid address from message');
      return NextResponse.json({ 
        error: 'Invalid message format' 
      }, { 
        status: 400 
      });
    }

    // Create a session
    const sessionId = Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    const sessionData = {
      address: address.toLowerCase(),
      chainId: 1, // Store a default chainId but don't restrict validation to it
      expiresAt
    };
    
    sessions.set(sessionId, sessionData);
    
    console.log('💾 Created chain-agnostic session:', sessionId);
    console.log('📋 Session data:', sessionData);
    console.log('🗂️ Total sessions in memory:', sessions.size);

    // In production, you'd set this as an httpOnly cookie
    return NextResponse.json({ 
      success: true,
      sessionId,
      address: address.toLowerCase()
    });
    
  } catch (error) {
    console.error('❌ Error verifying message:', error);
    return NextResponse.json({ 
      error: 'Failed to verify message' 
    }, { 
      status: 500 
    });
  }
} 