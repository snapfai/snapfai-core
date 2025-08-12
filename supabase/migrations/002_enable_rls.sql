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

-- Note: These policies allow the anon key to read and write data
-- which is necessary for our analytics tracking to work.
-- In production, you might want to:
-- 1. Use authenticated users instead of anon
-- 2. Restrict reads to only user's own data
-- 3. Use service role key only for admin operations
