'use client'

import useAuthStatus from '@/hooks/useAuthStatus'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface ConnectWalletPromptProps {
  message?: string
  redirectPath?: string
}

export default function ConnectWalletPrompt({ 
  message = "Connect your wallet to access this feature", 
  redirectPath = "/snap"
}: ConnectWalletPromptProps) {
  const { 
    isAuthenticated, 
    isConnected, 
    isConnecting, 
    connectWithSignature 
  } = useAuthStatus()
  
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Monitor authentication state and redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log(`Wallet authenticated, redirecting to ${redirectPath}`);
      // Small delay to ensure wallet state is fully updated
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, redirectPath, router]);
  
  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      console.log('Connecting wallet and requesting signature...');
      const success = await connectWithSignature();
      console.log('Connection result:', success);
      
      if (success) {
        console.log('Successfully connected and signed, will redirect shortly');
      } else {
        console.log('Connection or signature failed');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-snapfai-amber/20 flex items-center justify-center mb-6">
        <Wallet className="h-8 w-8 text-snapfai-amber" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Wallet Connection Required</h2>
      
      <p className="text-muted-foreground mb-4">
        {message}
      </p>
      
      <p className="text-sm text-muted-foreground mb-8">
        You'll need to sign a message to verify wallet ownership.
        This signature doesn't cost any gas fees.
      </p>
      
      <Button 
        onClick={handleConnect}
        disabled={isProcessing || isConnecting}
        className="bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isProcessing || isConnecting ? 'Connecting...' : 'Connect & Sign'}
      </Button>
    </div>
  )
} 