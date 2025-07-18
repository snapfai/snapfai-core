'use client'

import { useAppKitNetwork } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { networks } from '@/config'
import { extractChainIdFromCAIP, getChainById } from '@/lib/chains'
import { useToast } from '@/components/ui/use-toast'
import { useEffect } from 'react'

export default function NetworkSwitcher() {
  const { caipNetwork } = useAppKitNetwork()
  const { toast } = useToast()

  // Clear any cached AppKit data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any cached network data that might include unsupported networks
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.includes('appkit') || 
        key.includes('walletconnect') ||
        key.includes('wc@') ||
        key.includes('wagmi')
      );
      
      if (keysToRemove.length > 0) {
        console.log('Clearing cached AppKit data:', keysToRemove);
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Also clear sessionStorage
      const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
        key.includes('appkit') || 
        key.includes('walletconnect') ||
        key.includes('wc@') ||
        key.includes('wagmi')
      );
      
      if (sessionKeysToRemove.length > 0) {
        console.log('Clearing cached session data:', sessionKeysToRemove);
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
    }
  }, []);

  // Only show when connected to a network
  if (!caipNetwork) {
    return null
  }

  // Get the current network's chain ID in plain number format
  const currentChainId = caipNetwork.id ? extractChainIdFromCAIP(caipNetwork.id) : null;

  // Direct network switching function (matches Chat.tsx approach)
  const switchToNetwork = async (targetNetwork: any) => {
    const targetChainId = targetNetwork.id;
    
    // Check if already on target network
    if (currentChainId === targetChainId) {
      return;
    }

    // Check if wallet provider is available
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        title: 'Error',
        description: 'No wallet provider detected. Please check your wallet connection.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const hexChainId = '0x' + targetChainId.toString(16);
      const chainConfig = getChainById(targetChainId);
      
      toast({
        title: 'Switching Network',
        description: `Switching to ${targetNetwork.name}...`,
      });

      try {
        // First try to switch to existing network
        await (window.ethereum as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
        
        toast({
          title: 'Network Switched',
          description: `Successfully switched to ${targetNetwork.name}`,
        });

      } catch (switchError: any) {
        // If network doesn't exist (error 4902), add it
        if (switchError.code === 4902 && chainConfig) {
          try {
            await (window.ethereum as any).request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: hexChainId,
                chainName: chainConfig.name,
                nativeCurrency: {
                  name: chainConfig.symbol,
                  symbol: chainConfig.symbol,
                  decimals: 18
                },
                rpcUrls: chainConfig.rpcUrls || [],
                blockExplorerUrls: chainConfig.blockExplorer ? [chainConfig.blockExplorer] : []
              }]
            });
            
            toast({
              title: 'Network Added',
              description: `Added ${chainConfig.name} to your wallet`,
            });

          } catch (addError) {
            console.error('Error adding network:', addError);
            toast({
              title: 'Error',
              description: `Failed to add ${targetNetwork.name} to your wallet.`,
              variant: 'destructive',
            });
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          toast({
            title: 'Cancelled',
            description: 'Network switch was cancelled.',
          });
        } else {
          // Other error
          console.error('Unexpected error during network switch:', switchError);
          toast({
            title: 'Error',
            description: `Failed to switch to ${targetNetwork.name}.`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error in network switch request:', error);
      toast({
        title: 'Error',
        description: 'There was an error requesting the network switch.',
        variant: 'destructive',
      });
    }
  };

  // Helper function to truncate chain names for mobile
  const truncateChainName = (name: string) => {
    if (name.length > 10) {
      return name
        .replace('Arbitrum One', 'Arbitrum')
        .replace('Ethereum Mainnet', 'Ethereum')
        .replace('Polygon Mainnet', 'Polygon')
        .replace('Avalanche Network C-Chain', 'Avalanche')
        .replace('Optimism Mainnet', 'Optimism')
        .replace('Base Mainnet', 'Base');
    }
    return name;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 max-w-[120px] sm:max-w-none">
          <span className="truncate">
            <span className="sm:hidden">{truncateChainName(caipNetwork.name)}</span>
            <span className="hidden sm:inline">{caipNetwork.name}</span>
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => switchToNetwork(network)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {network.name}
              {currentChainId === network.id && (
                <span className="text-green-500">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 