-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (tracks unique wallets)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS sessions (
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
CREATE TABLE IF NOT EXISTS swaps (
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
CREATE TABLE IF NOT EXISTS chat_interactions (
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
CREATE TABLE IF NOT EXISTS analytics_events (
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
CREATE TABLE IF NOT EXISTS daily_metrics (
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
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
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
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT CASE WHEN DATE(first_connected_at) = DATE(created_at) THEN user_id END) as new_users
FROM (
  SELECT u.id as user_id, u.first_connected_at, s.created_at
  FROM users u
  JOIN sessions s ON u.id = s.user_id
) as activity
GROUP BY DATE(created_at);

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
