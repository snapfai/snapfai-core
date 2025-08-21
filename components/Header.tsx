"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Menu, X, Zap, Wallet, ArrowUpDown, BarChart3 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import ConnectButton from './ConnectButton';
import NetworkSwitcher from './NetworkSwitcher';
import { useAppKitAccount } from '@reown/appkit/react';

const Header = () => {
  const { isConnected } = useAppKitAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Toggle menu" className="h-8 w-8 md:h-10 md:w-10">
                <Menu className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col w-80 [&>button]:hidden">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <div className="flex items-center justify-between mb-6">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <img 
                      src="/images/SnapFAI_Logo.png" 
                      alt="SnapFAI" 
                      className="h-5 w-auto"
                    />
                    <span className="font-bold text-lg md:text-xl">SnapFAI</span>
                    <span className="text-xs bg-snapfai-black text-white dark:bg-snapfai-amber dark:text-snapfai-black px-2 py-0.5 rounded-full">Alpha</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>
              
              {/* Mobile-only controls */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-lg">
                <ThemeToggle />
                {isConnected && <NetworkSwitcher />}
              </div>
              
              <nav className="flex flex-col gap-3">
                <SheetClose asChild>
                  <Link href="/" className="text-base md:text-lg font-medium py-2 hover:text-snapfai-black dark:hover:text-snapfai-amber transition-colors">
                    Home
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/#features" className="text-base md:text-lg font-medium py-2 hover:text-snapfai-black dark:hover:text-snapfai-amber transition-colors">
                    Features
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/snap" className="text-base md:text-lg font-medium py-2 hover:text-snapfai-black dark:hover:text-snapfai-amber transition-colors">
                    Snap
                  </Link>
                </SheetClose>
                {/* Portfolio link hidden per requirements */}
                <SheetClose asChild>
                  <Link href="/stats" className="text-base md:text-lg font-medium py-2 hover:text-snapfai-black dark:hover:text-snapfai-amber transition-colors flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="https://docs.snapfai.com/" target="_blank" rel="noopener noreferrer" className="text-base md:text-lg font-medium py-2 hover:text-snapfai-black dark:hover:text-snapfai-amber transition-colors">
                    Docs
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="flex items-center gap-2">
            {/* <img 
              src="/images/SnapFAI_Logo.png" 
              alt="SnapFAI" 
              className="h-6 w-auto"
            /> */}
            <span className="font-bold text-lg md:text-xl">SnapFAI</span>
            <span className="text-xs bg-snapfai-black text-white dark:bg-snapfai-amber dark:text-snapfai-black px-2 py-0.5 rounded-full">Alpha</span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Home
          </Link>
          <Link href="/#features" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Features
          </Link>
          <Link href="/snap" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Snap
          </Link>
          {/* Portfolio link hidden per requirements */}
          <Link href="/stats" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Stats
          </Link>
          <Link href="https://docs.snapfai.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-snapfai-black dark:text-gray-300 dark:hover:text-snapfai-amber transition-colors">
            Docs
          </Link>
        </nav>
        
        <div className="flex items-center gap-2">
          {/* Desktop-only controls */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            {isConnected && <NetworkSwitcher />}
          </div>
          
          {/* Login button removed - wallet connection serves as authentication */}
          
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header; 