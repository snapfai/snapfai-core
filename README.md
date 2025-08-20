# SnapFAI

SnapFAI is a revolutionary interaction layer that transforms how you engage with decentralized finance (DeFi). Powered by conversational AI and real-time data aggregation, SnapFAI simplifies complex DeFi operations through natural language commands.

## ✨ Key Features

### 🤖 AI-Powered DeFi Assistant
- **Natural Language Interface**: Interact with DeFi protocols using simple conversational commands
- **Smart Recommendations**: Get optimal strategies for swaps, lending, and yield farming  
- **Real-time Data**: Access live market data, prices, and protocol information
- **XAI Integration**: Powered by X.AI (Grok) for advanced natural language processing
- **Price Queries**: Ask "What's the price of ETH?" and get real-time data from Binance + CoinGecko

### 💼 Multi-Chain Portfolio Management ⭐
- **Real Portfolio Dashboard**: Track your actual DeFi assets across all supported networks
- **Alchemy Integration**: Powered by [Alchemy's Token API](https://docs.alchemy.com/reference/token-api) for accurate balance data
- **Multi-Chain Support**: Monitor holdings on Ethereum, Arbitrum, Base, Polygon, Avalanche, and Optimism
- **Real-time Balances**: View live token balances fetched directly from blockchain
- **Native Token Support**: Proper ETH, MATIC, AVAX display with accurate pricing
- **Automatic Token Discovery**: Finds all your ERC-20 tokens automatically
- **Enhanced Pricing**: Real-time prices using Binance API (primary) + CoinGecko (fallback)
- **Portfolio Analytics**: Track performance, gains/losses, and asset distribution

### 🔄 Smart Swaps & Trading
- **0x Protocol Integration**: Get the best rates using 0x API with permit2 support
- **Multi-DEX Aggregation**: Access liquidity across multiple decentralized exchanges
- **Cross-Chain Swaps**: Seamlessly swap tokens across different networks
- **Slippage Protection**: Automatic slippage management for optimal trade execution
- **Real-time Quotes**: Live pricing and swap quotes with 500ms debounced updates
- **Gas Optimization**: Smart gas estimation and optimization
- **Platform Fees**: 10 bps (0.1%) fee system for sustainable platform monetization

### 🔐 Advanced Wallet & Authentication
- **AppKit Integration**: Multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet, etc.)
- **SIWE Authentication**: Sign-In with Ethereum for secure, gasless authentication
- **Chain-Agnostic Sessions**: Switch networks without re-authenticating
- **Session Management**: Persistent sessions with secure server-side validation
- **Protected Routes**: Secure access to portfolio and trading features

### 🌐 Cross-Chain Infrastructure
- **7 Networks Supported**: Ethereum, Arbitrum, Base, Polygon, Avalanche, Optimism, Sepolia
- **Multi-Network Wallet**: Single wallet interface for all supported chains
- **Network Switching**: Seamless network switching with proper chain configurations
- **Custom Network Support**: Easily extendable to new EVM chains

## 🚀 Supported Networks

| Network | Chain ID | Native Token | Portfolio Support | Swap Support | Status |
|---------|----------|--------------|-------------------|--------------|--------|
| Ethereum | 1 | ETH | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Arbitrum | 42161 | ETH | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Base | 8453 | ETH | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Polygon | 137 | MATIC | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Avalanche | 43114 | AVAX | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Optimism | 10 | ETH | ✅ Alchemy API | ✅ 0x Protocol | ✅ Active |
| Sepolia | 11155111 | ETH | ✅ Alchemy API | ✅ 0x Protocol | ✅ Testnet |

## 🛠 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- **[Alchemy API Key](https://www.alchemy.com/pricing)** (free tier available)
- Some tokens on supported networks for testing

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/snapfai.git
cd snapfai
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

4. **Configure Required API Keys:**

**Alchemy API (Required for Portfolio):**
- Sign up for free at [Alchemy.com](https://www.alchemy.com/)
- Create a new app supporting your desired networks
- Add your API key to `.env.local`:
```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here
```

**Complete Environment Configuration:**
```bash
# Alchemy Integration (Required)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here

# AI API Configuration
XAI_API_KEY=your_xai_api_key_here

# DeFi API Keys
ZERO_X_API_KEY=your_0x_api_key_here
NEXT_PUBLIC_ZEROEX_API_KEY=your_0x_api_key_here

# Web3 Configuration  
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Optional APIs
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

5. **Run the development server:**
```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser**

### 🔑 API Key Setup Guide

**Alchemy (Portfolio Data) - REQUIRED:**
1. Visit [Alchemy.com](https://www.alchemy.com/) and create a free account
2. Create a new app and select your desired networks
3. Copy your API key and add to `NEXT_PUBLIC_ALCHEMY_API_KEY`
4. Free tier includes 5M compute units/month (perfect for testing)

**0x Protocol (Swap Data) - RECOMMENDED:**
1. Visit [0x.org](https://0x.org/docs/introduction/getting-started) 
2. Sign up for a free API key
3. Add to both `ZERO_X_API_KEY` and `NEXT_PUBLIC_ZEROEX_API_KEY`

**X.AI (Chat Features) - OPTIONAL:**
1. Get API access from [x.ai](https://x.ai/)
2. Add to `XAI_API_KEY` for advanced AI features

## 💡 Usage Examples

### Portfolio Management
```
# View your complete multi-chain portfolio
"Show me my portfolio"

# Check specific network balances  
"What tokens do I have on Arbitrum?"

# Get portfolio value
"What's my total portfolio worth?"

# Check ETH holdings across chains
"How much ETH do I have?"
```

### Token Swaps
```
# Simple swaps
"Swap 100 USDC to ETH on Ethereum"

# Cross-chain swaps
"Swap 0.5 ETH on Arbitrum to USDC"

# Get real-time quotes
"What's the rate for 1000 USDT to DAI?"

# Best price discovery
"Find the best rate to swap BTC to ETH"
```

### Price Queries
```
# Real-time prices
"What's the current price of ETH?"
"Show me BTC price"
"How much is MATIC worth?"

# Price with 24h change
"ETH price with daily change"
```

## 💰 Monetization

### Platform Fees
SnapFAI includes a sustainable monetization model through platform fees:

- **Fee Rate**: 10 basis points (0.1%) on all swaps
- **Collection Method**: Fees are collected in the token being sold
- **Transparency**: Users are always informed about fees before executing swaps
- **Competitive**: 0.1% is competitive with other DEX aggregators

### Revenue Streams
1. **Swap Fees**: Primary revenue from trading volume
2. **Volume-Based**: Higher trading volume = higher fee revenue
3. **Token Diversity**: Fees collected in various tokens for portfolio diversification

### Setup
To enable fee collection, add these environment variables:

```bash
# Default: fees will be sent to 0x12a377514F19Af5A626Bb6250065673874c708aB
# Custom: set your own wallet address
SWAP_FEE_RECIPIENT=your_wallet_address_here
SWAP_FEE_BPS=10
```

**Note**: If you don't set `SWAP_FEE_RECIPIENT`, fees will automatically be collected and sent to the default address. You can override this by setting your own wallet address.

See [SWAP_FEE_SETUP.md](docs/SWAP_FEE_SETUP.md) for detailed configuration instructions.

## 🏗 Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router and TypeScript
- **Tailwind CSS**: Utility-first styling with Shadcn/UI components
- **React Query**: Data fetching and caching
- **Wagmi + Viem**: Ethereum interactions and wallet management

### Wallet & Authentication
- **AppKit (Reown)**: Multi-wallet connection with WalletConnect v2
- **SIWE (Sign-In with Ethereum)**: Gasless authentication across all chains
- **Session Management**: Persistent, secure sessions with server-side validation
- **Protected Routes**: Secure access control for authenticated features

### Portfolio & Data Layer
- **Alchemy SDK**: Reliable blockchain data across all supported networks
- **Enhanced Pricing**: Binance API (primary) + CoinGecko (fallback) for real-time prices
- **Multi-chain Balance Fetching**: Parallel API calls for fast portfolio loading
- **Token Discovery**: Automatic detection of all ERC-20 holdings
- **Native Token Support**: Proper handling of ETH, MATIC, AVAX, etc.

### Trading & DeFi Integration
- **0x Protocol**: Professional-grade swap aggregation with permit2
- **Multi-DEX Access**: Best rates across decentralized exchanges  
- **Cross-chain Support**: Network-specific swap optimization
- **Gas Optimization**: Smart gas estimation and transaction optimization

### AI & Intelligence
- **X.AI Integration**: Advanced natural language processing
- **Function Calling**: Direct DeFi operations via conversational commands
- **Real-time Market Data**: Live prices and market information
- **Smart Recommendations**: AI-powered trading and investment suggestions

## 📁 Project Structure

```
snapfai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # SIWE authentication endpoints
│   │   ├── prompt/       # AI chat processing
│   │   └── swap/         # Trading API endpoints
│   ├── portfolio/        # Portfolio dashboard
│   ├── snap/             # AI chat interface  
│   ├── swap/             # Trading interface
│   └── wallet/           # Wallet management
├── components/            # Reusable components
│   ├── ui/               # Shadcn/UI components
│   ├── Chat.tsx          # AI chat interface
│   ├── SwapInterface.tsx # Trading component
│   └── WalletInfo.tsx    # Multi-chain wallet display
├── hooks/                # Custom React hooks
│   ├── usePortfolio.ts   # Portfolio data management
│   ├── useSwap.ts        # Trading functionality
│   └── useAuthStatus.ts  # Authentication state
├── lib/                  # Core utilities
│   ├── alchemy-portfolio.ts  # Alchemy SDK integration
│   ├── siwe-config.ts    # SIWE authentication config
│   ├── chains.ts         # Multi-chain configuration
│   ├── tokens.ts         # Token definitions (15K+ tokens)
│   └── swap-utils.ts     # Trading utilities
├── server/               # Backend services
│   └── services/         # Microservices (AI, swap, execution)
└── config/               # Network and app configuration
```

### Key Components & Hooks

**Portfolio Management:**
- `usePortfolio`: Multi-chain portfolio data with real-time pricing
- `alchemy-portfolio.ts`: Alchemy SDK integration with enhanced pricing
- `WalletSummary`: Portfolio overview with analytics

**Trading System:**
- `useSwap`: Trading functionality with 0x integration
- `SwapInterface`: Professional trading interface
- `SwapConfirmation`: Transaction confirmation flow

**Authentication:**
- `siwe-config.ts`: Chain-agnostic SIWE configuration
- `ProtectedRoute`: Secure route protection
- `useAuthStatus`: Authentication state management

## 🔧 API Integrations

### Portfolio Data (Alchemy)
```typescript
// Multi-chain balance fetching
const balances = await alchemy.core.getTokenBalances(address, ['erc20'])

// Native token balances (ETH, MATIC, AVAX)
const nativeBalance = await alchemy.core.getBalance(address)

// Token metadata with logos
const metadata = await alchemy.core.getTokenMetadata(tokenAddress)
```

### Real-time Pricing (Binance + CoinGecko)
```typescript
// Binance API for major tokens
const binancePrice = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT`)

// CoinGecko fallback for all tokens
const coinGeckoPrice = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`)
```

### Trading Integration (0x Protocol)
```typescript
// Get swap quote
const quote = await fetch(`https://api.0x.org/swap/permit2/price?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${amount}`)

// Execute swap with permit2
const transaction = await fetch(`https://api.0x.org/swap/permit2/quote`, { method: 'POST', body: quoteParams })
```

## 🎯 Recent Major Updates

### Portfolio Enhancement (Latest)
- ✅ **Fixed ETH Holdings Display**: Resolved native token mapping issues
- ✅ **Real-time Pricing**: Implemented Binance + CoinGecko pricing strategy
- ✅ **Enhanced Logging**: Clean, informative portfolio monitoring
- ✅ **Multi-chain Native Support**: Proper ETH, MATIC, AVAX display
- ✅ **Performance Optimization**: Batched API calls with rate limiting

### Authentication & Security
- ✅ **Chain-agnostic SIWE**: Switch networks without re-authentication
- ✅ **Session Persistence**: Secure server-side session management
- ✅ **Protected Routes**: Secure access to portfolio and trading
- ✅ **Fallback Authentication**: Robust error handling and recovery

### Trading & Swap Features
- ✅ **0x Protocol Integration**: Professional swap aggregation
- ✅ **Multi-chain Trading**: Network-specific swap optimization
- ✅ **Real-time Quotes**: Live pricing with debounced updates
- ✅ **Gas Optimization**: Smart transaction cost management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add proper error handling and logging
- Test across multiple networks
- Update documentation for new features

## 📄 License

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
See the [LICENSE](LICENSE) file for details.

## 🆘 Support & Resources

- **Documentation**: [https://docs.snapfai.com](https://docs.snapfai.com)
- **Alchemy Docs**: [https://docs.alchemy.com](https://docs.alchemy.com)
- **0x Protocol Docs**: [https://0x.org/docs](https://0x.org/docs)
- **Discord**: Join our community for support and updates
- **Issues**: Report bugs and request features on GitHub

## 🎉 Acknowledgments

- **Alchemy**: Reliable blockchain infrastructure and APIs
- **0x Protocol**: Professional-grade swap aggregation
- **Reown (AppKit)**: Excellent wallet connection infrastructure
- **X.AI**: Advanced AI capabilities for natural language processing

---

**Built with ❤️ for the DeFi community**

*Doing DeFi Like a Snap! ⚡*