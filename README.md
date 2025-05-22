# SnapFAI MVP

SnapFAI is a chat-based DeFi interaction layer that simplifies token swapping on Ethereum and Arbitrum.

## Features

- **Chat-based Interface**: Simply type what you want to do in natural language
- **Smart Swaps**: "Swap 100 USDT to ETH on Arbitrum"
- **Best Prices**: Automatically finds the best rates across multiple protocols (0x and Odos)
- **Cross-chain Support**: Ethereum and Arbitrum networks

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **AI**: OpenAI GPT-4
- **DeFi**: 0x API, Odos API
- **Authentication**: Web3Modal for wallet connections

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key
- Optional: 0x API key and Odos API key for real price quotes (mocked in MVP)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/snapfai.git
   cd snapfai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env.local` file in the root directory with the following content:
   ```
   # xAI API Key
   XAI_API_KEY=your_xai_api_key

   # DeFi API Keys (optional for MVP)
   ZERO_X_API_KEY=your_0x_api_key
   ODOS_API_KEY=your_odos_api_key
   INFURA_API_KEY=your_infura_api_key

   # Web3 Configuration (optional for MVP)
   NEXT_PUBLIC_INFURA_ID=your_infura_id
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Open the app in your browser
2. Connect your wallet (optional for seeing the full flow)
3. Type a natural language request in the chat, for example:
   - "Swap 100 USDT to ETH on Arbitrum"
   - "Swap 1 ETH to USDT"
   - "What's the current price of ETH?"

## Development Notes

### MVP Limitations

- The MVP uses simulated prices and executions for demonstration purposes
- Real wallet integration and transaction signing are not fully implemented
- Price triggers are simulated (no real price feed integration)

### Folder Structure

- `/app`: Next.js application and API routes
- `/components`: React components
- `/server`: Backend server for production deployment (not included in MVP)

## Future Enhancements

- Real-time price feeds via Pyth Network
- Enhanced wallet integration
- Twitter sentiment analysis
- Support for more DEX aggregators
- Adding lending/borrowing protocols

## License

[MIT](LICENSE)
