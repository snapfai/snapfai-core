'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  BarChart3,
  Wallet,
  MessageSquare,
  RefreshCw,
  Trophy,
  Target,
  LineChart
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PublicStats {
  // User metrics (anonymized)
  totalUsers: number
  activeUsersToday: number
  activeUsersWeek: number
  activeUsersMonth: number
  userGrowthPercent: number
  
  // Swap metrics
  totalSwaps: number
  swapsToday: number
  swapSuccessRate: number
  totalVolumeUsd: number
  volumeToday: number
  averageSwapSize: number
  
  // Platform metrics
  totalTransactions: number
  supportedChains: number
  supportedTokens: number
  chatMessages: number
  chatToSwapConversion: number
  
  // Chain distribution (percentages only)
  chainDistribution: {
    name: string
    percentage: number
    color: string
  }[]
  
  // Top tokens (no amounts, just popularity)
  topTokens: {
    symbol: string
    rank: number
    trades: number
  }[]
  
  // Growth metrics
  dailyGrowth: {
    date: string
    users: number
    swaps: number
    volume: number
  }[]
  
  lastUpdated: string
}

// Mock milestones for gamification
const MILESTONES = [
  { value: 100, label: '100 Users', icon: '👥' },
  { value: 1000, label: '1K Swaps', icon: '🔄' },
  { value: 10000, label: '$10K Volume', icon: '💰' },
  { value: 50000, label: '$50K Volume', icon: '💎' },
  { value: 100000, label: '$100K Volume', icon: '🏆' },
  { value: 1000000, label: '$1M Volume', icon: '🎯' },
  { value: 10000, label: '10K Users', icon: '🚀' },
]

export default function PublicStatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'swaps' | 'volume'>('swaps')

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/analytics/public')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 10000) // Update every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatUSD = (num: number) => {
    // Show more precision for small values
    if (num < 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(num)
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto p-6 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">SnapFAI Platform Stats</h1>
            <p className="text-muted-foreground">Real-time platform metrics</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-16 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Unable to load stats</p>
            <Button onClick={fetchStats}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate milestone progress
  const nextVolumeMilestone = MILESTONES.find(m => m.label.includes('Volume') && stats.totalVolumeUsd < m.value)
  const nextUserMilestone = MILESTONES.find(m => m.label.includes('Users') && stats.totalUsers < m.value)
  const volumeProgress = nextVolumeMilestone 
    ? (stats.totalVolumeUsd / nextVolumeMilestone.value) * 100
    : 100



  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header with Live Indicator */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              SnapFAI Platform Stats
            </h1>
          </div>
          <p className="text-muted-foreground">
            Decentralized trading made simple • Powered by AI
          </p>
        </div>

        {/* Milestone Progress */}
        {nextVolumeMilestone && (
          <Card className="relative overflow-hidden border-amber-200/30 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/80 dark:from-amber-950/20 dark:via-yellow-950/15 dark:to-orange-950/20">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-400/5 to-orange-400/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Next Milestone: {nextVolumeMilestone.label}
                </CardTitle>
                <span className="text-2xl filter drop-shadow-sm">{nextVolumeMilestone.icon}</span>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Progress value={volumeProgress} className="h-3 bg-amber-100 dark:bg-amber-950/50" />
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2 font-medium">
                {formatUSD(stats.totalVolumeUsd)} / {formatUSD(nextVolumeMilestone.value)} 
                <span className="ml-1 text-amber-600 dark:text-amber-400">({volumeProgress.toFixed(1)}% complete)</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stats.userGrowthPercent > 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{stats.userGrowthPercent}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{stats.userGrowthPercent}%</span>
                  </>
                )}
                <span className="ml-1">this week</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUSD(stats.totalVolumeUsd)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatUSD(stats.volumeToday)} today
              </p>
            </CardContent>
          </Card>

          {/* Total Swaps */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalSwaps)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(stats.swapsToday)} today
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.activeUsersToday)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeUsersMonth} this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Multi-Chain Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{stats.supportedChains}</span>
                  <span className="text-sm text-muted-foreground">Active Chains</span>
                </div>
                <div className="space-y-2">
                  {stats.chainDistribution.slice(0, 3).map((chain) => (
                    <div key={chain.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{chain.name}</span>
                        <span className="text-muted-foreground">{chain.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={chain.percentage} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Popular Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.topTokens.slice(0, 5).map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                        {token.rank}
                      </Badge>
                      <span className="font-medium">{token.symbol}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(token.trades)} trades
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Chat Messages</span>
                    <span className="text-2xl font-bold">{formatNumber(stats.chatMessages)}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Chat → Swap Rate</span>
                    <span className="text-lg font-bold">{stats.chatToSwapConversion.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.chatToSwapConversion} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Swap Size</span>
                    <span className="font-medium">{formatUSD(stats.averageSwapSize)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Chart (simplified) */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <LineChart className="h-5 w-5 sm:h-6 sm:w-6" />
              7-Day Growth Trend
            </CardTitle>
                <CardDescription className="mt-2">Platform activity over the last week</CardDescription>
              </div>
              <div className="flex gap-2">
                {(["users", "swaps", "volume"] as const).map((metric) => (
                  <Button
                    key={metric}
                    variant={selectedMetric === metric ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMetric(metric)}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const weekData = stats.dailyGrowth.slice(-7)
              const currentData = weekData.map((d) => d[selectedMetric] || 0)
              const maxValue = Math.max(...currentData, 1)
              const totalValue = currentData.reduce((sum, val) => sum + val, 0)
              const avgValue = totalValue / currentData.length

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {selectedMetric === "volume" ? formatUSD(totalValue) : formatNumber(totalValue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {selectedMetric === "volume" ? formatUSD(avgValue) : formatNumber(Math.round(avgValue))}
                      </div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {selectedMetric === "volume"
                          ? formatUSD(currentData[currentData.length - 1] || 0)
                          : formatNumber(currentData[currentData.length - 1] || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Today</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>7 days ago</span>
                      <span>Today</span>
                    </div>
                    <div className="flex items-end justify-between gap-2 h-32 sm:h-40">
                      {weekData.map((day, index) => {
                        const value = day[selectedMetric] || 0
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0
                        const isToday = index === weekData.length - 1

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
                              <div
                                className={`w-full max-w-8 rounded-t transition-all duration-300 hover:opacity-80 ${
                                  isToday ? "bg-primary" : "bg-muted-foreground/60"
                                }`}
                                style={{ height: `${height}%`, minHeight: value > 0 ? "4px" : "0px" }}
                                title={`${day.date}: ${selectedMetric === "volume" ? formatUSD(value) : formatNumber(value)}`}
                              />
                              </div>
                            <div className="text-xs text-muted-foreground text-center">
                              {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Platform Features */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Wallet className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">{stats.supportedChains}+ Chains</p>
              <p className="text-xs text-muted-foreground">Multi-chain support</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">{stats.supportedTokens}+ Tokens</p>
              <p className="text-xs text-muted-foreground">Wide token selection</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">AI Powered</p>
              <p className="text-xs text-muted-foreground">Natural language trading</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Instant Swaps</p>
              <p className="text-xs text-muted-foreground">Best rates guaranteed</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>Last updated: {new Date(stats.lastUpdated).toLocaleString()}</p>
          <p className="mt-2">
            All metrics are aggregated and anonymized. No personal information is displayed.
          </p>
        </div>
      </div>
    </div>
  )
}
