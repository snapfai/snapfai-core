# Volume Calculation Rules

## 🔒 **CRITICAL RULE: Volume is Locked at Swap Timestamp**

Volume USD values must be calculated and stored at the **exact moment the swap occurs** and **NEVER changed afterward**, even if token prices fluctuate.

## ✅ **Correct Behavior**

```
Swap occurs on 2025-08-12 at 10:06 AM:
- 0.001 ETH (ETH price = $3,500 at that time)
- Receives 4 USDC (USDC price = $1.00 at that time)

Volume recorded: $3.50 (0.001 × $3,500)
Output value: $4.00 (4 × $1.00)

Later, ETH price goes to $5,000:
- Volume REMAINS $3.50 ✅
- Historical data is preserved ✅
```

## ❌ **Incorrect Behavior**

```
Swap occurs on 2025-08-12 at 10:06 AM:
- Volume initially recorded as $3.50

Later, ETH price goes to $5,000:
- Someone updates volume to $5.00 ❌
- Historical accuracy is lost ❌
- Volume data becomes misleading ❌
```

## 🏗️ **Implementation**

### **When Swap Occurs:**
1. Fetch real-time token prices from CoinGecko API
2. Calculate USD values: `amount × currentPrice`
3. Store in database with timestamp
4. **Lock these values forever**

### **Database Protection:**
```sql
-- Trigger prevents retroactive updates
CREATE TRIGGER prevent_usd_value_updates_trigger
  BEFORE UPDATE ON swaps
  FOR EACH ROW
  EXECUTE FUNCTION prevent_usd_value_updates();
```

### **Code Implementation:**
```typescript
// ✅ Correct: Get price at swap time
const swapTime = new Date()
const tokenPrice = await priceFetcher.getTokenPrice('ETH')
const volumeUSD = amount * tokenPrice.price

// Store in database - LOCKED FOREVER
await supabase.from('swaps').insert({
  token_in_value_usd: volumeUSD,
  created_at: swapTime,
  // ... other fields
})

// ❌ Never do this:
// await supabase.from('swaps').update({ 
//   token_in_value_usd: newPrice // FORBIDDEN!
// })
```

## 📊 **Volume Aggregation**

### **Total Volume Calculation:**
```sql
-- All-time volume (sum of historical USD values)
SELECT SUM(token_in_value_usd) FROM swaps 
WHERE token_in_value_usd IS NOT NULL

-- Daily volume (sum for specific date)
SELECT SUM(token_in_value_usd) FROM swaps 
WHERE DATE(created_at) = '2025-08-12'
AND token_in_value_usd IS NOT NULL
```

### **Why Input Token Value?**
- Standard practice in DeFi analytics
- Represents the "size" of the trade
- Avoids double-counting in aggregations

## 🚫 **What NOT to Do**

1. **Never update historical USD values**
2. **Never recalculate volume with current prices**
3. **Never "fix" old swaps with new price data**
4. **Never create APIs that allow retroactive updates**

## ✅ **What TO Do**

1. **Fetch prices at swap time**
2. **Store USD values immediately**
3. **Protect historical data with database constraints**
4. **Use timestamp-appropriate prices for any fixes**

## 🔧 **One-Time Data Fix**

If existing swaps have incorrect USD values, fix them ONCE with timestamp-appropriate prices:

```sql
-- Fix with price that was realistic at that timestamp
UPDATE swaps 
SET token_in_value_usd = 3.50  -- Price on 2025-08-12
WHERE created_at = '2025-08-12T10:06:03.745132+00:00'
AND token_in_value_usd IS NULL  -- Only if not set
```

Then **never touch USD values again**.

## 📈 **Benefits of This Approach**

1. **Historical accuracy** - Volume reflects market conditions at swap time
2. **Consistent analytics** - Matches industry standards (Uniswap, DEX analytics)
3. **Reliable metrics** - Volume numbers don't change unexpectedly
4. **Audit trail** - Clear record of when and how volume was calculated

Remember: **Volume is history, not current market value!**
