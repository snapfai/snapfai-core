"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Wallet, Menu, X, Zap } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

const Header = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, we would use Web3Modal or a similar library
      // to connect to the user's wallet
      
      // Mock wallet connection for MVP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAddress = '0xa1b2c3d4e5f67890abcdef1234567890abcdef12';
      setWalletAddress(mockAddress);
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-snapfai-black dark:text-snapfai-amber" />
                  <span className="font-bold text-xl">SnapFAI</span>
                  <span className="text-xs bg-snapfai-black text-white dark:bg-snapfai-amber dark:text-snapfai-black px-2 py-0.5 rounded-full">AI-Powered</span>
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
              <nav className="mt-8 flex flex-col gap-4">
                <Link href="/" className="text-lg font-medium">
                  Home
                </Link>
                <Link href="#features" className="text-lg font-medium">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-lg font-medium">
                  How It Works
                </Link>
                <Link href="/snap" className="text-lg font-medium">
                  Snap
                </Link>
                <Link href="#" className="text-lg font-medium">
                  Docs
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-snapfai-black dark:text-snapfai-amber" />
            <span className="font-bold text-xl">SnapFAI</span>
            <span className="text-xs bg-snapfai-black text-white dark:bg-snapfai-amber dark:text-snapfai-black px-2 py-0.5 rounded-full">AI-Powered</span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Home
          </Link>
          <Link href="#features" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            How It Works
          </Link>
          <Link href="/snap" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Snap
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Docs
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {!isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex dark:text-gray-200 dark:border-gray-700"
              onClick={() => {}}
            >
              Log In
            </Button>
          )}
          
          {isConnected ? (
            <Button
              variant="outline"
              onClick={handleDisconnectWallet}
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {truncateAddress(walletAddress)}
            </Button>
          ) : (
            <Button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
            >
              <Wallet className="h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 