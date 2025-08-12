-- Create daily_metrics table if it doesn't exist
-- This fixes the "Error updating daily metrics" issue

-- Check if table exists and create it if missing
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
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

-- Enable RLS
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS "Service role can do everything with metrics" ON daily_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Anon can read metrics" ON daily_metrics
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON daily_metrics TO postgres;
GRANT SELECT ON daily_metrics TO anon, authenticated;

-- Add trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_daily_metrics_updated_at 
  BEFORE UPDATE ON daily_metrics
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 'daily_metrics table created/verified successfully' as status;
