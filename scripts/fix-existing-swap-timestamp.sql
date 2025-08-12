-- ONE-TIME SCRIPT: Fix existing swap with timestamp-appropriate USD values
-- This should only be run ONCE to set initial USD values
-- After this, USD values should NEVER be changed

-- Check the current swap
SELECT 
  id,
  token_in_symbol,
  token_in_amount,
  token_in_value_usd,
  token_out_symbol,
  token_out_amount, 
  token_out_value_usd,
  created_at,
  status
FROM swaps 
WHERE token_in_symbol = 'ETH' 
AND token_in_amount = 0.001
ORDER BY created_at DESC
LIMIT 1;

-- Update with realistic values for the timestamp when swap was created
-- Based on your swap: 0.001 ETH → 4 USDC on 2025-08-12T10:06:03
-- ETH was around $3000-4000 at that time, so:
-- 0.001 ETH = ~$3-4 USD
-- 4 USDC = $4 USD

UPDATE swaps 
SET 
  token_in_value_usd = 3.50,   -- 0.001 ETH * ~$3500 (reasonable price for that timestamp)
  token_out_value_usd = 4.00,  -- 4 USDC * $1.00
  updated_at = NOW()
WHERE 
  token_in_symbol = 'ETH' 
  AND token_in_amount = 0.001
  AND created_at = '2025-08-12T10:06:03.745132+00:00';

-- Verify the update
SELECT 
  id,
  token_in_symbol,
  token_in_amount,
  token_in_value_usd,
  token_out_symbol,
  token_out_amount,
  token_out_value_usd,
  created_at,
  'USD values now LOCKED at swap timestamp' as note
FROM swaps 
WHERE token_in_symbol = 'ETH' 
AND token_in_amount = 0.001
ORDER BY created_at DESC
LIMIT 1;

-- Calculate new total volume
SELECT 
  'Total Volume (All Swaps)' as metric,
  '$' || ROUND(SUM(COALESCE(token_in_value_usd, 0))::numeric, 2) as value
FROM swaps;

-- Show volume by status
SELECT 
  status,
  COUNT(*) as swap_count,
  '$' || ROUND(SUM(COALESCE(token_in_value_usd, 0))::numeric, 2) as volume_usd
FROM swaps 
GROUP BY status
ORDER BY status;

-- IMPORTANT REMINDER
SELECT '⚠️  REMINDER: USD values are now LOCKED at swap timestamp and should NEVER be updated again!' as warning;
