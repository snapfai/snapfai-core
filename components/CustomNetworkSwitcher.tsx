'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ChainIcon, getChainName, getChainShortName } from '@/components/ui/chain-icons'
import { useIsMobile } from '@/hooks/use-mobile'

// Define supported networks with their configurations
const SUPPORTED_NETWORKS = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://etherscan.io',
    chainId: '0x1'
  },
  {
    id: 56,
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    chainId: '0x38'
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    chainId: '0x89'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    chainId: '0xa4b1'
  },
  {
    id: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    chainId: '0x2105'
  },
  {
    id: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    chainId: '0xa'
  },
  {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    chainId: '0xa86a'
  }
]

export default function CustomNetworkSwitcher() {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isSwitching, setIsSwitching] = useState(false)

  const switchToNetwork = async (network: typeof SUPPORTED_NETWORKS[0]) => {
    if (isSwitching) return
    
    setIsSwitching(true)
    
    try {
      // Check if wallet provider is available
      if (typeof window === 'undefined' || !window.ethereum) {
        toast({
          title: 'Error',
          description: 'No wallet provider detected. Please check your wallet connection.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Switching Network',
        description: `Switching to ${network.name}...`,
      })

      try {
        // First try to switch to existing network
        await (window.ethereum as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        })
        
        toast({
          title: 'Network Switched',
          description: `Successfully switched to ${network.name}`,
        })

      } catch (switchError: any) {
        // If network doesn't exist (error 4902), add it
        if (switchError.code === 4902) {
          try {
            await (window.ethereum as any).request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer]
              }]
            })
            
            toast({
              title: 'Network Added',
              description: `Added ${network.name} to your wallet`,
            })

          } catch (addError) {
            console.error('Error adding network:', addError)
            toast({
              title: 'Error',
              description: `Failed to add ${network.name} to your wallet.`,
              variant: 'destructive',
            })
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          toast({
            title: 'Cancelled',
            description: 'Network switch was cancelled.',
          })
        } else {
          // Other error
          console.error('Unexpected error during network switch:', switchError)
          toast({
            title: 'Error',
            description: `Failed to switch to ${network.name}.`,
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Network switch error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while switching networks.',
        variant: 'destructive',
      })
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" disabled={isSwitching}>
          <span className="flex items-center gap-2">
            <span>Switch Network</span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        {SUPPORTED_NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => switchToNetwork(network)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <ChainIcon chainId={network.id} className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-medium">{network.name}</span>
              <span className="text-xs text-muted-foreground">
                {getChainShortName(network.id)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
