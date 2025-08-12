-- Add some test swaps with realistic volume to demonstrate the system
-- This will add test data to show volume tracking working

-- First, let's see what users exist
-- SELECT * FROM users LIMIT 5;

-- Add test swaps with realistic volumes
INSERT INTO swaps (
  user_id,
  wallet_address,
  chain_id,
  chain_name,
  token_in_symbol,
  token_in_address,
  token_in_amount,
  token_in_value_usd,
  token_out_symbol,
  token_out_address,
  token_out_amount,
  token_out_value_usd,
  tx_hash,
  status,
  protocol,
  slippage,
  initiated_at,
  confirmed_at,
  created_at
) VALUES 
-- Test swap 1: 1 ETH for USDC
(
  (SELECT id FROM users LIMIT 1),
  '0x9fdb3d7f40490a292a4f26886305c043ca8f2a00',
  42161,
  'arbitrum',
  'ETH',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  1.0,
  3000.00,  -- $3000
  'USDC',
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  2950.00,
  2950.00,  -- $2950 after slippage
  '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456',
  'confirmed',
  '0x',
  1.0,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- Test swap 2: 0.5 ETH for USDC  
(
  (SELECT id FROM users LIMIT 1),
  '0x9fdb3d7f40490a292a4f26886305c043ca8f2a00',
  42161,
  'arbitrum',
  'ETH',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  0.5,
  1500.00,  -- $1500
  'USDC',
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  1475.00,
  1475.00,  -- $1475 after slippage
  '0x2345678901abcdef2345678901abcdef23456789012345678901abcdef234567',
  'confirmed',
  '0x',
  1.0,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
-- Test swap 3: Pending swap
(
  (SELECT id FROM users LIMIT 1),
  '0x9fdb3d7f40490a292a4f26886305c043ca8f2a00',
  42161,
  'arbitrum',
  'USDC',
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  1000.00,
  1000.00,  -- $1000
  'ETH',
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  0.333,
  999.00,   -- $999 worth of ETH
  '0x3456789012abcdef3456789012abcdef34567890123456789012abcdef345678',
  'pending',
  '0x',
  1.0,
  NOW() - INTERVAL '30 minutes',
  NULL,
  NOW() - INTERVAL '30 minutes'
);

-- Update user stats
UPDATE users 
SET 
  total_swaps_count = (SELECT COUNT(*) FROM swaps WHERE user_id = users.id AND status = 'confirmed'),
  total_volume_usd = (SELECT COALESCE(SUM(token_in_value_usd), 0) FROM swaps WHERE user_id = users.id AND status = 'confirmed'),
  last_active_at = NOW()
WHERE id = (SELECT id FROM users LIMIT 1);

-- Show the results
SELECT 
  'Total Volume' as metric,
  '$' || ROUND(SUM(token_in_value_usd)::numeric, 2) as value
FROM swaps 
WHERE token_in_value_usd IS NOT NULL
UNION ALL
SELECT 
  'Confirmed Volume' as metric,
  '$' || ROUND(SUM(token_in_value_usd)::numeric, 2) as value
FROM swaps 
WHERE token_in_value_usd IS NOT NULL AND status = 'confirmed'
UNION ALL
SELECT 
  'Pending Volume' as metric,
  '$' || ROUND(SUM(token_in_value_usd)::numeric, 2) as value
FROM swaps 
WHERE token_in_value_usd IS NOT NULL AND status = 'pending';
