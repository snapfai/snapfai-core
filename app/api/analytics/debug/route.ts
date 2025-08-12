import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get all swaps with their data
    const { data: swaps, error } = await supabase
      .from('swaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate volume by status
    const volumeByStatus = swaps.reduce((acc, swap) => {
      const status = swap.status || 'unknown'
      acc[status] = (acc[status] || 0) + (swap.token_in_value_usd || 0)
      return acc
    }, {} as Record<string, number>)

    // Check for any swaps with null USD values
    const swapsWithNullValues = swaps.filter(s => s.token_in_value_usd === null)
    const swapsWithValues = swaps.filter(s => s.token_in_value_usd !== null)

    const totalVolume = swapsWithValues.reduce((sum, swap) => sum + (swap.token_in_value_usd || 0), 0)

    return NextResponse.json({
      totalSwaps: swaps.length,
      swapsWithValues: swapsWithValues.length,
      swapsWithNullValues: swapsWithNullValues.length,
      totalVolume,
      volumeByStatus,
      recentSwaps: swaps.slice(0, 5).map(s => ({
        id: s.id,
        symbol: s.token_in_symbol,
        amount: s.token_in_amount,
        usdValue: s.token_in_value_usd,
        status: s.status,
        chain: s.chain_name,
        created: s.created_at
      })),
      swapsWithNullValues: swapsWithNullValues.map(s => ({
        id: s.id,
        symbol: s.token_in_symbol,
        amount: s.token_in_amount,
        status: s.status
      }))
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data' },
      { status: 500 }
    )
  }
}
