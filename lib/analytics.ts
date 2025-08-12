import { supabase } from './supabase'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Session = Tables['sessions']['Row']
type Swap = Tables['swaps']['Row']
type ChatInteraction = Tables['chat_interactions']['Row']
type AnalyticsEvent = Tables['analytics_events']['Row']

// Analytics tracking class
export class Analytics {
  private static instance: Analytics
  private currentSessionId: string | null = null
  private currentUserId: string | null = null

  private constructor() {}

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  // Initialize or get user
  async initUser(walletAddress: string, ensName?: string | null): Promise<User | null> {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (existingUser) {
        // Update last active time
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ 
            last_active_at: new Date().toISOString(),
            ens_name: ensName || existingUser.ens_name
          })
          .eq('id', existingUser.id)
          .select()
          .single()

        this.currentUserId = existingUser.id
        return updatedUser
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          ens_name: ensName
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return null
      }

      this.currentUserId = newUser.id
      return newUser
    } catch (error) {
      console.error('Error in initUser:', error)
      return null
    }
  }

  // Start a new session
  async startSession(
    walletAddress: string,
    chainId: number,
    chainName: string,
    authMethod: string = 'siwe'
  ): Promise<string | null> {
    try {
      // Get or create user
      const user = await this.initUser(walletAddress)
      if (!user) return null

      // Get user agent and IP (if available)
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : null
      
      // Create session
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          chain_id: chainId,
          chain_name: chainName,
          auth_method: authMethod,
          user_agent: userAgent
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating session:', error)
        return null
      }

      this.currentSessionId = session.id
      
      // Track wallet connected event
      await this.trackEvent('wallet_connected', 'auth', {
        chain_id: chainId,
        chain_name: chainName,
        auth_method: authMethod
      })

      return session.id
    } catch (error) {
      console.error('Error in startSession:', error)
      return null
    }
  }

  // End current session
  async endSession(): Promise<void> {
    if (!this.currentSessionId) return

    try {
      const sessionStart = await supabase
        .from('sessions')
        .select('session_start')
        .eq('id', this.currentSessionId)
        .single()

      if (sessionStart.data) {
        const duration = Math.floor(
          (Date.now() - new Date(sessionStart.data.session_start).getTime()) / 1000
        )

        await supabase
          .from('sessions')
          .update({
            session_end: new Date().toISOString(),
            duration_seconds: duration
          })
          .eq('id', this.currentSessionId)
      }

      // Track wallet disconnected event
      await this.trackEvent('wallet_disconnected', 'auth')

      this.currentSessionId = null
      this.currentUserId = null
    } catch (error) {
      console.error('Error in endSession:', error)
    }
  }

  // Track a swap transaction
  // IMPORTANT: USD values are locked at swap timestamp and should NEVER be updated
  async trackSwap(swapData: {
    walletAddress: string
    chainId: number
    chainName: string
    tokenInSymbol: string
    tokenInAddress: string
    tokenInAmount: string
    tokenInValueUsd?: number
    tokenOutSymbol: string
    tokenOutAddress: string
    tokenOutAmount: string
    tokenOutValueUsd?: number
    txHash?: string
    status: 'pending' | 'confirmed' | 'failed' | 'cancelled'
    protocol?: string
    slippage?: number
    errorMessage?: string
  }): Promise<string | null> {
    try {
      // Get or create user
      const user = await this.initUser(swapData.walletAddress)
      if (!user) return null

      const { data: swap, error } = await supabase
        .from('swaps')
        .insert({
          user_id: user.id,
          wallet_address: swapData.walletAddress.toLowerCase(),
          chain_id: swapData.chainId,
          chain_name: swapData.chainName,
          token_in_symbol: swapData.tokenInSymbol,
          token_in_address: swapData.tokenInAddress,
          token_in_amount: swapData.tokenInAmount,
          token_in_value_usd: swapData.tokenInValueUsd,
          token_out_symbol: swapData.tokenOutSymbol,
          token_out_address: swapData.tokenOutAddress,
          token_out_amount: swapData.tokenOutAmount,
          token_out_value_usd: swapData.tokenOutValueUsd,
          tx_hash: swapData.txHash,
          status: swapData.status,
          protocol: swapData.protocol,
          slippage: swapData.slippage,
          error_message: swapData.errorMessage,
          initiated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error tracking swap:', error)
        return null
      }

      // Update user stats if swap is confirmed
      if (swapData.status === 'confirmed' && swapData.tokenInValueUsd) {
        await supabase.rpc('increment', {
          table_name: 'users',
          row_id: user.id,
          column_name: 'total_swaps_count',
          increment_value: 1
        })

        await supabase.rpc('increment', {
          table_name: 'users',
          row_id: user.id,
          column_name: 'total_volume_usd',
          increment_value: swapData.tokenInValueUsd
        })
      }

      // Track swap event
      await this.trackEvent(`swap_${swapData.status}`, 'swap', {
        token_in: swapData.tokenInSymbol,
        token_out: swapData.tokenOutSymbol,
        chain_id: swapData.chainId,
        value_usd: swapData.tokenInValueUsd
      })

      // Only update daily metrics if swap is confirmed with volume
      if (swapData.status === 'confirmed' && swapData.tokenInValueUsd) {
        this.updateDailyMetrics().catch(err => {
          // Log daily metrics errors but don't break swap tracking
          console.warn('Daily metrics update failed (non-critical) during trackSwap:', err);
        });
      }

      return swap.id
    } catch (error) {
      console.error('Error in trackSwap:', error)
      return null
    }
  }

  // Update swap status
  async updateSwapStatus(
    swapId: string,
    status: 'confirmed' | 'failed',
    txHash?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString()
        if (txHash) updateData.tx_hash = txHash
      } else if (status === 'failed') {
        updateData.failed_at = new Date().toISOString()
        if (errorMessage) updateData.error_message = errorMessage
      }

      await supabase
        .from('swaps')
        .update(updateData)
        .eq('id', swapId)

      // Track status update event
      await this.trackEvent(`swap_${status}`, 'swap', { swap_id: swapId })

      // Only update daily metrics when swap is confirmed (transaction completed)
      if (status === 'confirmed') {
        this.updateDailyMetrics().catch(err => {
          // Log daily metrics errors but don't break swap status updates
          console.warn('Daily metrics update failed (non-critical) during updateSwapStatus:', err);
        });
      }
    } catch (error) {
      console.error('Error updating swap status:', error)
    }
  }

  // Track chat interaction
  async trackChatInteraction(data: {
    walletAddress?: string
    messageType: 'user' | 'assistant' | 'system'
    messageContent: string
    intent?: string
    detectedTokens?: string[]
    detectedAmounts?: number[]
    responseTimeMs?: number
    tokensUsed?: number
    modelUsed?: string
    ledToSwap?: boolean
    swapId?: string
  }): Promise<void> {
    try {
      let userId = this.currentUserId

      if (data.walletAddress && !userId) {
        const user = await this.initUser(data.walletAddress)
        userId = user?.id || null
      }

      await supabase
        .from('chat_interactions')
        .insert({
          user_id: userId,
          session_id: this.currentSessionId,
          wallet_address: data.walletAddress?.toLowerCase(),
          message_type: data.messageType,
          message_content: data.messageContent.substring(0, 10000), // Limit message length
          intent: data.intent,
          detected_tokens: data.detectedTokens,
          detected_amounts: data.detectedAmounts,
          response_time_ms: data.responseTimeMs,
          tokens_used: data.tokensUsed,
          model_used: data.modelUsed,
          led_to_swap: data.ledToSwap || false,
          swap_id: data.swapId
        })

      // Track chat event
      await this.trackEvent('chat_message', 'chat', {
        message_type: data.messageType,
        intent: data.intent,
        led_to_swap: data.ledToSwap
      })
    } catch (error) {
      console.error('Error tracking chat interaction:', error)
    }
  }

  // Track generic event
  async trackEvent(
    eventType: string,
    eventCategory: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      const eventData: any = {
        user_id: this.currentUserId,
        session_id: this.currentSessionId,
        event_type: eventType,
        event_category: eventCategory,
        properties: properties || {}
      }

      // Add page path if available
      if (typeof window !== 'undefined') {
        eventData.page_path = window.location.pathname
        eventData.referrer = document.referrer
      }

      // Add wallet address if available
      if (properties?.wallet_address) {
        eventData.wallet_address = properties.wallet_address.toLowerCase()
      }

      // Add chain info if available
      if (properties?.chain_id) {
        eventData.chain_id = properties.chain_id
      }

      await supabase
        .from('analytics_events')
        .insert(eventData)
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }

  // Track portfolio snapshot
  async trackPortfolioSnapshot(
    walletAddress: string,
    totalValueUsd: number,
    chainValues: Record<string, number>,
    tokenHoldings: Array<{
      symbol: string
      amount: number
      value_usd: number
    }>
  ): Promise<void> {
    try {
      const user = await this.initUser(walletAddress)
      if (!user) return

      await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          total_value_usd: totalValueUsd,
          chain_values: chainValues,
          token_holdings: tokenHoldings
        })

      // Track portfolio view event
      await this.trackEvent('portfolio_viewed', 'portfolio', {
        total_value_usd: totalValueUsd,
        num_chains: Object.keys(chainValues).length,
        num_tokens: tokenHoldings.length
      })
    } catch (error) {
      console.error('Error tracking portfolio snapshot:', error)
    }
  }

  // Update daily metrics with volume aggregation
  async updateDailyMetrics(): Promise<void> {
    try {
      // Check if daily_metrics table exists first
      const { error: tableCheckError } = await supabase
        .from('daily_metrics')
        .select('id')
        .limit(1);

      // If table doesn't exist, skip daily metrics update
      if (tableCheckError?.code === 'PGRST116' || tableCheckError?.message?.includes('does not exist')) {
        // Table doesn't exist yet, skip daily metrics update
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Get today's swaps and volume
      console.log('📅 Fetching swaps for date:', today);
      const { data: todaySwaps, error: swapsError } = await supabase
        .from('swaps')
        .select('token_in_value_usd, status, created_at')
        .gte('created_at', today)
        .not('token_in_value_usd', 'is', null);

      if (swapsError) {
        console.error('Error fetching today\'s swaps for metrics:', swapsError);
        return;
      }

      console.log('📊 Found swaps for today:', todaySwaps?.length || 0);
      console.log('📊 Today\'s swaps data:', todaySwaps);

      const totalVolumeToday = todaySwaps?.reduce(
        (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
        0
      ) || 0;

      const successfulSwapsToday = todaySwaps?.filter(s => s.status === 'confirmed').length || 0;
      const totalSwapsToday = todaySwaps?.length || 0;

      // Upsert daily metrics
      const metricsData = {
        date: today,
        total_users: 0, // Will be updated by separate process
        new_users: 0, // Will be updated by separate process  
        active_users: 0, // Will be updated by separate process
        returning_users: 0, // Will be updated by separate process
        total_sessions: 0, // Will be updated by separate process
        avg_session_duration_seconds: 0, // Will be updated by separate process
        total_swaps: totalSwapsToday,
        successful_swaps: successfulSwapsToday,
        failed_swaps: totalSwapsToday - successfulSwapsToday,
        total_volume_usd: totalVolumeToday,
        avg_swap_size_usd: totalSwapsToday > 0 ? totalVolumeToday / totalSwapsToday : 0,
        chain_distribution: {}, // Will be updated by separate process
        top_tokens_traded: [], // Will be updated by separate process
        total_chat_messages: 0, // Will be updated by separate process
        chat_to_swap_conversion: 0, // Will be updated by separate process
        updated_at: new Date().toISOString()
      };

      console.log('📊 Updating daily metrics for', today, ':', {
        totalSwaps: totalSwapsToday,
        successfulSwaps: successfulSwapsToday,
        totalVolume: totalVolumeToday
      });

      console.log('📊 Complete metrics data to be upserted:', JSON.stringify(metricsData, null, 2));

      // Call secure API route that uses service role (bypasses RLS)
      const resp = await fetch('/api/analytics/update-daily', { method: 'POST' })
      if (!resp.ok) {
        const text = await resp.text()
        console.error('❌ Error updating daily metrics via route:', text)
        return
      }
      console.log('✅ Daily metrics updated successfully for', today)
    } catch (error) {
      console.error('Error in updateDailyMetrics:', error);
    }
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<any> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get today's active users
      const today = new Date().toISOString().split('T')[0]
      const { count: todayActiveUsers } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      // Get total swaps (only count confirmed ones for analytics)
      const { count: totalSwaps } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')

      // Get successful swaps (same as total for public stats)
      const { count: successfulSwaps } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')

      // Get total volume
      const { data: volumeData } = await supabase
        .from('swaps')
        .select('token_in_value_usd')
        .eq('status', 'confirmed')

      const totalVolumeUsd = volumeData?.reduce(
        (sum, swap) => sum + (Number(swap.token_in_value_usd) || 0),
        0
      ) || 0

      // Get chain distribution
      const { data: chainData } = await supabase
        .from('swaps')
        .select('chain_name')
        .eq('status', 'confirmed')

      const chainDistribution: Record<string, number> = {}
      chainData?.forEach(swap => {
        chainDistribution[swap.chain_name] = (chainDistribution[swap.chain_name] || 0) + 1
      })

      return {
        totalUsers,
        todayActiveUsers,
        totalSwaps,
        successfulSwaps,
        swapSuccessRate: totalSwaps ? (successfulSwaps! / totalSwaps) * 100 : 0,
        totalVolumeUsd,
        averageSwapSize: successfulSwaps ? totalVolumeUsd / successfulSwaps : 0,
        chainDistribution
      }
    } catch (error) {
      console.error('Error getting analytics summary:', error)
      return null
    }
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance()
