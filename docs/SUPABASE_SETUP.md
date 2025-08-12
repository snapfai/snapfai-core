# Supabase Analytics Setup Guide

This guide will help you set up Supabase for tracking user analytics, wallet connections, and swap volumes in SnapFAI.

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project" and fill in:
   - Project name: `snapfai-analytics` (or your preference)
   - Database password: Choose a strong password (save this!)
   - Region: Choose the closest to your users
3. Click "Create new project" and wait for setup (~2 minutes)

### 2. Get Your API Keys

Once your project is ready:

1. Go to Settings → API
2. Copy these values to your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
   ```

### 3. Run Database Migrations

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/migrations/001_analytics_schema.sql`
4. Click "Run" to create all tables and indexes

### 4. Verify Setup

1. Go to Table Editor in Supabase Dashboard
2. You should see these tables:
   - `users` - Tracks unique wallets
   - `sessions` - Tracks wallet connections
   - `swaps` - Tracks all swap transactions
   - `chat_interactions` - Tracks chat messages
   - `analytics_events` - Generic event tracking
   - `daily_metrics` - Aggregated daily stats
   - `portfolio_snapshots` - Portfolio value tracking

## 📊 What Gets Tracked

### User Analytics
- Wallet addresses (anonymized)
- First connection time
- Last active time
- Total swaps count
- Total volume in USD
- Preferred chain

### Session Tracking
- Wallet connection events
- Chain switching
- Session duration
- Authentication method (SIWE, WalletConnect, etc.)

### Swap Transactions
- Token pairs traded
- Amounts and USD values
- Transaction hashes
- Success/failure status
- Gas costs
- Slippage and price impact
- Protocol used (0x, Uniswap, etc.)

### Chat Interactions
- Message intents (swap, price check, portfolio, etc.)
- Detected tokens and amounts
- Response times
- Whether chat led to a swap
- Model used (GPT-4, xAI, etc.)

### Portfolio Snapshots
- Total portfolio value over time
- Token holdings
- Chain distribution
- Value changes

## 🔒 Security & Privacy

### Data Protection
- All wallet addresses are stored in lowercase for consistency
- No private keys or sensitive wallet data is ever stored
- Session data expires after 24 hours
- All API calls use Row Level Security (RLS)

### GDPR Compliance
- Users can request data deletion
- No personally identifiable information beyond wallet addresses
- Data is used only for analytics and service improvement

## 📈 Accessing Analytics

### In-App Dashboard
Navigate to `/analytics` in your SnapFAI app to see:
- Total users and active users
- Swap volume and success rates
- Chain distribution
- Top traded tokens
- User growth charts
- Export to CSV for investors

### Supabase Dashboard
Use Supabase's built-in analytics:
1. Go to your project dashboard
2. Click on "Analytics" or "Logs"
3. View real-time metrics and queries

### Custom Queries
Run SQL queries in Supabase SQL Editor:

```sql
-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
FROM sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top traders by volume
SELECT wallet_address, SUM(token_in_value_usd) as total_volume
FROM swaps
WHERE status = 'confirmed'
GROUP BY wallet_address
ORDER BY total_volume DESC
LIMIT 10;

-- Chain distribution
SELECT chain_name, COUNT(*) as swap_count
FROM swaps
WHERE status = 'confirmed'
GROUP BY chain_name
ORDER BY swap_count DESC;
```

## 🚨 Troubleshooting

### "Supabase environment variables not configured"
- Make sure all three environment variables are set in `.env.local`
- Restart your Next.js development server after adding env vars

### "Failed to track event"
- Check that your Supabase project is active (not paused)
- Verify your API keys are correct
- Check Supabase logs for any errors

### Tables not created
- Make sure you ran the migration SQL in the SQL Editor
- Check for any error messages when running the migration
- Verify you have the correct permissions

## 🎯 For Investors

The analytics system provides comprehensive metrics to demonstrate traction:

1. **User Growth**: Track daily, weekly, and monthly active users
2. **Transaction Volume**: Monitor total swap volume in USD
3. **Success Metrics**: View swap success rates and user retention
4. **Chain Adoption**: See which blockchains are most popular
5. **Token Trends**: Identify trending tokens and trading pairs
6. **Export Reports**: Generate CSV reports with all key metrics

Access the analytics dashboard at `/analytics` or export data via the API endpoint `/api/analytics/summary`.

## 📝 Next Steps

1. Set up automated daily reports (optional)
2. Configure alerts for significant events
3. Integrate with external analytics tools (Mixpanel, Amplitude)
4. Set up data backups and retention policies

## 🆘 Support

- Supabase Documentation: [docs.supabase.com](https://docs.supabase.com)
- SnapFAI Issues: Create an issue on GitHub
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
