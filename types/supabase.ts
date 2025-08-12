export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          wallet_address: string
          ens_name: string | null
          first_connected_at: string
          last_active_at: string
          total_swaps_count: number
          total_volume_usd: number
          preferred_chain: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          ens_name?: string | null
          first_connected_at?: string
          last_active_at?: string
          total_swaps_count?: number
          total_volume_usd?: number
          preferred_chain?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          ens_name?: string | null
          first_connected_at?: string
          last_active_at?: string
          total_swaps_count?: number
          total_volume_usd?: number
          preferred_chain?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string
          chain_id: number
          chain_name: string
          session_start: string
          session_end: string | null
          duration_seconds: number | null
          auth_method: string
          ip_address: string | null
          user_agent: string | null
          country: string | null
          city: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address: string
          chain_id: number
          chain_name: string
          session_start?: string
          session_end?: string | null
          duration_seconds?: number | null
          auth_method?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          city?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string
          chain_id?: number
          chain_name?: string
          session_start?: string
          session_end?: string | null
          duration_seconds?: number | null
          auth_method?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          city?: string | null
          created_at?: string
        }
      }
      swaps: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string
          chain_id: number
          chain_name: string
          token_in_symbol: string
          token_in_address: string
          token_in_amount: string
          token_in_value_usd: number | null
          token_out_symbol: string
          token_out_address: string
          token_out_amount: string
          token_out_value_usd: number | null
          tx_hash: string | null
          gas_used: string | null
          gas_price: string | null
          gas_cost_usd: number | null
          status: string
          error_message: string | null
          protocol: string | null
          slippage: number | null
          price_impact: number | null
          initiated_at: string
          confirmed_at: string | null
          failed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address: string
          chain_id: number
          chain_name: string
          token_in_symbol: string
          token_in_address: string
          token_in_amount: string
          token_in_value_usd?: number | null
          token_out_symbol: string
          token_out_address: string
          token_out_amount: string
          token_out_value_usd?: number | null
          tx_hash?: string | null
          gas_used?: string | null
          gas_price?: string | null
          gas_cost_usd?: number | null
          status?: string
          error_message?: string | null
          protocol?: string | null
          slippage?: number | null
          price_impact?: number | null
          initiated_at?: string
          confirmed_at?: string | null
          failed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string
          chain_id?: number
          chain_name?: string
          token_in_symbol?: string
          token_in_address?: string
          token_in_amount?: string
          token_in_value_usd?: number | null
          token_out_symbol?: string
          token_out_address?: string
          token_out_amount?: string
          token_out_value_usd?: number | null
          tx_hash?: string | null
          gas_used?: string | null
          gas_price?: string | null
          gas_cost_usd?: number | null
          status?: string
          error_message?: string | null
          protocol?: string | null
          slippage?: number | null
          price_impact?: number | null
          initiated_at?: string
          confirmed_at?: string | null
          failed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      chat_interactions: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          wallet_address: string | null
          message_type: string
          message_content: string
          intent: string | null
          detected_tokens: string[] | null
          detected_amounts: number[] | null
          response_time_ms: number | null
          tokens_used: number | null
          model_used: string | null
          led_to_swap: boolean
          swap_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          wallet_address?: string | null
          message_type: string
          message_content: string
          intent?: string | null
          detected_tokens?: string[] | null
          detected_amounts?: number[] | null
          response_time_ms?: number | null
          tokens_used?: number | null
          model_used?: string | null
          led_to_swap?: boolean
          swap_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          wallet_address?: string | null
          message_type?: string
          message_content?: string
          intent?: string | null
          detected_tokens?: string[] | null
          detected_amounts?: number[] | null
          response_time_ms?: number | null
          tokens_used?: number | null
          model_used?: string | null
          led_to_swap?: boolean
          swap_id?: string | null
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          event_type: string
          event_category: string
          event_action: string | null
          event_label: string | null
          event_value: number | null
          chain_id: number | null
          wallet_address: string | null
          page_path: string | null
          referrer: string | null
          properties: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type: string
          event_category: string
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          chain_id?: number | null
          wallet_address?: string | null
          page_path?: string | null
          referrer?: string | null
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_type?: string
          event_category?: string
          event_action?: string | null
          event_label?: string | null
          event_value?: number | null
          chain_id?: number | null
          wallet_address?: string | null
          page_path?: string | null
          referrer?: string | null
          properties?: Json
          created_at?: string
        }
      }
      daily_metrics: {
        Row: {
          id: string
          date: string
          total_users: number
          new_users: number
          active_users: number
          returning_users: number
          total_sessions: number
          avg_session_duration_seconds: number
          total_swaps: number
          successful_swaps: number
          failed_swaps: number
          total_volume_usd: number
          avg_swap_size_usd: number
          chain_distribution: Json
          top_tokens_traded: Json
          total_chat_messages: number
          chat_to_swap_conversion: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          total_users?: number
          new_users?: number
          active_users?: number
          returning_users?: number
          total_sessions?: number
          avg_session_duration_seconds?: number
          total_swaps?: number
          successful_swaps?: number
          failed_swaps?: number
          total_volume_usd?: number
          avg_swap_size_usd?: number
          chain_distribution?: Json
          top_tokens_traded?: Json
          total_chat_messages?: number
          chat_to_swap_conversion?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_users?: number
          new_users?: number
          active_users?: number
          returning_users?: number
          total_sessions?: number
          avg_session_duration_seconds?: number
          total_swaps?: number
          successful_swaps?: number
          failed_swaps?: number
          total_volume_usd?: number
          avg_swap_size_usd?: number
          chain_distribution?: Json
          top_tokens_traded?: Json
          total_chat_messages?: number
          chat_to_swap_conversion?: number
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string
          total_value_usd: number
          chain_values: Json
          token_holdings: Json
          snapshot_time: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address: string
          total_value_usd: number
          chain_values: Json
          token_holdings: Json
          snapshot_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string
          total_value_usd?: number
          chain_values?: Json
          token_holdings?: Json
          snapshot_time?: string
          created_at?: string
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          wallet_address: string
          first_connected_at: string
          last_active_at: string
          total_swaps_count: number
          total_volume_usd: number
          session_count: number
          swap_count: number
          actual_volume_usd: number
        }
      }
      daily_active_users: {
        Row: {
          date: string
          active_users: number
          new_users: number
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
