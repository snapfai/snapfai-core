import { NextRequest, NextResponse } from 'next/server';

// Persistent session storage that survives API route recompiles
// Use a global variable that persists across route recompiles
declare global {
  var __sessions: Map<string, { address: string; chainId: number; expiresAt: number }> | undefined;
}

// Initialize persistent session storage
if (!global.__sessions) {
  global.__sessions = new Map<string, { address: string; chainId: number; expiresAt: number }>();
}

const sessions = global.__sessions;

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the session ID from a secure httpOnly cookie
    const sessionId = request.headers.get('x-session-id') || 
                     request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ 
        session: null 
      });
    }

    const session = sessions.get(sessionId);
    
    if (!session) {
      // Only log when we can't find a session that should exist
      if (sessionId.length > 10) { // Valid session ID format
        console.log('❌ No session found for', sessionId.substring(0, 8) + '...');
      }
      return NextResponse.json({ 
        session: null 
      });
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log('⏰ Session expired for', sessionId.substring(0, 8) + '...');
      sessions.delete(sessionId);
      return NextResponse.json({ 
        session: null 
      });
    }
    return NextResponse.json({ 
      session: {
        address: session.address,
        chainId: session.chainId
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting session:', error);
    return NextResponse.json({ 
      error: 'Failed to get session' 
    }, { 
      status: 500 
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id') || 
                     request.nextUrl.searchParams.get('sessionId');
    
    console.log('🗑️ Session DELETE request - sessionId:', sessionId);
    
    if (sessionId) {
      const deleted = sessions.delete(sessionId);
      console.log('Session deleted:', deleted);
    }

    return NextResponse.json({ 
      success: true 
    });
    
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ 
      error: 'Failed to delete session' 
    }, { 
      status: 500 
    });
  }
} 