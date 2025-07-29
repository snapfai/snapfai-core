'use client'

import { useAppKitAccount, useAppKitNetwork, useWalletInfo } from '@reown/appkit/react'
import { Button } from '@/components/ui/button'
import { useAppKit } from '@reown/appkit/react'
import { ArrowLeftIcon, TrendingUp, TrendingDown, Wallet, PieChart, Activity, RefreshCw, Layers } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'
import { usePortfolio, type TokenHolding } from '@/hooks/usePortfolio'
import { PortfolioAnalysis } from './analysis'

export default function PortfolioPage() {
  const { isConnected, address } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const { walletInfo } = useWalletInfo()
  const { open } = useAppKit()
  
  const { stats: portfolioStats, holdings: tokenHoldings, isLoading, error, refresh, refreshToken } = usePortfolio()
  const [selectedChain, setSelectedChain] = useState<number | 'all'>('all')
  const [showUnsupported, setShowUnsupported] = useState(false)

  const filteredHoldings = selectedChain === 'all' 
    ? tokenHoldings 
    : tokenHoldings.filter(holding => holding.chainId === selectedChain)

  const getChainBadgeColor = (chainId: number) => {
    const colors: Record<number, string> = {
      1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      42161: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      8453: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      137: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      43114: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      10: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    }
    return colors[chainId] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const getUniqueChains = () => {
    // Get unique chains from token holdings
    const chains = new Set(tokenHoldings.map(holding => holding.chainId))
    return Array.from(chains).map(chainId => ({
      id: chainId,
      name: tokenHoldings.find(h => h.chainId === chainId)?.chain || '',
      count: tokenHoldings.filter(h => h.chainId === chainId).length
    }))
  }

  return (
    <ProtectedRoute>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Removed Back to Home button */}
            <div>
              <h1 className="text-3xl font-bold">Portfolio</h1>
              <p className="text-muted-foreground">Track your DeFi assets across all networks</p>
            </div>
          </div>
          <Button onClick={refresh} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Wallet Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={walletInfo?.icon} alt={walletInfo?.name} />
                  <AvatarFallback>
                    <Wallet className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{walletInfo?.name || 'Your Wallet'}</CardTitle>
                  <CardDescription className="font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {caipNetwork?.name || 'Unknown Network'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
                <p className="text-3xl font-bold">{portfolioStats.totalValue}</p>
                <div className="flex items-center gap-1 mt-1">
                  {portfolioStats.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${portfolioStats.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {portfolioStats.changePercent >= 0 ? '+' : ''}{portfolioStats.changePercent.toFixed(2)}% 
                    (${portfolioStats.change24h >= 0 ? '+' : ''}${portfolioStats.change24h.toFixed(2)})
                  </span>
                  <span className="text-xs text-muted-foreground">24h</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
                <p className="text-2xl font-semibold">{portfolioStats.totalAssets}</p>
                <p className="text-xs text-muted-foreground mt-1">Across {portfolioStats.activeChains} chains</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Networks</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getUniqueChains().slice(0, 4).map(chain => (
                    <Badge key={chain.id} variant="outline" className={`text-xs ${getChainBadgeColor(chain.id)}`}>
                      {chain.name}
                    </Badge>
                  ))}
                  {getUniqueChains().length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{getUniqueChains().length - 4} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Content */}
        <Tabs defaultValue="holdings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="holdings">
              Holdings ({tokenHoldings.length})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="protocols">Protocols</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings" className="space-y-4">
            {/* Chain Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter by Network</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                                    <Button
                    variant={selectedChain === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChain('all')}
                  >
                    All Networks ({tokenHoldings.length})
                  </Button>
                  {getUniqueChains().map(chain => (
                    <Button
                      key={chain.id}
                      variant={selectedChain === chain.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChain(chain.id)}
                    >
                      {chain.name} ({chain.count})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Token Holdings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Token Holdings ({filteredHoldings.length})</CardTitle>
                    <CardDescription>
                      Your valuable token balances across all supported networks
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnsupported(!showUnsupported)}
                  >
                    {showUnsupported ? 'Hide' : 'Show'} Unsupported Tokens
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        </div>
                        <div className="text-right space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredHoldings.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No holdings found</p>
                    <p className="text-muted-foreground">Start trading to see your token balances here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHoldings.map((holding, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={holding.token.logoURI} alt={holding.token.symbol} />
                            <AvatarFallback>{holding.token.symbol.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <Badge 
                            className={`absolute -bottom-1 -right-1 text-xs px-1 ${getChainBadgeColor(holding.chainId)}`}
                          >
                            {holding.chain.slice(0, 3)}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{holding.token.symbol}</h3>
                            <span className="text-sm text-muted-foreground">{holding.token.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {holding.balance} {holding.token.symbol} on {holding.chain}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refreshToken(holding.token.symbol)}
                              className="h-6 w-6 p-0 hover:bg-muted"
                              title={`Refresh ${holding.token.symbol} price`}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <div>
                              <p className="font-medium">{holding.value}</p>
                              {holding.change24h !== undefined && (
                                <p className={`text-sm ${holding.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent DeFi transactions across all networks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Transaction history coming soon</p>
                  <p className="text-muted-foreground">We're working on integrating transaction tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Analytics</CardTitle>
                <CardDescription>Detailed analysis of your portfolio performance</CardDescription>
              </CardHeader>
              <CardContent>
                {tokenHoldings.length > 0 ? (
                  <PortfolioAnalysis holdings={tokenHoldings} minValue={1} />
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No data to analyze</p>
                    <p className="text-muted-foreground">Connect your wallet and hold some tokens to see analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DeFi Protocol Positions</CardTitle>
                <CardDescription>Your positions in lending, staking, and other DeFi protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Protocol tracking coming soon</p>
                  <p className="text-muted-foreground">Monitor your positions in Aave, Compound, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 