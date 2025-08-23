import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get totals from aggregate tables (O(1) reads)
    const { data: totalsData } = await supabase
      .from('analytics_totals')
      .select('metric_key, value')

    const totals = totalsData?.reduce((acc, row) => {
      acc[row.metric_key] = Number(row.value)
      return acc
    }, {} as Record<string, number>) || {}

    // Get totals from aggregates
    let totalUsers = totals.total_users || 0
    let totalSwaps = totals.total_swaps || 0
    let totalVolumeUsd = totals.total_volume_usd || 0

    // If no totals in aggregates, get them live and populate aggregates
    if (totalUsers === 0) {
      const { count: liveTotalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      totalUsers = liveTotalUsers || 0
      
      // Populate aggregates for next time
      await supabase
        .from('analytics_totals')
        .upsert({
          metric_key: 'total_users',
          value: totalUsers,
          updated_at: new Date().toISOString()
        })
    }

    if (totalSwaps === 0) {
      const { count: liveTotalSwaps } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
      totalSwaps = liveTotalSwaps || 0
      
      await supabase
        .from('analytics_totals')
        .upsert({
          metric_key: 'total_swaps',
          value: totalSwaps,
          updated_at: new Date().toISOString()
        })
    }

    if (totalVolumeUsd === 0) {
      const { data: liveVolumeData } = await supabase
        .from('swaps')
        .select('token_in_value_usd')
        .eq('status', 'confirmed')
        .not('token_in_value_usd', 'is', null)
      
      totalVolumeUsd = liveVolumeData?.reduce(
        (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
        0
      ) || 0
      
      await supabase
        .from('analytics_totals')
        .upsert({
          metric_key: 'total_volume_usd',
          value: totalVolumeUsd,
          updated_at: new Date().toISOString()
        })
    }

    // Get daily data for last 7 days from aggregate tables
    const { data: dailyData } = await supabase
      .from('analytics_daily')
      .select('day, metric_key, value')
      .gte('day', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('day', { ascending: true })

    // Transform daily data into the expected format
    const dailyGrowth = []
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    for (const day of last7Days) {
      const dayData = dailyData?.filter(d => d.day === day) || []
      const users = dayData.find(d => d.metric_key === 'users_active')?.value || 0
      const swaps = dayData.find(d => d.metric_key === 'swaps')?.value || 0
      const volume = dayData.find(d => d.metric_key === 'volume_usd')?.value || 0

      // Database triggers now handle all updates automatically
      // Just use the existing analytics_daily data
      dailyGrowth.push({
        date: day,
        users: Number(users),
        swaps: Number(swaps),
        volume: Number(volume)
      })
    }

    // Get active users for different periods from daily aggregates
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get active users from daily aggregates - database triggers handle updates automatically
    const { data: activeUsersData } = await supabase
      .from('analytics_daily')
      .select('day, value')
      .eq('metric_key', 'users_active')
      .gte('day', weekAgo)

    const activeUsersToday = activeUsersData?.find(d => d.day === today)?.value || 0
    const activeUsersWeek = activeUsersData?.filter(d => d.day >= weekAgo).reduce((sum, d) => sum + Number(d.value), 0) || 0
    const activeUsersMonth = activeUsersData?.filter(d => d.day >= monthAgo).reduce((sum, d) => sum + Number(d.value), 0) || 0

    // Calculate user growth percentage
    const { data: weekAgoUsers } = await supabase
      .from('analytics_daily')
      .select('value')
      .eq('metric_key', 'users_new')
      .lt('day', weekAgo)

    const usersLastWeek = weekAgoUsers?.reduce((sum, d) => sum + Number(d.value), 0) || 0
    const userGrowthPercent = usersLastWeek > 0
      ? ((totalUsers - usersLastWeek) / usersLastWeek) * 100
      : 0

    // Get today's metrics from daily aggregates
    const todayData = dailyData?.filter(d => d.day === today) || []
    const swapsToday = todayData.find(d => d.metric_key === 'swaps')?.value || 0
    const volumeToday = todayData.find(d => d.metric_key === 'volume_usd')?.value || 0

    // Calculate success rate
    const { count: totalSwapsAllStatuses } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })

    const swapSuccessRate = totalSwapsAllStatuses && totalSwapsAllStatuses > 0
      ? (totalSwaps / totalSwapsAllStatuses) * 100
      : 0

    // Calculate average swap size
    const averageSwapSize = totalSwaps > 0 ? totalVolumeUsd / totalSwaps : 0

    // Get chain distribution from aggregates
    const { data: chainDistributionData } = await supabase
      .from('analytics_daily')
      .select('day, metric_key, value')
      .like('metric_key', 'chain_%')
      .eq('day', new Date().toISOString().split('T')[0])

    let chainDistribution: Array<{name: string, percentage: number, color: string}> = []
    if (chainDistributionData && chainDistributionData.length > 0) {
      const chainCounts: Record<string, number> = {}
      chainDistributionData.forEach(row => {
        const chainName = row.metric_key.replace('chain_', '')
        chainCounts[chainName] = Number(row.value)
      })

      const totalChainSwaps = Object.values(chainCounts).reduce((a, b) => a + b, 0)
      chainDistribution = Object.entries(chainCounts)
        .map(([name, count]) => ({
          name,
          percentage: totalChainSwaps > 0 ? (count / totalChainSwaps) * 100 : 0,
          color: getChainColor(name)
        }))
        .sort((a, b) => b.percentage - a.percentage)
    }

    // Get top traded tokens from aggregates
    const { data: topTokensData } = await supabase
      .from('analytics_daily')
      .select('day, metric_key, value')
      .like('metric_key', 'token_%')
      .eq('day', new Date().toISOString().split('T')[0])

    let topTokens: Array<{symbol: string, rank: number, trades: number}> = []
    if (topTokensData && topTokensData.length > 0) {
      const tokenCounts: Record<string, number> = {}
      topTokensData.forEach(row => {
        const symbol = row.metric_key.replace('token_', '')
        tokenCounts[symbol] = Number(row.value)
      })

      topTokens = Object.entries(tokenCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([symbol, trades], index) => ({
          symbol,
          rank: index + 1,
          trades
        }))
    }

    // Get chat metrics from aggregates
    const { data: chatMetricsData } = await supabase
      .from('analytics_totals')
      .select('metric_key, value')
      .in('metric_key', ['chat_messages', 'daily_active_conversations'])

    const chatMetrics = chatMetricsData?.reduce((acc, row) => {
      acc[row.metric_key] = Number(row.value)
      return acc
    }, {} as Record<string, number>) || {}

    const chatMessages = chatMetrics.chat_messages || 0
    const dailyActiveConversations = chatMetrics.daily_active_conversations || 0

    // Platform constants
    const supportedChains = 5
    const supportedTokens = 15000

    return NextResponse.json({
      // User metrics
      totalUsers,
      activeUsersToday: Number(activeUsersToday),
      activeUsersWeek: Number(activeUsersWeek),
      activeUsersMonth: Number(activeUsersMonth),
      userGrowthPercent: Math.round(userGrowthPercent * 10) / 10,
      
      // Swap metrics
      totalSwaps,
      swapsToday: Number(swapsToday),
      swapSuccessRate: Math.round(swapSuccessRate * 10) / 10,
      totalVolumeUsd: Math.round(totalVolumeUsd),
      volumeToday: Math.round(volumeToday),
      averageSwapSize: Math.round(averageSwapSize),
      
      // Platform metrics
      totalTransactions: totalSwaps,
      supportedChains,
      supportedTokens,
      chatMessages,
      dailyActiveConversations,
      
      // Distributions
      chainDistribution,
      topTokens,
      dailyGrowth,
      
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching public stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}

function getChainColor(chain: string): string {
  const colors: Record<string, string> = {
    ethereum: '#627EEA',
    arbitrum: '#28A0F0',
    base: '#0052FF',
    optimism: '#FF0420',
    avalanche: '#E84142',
    polygon: '#8247E5'
  }
  return colors[chain.toLowerCase()] || '#888888'
}
