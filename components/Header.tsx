"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, Zap, Wallet, ArrowUpDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import ConnectButton from './ConnectButton';
import NetworkSwitcher from './NetworkSwitcher';
import { useAppKitAccount } from '@reown/appkit/react';

const Header = () => {
  const { isConnected } = useAppKitAccount();

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
                {isConnected && (
                  <>
                    <Link href="/wallet" className="text-lg font-medium flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Wallet
                    </Link>
                    <Link href="/swap" className="text-lg font-medium flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5" />
                      Swap
                    </Link>
                  </>
                )}
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
          {isConnected && (
            <>
              <Link href="/wallet" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                Wallet
              </Link>
              <Link href="/swap" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors flex items-center gap-1">
                <ArrowUpDown className="h-4 w-4" />
                Swap
              </Link>
            </>
          )}
          <Link href="#" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Docs
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isConnected && <NetworkSwitcher />}
          
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
          
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header; 