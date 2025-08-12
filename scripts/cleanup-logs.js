#!/usr/bin/env node

// Quick script to clean up stale session IDs from localStorage
// Run this in browser console if you have stale sessions

console.log('🧹 Cleaning up stale authentication data...');

// Clear all SIWE related data
localStorage.removeItem('siwe-session-id');
localStorage.removeItem('siwe-address');
localStorage.removeItem('siwe-timestamp');

// Clear any WalletConnect data that might be causing issues
const keysToRemove = Object.keys(localStorage).filter(key => 
  key.includes('walletconnect') || 
  key.includes('wagmi') || 
  key.includes('appkit') ||
  key.includes('wc@') ||
  key.includes('siwe')
);

console.log('🗑️ Removing keys:', keysToRemove);
keysToRemove.forEach(key => localStorage.removeItem(key));

console.log('✅ Cleanup complete! Refresh the page.');
