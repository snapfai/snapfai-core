-- Function to refresh user statistics after swap price updates
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user statistics based on confirmed swaps
  UPDATE users 
  SET 
    total_swaps_count = (
      SELECT COUNT(*) 
      FROM swaps 
      WHERE swaps.user_id = users.id 
      AND swaps.status = 'confirmed'
    ),
    total_volume_usd = (
      SELECT COALESCE(SUM(token_in_value_usd), 0) 
      FROM swaps 
      WHERE swaps.user_id = users.id 
      AND swaps.status = 'confirmed'
      AND token_in_value_usd IS NOT NULL
    ),
    last_active_at = (
      SELECT MAX(created_at) 
      FROM swaps 
      WHERE swaps.user_id = users.id
    ),
    updated_at = NOW()
  WHERE EXISTS (
    SELECT 1 FROM swaps WHERE swaps.user_id = users.id
  );

  -- Log the update
  RAISE NOTICE 'User statistics refreshed for % users', 
    (SELECT COUNT(*) FROM users WHERE EXISTS (SELECT 1 FROM swaps WHERE swaps.user_id = users.id));
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refresh_user_stats() TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION refresh_user_stats() IS 'Refreshes user statistics after swap price updates';
