-- Fix the GROUP BY issue in daily_active_users view
-- This addresses the "column must appear in the GROUP BY clause" error

-- Drop and recreate the view with proper GROUP BY
DROP VIEW IF EXISTS daily_active_users CASCADE;

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

-- Grant permissions
GRANT SELECT ON daily_active_users TO anon, authenticated;

-- Add comment
COMMENT ON VIEW daily_active_users IS 'Daily user activity metrics - aggregated and safe';
