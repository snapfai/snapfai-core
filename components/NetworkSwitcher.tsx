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

export default function NetworkSwitcher() {
  const { caipNetwork, switchNetwork } = useAppKitNetwork()

  // Only show when connected to a network
  if (!caipNetwork) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          {caipNetwork.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            onClick={() => switchNetwork(network)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {network.name}
              {caipNetwork.id === network.id && (
                <span className="text-green-500">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 