'use client'

import { Wallet, ChevronDown, LogOut, ExternalLink, Copy, Check, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnsName } from 'wagmi'
import { 
  useAppKit, 
  useAppKitAccount, 
  useAppKitNetwork, 
  useWalletInfo,
  useDisconnect
} from '@reown/appkit/react'
import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ConnectButton() {
  const { address, isConnected, status } = useAppKitAccount()
  const { data: ensName } = useEnsName({ 
    address: address as `0x${string}` | undefined 
  })
  const { open } = useAppKit()
  const { walletInfo } = useWalletInfo()
  const { caipNetwork } = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const [isClient, setIsClient] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Open the Connect view without specifying a namespace to show all options
      await open({ view: 'Connect' })
    } catch (error) {
      console.error('Error connecting wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      // Fallback to account view if direct disconnect fails
      await open({ view: 'Account' })
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
    }
  }

  const openExplorer = () => {
    if (address && caipNetwork?.blockExplorers?.default) {
      const explorerUrl = `${caipNetwork.blockExplorers.default.url}/address/${address}`
      window.open(explorerUrl, '_blank')
    }
  }

  const openAccountView = () => {
    open({ view: 'Account' })
  }

  const openNetworkView = () => {
    open({ view: 'Networks' })
  }

  // Get chain type based on namespace
  const getChainType = () => {
    switch (caipNetwork?.chainNamespace) {
      case 'eip155':
        return 'Ethereum'
      case 'solana':
        return 'Solana'
      case 'bip122':
        return 'Bitcoin'
      default:
        return 'Unknown'
    }
  }

  // Get chain badge color
  const getChainColor = () => {
    switch (caipNetwork?.chainNamespace) {
      case 'eip155':
        return 'bg-blue-500'
      case 'solana':
        return 'bg-green-500'
      case 'bip122':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Only render after client-side hydration
  if (!isClient) {
    return null
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            {walletInfo?.icon && (
              <img 
                src={walletInfo.icon} 
                alt={walletInfo.name || 'Wallet'} 
                className="h-4 w-4 mr-1" 
              />
            )}
            {!walletInfo?.icon && <Wallet className="h-4 w-4" />}
            
            {ensName || truncateAddress(address)}
            
            <Badge className={`ml-1 px-1.5 py-0 text-[10px] font-normal ${getChainColor()}`}>
              {caipNetwork?.name || 'Unknown'}
            </Badge>
            
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span>{walletInfo?.name || 'Wallet'}</span>
            <span className="text-xs text-muted-foreground mt-1 font-normal">
              {getChainType()} Network
            </span>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={openAccountView}>
              <Wallet className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={openNetworkView}>
              <Layers className="mr-2 h-4 w-4" />
              <span>Switch Network</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem onClick={copyAddress}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{address}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {caipNetwork?.blockExplorers?.default && (
              <DropdownMenuItem onClick={openExplorer}>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View in Explorer</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (status === 'connecting' || isConnecting) {
    return (
      <Button
        disabled
        className="flex items-center gap-2 bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
      >
        <Wallet className="h-4 w-4" />
        Connecting...
      </Button>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      className="flex items-center gap-2 bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
} 