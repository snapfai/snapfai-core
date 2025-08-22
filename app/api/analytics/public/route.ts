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

    // Fallback to live counting if aggregates are empty
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
      let users = dayData.find(d => d.metric_key === 'users_active')?.value || 0
      let swaps = dayData.find(d => d.metric_key === 'swaps')?.value || 0
      let volume = dayData.find(d => d.metric_key === 'volume_usd')?.value || 0

      // Fallback to live counting if daily aggregates are empty
      if (users === 0) {
        // Count ALL active users for the day (not just new users)
        // This includes users who connected, swapped, or chatted today
        const { data: activeUsersToday } = await supabase
          .from('users')
          .select('id')
          .or(`id.in.(${
            // Users with sessions today
            supabase
              .from('sessions')
              .select('user_id')
              .gte('created_at', day + 'T00:00:00Z')
              .lt('created_at', day + 'T23:59:59Z')
              .toString()
          }),id.in.(${
            // Users with swaps today
            supabase
              .from('swaps')
              .select('user_id')
              .gte('created_at', day + 'T00:00:00Z')
              .lt('created_at', day + 'T23:59:59Z')
              .toString()
          }),id.in.(${
            // Users with chat interactions today
            supabase
              .from('chat_interactions')
              .select('user_id')
              .gte('created_at', day + 'T00:00:00Z')
              .lt('created_at', day + 'T23:59:59Z')
              .toString()
          })`)
        
        // Count unique active users
        users = new Set(activeUsersToday?.map(u => u.id)).size || 0
        
        // Populate daily aggregates for active users
        await supabase
          .from('analytics_daily')
          .upsert({
            day,
            metric_key: 'users_active', // Active users for the day
            value: users,
            updated_at: new Date().toISOString()
          })
      }

      // Also track new users for growth percentage calculation
      const { data: newUsersData } = await supabase
        .from('analytics_daily')
        .select('value')
        .eq('day', day)
        .eq('metric_key', 'users_new')
      
      if (!newUsersData || newUsersData.length === 0) {
        // Count new users (users created today)
        const { count: newUsersToday } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', day + 'T00:00:00Z')
          .lt('created_at', day + 'T23:59:59Z')
        
        // Populate daily aggregates for new users
        await supabase
          .from('analytics_daily')
          .upsert({
            day,
            metric_key: 'users_new', // New users for the day
            value: newUsersToday || 0,
            updated_at: new Date().toISOString()
          })
      }

      if (swaps === 0) {
        const { count: daySwaps } = await supabase
          .from('swaps')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .gte('created_at', day + 'T00:00:00Z')
          .lt('created_at', day + 'T23:59:59Z')
        swaps = daySwaps || 0
        
        await supabase
          .from('analytics_daily')
          .upsert({
            day,
            metric_key: 'swaps',
            value: swaps,
            updated_at: new Date().toISOString()
          })
      }

      if (volume === 0) {
        const { data: dayVolumeData } = await supabase
          .from('swaps')
          .select('token_in_value_usd')
          .eq('status', 'confirmed')
          .not('token_in_value_usd', 'is', null)
          .gte('created_at', day + 'T00:00:00Z')
          .lt('created_at', day + 'T23:59:59Z')
        
        volume = dayVolumeData?.reduce(
          (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
          0
        ) || 0
        
        await supabase
          .from('analytics_daily')
          .upsert({
            day,
            metric_key: 'volume_usd',
            value: volume,
            updated_at: new Date().toISOString()
          })
      }

      dailyGrowth.push({
        date: day,
        users: Number(users), // Active users for the day (displayed in 7-day growth trend)
        swaps: Number(swaps),
        volume: Number(volume)
      })
    }

    // Get active users for different periods from daily aggregates
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Get active users from daily aggregates
    const { data: activeUsersData } = await supabase
      .from('analytics_daily')
      .select('day, value')
      .eq('metric_key', 'users_active') // Changed from 'active_users' to 'users_active'
      .gte('day', weekAgo)

    const activeUsersToday = activeUsersData?.find(d => d.day === today)?.value || 0
    const activeUsersWeek = activeUsersData?.filter(d => d.day >= weekAgo).reduce((sum, d) => sum + Number(d.value), 0) || 0
    const activeUsersMonth = activeUsersData?.filter(d => d.day >= monthAgo).reduce((sum, d) => sum + Number(d.value), 0) || 0

    // Calculate user growth percentage
    const { data: weekAgoUsers } = await supabase
      .from('analytics_daily')
      .select('value')
      .eq('metric_key', 'users_new') // Use new users for growth percentage
      .lt('day', weekAgo)

    const usersLastWeek = weekAgoUsers?.reduce((sum, d) => sum + Number(d.value), 0) || 0
    const userGrowthPercent = usersLastWeek > 0
      ? ((totalUsers - usersLastWeek) / usersLastWeek) * 100
      : 0

    // Get today's metrics from daily aggregates
    const todayData = dailyData?.filter(d => d.day === today) || []
    const swapsToday = todayData.find(d => d.metric_key === 'swaps')?.value || 0
    const volumeToday = todayData.find(d => d.metric_key === 'volume_usd')?.value || 0

    // Calculate success rate (if we have total attempts vs successful)
    const { count: totalSwapsAllStatuses } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })

    const swapSuccessRate = totalSwapsAllStatuses && totalSwapsAllStatuses > 0
      ? (totalSwaps / totalSwapsAllStatuses) * 100
      : 0

    // Calculate average swap size
    const averageSwapSize = totalSwaps > 0 ? totalVolumeUsd / totalSwaps : 0

    // Get chain distribution from aggregates (fast)
    const { data: chainDistributionData } = await supabase
      .from('analytics_daily')
      .select('day, metric_key, value')
      .like('metric_key', 'chain_%')
      .eq('day', new Date().toISOString().split('T')[0])

    let chainDistribution = []
    if (chainDistributionData && chainDistributionData.length > 0) {
      // Transform aggregate data to chain distribution format
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
    } else {
      // Fallback to live counting if aggregates are empty
      const { data: chainData } = await supabase
        .from('swaps')
        .select('chain_name')
        .eq('status', 'confirmed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const chainCounts: Record<string, number> = {}
      chainData?.forEach(swap => {
        chainCounts[swap.chain_name] = (chainCounts[swap.chain_name] || 0) + 1
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

    // Get top traded tokens from aggregates (fast)
    const { data: topTokensData } = await supabase
      .from('analytics_daily')
      .select('day, metric_key, value')
      .like('metric_key', 'token_%')
      .eq('day', new Date().toISOString().split('T')[0])

    let topTokens = []
    if (topTokensData && topTokensData.length > 0) {
      // Transform aggregate data to top tokens format
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
    } else {
      // Fallback to live counting if aggregates are empty
      const { data: tokenData } = await supabase
        .from('swaps')
        .select('token_in_symbol, token_out_symbol')
        .eq('status', 'confirmed')

      const tokenCounts: Record<string, number> = {}
      tokenData?.forEach(swap => {
        tokenCounts[swap.token_in_symbol] = (tokenCounts[swap.token_in_symbol] || 0) + 1
        tokenCounts[swap.token_out_symbol] = (tokenCounts[swap.token_out_symbol] || 0) + 1
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

    // Get chat metrics from aggregates (faster than live counting)
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

    // If no chat metrics in aggregates, fall back to live counting (only once)
    if (chatMessages === 0) {
      const { count: chatMessagesCount } = await supabase
        .from('chat_interactions')
        .select('*', { count: 'exact', head: true })
      
      // Store in aggregates for next time
      await supabase
        .from('analytics_totals')
        .upsert({
          metric_key: 'chat_messages',
          value: chatMessagesCount || 0,
          updated_at: new Date().toISOString()
        })
    }

    if (dailyActiveConversations === 0) {
      // Daily Active Conversations: unique conversation sessions with >=2 messages in last 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: conversations } = await supabase
        .from('conversation_sessions')
        .select('conversation_id, last_activity, message_count')
        .gte('last_activity', yesterday)
        .gte('message_count', 2)
      
      const conversationsCount = conversations?.length || 0
      
      // Store in aggregates for next time
      await supabase
        .from('analytics_totals')
        .upsert({
          metric_key: 'daily_active_conversations',
          value: conversationsCount,
          updated_at: new Date().toISOString()
        })
    }

    // Platform constants
    const supportedChains = 5 // Ethereum, Arbitrum, Base, Optimism, Avalanche
    const supportedTokens = 15000 // From our token list

    return NextResponse.json({
      // User metrics (anonymized)
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
      chatMessages: chatMessages || 0,
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
