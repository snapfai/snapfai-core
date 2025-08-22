import type {
  SIWEVerifyMessageArgs,
  SIWECreateMessageArgs,
  SIWESession,
} from "@reown/appkit-siwe";
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { mainnet } from "@reown/appkit/networks";
import { arbitrumOneChain, baseChain, optimismChain, avalancheChain, bscChain } from "@/config/custom-networks";

// Global state for authentication
let globalAuthState = {
  isAuthenticated: false,
  address: null as string | null,
  sessionId: null as string | null
};

export const siweConfig = createSIWEConfig({
  // Get message params for SIWE
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    // Include all supported chains but don't restrict session validation to specific chains
    chains: [mainnet.id, arbitrumOneChain.id, baseChain.id, optimismChain.id, avalancheChain.id, bscChain.id, 137], // Added BSC (56) and Polygon (137)
    statement: "Welcome to SnapFAI!\n\nSign this message to securely connect your wallet and access DeFi features across all supported networks. This signature proves you own this wallet address without any gas fees.",
    version: "1",
  }),

  // Create the SIWE message
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),

  // Get a unique nonce for the message
  getNonce: async () => {
    try {
      console.log('🎲 Fetching nonce from server...');
      const response = await fetch('/api/auth/nonce');
      if (!response.ok) {
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await response.json();
      console.log('✅ Generated nonce:', nonce);
      return nonce;
    } catch (error) {
      console.error('❌ Error fetching nonce:', error);
      // Fallback to client-side generation
      const fallbackNonce = Math.random().toString(36).substring(2, 15);
      console.log('🔄 Using fallback nonce:', fallbackNonce);
      return fallbackNonce;
    }
  },

  // Get current session - chain-agnostic
  getSession: async () => {
    try {
      console.log('🔍 AppKit requesting session (chain switch check)...');
      const sessionId = localStorage.getItem('siwe-session-id');
      
      if (!sessionId) {
        console.log('❌ No session ID found in localStorage');
        return null;
      }

      const response = await fetch(`/api/auth/session?sessionId=${sessionId}`);
      
      if (!response.ok) {
        // Don't remove session ID immediately - might be temporary server issue
        return null;
      }

      const responseText = await response.text();
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : { session: null };
      } catch (parseError) {
        console.error('❌ JSON parse error in getSession:', parseError);
        return null;
      }
      
      const { session } = data;
      
      if (session && session.address) {
        // Update global state
        globalAuthState.isAuthenticated = true;
        globalAuthState.address = session.address;
        globalAuthState.sessionId = sessionId;
        
        console.log('🌐 Returning chain-agnostic session for AppKit');
        // Return session that works across all chains
        return {
          address: session.address,
          chainId: session.chainId // AppKit expects this but we don't restrict to it
        };
      } else {
        console.log('❌ Invalid session data from server');
        return null;
      }
    } catch (error) {
      console.error('❌ Error in getSession:', error);
      
      // Fallback: Check localStorage directly if server fails
      const sessionId = localStorage.getItem('siwe-session-id');
      const siweAddress = localStorage.getItem('siwe-address');
      const siweTimestamp = localStorage.getItem('siwe-timestamp');
      
      if (sessionId && siweAddress && siweTimestamp) {
        const timestamp = parseInt(siweTimestamp);
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age < maxAge) {
          console.log('🔄 Using localStorage fallback session');
          return {
            address: siweAddress,
            chainId: 1 // Default chainId
          };
        }
      }
      
      return null;
    }
  },

  // Verify the signed message
  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    try {
      console.log('🔐 Verifying SIWE message...');
      console.log('📝 Message preview:', message.substring(0, 100) + '...');
      console.log('✍️ Signature preview:', signature.substring(0, 20) + '...');
      
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!response.ok) {
        console.error('❌ Verification failed with status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error('Verification failed');
      }

      const result = await response.json();
      console.log('✅ Verification successful:', result);
      
      // Store session ID for future requests
      if (result.sessionId) {
        localStorage.setItem('siwe-session-id', result.sessionId);
        console.log('💾 Stored session ID:', result.sessionId);
        
        // Store fallback authentication data
        if (result.address) {
          localStorage.setItem('siwe-address', result.address.toLowerCase());
          localStorage.setItem('siwe-timestamp', Date.now().toString());
          console.log('💾 Stored fallback SIWE data for', result.address);
        }
        
        // Update global state
        globalAuthState.isAuthenticated = true;
        globalAuthState.address = result.address;
        globalAuthState.sessionId = result.sessionId;
        
        // Trigger a custom event to notify components immediately
        if (typeof window !== 'undefined') {
          console.log('📢 Dispatching SIWE success event...');
          window.dispatchEvent(new CustomEvent('siwe-auth-success', { 
            detail: { 
              address: result.address, 
              sessionId: result.sessionId,
              timestamp: Date.now()
            } 
          }));
          
          // Also trigger a storage event for immediate updates
          window.dispatchEvent(new Event('storage'));
        }
      }

      return result.success;
    } catch (error) {
      console.error('❌ Error verifying message:', error);
      
      // Trigger failure event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('siwe-auth-error', { 
          detail: { error: error instanceof Error ? error.message : 'Unknown error' } 
        }));
      }
      
      return false;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      console.log('👋 Signing out...');
      const sessionId = localStorage.getItem('siwe-session-id');
      
      // End analytics session before cleanup
      const { analytics } = await import('./analytics');
      await analytics.endSession();
      
      if (sessionId) {
        // Call server to delete session
        await fetch(`/api/auth/session?sessionId=${sessionId}`, {
          method: 'DELETE'
        });
      }
      
      // Clear all local storage
      localStorage.removeItem('siwe-session-id');
      localStorage.removeItem('siwe-address');
      localStorage.removeItem('siwe-timestamp');
      
      // Reset global state
      globalAuthState.isAuthenticated = false;
      globalAuthState.address = null;
      globalAuthState.sessionId = null;
      
      // Trigger logout event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('siwe-auth-logout'));
      }
      
      console.log('✅ Signed out successfully');
      return true;
    } catch (error) {
      console.error('❌ Error signing out:', error);
      return false;
    }
  },

  // Optional callbacks
  onSignIn: (session?: SIWESession) => {
    console.log("🎉 User signed in successfully:", session);
    
    // Trigger a custom event to notify components instead of page reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('siwe-auth-success', { 
        detail: { session } 
      }));
    }
  },
  onSignOut: () => {
    console.log("👋 User signed out");
    // Clear any local storage
    localStorage.removeItem('siwe-session-id');
    
    // Clear global state
    globalAuthState.isAuthenticated = false;
    globalAuthState.address = null;
    globalAuthState.sessionId = null;
  },

  // Optional configurations
  enabled: true,
  nonceRefetchIntervalMs: 300000, // 5 minutes
  sessionRefetchIntervalMs: 300000, // 5 minutes
  signOutOnDisconnect: true,
  signOutOnAccountChange: true,
  signOutOnNetworkChange: false, // Allow network changes without signing out
});

// Export global auth state for components to access
export const getGlobalAuthState = () => globalAuthState; 