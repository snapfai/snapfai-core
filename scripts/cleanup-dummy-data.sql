-- Clean up dummy data and keep only real user data from August 12, 2024 onwards
-- This will remove test/dummy data that was inserted before the real user activity

-- Set the cutoff date (August 12, 2024)
-- Assuming real user activity started on August 12, 2024
-- Adjust this date if needed based on when your first real user connected

-- First, let's see what data exists before cleanup
SELECT 'BEFORE CLEANUP - Users' as category, COUNT(*) as count FROM users
UNION ALL
SELECT 'BEFORE CLEANUP - Sessions' as category, COUNT(*) as count FROM sessions
UNION ALL  
SELECT 'BEFORE CLEANUP - Swaps' as category, COUNT(*) as count FROM swaps
UNION ALL
SELECT 'BEFORE CLEANUP - Chat Interactions' as category, COUNT(*) as count FROM chat_interactions
UNION ALL
SELECT 'BEFORE CLEANUP - Analytics Events' as category, COUNT(*) as count FROM analytics_events;

-- Show date range of existing data
SELECT 
  'Data Date Range' as info,
  MIN(created_at)::date as earliest_date,
  MAX(created_at)::date as latest_date
FROM (
  SELECT created_at FROM users
  UNION ALL
  SELECT created_at FROM sessions
  UNION ALL
  SELECT created_at FROM swaps
  UNION ALL
  SELECT created_at FROM chat_interactions
  UNION ALL
  SELECT created_at FROM analytics_events
) all_dates;

-- Delete dummy data (anything before August 12, 2024)
-- Adjust this date based on when your real user activity actually started
DELETE FROM analytics_events WHERE created_at < '2024-08-12'::date;
DELETE FROM chat_interactions WHERE created_at < '2024-08-12'::date;
DELETE FROM swaps WHERE created_at < '2024-08-12'::date;
DELETE FROM sessions WHERE created_at < '2024-08-12'::date;

-- Delete users who have no activity after the cutoff date
-- This will remove users who only had dummy/test activity
DELETE FROM users 
WHERE id NOT IN (
  SELECT DISTINCT user_id FROM sessions WHERE created_at >= '2024-08-12'::date
  UNION
  SELECT DISTINCT user_id FROM swaps WHERE created_at >= '2024-08-12'::date AND user_id IS NOT NULL
  UNION
  SELECT DISTINCT u.id FROM users u 
  JOIN chat_interactions ci ON u.wallet_address = ci.wallet_address 
  WHERE ci.created_at >= '2024-08-12'::date
);

-- Update user stats to reflect only real data
UPDATE users 
SET 
  total_swaps_count = (
    SELECT COUNT(*) 
    FROM swaps 
    WHERE user_id = users.id 
    AND status = 'confirmed'
    AND created_at >= '2024-08-12'::date
  ),
  total_volume_usd = (
    SELECT COALESCE(SUM(token_in_value_usd), 0) 
    FROM swaps 
    WHERE user_id = users.id 
    AND status = 'confirmed'
    AND created_at >= '2024-08-12'::date
  ),
  last_active_at = (
    SELECT MAX(activity_date)
    FROM (
      SELECT MAX(created_at) as activity_date FROM sessions WHERE user_id = users.id
      UNION ALL
      SELECT MAX(created_at) as activity_date FROM swaps WHERE user_id = users.id
    ) activities
  )
WHERE EXISTS (
  SELECT 1 FROM sessions WHERE user_id = users.id AND created_at >= '2024-08-12'::date
  UNION
  SELECT 1 FROM swaps WHERE user_id = users.id AND created_at >= '2024-08-12'::date
);

-- Show results after cleanup
SELECT 'AFTER CLEANUP - Users' as category, COUNT(*) as count FROM users
UNION ALL
SELECT 'AFTER CLEANUP - Sessions' as category, COUNT(*) as count FROM sessions
UNION ALL  
SELECT 'AFTER CLEANUP - Swaps' as category, COUNT(*) as count FROM swaps
UNION ALL
SELECT 'AFTER CLEANUP - Chat Interactions' as category, COUNT(*) as count FROM chat_interactions
UNION ALL
SELECT 'AFTER CLEANUP - Analytics Events' as category, COUNT(*) as count FROM analytics_events;

-- Show remaining data date range
SELECT 
  'Remaining Data Date Range' as info,
  MIN(created_at)::date as earliest_date,
  MAX(created_at)::date as latest_date
FROM (
  SELECT created_at FROM users WHERE created_at IS NOT NULL
  UNION ALL
  SELECT created_at FROM sessions
  UNION ALL
  SELECT created_at FROM swaps
  UNION ALL
  SELECT created_at FROM chat_interactions
  UNION ALL
  SELECT created_at FROM analytics_events
) all_dates;

-- Verify daily_active_users view shows correct data
SELECT 
  date,
  active_users,
  new_users,
  total_sessions,
  chains_used
FROM daily_active_users 
ORDER BY date DESC
LIMIT 10;
