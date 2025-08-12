import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get basic counts
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active users for different periods
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Start of today
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    


    const { count: activeUsersToday } = await supabase
      .from('sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    const { count: activeUsersWeek } = await supabase
      .from('sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    const { count: activeUsersMonth } = await supabase
      .from('sessions')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // Calculate user growth
    const { count: usersLastWeek } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', weekAgo.toISOString())

    const userGrowthPercent = usersLastWeek && usersLastWeek > 0
      ? ((totalUsers! - usersLastWeek) / usersLastWeek) * 100
      : 0

    // Get swap metrics for success rate calculation
    const { count: totalSwapsAllStatuses } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })

    const { count: successfulSwaps } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')

    const { count: swapsToday } = await supabase
      .from('swaps')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', today.toISOString())

    // For public stats, show confirmed swaps as "total swaps"
    const totalSwaps = successfulSwaps

    // Calculate success rate based on all attempts vs successful
    const swapSuccessRate = totalSwapsAllStatuses && totalSwapsAllStatuses > 0
      ? (successfulSwaps! / totalSwapsAllStatuses) * 100
      : 0

    // Get volume metrics - only include confirmed swaps with volume
    const { data: volumeData } = await supabase
      .from('swaps')
      .select('token_in_value_usd, status, created_at, token_in_symbol, token_in_amount')
      .eq('status', 'confirmed')
      .not('token_in_value_usd', 'is', null)

    const totalVolumeUsd = volumeData?.reduce(
      (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
      0
    ) || 0

    const { data: volumeTodayData } = await supabase
      .from('swaps')
      .select('token_in_value_usd, status, created_at')
      .eq('status', 'confirmed')
      .not('token_in_value_usd', 'is', null)
      .gte('created_at', today.toISOString())

    const volumeToday = volumeTodayData?.reduce(
      (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
      0
    ) || 0

    // Calculate average swap size based on confirmed swaps only
    const averageSwapSize = successfulSwaps && successfulSwaps > 0
      ? totalVolumeUsd / successfulSwaps
      : 0

    // Get chain distribution (anonymized percentages)
    const { data: chainData } = await supabase
      .from('swaps')
      .select('chain_name')
      .eq('status', 'confirmed')

    const chainCounts: Record<string, number> = {}
    chainData?.forEach(swap => {
      chainCounts[swap.chain_name] = (chainCounts[swap.chain_name] || 0) + 1
    })

    const totalChainSwaps = Object.values(chainCounts).reduce((a, b) => a + b, 0)
    const chainDistribution = Object.entries(chainCounts)
      .map(([name, count]) => ({
        name,
        percentage: totalChainSwaps > 0 ? (count / totalChainSwaps) * 100 : 0,
        color: getChainColor(name)
      }))
      .sort((a, b) => b.percentage - a.percentage)

    // Get top traded tokens (no user info, just popularity)
    const { data: tokenData } = await supabase
      .from('swaps')
      .select('token_in_symbol, token_out_symbol')
      .eq('status', 'confirmed')

    const tokenCounts: Record<string, number> = {}
    tokenData?.forEach(swap => {
      tokenCounts[swap.token_in_symbol] = (tokenCounts[swap.token_in_symbol] || 0) + 1
      tokenCounts[swap.token_out_symbol] = (tokenCounts[swap.token_out_symbol] || 0) + 1
    })

    const topTokens = Object.entries(tokenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([symbol, trades], index) => ({
        symbol,
        rank: index + 1,
        trades
      }))

    // Get chat metrics
    const { count: chatMessages } = await supabase
      .from('chat_interactions')
      .select('*', { count: 'exact', head: true })

    // Daily Active Conversations: unique conversation sessions with >=2 messages in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: conversations } = await supabase
      .from('conversation_sessions')
      .select('conversation_id, last_activity, message_count')
      .gte('last_activity', yesterday)
      .gte('message_count', 2)
    const dailyActiveConversations = conversations?.length || 0

    // Get daily growth for last 7 days
    const dailyGrowth = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { count: dayUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', nextDate.toISOString())

      const { count: daySwaps } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      const { data: dayVolumeData } = await supabase
        .from('swaps')
        .select('token_in_value_usd')
        .eq('status', 'confirmed')
        .not('token_in_value_usd', 'is', null)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      const dayVolume = dayVolumeData?.reduce(
        (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
        0
      ) || 0

      dailyGrowth.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers || 0,
        swaps: daySwaps || 0,
        volume: dayVolume
      })
    }

    // Platform constants
    const supportedChains = 5 // Ethereum, Arbitrum, Base, Optimism, Avalanche
    const supportedTokens = 15000 // From our token list

    return NextResponse.json({
      // User metrics (anonymized)
      totalUsers: totalUsers || 0,
      activeUsersToday: activeUsersToday || 0,
      activeUsersWeek: activeUsersWeek || 0,
      activeUsersMonth: activeUsersMonth || 0,
      userGrowthPercent: Math.round(userGrowthPercent * 10) / 10,
      
      // Swap metrics
      totalSwaps: totalSwaps || 0,
      swapsToday: swapsToday || 0,
      swapSuccessRate: Math.round(swapSuccessRate * 10) / 10,
      totalVolumeUsd: Math.round(totalVolumeUsd),
      volumeToday: Math.round(volumeToday),
      averageSwapSize: Math.round(averageSwapSize),
      
      // Platform metrics
      totalTransactions: totalSwaps || 0,
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
