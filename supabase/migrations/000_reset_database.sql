-- Complete Database Reset Migration
-- This will drop all existing objects and recreate them from scratch

-- Drop all existing views first (due to dependencies)
DROP VIEW IF EXISTS daily_active_users CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;

-- Drop all existing tables (CASCADE will handle foreign key constraints)
DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
DROP TABLE IF EXISTS daily_metrics CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS chat_interactions CASCADE;
DROP TABLE IF EXISTS swaps CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all existing triggers (they should be dropped with CASCADE above, but being explicit)
-- (No explicit DROP TRIGGER needed as CASCADE handles this)

-- Now recreate everything from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (tracks unique wallets)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  ens_name TEXT,
  first_connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  total_swaps_count INTEGER DEFAULT 0,
  total_volume_usd DECIMAL(20, 2) DEFAULT 0,
  preferred_chain TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for wallet lookups
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);

-- Sessions table (tracks wallet connections)
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  chain_name TEXT NOT NULL,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  auth_method TEXT DEFAULT 'siwe', -- siwe, walletconnect, etc
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for session queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_chain ON sessions(chain_id);

-- Swaps table (tracks all swap transactions)
CREATE TABLE swaps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  chain_name TEXT NOT NULL,
  
  -- Swap details
  token_in_symbol TEXT NOT NULL,
  token_in_address TEXT NOT NULL,
  token_in_amount DECIMAL(36, 18) NOT NULL,
  token_in_value_usd DECIMAL(20, 2),
  
  token_out_symbol TEXT NOT NULL,
  token_out_address TEXT NOT NULL,
  token_out_amount DECIMAL(36, 18) NOT NULL,
  token_out_value_usd DECIMAL(20, 2),
  
  -- Transaction details
  tx_hash TEXT,
  gas_used DECIMAL(20, 0),
  gas_price DECIMAL(20, 0),
  gas_cost_usd DECIMAL(10, 4),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed, cancelled
  error_message TEXT,
  
  -- Protocol info
  protocol TEXT, -- 0x, uniswap, etc
  slippage DECIMAL(5, 2),
  price_impact DECIMAL(5, 2),
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for swap queries
CREATE INDEX idx_swaps_user_id ON swaps(user_id);
CREATE INDEX idx_swaps_wallet ON swaps(wallet_address);
CREATE INDEX idx_swaps_status ON swaps(status);
CREATE INDEX idx_swaps_created_at ON swaps(created_at DESC);
CREATE INDEX idx_swaps_chain ON swaps(chain_id);
CREATE INDEX idx_swaps_tokens ON swaps(token_in_symbol, token_out_symbol);

-- Chat interactions table
CREATE TABLE chat_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  wallet_address TEXT,
  
  -- Message details
  message_type TEXT NOT NULL, -- user, assistant, system
  message_content TEXT NOT NULL,
  
  -- Intent classification
  intent TEXT, -- swap, price_check, portfolio, help, other
  detected_tokens TEXT[],
  detected_amounts DECIMAL[],
  
  -- Response metrics
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used TEXT,
  
  -- Outcome
  led_to_swap BOOLEAN DEFAULT FALSE,
  swap_id UUID REFERENCES swaps(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat queries
CREATE INDEX idx_chat_user_id ON chat_interactions(user_id);
CREATE INDEX idx_chat_session_id ON chat_interactions(session_id);
CREATE INDEX idx_chat_intent ON chat_interactions(intent);
CREATE INDEX idx_chat_created_at ON chat_interactions(created_at DESC);

-- Analytics events table (generic event tracking)
CREATE TABLE analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL, -- wallet_connected, swap_initiated, swap_completed, etc
  event_category TEXT NOT NULL, -- auth, swap, chat, portfolio, etc
  event_action TEXT,
  event_label TEXT,
  event_value DECIMAL,
  
  -- Context
  chain_id INTEGER,
  wallet_address TEXT,
  page_path TEXT,
  referrer TEXT,
  
  -- Metadata
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Daily metrics table (aggregated metrics)
CREATE TABLE daily_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  
  -- User metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  
  -- Session metrics
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  
  -- Swap metrics
  total_swaps INTEGER DEFAULT 0,
  successful_swaps INTEGER DEFAULT 0,
  failed_swaps INTEGER DEFAULT 0,
  total_volume_usd DECIMAL(20, 2) DEFAULT 0,
  avg_swap_size_usd DECIMAL(20, 2) DEFAULT 0,
  
  -- Chain distribution
  chain_distribution JSONB DEFAULT '{}',
  
  -- Token metrics
  top_tokens_traded JSONB DEFAULT '[]',
  
  -- Chat metrics
  total_chat_messages INTEGER DEFAULT 0,
  chat_to_swap_conversion DECIMAL(5, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for date queries
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);

-- Portfolio snapshots table (track portfolio values over time)
CREATE TABLE portfolio_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Portfolio value
  total_value_usd DECIMAL(20, 2) NOT NULL,
  
  -- Chain breakdown
  chain_values JSONB NOT NULL, -- {ethereum: 1000, arbitrum: 500, ...}
  
  -- Token holdings
  token_holdings JSONB NOT NULL, -- [{symbol, amount, value_usd}, ...]
  
  -- Timestamp
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for portfolio queries
CREATE INDEX idx_portfolio_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_wallet ON portfolio_snapshots(wallet_address);
CREATE INDEX idx_portfolio_time ON portfolio_snapshots(snapshot_time DESC);

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swaps_updated_at BEFORE UPDATE ON swaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.wallet_address,
  u.first_connected_at,
  u.last_active_at,
  u.total_swaps_count,
  u.total_volume_usd,
  COUNT(DISTINCT s.id) as session_count,
  COUNT(DISTINCT sw.id) as swap_count,
  COALESCE(SUM(sw.token_in_value_usd), 0) as actual_volume_usd
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
LEFT JOIN swaps sw ON u.id = sw.user_id AND sw.status = 'confirmed'
GROUP BY u.id, u.wallet_address, u.first_connected_at, u.last_active_at, 
         u.total_swaps_count, u.total_volume_usd;

-- Create view for daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
  DATE(s.created_at) as date,
  COUNT(DISTINCT s.user_id) as active_users,
  COUNT(DISTINCT CASE WHEN DATE(u.first_connected_at) = DATE(s.created_at) THEN s.user_id END) as new_users,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT s.chain_name) as chains_used
FROM sessions s
JOIN users u ON s.user_id = u.id
GROUP BY DATE(s.created_at)
ORDER BY DATE(s.created_at) DESC;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Grant SELECT permissions to anon and authenticated users for views
GRANT SELECT ON user_stats TO anon, authenticated;
GRANT SELECT ON daily_active_users TO anon, authenticated;

-- Add comments
COMMENT ON VIEW daily_active_users IS 'Daily user activity metrics - aggregated and safe';
COMMENT ON VIEW user_stats IS 'User statistics and activity summary';

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access for backend)
-- Service role bypasses RLS by default, but we'll be explicit

-- Users table policies
CREATE POLICY "Service role can do everything with users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can update users" ON users
  FOR UPDATE USING (true);

-- Sessions table policies
CREATE POLICY "Service role can do everything with sessions" ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can update sessions" ON sessions
  FOR UPDATE USING (true);

-- Swaps table policies
CREATE POLICY "Service role can do everything with swaps" ON swaps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read swaps" ON swaps
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert swaps" ON swaps
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon can update swaps" ON swaps
  FOR UPDATE USING (true);

-- Chat interactions table policies
CREATE POLICY "Service role can do everything with chat" ON chat_interactions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read chat" ON chat_interactions
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert chat" ON chat_interactions
  FOR INSERT WITH CHECK (true);

-- Analytics events table policies
CREATE POLICY "Service role can do everything with analytics" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read analytics" ON analytics_events
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Daily metrics table policies (read-only for anon)
CREATE POLICY "Service role can do everything with metrics" ON daily_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read metrics" ON daily_metrics
  FOR SELECT USING (true);

-- Portfolio snapshots table policies
CREATE POLICY "Service role can do everything with portfolios" ON portfolio_snapshots
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anon can read portfolios" ON portfolio_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Anon can insert portfolios" ON portfolio_snapshots
  FOR INSERT WITH CHECK (true);
