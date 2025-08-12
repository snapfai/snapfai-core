import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST() {
  const supabase = getServiceSupabase()

  try {
    const today = new Date().toISOString().split('T')[0]

    // Get today's confirmed swaps and volume
    const { data: todaySwaps, error: swapsError } = await supabase
      .from('swaps')
      .select('token_in_value_usd, status, created_at')
      .eq('status', 'confirmed')
      .gte('created_at', today)
      .not('token_in_value_usd', 'is', null)

    if (swapsError) {
      return NextResponse.json({ ok: false, error: swapsError.message }, { status: 500 })
    }

    const totalVolumeToday =
      todaySwaps?.reduce((sum, swap) => sum + (Number(swap.token_in_value_usd) || 0), 0) || 0

    const totalSwapsToday = todaySwaps?.length || 0
    const successfulSwapsToday = totalSwapsToday // all queried are confirmed

    const metricsData = {
      date: today,
      total_users: 0,
      new_users: 0,
      active_users: 0,
      returning_users: 0,
      total_sessions: 0,
      avg_session_duration_seconds: 0,
      total_swaps: totalSwapsToday,
      successful_swaps: successfulSwapsToday,
      failed_swaps: 0,
      total_volume_usd: totalVolumeToday,
      avg_swap_size_usd: totalSwapsToday > 0 ? totalVolumeToday / totalSwapsToday : 0,
      chain_distribution: {},
      top_tokens_traded: [],
      total_chat_messages: 0,
      chat_to_swap_conversion: 0,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('daily_metrics')
      .upsert(metricsData, { onConflict: 'date' })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, metrics: metricsData })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


