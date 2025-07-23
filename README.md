# SnapFAI

SnapFAI is a revolutionary interaction layer that transforms how you engage with decentralized finance (DeFi). Powered by conversational AI and real-time data aggregation, SnapFAI simplifies complex DeFi operations through natural language commands.

## Features

### 🤖 AI-Powered DeFi Assistant
- **Natural Language Interface**: Interact with DeFi protocols using simple conversational commands
- **Smart Recommendations**: Get optimal strategies for swaps, lending, and yield farming
- **Real-time Data**: Access live market data, prices, and protocol information

### 💼 Multi-Chain Portfolio Management (NEW!)
- **Portfolio Dashboard**: Track your DeFi assets across all supported networks in one place
- **Real Alchemy Integration**: Powered by [Alchemy's Token API](https://docs.alchemy.com/reference/token-api) for accurate balance data
- **Multi-Chain Support**: Monitor holdings on Ethereum, Arbitrum, Base, Polygon, Avalanche, and more
- **Real-time Balances**: View live token balances fetched directly from blockchain via Alchemy
- **Chain-Specific Filtering**: Filter holdings by specific networks
- **Automatic Token Discovery**: Uses Alchemy's `erc20` parameter to find all your tokens automatically
- **Portfolio Analytics**: Track performance, gains/losses, and asset distribution (coming soon)

### 🔄 Smart Swaps
- **Multi-DEX Aggregation**: Get the best rates across 0x, 1inch, ParaSwap, and other aggregators
- **Cross-Chain Swaps**: Seamlessly swap tokens across different networks
- **Slippage Protection**: Automatic slippage management for optimal trade execution

### 🌐 Cross-Chain Interactions
- **LayerZero Integration**: Seamless cross-chain asset transfers
- **deBridge Support**: Additional bridging options for better liquidity
- **Multi-Network Wallet**: Single wallet interface for all supported chains

### 📊 Borrow & Earn
- **Lending Protocols**: Integrate with Aave, Compound, SparkFi, and more
- **Yield Farming**: Discover and manage yield farming opportunities
- **Risk Assessment**: Smart analysis of lending and borrowing risks

### ⚡ Automation & Triggers
- **Time-based Triggers**: Schedule DeFi actions for optimal timing
- **Price-based Alerts**: Execute trades when target prices are reached
- **Gas Optimization**: Automatic gas price optimization for transactions

## Supported Networks

| Network | Chain ID | Native Token | Portfolio Support | Status |
|---------|----------|--------------|-------------------|--------|
| Ethereum | 1 | ETH | ✅ Alchemy API | ✅ Active |
| Arbitrum | 42161 | ETH | ✅ Alchemy API | ✅ Active |
| Base | 8453 | ETH | ✅ Alchemy API | ✅ Active |
| Polygon | 137 | MATIC | ✅ Alchemy API | ✅ Active |
| Avalanche | 43114 | AVAX | ✅ Alchemy API | ✅ Active |
| Optimism | 10 | ETH | ✅ Alchemy API | ✅ Active |
| Sepolia | 11155111 | ETH | ✅ Alchemy API | ✅ Testnet |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- **[Alchemy API Key](https://www.alchemy.com/pricing)** (free tier available)
- Some tokens on supported networks for testing

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/snapfai.git
cd snapfai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. **Configure Alchemy API (Required for Portfolio)**:
   - Sign up for free at [Alchemy.com](https://www.alchemy.com/)
   - Create a new app on their dashboard
   - Copy your API key and add it to `.env.local`:
   ```bash
   NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
   ```

5. Add other optional API keys:
```bash
# AI API Configuration  
XAI_API_KEY=your_xai_api_key_here

# DeFi API Keys (optional)
ZERO_X_API_KEY=your_0x_api_key_here
ODOS_API_KEY=your_odos_api_key_here

# Web3 Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### 🔑 Setting Up Alchemy for Portfolio Features

To get real, accurate portfolio data, you'll need an Alchemy API key:

1. **Sign Up**: Visit [Alchemy.com](https://www.alchemy.com/) and create a free account
2. **Create App**: Go to your dashboard and create a new app
3. **Choose Networks**: Select the networks you want to support (Ethereum, Arbitrum, etc.)
4. **Get API Key**: Copy your API key from the app dashboard
5. **Add to Environment**: Set `NEXT_PUBLIC_ALCHEMY_API_KEY` in your `.env.local` file

**What you get with Alchemy integration:**
- ✅ Real token balances across all supported chains
- ✅ Automatic token discovery (finds all ERC-20 tokens you own)
- ✅ Token metadata (names, symbols, logos, decimals)
- ✅ Up to 100 tokens per address per chain
- ✅ Fast, reliable blockchain data

**Free Tier Limits:**
- 5 million compute units per month
- Enough for thousands of portfolio loads
- Perfect for individual users and testing

### Quick Start Guide

1. **Connect Your Wallet**: Click the "Connect Wallet" button and select your preferred wallet
2. **View Portfolio**: Navigate to `/portfolio` to see your multi-chain asset overview with real Alchemy data
3. **Start Chatting**: Go to `/snap` and try commands like:
   - "Swap 0.1 ETH to USDC on Arbitrum"
   - "Show me the best yield farming opportunities"
   - "What's the current price of MATIC?"

## Usage Examples

### Portfolio Management
```
# View your complete portfolio
"Show me my portfolio"

# Check specific chain balances
"What tokens do I have on Base?"

# Get portfolio summary
"What's my total portfolio value?"
```

### Token Swaps
```
# Simple swaps
"Swap 100 USDC to ETH"

# Cross-chain swaps
"Swap 0.5 ETH on Ethereum to USDC on Arbitrum"

# Get quotes
"What's the rate for swapping 1000 USDT to DAI?"
```

### DeFi Operations
```
# Lending
"Lend 1000 USDC on Aave"

# Borrowing
"Borrow 500 DAI against my ETH"

# Yield farming
"Find the best yield for USDC"
```

## Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Modern component library

### Wallet Integration
- **AppKit (WalletConnect)**: Multi-wallet support
- **SIWE**: Sign-In with Ethereum for authentication
- **Wagmi**: React hooks for Ethereum

### Portfolio Data (NEW!)
- **Alchemy SDK**: Reliable blockchain data across all supported networks
- **Multi-chain Balance Fetching**: Parallel API calls for fast loading
- **Token Discovery**: Automatic detection of all ERC-20 holdings
- **Real-time Prices**: Mock prices (ready for CoinGecko/CoinMarketCap integration)

### AI & Data
- **OpenAI GPT-4**: Natural language processing
- **Real-time APIs**: Live price and market data
- **Multi-source aggregation**: Data from multiple DeFi protocols

## Development

### Project Structure
```
snapfai/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── portfolio/      # Portfolio page (NEW!)
│   ├── snap/           # AI chat interface
│   └── swap/           # Swap interface
├── components/         # Reusable components
│   ├── ui/            # UI components
│   └── ...            # Feature components
├── hooks/             # Custom React hooks
│   └── usePortfolio.ts # Portfolio data hook (NEW!)
├── lib/               # Utilities and configurations
│   ├── alchemy-portfolio.ts # Alchemy integration (NEW!)
│   ├── chains.ts      # Multi-chain configuration
│   └── tokens.ts      # Token configurations
└── config/            # Network and app configuration
```

### Key Components
- `usePortfolio`: Hook for fetching multi-chain portfolio data via Alchemy
- `alchemy-portfolio.ts`: Alchemy SDK integration utilities
- `Chat`: AI-powered conversation interface
- `SwapInterface`: Token swap functionality
- `WalletInfo`: Multi-chain wallet information display

### API Integration Examples

**Portfolio Data with Alchemy:**
```typescript
// Real token balances across all chains
const balances = await alchemy.core.getTokenBalances(address, ['erc20'])

// Token metadata with logos and decimals
const metadata = await alchemy.core.getTokenMetadata(tokenAddress)
```

**Supported Alchemy Networks:**
- Ethereum Mainnet & Sepolia
- Arbitrum One
- Base Mainnet
- Polygon Mainnet
- Optimism Mainnet
- Avalanche C-Chain

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.snapfai.com](https://docs.snapfai.com)
- **Alchemy Docs**: [https://docs.alchemy.com](https://docs.alchemy.com)
- **Discord**: Join our community for support and updates
- **Issues**: Report bugs and request features on GitHub

---

**Built with ❤️ for the DeFi community**

*Portfolio feature powered by [Alchemy](https://www.alchemy.com/) 🔮*
