-- Add comments to clarify that USD values are locked at swap timestamp
-- These values should NEVER be updated retroactively

COMMENT ON COLUMN swaps.token_in_value_usd IS 'USD value of input token at the time of swap - LOCKED, never updated';
COMMENT ON COLUMN swaps.token_out_value_usd IS 'USD value of output token at the time of swap - LOCKED, never updated';
COMMENT ON COLUMN swaps.initiated_at IS 'Timestamp when swap was initiated - used for price calculation';
COMMENT ON COLUMN swaps.confirmed_at IS 'Timestamp when swap was confirmed on blockchain';

-- Add a trigger to prevent retroactive USD value updates (except for initial NULL -> value)
CREATE OR REPLACE FUNCTION prevent_usd_value_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow initial setting of USD values (NULL -> value)
  IF OLD.token_in_value_usd IS NULL AND NEW.token_in_value_usd IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  IF OLD.token_out_value_usd IS NULL AND NEW.token_out_value_usd IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Prevent changes to existing USD values
  IF OLD.token_in_value_usd IS NOT NULL AND OLD.token_in_value_usd != NEW.token_in_value_usd THEN
    RAISE EXCEPTION 'Cannot update token_in_value_usd - USD values are locked at swap timestamp';
  END IF;
  
  IF OLD.token_out_value_usd IS NOT NULL AND OLD.token_out_value_usd != NEW.token_out_value_usd THEN
    RAISE EXCEPTION 'Cannot update token_out_value_usd - USD values are locked at swap timestamp';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (but disable it initially for manual fixes)
CREATE TRIGGER prevent_usd_value_updates_trigger
  BEFORE UPDATE ON swaps
  FOR EACH ROW
  EXECUTE FUNCTION prevent_usd_value_updates();

-- Disable the trigger initially so we can fix existing data
ALTER TABLE swaps DISABLE TRIGGER prevent_usd_value_updates_trigger;

-- Add comment explaining the trigger
COMMENT ON TRIGGER prevent_usd_value_updates_trigger ON swaps IS 'Prevents retroactive updates to USD values - volume must be locked at swap timestamp';
