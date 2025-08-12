'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AnalyticsSummary {
  totalUsers: number
  todayActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  totalSwaps: number
  successfulSwaps: number
  swapSuccessRate: number
  totalVolumeUsd: number
  averageSwapSize: number
  chainDistribution: Record<string, number>
  topTradedTokens: Array<{ token: string; count: number }>
  recentSwaps: any[]
  userGrowth: Record<string, number>
  lastUpdated: string
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchAnalytics = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      
      const response = await fetch('/api/analytics/summary')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const data = await response.json()
      setAnalytics(data)
      
      if (showRefreshToast) {
        toast({
          title: 'Analytics refreshed',
          description: 'Data has been updated successfully'
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 30 seconds
    const interval = setInterval(() => fetchAnalytics(), 30000)
    return () => clearInterval(interval)
  }, [])

  const exportToCSV = () => {
    if (!analytics) return

    const csvContent = `
SnapFAI Analytics Report
Generated: ${new Date().toISOString()}

KEY METRICS
Total Users,${analytics.totalUsers}
Today Active Users,${analytics.todayActiveUsers}
Weekly Active Users,${analytics.weeklyActiveUsers}
Monthly Active Users,${analytics.monthlyActiveUsers}
Total Swaps,${analytics.totalSwaps}
Successful Swaps,${analytics.successfulSwaps}
Swap Success Rate,${analytics.swapSuccessRate.toFixed(2)}%
Total Volume (USD),${analytics.totalVolumeUsd.toFixed(2)}
Average Swap Size (USD),${analytics.averageSwapSize.toFixed(2)}

CHAIN DISTRIBUTION
${Object.entries(analytics.chainDistribution)
  .map(([chain, count]) => `${chain},${count}`)
  .join('\n')}

TOP TRADED TOKENS
${analytics.topTradedTokens
  .map(({ token, count }) => `${token},${count}`)
  .join('\n')}
`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapfai-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Export successful',
      description: 'Analytics data has been exported to CSV'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px]" />
                <Skeleton className="h-3 w-[80px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">No analytics data available</p>
            <Button onClick={() => fetchAnalytics()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track SnapFAI usage, swaps, and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.todayActiveUsers} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.totalVolumeUsd.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg swap: ${analytics.averageSwapSize.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSwaps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.swapSuccessRate.toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.monthlyActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Monthly active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="swaps" className="space-y-4">
        <TabsList>
          <TabsTrigger value="swaps">Swaps</TabsTrigger>
          <TabsTrigger value="chains">Chains</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="swaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Swaps</CardTitle>
              <CardDescription>Latest swap transactions on SnapFAI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentSwaps?.slice(0, 10).map((swap, index) => (
                  <div key={swap.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={swap.status === 'confirmed' ? 'default' : 'destructive'}>
                        {swap.status}
                      </Badge>
                      <div>
                        <p className="font-medium">
                          {swap.token_in_symbol} → {swap.token_out_symbol}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {swap.chain_name} • {new Date(swap.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${swap.token_in_value_usd?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {swap.wallet_address?.slice(0, 6)}...{swap.wallet_address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chain Distribution</CardTitle>
              <CardDescription>Swap activity across different blockchains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.chainDistribution).map(([chain, count]) => {
                  const percentage = (count / analytics.totalSwaps) * 100
                  return (
                    <div key={chain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{chain}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} swaps ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Traded Tokens</CardTitle>
              <CardDescription>Most popular tokens on SnapFAI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topTradedTokens.map(({ token, count }, index) => (
                  <div key={token} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium">{token}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {count} trades
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.userGrowth)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 10)
                  .map(([date, count]) => (
                    <div key={date} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">
                        {new Date(date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {count} new users
                        </span>
                        {count > 0 && (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
