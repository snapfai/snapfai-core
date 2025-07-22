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
    
    console.log('📥 Session GET request - sessionId:', sessionId);
    console.log('🗂️ All sessions in memory:', Array.from(sessions.keys()));
    
    if (!sessionId) {
      console.log('❌ No session ID provided');
      return NextResponse.json({ 
        session: null 
      });
    }

    const session = sessions.get(sessionId);
    console.log('🔍 Found session for', sessionId, ':', session);
    
    if (!session) {
      console.log('❌ No session found in memory for', sessionId);
      return NextResponse.json({ 
        session: null 
      });
    }

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      console.log('⏰ Session expired for', sessionId);
      sessions.delete(sessionId);
      return NextResponse.json({ 
        session: null 
      });
    }

    console.log('✅ Returning valid session for', sessionId);
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