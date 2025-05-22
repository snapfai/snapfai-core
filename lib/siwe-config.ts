import type {
  SIWEVerifyMessageArgs,
  SIWECreateMessageArgs,
  SIWESession,
} from "@reown/appkit-siwe";
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { mainnet, polygon } from "@reown/appkit/networks";
import { avalancheChain, arbitrumNovaChain } from "@/config/custom-networks";

// Mock functions for demo purposes
// In a real app, these would interact with your auth backend
const mockNonce = () => Math.random().toString(36).substring(2, 10);
const mockSession: SIWESession | null = null;

export const siweConfig = createSIWEConfig({
  // Get message params for SIWE
  getMessageParams: async () => ({
    domain: typeof window !== "undefined" ? window.location.host : "",
    uri: typeof window !== "undefined" ? window.location.origin : "",
    // Include all supported chains
    chains: [mainnet.id, polygon.id, avalancheChain.id, arbitrumNovaChain.id],
    statement: "Sign in with Ethereum to SnapFAI",
    version: "1",
  }),

  // Create the SIWE message
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, address),

  // Get a unique nonce for the message
  getNonce: async () => {
    // In a real app, you'd get this from your backend
    // e.g., const response = await fetch('/api/auth/nonce');
    return mockNonce();
  },

  // Get the current session
  getSession: async () => {
    // In a real app, you'd get this from your backend
    // e.g., const response = await fetch('/api/auth/session');
    return mockSession;
  },

  // Verify the signed message
  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    // In a real app, you'd verify this with your backend
    // e.g., const response = await fetch('/api/auth/verify', {
    //   method: 'POST',
    //   body: JSON.stringify({ message, signature }),
    // });
    console.log("Would verify message:", { message, signature });
    return true; // Mock always successful for demo
  },

  // Sign out the user
  signOut: async () => {
    // In a real app, you'd sign out with your backend
    // e.g., const response = await fetch('/api/auth/signout', { method: 'POST' });
    console.log("Would sign out user");
    return true; // Mock always successful for demo
  },

  // Optional callbacks
  onSignIn: (session?: SIWESession) => {
    console.log("User signed in:", session);
  },
  onSignOut: () => {
    console.log("User signed out");
  },

  // Optional configurations
  enabled: true,
  nonceRefetchIntervalMs: 300000, // 5 minutes
  sessionRefetchIntervalMs: 300000, // 5 minutes
  signOutOnDisconnect: true,
  signOutOnAccountChange: true,
  signOutOnNetworkChange: true,
}); 