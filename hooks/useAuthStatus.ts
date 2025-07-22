'use client'

import { useState, useEffect } from 'react'
import { useAppKitAccount } from '@reown/appkit/react'

export default function useAuthStatus() {
  const { address, isConnected, status } = useAppKitAccount()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastCheckTimestamp, setLastCheckTimestamp] = useState(0)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    setIsConnecting(status === 'connecting')
  }, [status])

  useEffect(() => {
    const checkAuthStatus = async () => {
      const now = Date.now()
      
      // Prevent excessive checks - only check every 5 seconds
      if (now - lastCheckTimestamp < 5000) {
        return
      }
      
      setLastCheckTimestamp(now)
      
      console.log('🔍 Checking SIWE auth status...');
      console.log('Connected:', isConnected, 'Address:', address);
      
      if (!isConnected || !address) {
        console.log('❌ Not connected or no address');
        setIsAuthenticated(false);
        setAuthError(null);
        return;
      }

      // Method 1: Check our custom session first (this should be the primary method)
      try {
        const sessionId = localStorage.getItem('siwe-session-id');
        console.log('🔑 Session ID from localStorage:', sessionId);
        
        if (sessionId) {
          console.log('📞 Making API call to check session...');
          const response = await fetch(`/api/auth/session?sessionId=${sessionId}`);
          console.log('📡 Session API response status:', response.status, response.ok);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📋 Session API response data:', data);
            
            // Check if we have a valid session
            const session = data.session;
            if (session && session.address) {
              const sessionAddress = session.address.toLowerCase();
              const currentAddress = address.toLowerCase();
              const isAuth = sessionAddress === currentAddress;
              
              console.log('�� Address comparison (chain-agnostic):');
              console.log('  Session address:', sessionAddress);
              console.log('  Current address:', currentAddress);
              console.log('  Match:', isAuth);
              console.log('  ✅ Session valid across all chains');
              
              if (isAuth) {
                console.log('✅ Authenticated via custom session API (works on all chains)');
                setIsAuthenticated(true);
                setAuthError(null);
                return;
              } else {
                console.log('❌ Address mismatch in session');
              }
            } else {
              console.log('❌ No valid session data in response');
            }
          } else {
            console.log('🧹 Session API failed, but keeping sessionId for fallback check');
            // Don't remove sessionId immediately - use it for fallback
          }
        } else {
          console.log('❌ No session ID in localStorage');
        }
      } catch (error) {
        console.error('❌ Error checking session API:', error);
      }

      // Method 2: Fallback - Check if we have a sessionId and it matches recent SIWE activity
      try {
        const sessionId = localStorage.getItem('siwe-session-id');
        const siweTimestamp = localStorage.getItem('siwe-timestamp');
        const siweAddress = localStorage.getItem('siwe-address');
        
        console.log('🔄 Fallback check:');
        console.log('  Session ID:', sessionId);
        console.log('  SIWE Timestamp:', siweTimestamp);
        console.log('  SIWE Address:', siweAddress);
        
        if (sessionId && siweAddress && siweTimestamp) {
          const timestamp = parseInt(siweTimestamp);
          const now = Date.now();
          const age = now - timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          
          console.log('⏰ Session age:', Math.floor(age / 1000 / 60), 'minutes');
          
          if (age < maxAge && siweAddress.toLowerCase() === address.toLowerCase()) {
            console.log('✅ Authenticated via localStorage fallback');
            setIsAuthenticated(true);
            setAuthError(null);
            return;
          } else if (age >= maxAge) {
            console.log('⏰ Session expired, cleaning up');
            localStorage.removeItem('siwe-session-id');
            localStorage.removeItem('siwe-timestamp');
            localStorage.removeItem('siwe-address');
          }
        }
      } catch (error) {
        console.error('❌ Error in fallback check:', error);
      }

      console.log('❌ No valid authentication found');
      setIsAuthenticated(false);
    };

    // Check auth status immediately
    checkAuthStatus();
    
    // Also check periodically, but less frequently
    const interval = setInterval(checkAuthStatus, 10000); // Every 10 seconds instead of 2
    
    return () => clearInterval(interval);
  }, [isConnected, address, lastCheckTimestamp])

  // Listen for custom SIWE events and AppKit events
  useEffect(() => {
    const handleSiweSuccess = (event: CustomEvent) => {
      console.log('🎉 SIWE auth success event:', event.detail);
      
      // Store fallback data in localStorage
      if (event.detail?.address || event.detail?.session?.address) {
        const authAddress = event.detail.address || event.detail.session.address;
        localStorage.setItem('siwe-address', authAddress.toLowerCase());
        localStorage.setItem('siwe-timestamp', Date.now().toString());
        console.log('💾 Stored fallback SIWE data in localStorage');
      }
      
      if (event.detail?.address?.toLowerCase() === address?.toLowerCase() ||
          event.detail?.session?.address?.toLowerCase() === address?.toLowerCase()) {
        setIsAuthenticated(true);
        setAuthError(null);
        setLastCheckTimestamp(0); // Force immediate recheck on next cycle
      }
    };

    const handleSiweError = (event: CustomEvent) => {
      console.log('❌ SIWE auth error event:', event.detail);
      setAuthError(event.detail?.error || 'Authentication failed');
      setIsAuthenticated(false);
    };

    const handleSiweLogout = () => {
      console.log('👋 SIWE logout event');
      // Clean up fallback data
      localStorage.removeItem('siwe-address');
      localStorage.removeItem('siwe-timestamp');
      localStorage.removeItem('siwe-session-id');
      setIsAuthenticated(false);
      setAuthError(null);
      setLastCheckTimestamp(0);
    };

    // Listen for AppKit-specific events
    const handleAppKitConnect = () => {
      console.log('🔗 AppKit connect event detected');
      // Force a recheck by resetting timestamp
      setLastCheckTimestamp(0);
      setAuthError(null);
    };

    if (typeof window !== 'undefined') {
      // Custom events
      window.addEventListener('siwe-auth-success', handleSiweSuccess as EventListener);
      window.addEventListener('siwe-auth-error', handleSiweError as EventListener);
      window.addEventListener('siwe-auth-logout', handleSiweLogout);
      
      // AppKit events (if available)
      window.addEventListener('appkit-connect', handleAppKitConnect);
      window.addEventListener('appkit-session', handleAppKitConnect);
      
      // Storage events for when localStorage changes
      window.addEventListener('storage', handleAppKitConnect);
      
      return () => {
        window.removeEventListener('siwe-auth-success', handleSiweSuccess as EventListener);
        window.removeEventListener('siwe-auth-error', handleSiweError as EventListener);
        window.removeEventListener('siwe-auth-logout', handleSiweLogout);
        window.removeEventListener('appkit-connect', handleAppKitConnect);
        window.removeEventListener('appkit-session', handleAppKitConnect);
        window.removeEventListener('storage', handleAppKitConnect);
      };
    }
  }, [address, isConnected]);

  return {
    isAuthenticated,
    isConnected,
    isConnecting,
    address,
    authError
  }
} 