-- Quick fix for the existing ETH swap
-- This will update the 0.001 ETH swap to have the correct USD value

UPDATE swaps 
SET 
  token_in_value_usd = 3.0,  -- 0.001 ETH * $3000 = $3
  token_out_value_usd = CASE 
    WHEN token_out_symbol ILIKE '%USDC%' OR token_out_symbol ILIKE '%USDT%' THEN token_out_amount * 1.0
    WHEN token_out_symbol ILIKE '%ETH%' THEN token_out_amount * 3000.0
    ELSE token_out_amount * 10.0  -- Default estimate
  END,
  updated_at = NOW()
WHERE 
  token_in_symbol = 'ETH' 
  AND token_in_amount = 0.001
  AND token_in_value_usd = 0.1;

-- Verify the update
SELECT 
  id,
  token_in_symbol,
  token_in_amount,
  token_in_value_usd,
  token_out_symbol,
  token_out_amount,
  token_out_value_usd,
  status,
  created_at
FROM swaps 
ORDER BY created_at DESC 
LIMIT 5;
