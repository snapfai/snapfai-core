import { NextRequest, NextResponse } from 'next/server'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get basic summary from analytics service
    const summary = await analytics.getAnalyticsSummary()

    // Get additional metrics
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - 7))
    const startOfMonth = new Date(now.setMonth(now.getMonth() - 1))

    // Weekly active users
    const { count: weeklyActiveUsers } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfWeek.toISOString())

    // Monthly active users
    const { count: monthlyActiveUsers } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // Top traded tokens
    const { data: topTokens } = await supabase
      .from('swaps')
      .select('token_in_symbol, token_out_symbol')
      .eq('status', 'confirmed')
      .limit(100)

    const tokenCounts: Record<string, number> = {}
    topTokens?.forEach(swap => {
      tokenCounts[swap.token_in_symbol] = (tokenCounts[swap.token_in_symbol] || 0) + 1
      tokenCounts[swap.token_out_symbol] = (tokenCounts[swap.token_out_symbol] || 0) + 1
    })

    const topTradedTokens = Object.entries(tokenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([token, count]) => ({ token, count }))

    // Recent swaps (only show confirmed swaps)
    const { data: recentSwaps } = await supabase
      .from('swaps')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(10)

    // User growth (new users per day for last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: userGrowth } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const growthByDay: Record<string, number> = {}
    userGrowth?.forEach(user => {
      const day = user.created_at.split('T')[0]
      growthByDay[day] = (growthByDay[day] || 0) + 1
    })

    return NextResponse.json({
      ...summary,
      weeklyActiveUsers,
      monthlyActiveUsers,
      topTradedTokens,
      recentSwaps,
      userGrowth: growthByDay,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting analytics summary:', error)
    return NextResponse.json(
      { error: 'Failed to get analytics summary' },
      { status: 500 }
    )
  }
}
