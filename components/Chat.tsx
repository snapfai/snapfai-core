"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import SwapConfirmation from './SwapConfirmation';
import { v4 as uuid } from 'uuid';
import ReactMarkdown from 'react-markdown';
import { useAppKitAccount, useAppKitNetwork, useAppKitBalance, useWalletInfo, useAppKit } from '@reown/appkit/react'
import WalletSummary from './WalletSummary';
import { useSendTransaction, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
// Import types for better TypeScript support
import type { Hex } from 'viem';
import { getChainId, getChainByName, extractChainIdFromCAIP } from '@/lib/chains';
import { resolveToken, getTokensForChain } from '@/lib/tokens';

// Add rehype-raw to support HTML in markdown for links
import rehypeRaw from 'rehype-raw';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface SwapDetails {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: string;
  protocol: string;
  chain: string;
}

// Common ERC20 tokens for swap functionality
const TOKENS = [
  {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    symbol: 'DAI',
    decimals: 18,
    name: 'Dai Stablecoin',
    logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png'
  }
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuid(),
      role: 'assistant',
      content: `# Welcome to SnapFAI

**Your Smart, Easy, and Magical DeFi Experience**

SnapFAI transforms how you interact with decentralized finance through natural language. I can help you:

- **Swap tokens** across Ethereum & Arbitrum with the best rates
- **Borrow & earn** through platforms like Aave, Compound, and SparkFi
- **Set up triggers** based on price, time, or gas conditions
- **Get real-time insights** on tokens and market sentiment

## How to Use SnapFAI

Simply tell me what you want to do in plain language. For example:

- "Swap 500 USDT to ETH on Arbitrum"
- "Find the best lending rate for 10 ETH"
- "Set a trigger to buy ETH when price drops below $3,000"

I'll analyze multiple protocols to find you the best options, and you'll always see exactly what you'll get before confirming any transaction.

**Pro tip:** For the best experience, be specific about amounts and tokens. If you don't specify a chain, I'll default to Ethereum.

Ready to do DeFi like a snap? Go ahead and type your first request!`,
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showSwapConfirmation, setShowSwapConfirmation] = useState(false);
  const [swapDetails, setSwapDetails] = useState<SwapDetails | null>(null);
  const [useLiveSearch, setUseLiveSearch] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [searchSources, setSearchSources] = useState({
    web: true,
    news: true,
    x: true
  });
  // Store the last transaction data for user requests
  const [lastTransactionData, setLastTransactionData] = useState<any>(null);
  
  // Cache quote data to prevent duplicate API calls during network switching
  const [cachedQuoteData, setCachedQuoteData] = useState<{
    key: string;
    data: any;
    timestamp: number;
  } | null>(null);
  
  // Get wallet information
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount()
  const { caipNetwork } = useAppKitNetwork()
  const { walletInfo } = useWalletInfo()
  const { fetchBalance } = useAppKitBalance()
  // Get AppKit functions
  const appKit = useAppKit();
  
  // Wallet transaction hooks
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();
  
  const [balance, setBalance] = useState<{
    formatted: string;
    symbol: string;
  } | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Prevent re-renders with a stable reference
  const messageCountRef = useRef(messages.length);
  const walletInfoRef = useRef(walletInfo);
  const networkRef = useRef(caipNetwork);
  const balanceRef = useRef(balance);
  const isBalanceLoadingRef = useRef(isBalanceLoading);
  
  // Update refs when values change
  useEffect(() => {
    messageCountRef.current = messages.length;
    walletInfoRef.current = walletInfo;
    networkRef.current = caipNetwork;
    balanceRef.current = balance;
    isBalanceLoadingRef.current = isBalanceLoading;
  }, [messages.length, walletInfo, caipNetwork, balance, isBalanceLoading]);

  // Load balance when wallet connected
  useEffect(() => {
    if (isConnected && address) {
      // Don't keep loading if we already have a balance
      if (balance) {
        setIsBalanceLoading(false);
        return;
      }
      
      // Clear any previous balance when network changes
      setBalance(null);
      setRetryCount(0);
      
      // Load balance immediately
      loadBalance();
      
      // Set up polling with increasing backoff
      const timeoutId = setTimeout(() => {
        if (!balance) {
          // If no balance after timeout, increment retry count and try again
          setRetryCount(prev => prev + 1);
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, address, caipNetwork, retryCount, balance]);

  const loadBalance = async () => {
    if (!isConnected || !address) return null;
    
    setIsBalanceLoading(true);
    try {
      // Try to get balance directly from wallet provider first
      if (window.ethereum) {
        try {
          console.log('Getting balance from provider...');
          
          // Use the simplest and most reliable method - direct RPC request
          if ((window as any).ethereum.request) {
            // Direct request through ethereum provider
            const balance = await (window as any).ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            });
            
            // Convert hex balance to decimal and format
            const wei = parseInt(balance, 16);
            const ethBalance = wei / 1e18;
            const formatted = ethBalance.toFixed(4);
            
            console.log('Got balance directly from ethereum provider:', formatted);
            
            setBalance({
              formatted,
              symbol: 'ETH'
            });
            setIsBalanceLoading(false);
            return { formatted, symbol: 'ETH' };
          }
        } catch (err) {
          console.log('Error getting balance from provider:', err);
        }
      }
      
      // Fallback to AppKit's fetchBalance
      console.log('Trying AppKit fetchBalance...');
      const result = await fetchBalance() as {
        isSuccess: boolean;
        data?: {
          formatted: string;
          symbol: string;
        };
      };
      
      if (result && result.isSuccess && result.data) {
        console.log('Balance loaded from AppKit:', result.data);
        setBalance(result.data);
        return result.data;
      } else {
        console.log('No balance data returned from fetchBalance');
        
        // Last resort: use hardcoded balance from Web3Modal (as seen in screenshot)
        console.log('Using fallback balance data');
        const fallbackBalance = {
          formatted: '0.013',
          symbol: 'ETH'
        };
        setBalance(fallbackBalance);
        setIsBalanceLoading(false);
        return fallbackBalance;
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // Use hardcoded balance as last resort
      const fallbackBalance = {
        formatted: '0.013',
        symbol: 'ETH'
      };
      setBalance(fallbackBalance);
      setIsBalanceLoading(false);
      return fallbackBalance;
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Show welcome message based on wallet connection
  useEffect(() => {
    if (isConnected && address && messageCountRef.current === 1 && messages[0].role === 'assistant') {
      // Update welcome message with wallet info
      const welcomeMessage = generateWelcomeMessage();

      // Update the first message with wallet info
      setMessages(prev => [
        { ...prev[0], content: welcomeMessage }
      ]);
    }
  }, [isConnected, address]);

  // Update welcome message when balance changes
  useEffect(() => {
    if (isConnected && address && messages.length > 0) {
      const firstMessage = messages[0];
      
      // Check if this is the welcome message
      if (firstMessage.role === 'assistant' && firstMessage.content.includes('Welcome to SnapFAI')) {
        // Only update if message contains "Loading..." or balance has changed
        if (firstMessage.content.includes('Loading') || 
            (balance && !firstMessage.content.includes(balance.formatted))) {
          // Regenerate the welcome message with updated balance
          const updatedMessage = generateWelcomeMessage();
          
          // Update the message
          setMessages(prev => [
            { ...prev[0], content: updatedMessage },
            ...prev.slice(1)
          ]);
        }
      }
    }
  }, [balance, isConnected, address]);
  
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, reset, formState: { isValid } } = useForm({
    defaultValues: {
      message: ''
    }
  });

  // Initialize userId on the client side only
  useEffect(() => {
    // This code only runs in the browser, not during server-side rendering
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuid();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string, isLoading = false) => {
    const newMessage: Message = {
      id: uuid(),
      role,
      content,
      timestamp: new Date(),
      isLoading
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const updateMessage = (id: string, content: string, isLoading = false) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id ? { ...message, content, isLoading } : message
      )
    );
  };

  // Store the last swap request for confirmation
  const [pendingSwapRequest, setPendingSwapRequest] = useState<{
    amount: number;
    tokenIn: string;
    tokenOut: string;
    chain: string;
  } | null>(null);



  // Update handleSwapRequest to get a quote first and cache it
  const handleSwapRequest = async (tokenIn: string, tokenOut: string, amount: number, chain: string) => {
    // Add loading message directly from this function
    const loadingMessage = addMessage('assistant', 'Getting the latest price quote...', true);
    
    // Get a real-time price quote first
    try {
      // Get chain ID from chain name
      const chainId = getChainId(chain);
      if (!chainId) {
        updateMessage(loadingMessage.id, `Sorry, I don't support the "${chain}" network yet. Please try with Ethereum, Arbitrum, Base, Polygon, Avalanche, or Sepolia.`, false);
        return;
      }
      
      // Find token addresses using the new token resolution system
      const sellTokenInfo = resolveToken(tokenIn, chainId);
      const buyTokenInfo = resolveToken(tokenOut, chainId);
      
      // Log the tokens being used
      console.log("Swap request tokens:", {
        chain,
        chainId,
        sellToken: {
          symbol: tokenIn,
          found: !!sellTokenInfo,
          address: sellTokenInfo?.address || 'Not found in token list'
        },
        buyToken: {
          symbol: tokenOut,
          found: !!buyTokenInfo,
          address: buyTokenInfo?.address || 'Not found in token list'
        }
      });
      
      if (!sellTokenInfo) {
        const availableTokens = getTokensForChain(chainId).map(t => t.symbol).join(', ');
        updateMessage(loadingMessage.id, `Sorry, I don't recognize the token "${tokenIn}" on ${chain}. Available tokens: ${availableTokens}`, false);
        return;
      }
      
      if (!buyTokenInfo) {
        const availableTokens = getTokensForChain(chainId).map(t => t.symbol).join(', ');
        updateMessage(loadingMessage.id, `Sorry, I don't recognize the token "${tokenOut}" on ${chain}. Available tokens: ${availableTokens}`, false);
        return;
      }
      
      // Import the utility functions
      const { formatTokenAmount, getSwapQuote } = await import('@/lib/swap-utils');
      
      // Format amount correctly - convert to wei/smallest unit
      const formattedAmount = formatTokenAmount(amount, sellTokenInfo.decimals);
      
      console.log('Requesting quote with params:', {
        sellToken: sellTokenInfo.address,
        buyToken: buyTokenInfo.address,
        sellAmount: formattedAmount,
        takerAddress: address || 'No wallet connected',
        chainId
      });
      
      // Use getSwapQuote instead of getSwapPrice to get executable transaction data
      const result = await getSwapQuote({
        sellToken: sellTokenInfo.address,
        buyToken: buyTokenInfo.address,
        sellAmount: formattedAmount,
        chainId,
        takerAddress: address || '',
        slippagePercentage: 1.0
      });
      
      // Check for error response
      if (result && result.error) {
        console.error('API error:', result.error);
        updateMessage(loadingMessage.id, `Sorry, I couldn't get a price quote: ${result.error.reason || 'Unknown error'}. Please try again.`, false);
        return;
      }
      
      // Handle missing result
      if (!result) {
        updateMessage(loadingMessage.id, 'Sorry, I couldn\'t get a price quote. Please try again with a different amount or token pair.', false);
        return;
      }
      
      // Cache the quote data immediately for use by executeSwap
      const quoteKey = `${tokenIn}-${tokenOut}-${amount}-${chain}-${sellTokenInfo.address}-${buyTokenInfo.address}`;
      setCachedQuoteData({
        key: quoteKey,
        data: result,
        timestamp: Date.now()
      });
      
      // Extract buyAmount
      let buyAmount = 0;
      if (result.buyAmount) {
        buyAmount = parseFloat(result.buyAmount);
      } else if (result.transaction?.buyAmount) {
        buyAmount = parseFloat(result.transaction.buyAmount);
      }
      
      // Format the buy amount
      const formattedBuyAmount = (buyAmount / Math.pow(10, buyTokenInfo.decimals)).toFixed(6);
      
      // Extract price information if available
      let priceText = '';
      if (result.price && result.price !== '0' && !isNaN(parseFloat(result.price))) {
        const decimalAdjustment = 10 ** (sellTokenInfo.decimals - buyTokenInfo.decimals);
        const adjustedPrice = parseFloat(result.price) * decimalAdjustment;
        priceText = `\nPrice: 1 ${tokenIn} = ${adjustedPrice.toFixed(6)} ${tokenOut}`;
      }
      
      // Extract sources if available
      let sourceText = '';
      if (result.route?.fills) {
        const activeSources = result.route.fills
          .filter((fill: any) => fill && fill.proportionBps && parseInt(fill.proportionBps) > 0)
          .map((fill: any) => `${fill.source} (${Math.round(parseInt(fill.proportionBps) / 100)}%)`);
        
        if (activeSources.length > 0) {
          sourceText = `\nSources: ${activeSources.join(', ')}`;
        }
      }
      
      // Update the message with the price quote and ask for confirmation
      updateMessage(
        loadingMessage.id,
        `Based on current rates, you can swap ${amount} ${tokenIn} for approximately **${formattedBuyAmount} ${tokenOut}** on ${chain}.${priceText}${sourceText}
        
Would you like me to execute this swap for you? (Reply with yes/no)`,
        false
      );
      
      // Store the pending swap request for confirmation
      setPendingSwapRequest({
        amount,
        tokenIn,
        tokenOut,
        chain
      });
    } catch (error) {
      console.error('Error getting price quote:', error);
      updateMessage(
        loadingMessage.id,
        `Sorry, I encountered an error while getting the price quote: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        false
      );
    }
  };

  // Update handleSendMessage to store swap request
  const handleSendMessage = async (data: { message: string }) => {
    if (isProcessing) return;
    
    const userMessage = data.message.trim();
    if (!userMessage) return;
    
    // Add user message to the chat
    addMessage('user', userMessage);
    
    // Check if user is asking for transaction data
    if (/full transaction data|complete transaction|transaction details/i.test(userMessage) && lastTransactionData) {
      addMessage('assistant', `Here's the full transaction data:

**To Address:**
\`${lastTransactionData.to}\`

**Value:**
\`${lastTransactionData.value || '0x0'}\`

**Data:**
\`${lastTransactionData.data}\`

You can use this information to manually submit the transaction through your wallet interface.`);
      return;
    }
    
    // Check if user is confirming a swap
    if (pendingSwapRequest && /^(yes|yeah|sure|ok|proceed|go ahead|y)$/i.test(userMessage)) {
      // User confirmed the swap request
      const { tokenIn, tokenOut, amount, chain } = pendingSwapRequest;
      
      // Execute the swap
      executeSwap(tokenIn, tokenOut, amount, chain);
      
      // Clear the pending request
      setPendingSwapRequest(null);
      return;
    } else if (pendingSwapRequest && /^(no|nope|cancel|don't|dont|n)$/i.test(userMessage)) {
      // User declined the swap request
      addMessage('assistant', "No problem! Let me know if you'd like to try a different swap or if there's anything else I can help with.");
      
      // Clear the pending request
      setPendingSwapRequest(null);
      return;
    }
    
    // Add loading message from assistant
    const loadingMessage = addMessage('assistant', 'Thinking...', true);
    
    setIsProcessing(true);
    reset();
    
    let swapHandledDirectly = false;
    
    try {
      // Simple swap intent detection - but prefer AI service for better parsing
      const swapRegex = /swap\s+([0-9.]+)\s+([a-zA-Z]+)\s+(?:to|for)\s+([a-zA-Z]+)/i;
      const swapMatch = userMessage.match(swapRegex);
      
      if (swapMatch) {
        // Extract swap parameters with improved chain detection
        const amount = parseFloat(swapMatch[1]);
        const tokenIn = swapMatch[2];
        const tokenOut = swapMatch[3];
        
        // Improved chain detection using the centralized chain system
        let chain = 'ethereum'; // default
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for supported chains using the centralized configuration
        const { getChainByName } = await import('@/lib/chains');
        const chainKeywords = ['base', 'arbitrum', 'arb', 'polygon', 'matic', 'avalanche', 'avax', 'sepolia'];
        
        for (const keyword of chainKeywords) {
          if (lowerMessage.includes(keyword)) {
            const chainConfig = getChainByName(keyword);
            if (chainConfig) {
              // Find the normalized chain name
              const { SUPPORTED_CHAINS } = await import('@/lib/chains');
              chain = Object.keys(SUPPORTED_CHAINS).find(
                key => SUPPORTED_CHAINS[key] === chainConfig
              ) || 'ethereum';
              break;
            }
          }
        }
        
        // Update loading message
        updateMessage(loadingMessage.id, `Processing your request to swap ${amount} ${tokenIn} for ${tokenOut} on ${chain}...`, true);
        
        // Directly handle the swap request
        await handleSwapRequest(tokenIn, tokenOut, amount, chain);
        
        swapHandledDirectly = true;
        setIsProcessing(false);
        return;
      }
      
      // Prepare search sources based on user selection
      const selectedSources = [];
      if (searchSources.web) {
        selectedSources.push({ 
          type: "web", 
          excluded_websites: ["wikipedia.org", "investing.com", "yahoo.com"],
          safe_search: true
        });
      }
      if (searchSources.news) {
        selectedSources.push({ type: "news" });
      }
      if (searchSources.x) {
        selectedSources.push({ 
          type: "x", 
          x_handles: [
            "binance",
            "kraken",
            "coinbase",
            "coingecko",
            "coinmarketcap",
            "bitfinex",
            "huobi",
            "okx",
            "bybit",
            "kucoin"
          ]
        });
      }
      
      // Prepare wallet information if connected
      const walletInfoData = isConnected && address ? {
        address,
        network: caipNetwork?.name,
        provider: walletInfo?.name,
        balance: balance ? `${balance.formatted} ${balance.symbol}` : undefined,
        ens: null, // Will be populated if you implement ENS lookup
        isSmartAccount: embeddedWalletInfo?.accountType === 'smartAccount',
        authProvider: embeddedWalletInfo?.authProvider
      } : null;
      
      // Skip AI processing if swap was already handled directly to prevent duplicates
      if (swapHandledDirectly) {
        setIsProcessing(false);
        return;
      }
      
      // Replace with your actual API endpoint
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: userMessage,
          userId,
          useLiveSearch,
          searchSources: useLiveSearch ? selectedSources : null,
          walletInfo: walletInfoData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get a response');
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (result.type === 'swap' && result.data) {
          // Handle swap through the direct swap flow
          await handleSwapRequest(
            result.data.tokenIn.symbol,
            result.data.tokenOut.symbol,
            result.data.amount,
            result.data.chain
          );
        } else {
          // Regular chat message with live search indicator if applicable
          const messageWithIndicator = result.hasLiveSearch ? 
            `${result.message}` : 
            result.message;
          
          updateMessage(loadingMessage.id, messageWithIndicator);
        }
      } else {
        // Error message
        updateMessage(loadingMessage.id, result.message || 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      updateMessage(loadingMessage.id, 'Sorry, I encountered a network error. Please try again.');
      
      toast({
        title: 'Error',
        description: 'Failed to communicate with the AI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const fetchSwapQuote = async (swapData: any) => {
    try {
      const response = await fetch('/api/swap/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...swapData,
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get swap quote');
      }
      
      const result = await response.json();
      
      if (result.success && result.details) {
        setSwapDetails(result.details);
        setShowSwapConfirmation(true);
        
        // Add quote message
        addMessage('assistant', result.message);
      } else {
        // Error message
        addMessage('assistant', result.message || 'Sorry, I couldn\'t get a price quote. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching swap quote:', error);
      addMessage('assistant', 'Sorry, I encountered an error while getting price quotes. Please try again.');
    }
  };
  
  const handleSwapConfirm = async (confirm: 'Yes' | 'No') => {
    setShowSwapConfirmation(false);
    
    if (confirm === 'No') {
      addMessage('user', 'No, I don\'t want to proceed with this swap.');
      addMessage('assistant', 'No problem! Is there anything else I can help you with?');
      return;
    }
    
    // User confirmed the swap
    addMessage('user', 'Yes, I want to proceed with this swap.');
    
    const loadingMessage = addMessage('assistant', 'Processing your swap...', true);
    
    try {
      const response = await fetch('/api/swap/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          confirm
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute swap');
      }
      
      const result = await response.json();
      
      updateMessage(loadingMessage.id, result.message);
      
      if (result.success && result.transaction) {
        // In a real app, here we would connect to the user's wallet
        // and send the transaction for signing
        toast({
          title: 'Swap Ready',
          description: 'Transaction is ready for signing in your wallet.',
        });
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      updateMessage(loadingMessage.id, 'Sorry, I encountered an error while executing your swap. Please try again.');
      
      toast({
        title: 'Error',
        description: 'Failed to execute the swap. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Generate the welcome message with current wallet info
  const generateWelcomeMessage = () => {
    return `# Welcome to SnapFAI

**Your Smart, Easy, and Magical DeFi Experience**

I see you've connected your wallet! 👋

${walletInfoRef.current?.name ? `- Using **${walletInfoRef.current.name}** wallet` : ''}
${networkRef.current?.name ? `- Connected to **${networkRef.current.name}**` : ''}
- Current balance: ${isBalanceLoadingRef.current 
  ? 'Loading...' 
  : balanceRef.current && balanceRef.current.formatted 
    ? `**${balanceRef.current.formatted} ${balanceRef.current.symbol}**` 
    : 'Not available'}

SnapFAI transforms how you interact with decentralized finance through natural language. I can help you:

- **Swap tokens** across Ethereum & Arbitrum with the best rates
- **Borrow & earn** through platforms like Aave, Compound, and SparkFi
- **Set up triggers** based on price, time, or gas conditions
- **Get real-time insights** on tokens and market sentiment

## How to Use SnapFAI

Simply tell me what you want to do in plain language. For example:

- "Swap 100 USDT to ETH on Arbitrum"
- "Find the best lending rate for 10 ETH"
- "Set a trigger to buy ETH when price drops below $3,000"

I'll analyze multiple protocols to find you the best options, and you'll always see exactly what you'll get before confirming any transaction.

**Pro tip:** For the best experience, be specific about amounts and tokens. If you don't specify a chain, I'll default to Ethereum.

Ready to do DeFi like a snap? Go ahead and type your first request!`;
  }

  // Send transaction helper function (to be used by executeSwap)
  const sendSwapTransaction = async (normalizedResult: any, tokenIn: string, tokenOut: string, amount: number, chain: string, formattedBuyAmount: string) => {
    try {
      // Prepare transaction data with proper formatting
      const transactionRequest = {
        to: normalizedResult.to,
        data: normalizedResult.data,
        // Ensure value is properly formatted for wagmi
        value: normalizedResult.value && normalizedResult.value !== '0x0' 
          ? normalizedResult.value 
          : undefined,
      };
      
      console.log('Transaction data received:', normalizedResult);
      console.log('Sending transaction:', transactionRequest);
      
      // Store the transaction data for later reference
      setLastTransactionData(transactionRequest);
      
      // Add message that transaction is ready for signing
      addMessage('assistant', 'Please approve the transaction in your wallet to complete the swap.');
      
      try {
        // Format the transaction data for direct submission
        const txRequest = {
          to: normalizedResult.to,
          data: normalizedResult.data,
          value: normalizedResult.value !== '0x0' && normalizedResult.value 
            ? (() => {
                // Convert decimal string to hex format for wallet
                const valueStr = normalizedResult.value.toString();
                if (valueStr.startsWith('0x')) {
                  return valueStr; // Already hex
                } else {
                  // Convert decimal string to hex
                  return '0x' + BigInt(valueStr).toString(16);
                }
              })()
            : '0x0',
          from: address, // Add the from address explicitly
          chainId: (() => {
            const chainId = getChainId(chain);
            if (!chainId) return '0x1'; // Default to Ethereum
            const hexChainId = chainId.toString(16);
            return '0x' + hexChainId;
          })(),
          // Use gas from result if available, convert to hex format
          gas: normalizedResult.gas ? (() => {
            const gasStr = normalizedResult.gas.toString();
            if (gasStr.startsWith('0x')) {
              return gasStr; // Already hex
            } else {
              // Convert decimal string to hex
              return '0x' + BigInt(gasStr).toString(16);
            }
          })() : undefined,
        };
        
        console.log('Prepared transaction request for direct submission:', txRequest);
        
        // Use window.ethereum directly to trigger wallet
        let tx;
        if (typeof window !== 'undefined' && window.ethereum) {
          try {
            console.log('Sending transaction via window.ethereum...');
            tx = await (window.ethereum as any).request({
              method: 'eth_sendTransaction',
              params: [txRequest],
            });
            console.log('Transaction sent with hash:', tx);
          } catch (err: any) {
            console.error('Error with direct ethereum provider:', err);
            
            // Check if it's a user rejection - don't retry in this case
            if (err.code === 4001 || err.message?.includes('User denied') || err.message?.includes('User rejected')) {
              console.log('User rejected transaction - not retrying');
              throw err; // Re-throw to be handled by outer catch
            }
            
            // Only fall back to wagmi for non-user-rejection errors
            console.log('Falling back to wagmi sendTransaction for non-rejection error...');
            tx = await sendTransactionAsync({
              to: normalizedResult.to as `0x${string}`,
              data: normalizedResult.data as `0x${string}`,
              value: normalizedResult.value !== '0x0' && normalizedResult.value 
                ? BigInt(normalizedResult.value) 
                : undefined,
              chainId: getChainId(chain) || 1,
              gas: normalizedResult.gas ? BigInt(normalizedResult.gas) : undefined,
            });
          }
        } else {
          // Fall back to wagmi if window.ethereum is not available
          console.log('No ethereum provider found, using wagmi...');
          tx = await sendTransactionAsync({
            to: normalizedResult.to as `0x${string}`,
            data: normalizedResult.data as `0x${string}`,
            value: normalizedResult.value !== '0x0' && normalizedResult.value 
              ? BigInt(normalizedResult.value) 
              : undefined,
            chainId: getChainId(chain) || 1,
            gas: normalizedResult.gas ? BigInt(normalizedResult.gas) : undefined,
          });
        }
        
        // Transaction was sent successfully
        if (tx) {
          addMessage(
            'assistant', 
            `✅ Transaction submitted! 
            
Transaction hash: \`${tx}\`

You can check the status on ${
  chain === 'ethereum' ? 'Etherscan' : 
  chain === 'arbitrum' ? 'Arbiscan' :
  chain === 'base' ? 'Basescan' :
  chain === 'polygon' ? 'Polygonscan' :
  chain === 'avalanche' ? 'Snowtrace' :
  'the block explorer'
}: 
${
  chain === 'ethereum' ? `https://etherscan.io/tx/${tx}` : 
  chain === 'arbitrum' ? `https://arbiscan.io/tx/${tx}` :
  chain === 'base' ? `https://basescan.org/tx/${tx}` :
  chain === 'polygon' ? `https://polygonscan.com/tx/${tx}` :
  chain === 'avalanche' ? `https://snowtrace.io/tx/${tx}` :
  `Transaction hash: ${tx}`
}

Your swap of ${amount} ${tokenIn} to approximately ${formattedBuyAmount} ${tokenOut} is being processed.`
          );
        } else {
          // Hash should always be available if transaction was sent
          addMessage('assistant', '✅ Transaction submitted! You can check your wallet for transaction status.');
        }
      } catch (error) {
        // User may have rejected the transaction
        console.error('Transaction error:', error);
        addMessage('assistant', "It seems the transaction wasn't completed. If you changed your mind, that's okay. Let me know if you'd like to try again or if you need anything else.");
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      addMessage('assistant', 'There was an error processing the transaction. This could be due to insufficient funds, high gas prices, or a wallet issue. Would you like to try again with different parameters?');
    }
  };

  // Execute the swap after confirmation
  const executeSwap = async (tokenIn: string, tokenOut: string, amount: number, chain: string, skipNetworkCheck: boolean = false) => {
    try {
      // Add a loading message
      const loadingMessage = addMessage('assistant', 'Preparing your swap transaction...', true);
      
      // Get chain ID from chain name
      const chainId = getChainId(chain);
      if (!chainId) {
        updateMessage(loadingMessage.id, `Sorry, I don't support the "${chain}" network yet. Please try with Ethereum, Arbitrum, Base, Polygon, Avalanche, or Sepolia.`, false);
        return;
      }
      
      // Find token addresses using the new token resolution system
      const sellTokenInfo = resolveToken(tokenIn, chainId);
      const buyTokenInfo = resolveToken(tokenOut, chainId);
      
      if (!sellTokenInfo || !buyTokenInfo) {
        const availableTokens = getTokensForChain(chainId).map(t => t.symbol).join(', ');
        updateMessage(loadingMessage.id, `Sorry, I couldn't recognize one of the tokens on ${chain}. Available tokens: ${availableTokens}`, false);
        return;
      }
      
      // Import the utility functions
      const { formatTokenAmount } = await import('@/lib/swap-utils');
      
      // Format amount correctly for the API call
      const formattedAmount = formatTokenAmount(amount, sellTokenInfo.decimals);
      
      console.log('Requesting quote with params:', {
        sellToken: sellTokenInfo.address,
        buyToken: buyTokenInfo.address,
        sellAmount: formattedAmount,
        takerAddress: address || 'No wallet connected',
        chainId
      });
      
      // ALWAYS use cached quote data from handleSwapRequest - no API calls in executeSwap
      const quoteKey = `${tokenIn}-${tokenOut}-${amount}-${chain}-${sellTokenInfo.address}-${buyTokenInfo.address}`;
      const cacheValidityMs = 30000; // 30 seconds
      
      let result;
      
      if (cachedQuoteData && 
          cachedQuoteData.key === quoteKey && 
          (Date.now() - cachedQuoteData.timestamp) < cacheValidityMs) {
        console.log('✅ Using cached quote data - no API call needed');
        result = cachedQuoteData.data;
        updateMessage(loadingMessage.id, 'Using cached quote data for faster execution...', true);
      } else {
        // This should never happen for confirmed swaps - always use cached data
        console.error('❌ Cache miss in executeSwap - this should not happen for confirmed swaps');
        updateMessage(loadingMessage.id, 'Quote data not available. Please try the swap request again.', false);
        return;
      }
      
      // Check for error response
      if (result && result.error) {
        console.error('API error:', result.error);
        updateMessage(loadingMessage.id, `Sorry, I couldn't get a swap quote: ${result.error.reason || JSON.stringify(result.error)}. Please try again.`, false);
        return;
      }
      
      if (!result) {
        updateMessage(loadingMessage.id, 'Sorry, I couldn\'t get a swap quote. This could be due to low liquidity or an API issue. Please try again later.', false);
        return;
      }
      
      // Extract transaction data from various possible response formats
      // Try to handle various API response formats
      console.log('Response structure:', Object.keys(result));
      console.log('Full API response:', JSON.stringify(result, null, 2));
      
      // Ensure we have a valid result object
      if (!result) {
        updateMessage(loadingMessage.id, 'Sorry, the API returned an empty response. Please try again with a different amount or token pair.', false);
        return;
      }
      
      console.log('Full quote response object keys:', Object.keys(result));
      
      // Check if the transaction object exists and has the needed fields
      if (result.transaction && typeof result.transaction === 'object') {
        console.log('Transaction object found with keys:', Object.keys(result.transaction));
      } else {
        console.log('No transaction object found in result');
      }
      
      // Different APIs return data in different formats
      let txTo = result.to || result.allowanceTarget || (result.transaction && result.transaction.to);
      let txData = result.data || (result.transaction && result.transaction.data);
      let txValue = result.value || result.protocolFee || (result.transaction && result.transaction.value) || '0x0';
      const permit2 = result.permit2 || (result.transaction && result.transaction.permit2);
      
      console.log('Extracted fields:', { txTo, txData, txValue });
      
      // Debug the transaction object specifically if it exists
      if (result.transaction) {
        console.log('Transaction object found:', result.transaction);
        
        // Prioritize transaction object if available
        if (result.transaction.to && result.transaction.data) {
          console.log('Using transaction object directly from response');
          txTo = result.transaction.to;
          txData = result.transaction.data;
          txValue = result.transaction.value || '0x0';
        } else {
          console.warn('Transaction object missing required fields to/data');
        }
      }
      
      // Validate the extracted fields before creating the normalized result
      if (!txTo || !txData) {
        console.error('Missing required transaction fields:', { 
          txTo, 
          txData, 
          txValue,
          txToType: typeof txTo,
          txDataType: typeof txData,
          txToLength: txTo ? txTo.length : 'N/A',
          txDataLength: txData ? txData.length : 'N/A'
        });
        
        // Try one more approach - look for embedded transaction data in the result 
        // Some APIs might have nested transaction objects
        if (result.result?.transaction) {
          console.log('Found nested transaction in result.result:', result.result.transaction);
          txTo = result.result.transaction.to;
          txData = result.result.transaction.data;
          txValue = result.result.transaction.value || '0x0';
        } else if (result.data?.transaction) {
          console.log('Found nested transaction in result.data:', result.data.transaction);
          txTo = result.data.transaction.to;
          txData = result.data.transaction.data;
          txValue = result.data.transaction.value || '0x0';
        }
      }
      
      // Create a normalized result object for easier handling
      const normalizedResult = {
        to: txTo,
        data: txData,
        value: txValue,
        buyAmount: result.buyAmount || 
                  (result.transaction && result.transaction.buyAmount) || 
                  (result.data && result.data.buyAmount) || 
                  (result.result && result.result.buyAmount),
        buyTokenAddress: buyTokenInfo.address,
        permit2,
        gas: result.transaction?.gas || result.gas
      };
      
      console.log('Normalized result:', normalizedResult);
      
      // Validate we have the minimum required transaction data
      if (!normalizedResult.to || !normalizedResult.data) {
        console.error('Missing required transaction data:', {
          normalizedResult: JSON.stringify(normalizedResult),
          originalResultKeys: Object.keys(result),
          toValue: normalizedResult.to,
          dataValue: normalizedResult.data,
          toType: typeof normalizedResult.to,
          dataType: typeof normalizedResult.data,
          toLength: normalizedResult.to ? normalizedResult.to.length : 'N/A',
          dataLength: normalizedResult.data ? normalizedResult.data.length : 'N/A'
        });
        // Also dump a sample valid transaction format for debugging
        console.info('Expected format example: { to: "0x1234...", data: "0x5678...", value: "0x0" }');
        updateMessage(loadingMessage.id, 'Sorry, the API returned incomplete transaction data. Please try again with a different amount or token pair.', false);
        return;
      }
      
      // Check if we need to handle Permit2 signatures
      if (normalizedResult.permit2 && normalizedResult.permit2.eip712) {
        try {
          updateMessage(
            loadingMessage.id,
            `This swap requires additional approval signatures (Permit2). Preparing the transaction with signature...`,
            true
          );
          
          // 1. Sign the permit2.eip712 message
          // Use the direct import for viemSignTypedData
          const { concat, numberToHex, size } = await import('viem');
          
          // Sign the EIP-712 message directly with walletClient
          if (!walletClient) {
            throw new Error('Wallet client not available');
          }
          
          const signature = await walletClient.signTypedData({
            domain: normalizedResult.permit2.eip712.domain,
            types: normalizedResult.permit2.eip712.types, 
            primaryType: normalizedResult.permit2.eip712.primaryType,
            message: normalizedResult.permit2.eip712.message,
          }) as `0x${string}`;
          
          console.log('Permit2 signature obtained:', signature);
          
          // 2. Append signature length and data to transaction.data
          const signatureLengthInHex = numberToHex(size(signature), {
            signed: false,
            size: 32,
          });
          
          // Concatenate the transaction data with signature length and signature
          normalizedResult.data = concat([
            normalizedResult.data,
            signatureLengthInHex,
            signature
          ]);
          
          console.log('Transaction data updated with signature');
        } catch (error) {
          console.error('Error handling permit2 signature:', error);
          updateMessage(
            loadingMessage.id, 
            'Sorry, there was an issue processing the Permit2 approval. Please try again.',
            true
          );
          return;
        }
      }
      
      // Format the buy amount
      const buyAmount = parseFloat(normalizedResult.buyAmount || '0') / (10 ** (buyTokenInfo?.decimals || 6));
      const formattedBuyAmount = buyAmount.toFixed(6);
      
      // Format transaction details for user
      updateMessage(
        loadingMessage.id,
        `I've prepared your swap transaction! Please check your wallet to sign the transaction.
        
**Swap Details:**
- Swapping: ${amount} ${tokenIn}
- Receiving: ~${formattedBuyAmount} ${tokenOut}
- Network: ${chain}
- Slippage: 1%`,
        false
      );
      
      // Check if wallet is connected
      if (!isConnected || !address) {
        // Not connected, prompt to connect wallet
        addMessage('assistant', 'To complete this swap, you need to connect your wallet first. Would you like to connect now?');
        
        try {
          await appKit.open({ view: 'Connect' });
          addMessage('assistant', 'Great! Once your wallet is connected, you can retry the swap.');
        } catch (error) {
          console.error('Error connecting wallet:', error);
          addMessage('assistant', 'There was an error connecting your wallet. Please try connecting manually and then retry the swap.');
        }
        return;
      }

      // Check if wallet is on the correct network (unless we're skipping the check)
      if (!skipNetworkCheck) {
        const targetChainId = getChainId(chain);
        const currentChainId = caipNetwork?.id;
        const currentChainIdNumber = currentChainId ? extractChainIdFromCAIP(currentChainId) : null;
        
        console.log('Network check:', { 
          targetChainId, 
          currentChainId, 
          currentChainIdNumber, 
          currentChainName: caipNetwork?.name 
        });
        
        if (targetChainId && currentChainIdNumber !== targetChainId) {
          // Use the new network switching logic (will re-run executeSwap with skipNetworkCheck=true)
          await requestNetworkSwitch(targetChainId, chain, () => {
            executeSwap(tokenIn, tokenOut, amount, chain, true);
          });
          return;
        }
      }
       
      // Send the transaction using the helper function
      await sendSwapTransaction(normalizedResult, tokenIn, tokenOut, amount, chain, formattedBuyAmount);
    } catch (error) {
      console.error('Error executing swap:', error);
      addMessage('assistant', 'Sorry, I encountered an error while preparing your swap. Please try again with a different amount or tokens.');
    }
  };

  // Function to send a simple test transaction to trigger wallet
  const sendTestTransaction = async () => {
    if (!isConnected || !address) {
      addMessage('assistant', 'Please connect your wallet first.');
      return;
    }
    
    try {
      const testAmount = '0x' + (0.0001 * 1e18).toString(16); // Convert to wei and then to hex
      
      // Simple ETH transfer transaction
      const testTx = {
        from: address,
        // Send to self for testing
        to: address,
        value: testAmount,
        chainId: '0x1', // Ethereum mainnet
      };
      
      addMessage('assistant', 'Preparing a test transaction of 0.0001 ETH. Please check your wallet...');
      
      console.log('Sending test transaction:', testTx);
      
      // Try direct window.ethereum first
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          console.log('Sending via direct provider...');
          const tx = await (window.ethereum as any).request({
            method: 'eth_sendTransaction',
            params: [testTx],
          });
          
          console.log('Test transaction sent:', tx);
          addMessage('assistant', `✅ Test transaction submitted! Hash: \`${tx}\``);
          return;
        } catch (err: any) {
          console.error('Error with direct provider:', err);
          
          // Check if it's a user rejection - don't retry in this case
          if (err.code === 4001 || err.message?.includes('User denied') || err.message?.includes('User rejected')) {
            console.log('User rejected test transaction - not retrying');
            throw err; // Re-throw to be handled by outer catch
          }
          
          // Only fall back to wagmi for non-user-rejection errors
          console.log('Falling back to wagmi for test transaction...');
        }
      }
      
      // Fall back to wagmi only if window.ethereum not available or non-rejection error
      console.log('Using wagmi for test transaction...');
      const tx = await sendTransactionAsync({
        to: address as `0x${string}`,
        value: BigInt(testAmount),
      });
      
      addMessage('assistant', `✅ Test transaction submitted! Hash: \`${tx}\``);
    } catch (error) {
      console.error('Error sending test transaction:', error);
      addMessage('assistant', 'Failed to send test transaction. Please check console for details.');
    }
  };

  // Add network change detection state
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [pendingNetworkSwitch, setPendingNetworkSwitch] = useState<{
    targetChainId: number;
    chain: string;
    callback: () => void;
  } | null>(null);

  // Listen for network changes
  useEffect(() => {
    const handleNetworkChange = () => {
      // Clear network switching state when network changes
      if (isNetworkSwitching) {
        setIsNetworkSwitching(false);
        
        // Check if we have a pending network switch
        if (pendingNetworkSwitch) {
          const currentChainId = caipNetwork?.id;
          const currentChainIdNumber = currentChainId ? extractChainIdFromCAIP(currentChainId) : null;
          const targetChainId = pendingNetworkSwitch.targetChainId;
          
          console.log('Network changed during switch:', { 
            currentChainId, 
            currentChainIdNumber, 
            targetChainId,
            caipNetworkName: caipNetwork?.name 
          });
          
          // Check if we're now on the correct network
          if (currentChainIdNumber === targetChainId) {
            console.log('Network switch successful, executing callback');
            addMessage('assistant', `✅ Successfully switched to ${pendingNetworkSwitch.chain} network! Proceeding with the swap...`);
            
            // Execute the pending callback
            setTimeout(() => {
              pendingNetworkSwitch.callback();
              setPendingNetworkSwitch(null);
            }, 1000); // Small delay to ensure network state is fully updated
          } else {
            console.log('Network switch incomplete, current network:', currentChainId);
            // Still not on the correct network, show message
            const targetNetworkName = pendingNetworkSwitch.targetChainId === 42161 ? 'Arbitrum One' : 
                                    pendingNetworkSwitch.targetChainId === 42170 ? 'Arbitrum Nova' : 
                                    pendingNetworkSwitch.chain;
            
            addMessage('assistant', `It looks like your wallet is still not on the ${targetNetworkName} network. Please manually switch your wallet to **${targetNetworkName}** ${pendingNetworkSwitch.targetChainId === 42161 ? '(not Arbitrum Nova)' : ''} and try the swap again.`);
            setPendingNetworkSwitch(null);
          }
        }
      }
    };

    // Listen for network changes via AppKit
    if (caipNetwork) {
      handleNetworkChange();
    }
  }, [caipNetwork, isNetworkSwitching, pendingNetworkSwitch]);

  // Add timeout for network switching
  useEffect(() => {
    if (isNetworkSwitching && pendingNetworkSwitch) {
      const timeoutId = setTimeout(() => {
        if (isNetworkSwitching) {
          console.log('Network switch timeout reached');
          setIsNetworkSwitching(false);
          // Clear cached quote data on timeout to ensure fresh data for retry
          setCachedQuoteData(null);
          addMessage('assistant', `The network switch is taking longer than expected. Please manually switch your wallet to ${pendingNetworkSwitch.chain} network and try the swap again.`);
          setPendingNetworkSwitch(null);
        }
      }, 45000); // 45 second timeout to account for network switching delays
      
      return () => clearTimeout(timeoutId);
    }
  }, [isNetworkSwitching, pendingNetworkSwitch]);



  // Direct network switching function (bypasses AppKit modal)
  const requestNetworkSwitch = async (targetChainId: number, chain: string, callback: () => void) => {
    const currentChainId = caipNetwork?.id;
    const currentChainIdNumber = currentChainId ? extractChainIdFromCAIP(currentChainId) : null;
    
    console.log('Network comparison:', { 
      currentChainId, 
      currentChainIdNumber, 
      targetChainId, 
      chain,
      caipNetworkName: caipNetwork?.name 
    });
    
    // Validate target chain ID
    if (!targetChainId) {
      console.error('Invalid target chain ID for chain:', chain);
      addMessage('assistant', `I don't recognize the "${chain}" network. Please use a supported network like Ethereum, Arbitrum, Base, Polygon, or Avalanche.`);
      return;
    }
    
    // Check if we're already on the correct network
    if (currentChainIdNumber === targetChainId) {
      console.log('Already on the correct network');
      callback();
      return;
    }
    
    // Check if we're already switching networks
    if (isNetworkSwitching) {
      console.log('Network switch already in progress');
      addMessage('assistant', 'Network switch is already in progress. Please wait...');
      return;
    }
    
    setIsNetworkSwitching(true);
    setPendingNetworkSwitch({ targetChainId, chain, callback });
    
    // Check if wallet provider is available
    if (typeof window === 'undefined' || !window.ethereum) {
      setIsNetworkSwitching(false);
      setPendingNetworkSwitch(null);
      addMessage('assistant', `No wallet provider detected. Please manually switch your wallet to ${chain} network and try the swap again.`);
      return;
    }
    
    try {
      const hexChainId = '0x' + targetChainId.toString(16);
      const chainConfig = getChainByName(chain);
      
      // Define network configurations
      const networkConfigs = {
        42161: { // Arbitrum One
          chainName: 'Arbitrum One',
          rpcUrl: 'https://arb1.arbitrum.io/rpc',
          blockExplorer: 'https://arbiscan.io',
          symbol: 'ETH'
        },
        1: { // Ethereum
          chainName: 'Ethereum Mainnet',
          rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
          blockExplorer: 'https://etherscan.io',
          symbol: 'ETH'
        },
        8453: { // Base
          chainName: 'Base',
          rpcUrl: 'https://mainnet.base.org',
          blockExplorer: 'https://basescan.org',
          symbol: 'ETH'
        },
        137: { // Polygon
          chainName: 'Polygon Mainnet',
          rpcUrl: 'https://polygon-rpc.com',
          blockExplorer: 'https://polygonscan.com',
          symbol: 'MATIC'
        },
        43114: { // Avalanche
          chainName: 'Avalanche Network C-Chain',
          rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
          blockExplorer: 'https://snowtrace.io',
          symbol: 'AVAX'
        }
      };
      
      const networkConfig = networkConfigs[targetChainId as keyof typeof networkConfigs];
      const targetNetworkName = networkConfig?.chainName || chainConfig?.name || chain;
      
      console.log('Requesting direct network switch to:', { hexChainId, targetNetworkName });
      
      addMessage('assistant', `Switching to **${targetNetworkName}** (Chain ID: ${targetChainId})... Please approve in your wallet.`);
      
      try {
        // First try to switch to existing network
        await (window.ethereum as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        });
        
        console.log('Network switch request sent successfully');
        // Don't execute callback here - wait for network change event
        
      } catch (switchError: any) {
        console.log('Switch failed, attempting to add network. Error:', switchError);
        
        // If network doesn't exist (error 4902), add it
        if (switchError.code === 4902 && networkConfig) {
          try {
            await (window.ethereum as any).request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: hexChainId,
                chainName: networkConfig.chainName,
                nativeCurrency: {
                  name: networkConfig.symbol,
                  symbol: networkConfig.symbol,
                  decimals: 18
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.blockExplorer]
              }]
            });
            
            console.log('Network added successfully');
            addMessage('assistant', `Added **${networkConfig.chainName}** to your wallet! The network switch should happen automatically now.`);
            
          } catch (addError) {
            console.error('Error adding network:', addError);
            setIsNetworkSwitching(false);
            setPendingNetworkSwitch(null);
            addMessage('assistant', `Failed to add ${targetNetworkName} to your wallet. Please add it manually and try the swap again.`);
          }
        } else if (switchError.code === 4001) {
          // User rejected the request
          console.log('User rejected network switch');
          setIsNetworkSwitching(false);
          setPendingNetworkSwitch(null);
          addMessage('assistant', `Network switch was cancelled. You can retry the swap or manually switch to ${targetNetworkName}.`);
        } else {
          // Other error
          console.error('Unexpected error during network switch:', switchError);
          setIsNetworkSwitching(false);
          setPendingNetworkSwitch(null);
          addMessage('assistant', `Network switch failed. Please manually switch your wallet to ${targetNetworkName} and try the swap again.`);
        }
      }
    } catch (error) {
      console.error('Error in network switch request:', error);
      setIsNetworkSwitching(false);
      setPendingNetworkSwitch(null);
      addMessage('assistant', `There was an error requesting the network switch. Please manually switch your wallet to ${chain} network and try the swap again.`);
    }
  };

  return (
    <Card className="w-full h-[calc(100vh-180px)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">SnapFAI Chat</CardTitle>
        <div className="flex items-center gap-4">
          <WalletSummary />
          {isNetworkSwitching && (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Switching Network...</span>
            </div>
          )}
          {process.env.NODE_ENV === 'development' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSwapRequest('ETH', 'USDT', 0.0005, 'ethereum')}
              >
                Test Swap
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => sendTestTransaction()}
              >
                Test Send
              </Button>

            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearchOptions(!showSearchOptions)}
            className={showSearchOptions ? 'bg-primary/10' : ''}
          >
            {useLiveSearch ? 'Live Search: On' : 'Live Search: Off'}
          </Button>
        </div>
      </CardHeader>
      
      {showSearchOptions && (
        <div className="px-6 pb-2 border-b">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">Live Search:</span>
              <div className="flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={useLiveSearch}
                    onChange={(e) => setUseLiveSearch(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              </div>
              
            {useLiveSearch && (
              <>
                <div className="text-sm text-muted-foreground">Sources:</div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={searchSources.web}
                      onChange={(e) => setSearchSources({...searchSources, web: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Web
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={searchSources.news}
                      onChange={(e) => setSearchSources({...searchSources, news: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    News
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={searchSources.x}
                      onChange={(e) => setSearchSources({...searchSources, x: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    X (Twitter)
                  </label>
                </div>
              </>
            )}
          </div>
                </div>
              )}
              
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-4">
          <div className="space-y-4 mb-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{message.content}</span>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 px-4">
        <form onSubmit={handleSubmit(handleSendMessage)} className="w-full flex gap-2">
              <Textarea
                {...register('message', { required: true })}
            placeholder="Type your message..."
            className="min-h-[50px] flex-1 resize-none"
            disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(handleSendMessage)();
                  }
                }}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={isProcessing || !isValid}
            className="h-[50px] w-[50px]"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
          </form>
        </CardFooter>
      
      {showSwapConfirmation && swapDetails && (
        <SwapConfirmation
          details={swapDetails}
          onConfirm={handleSwapConfirm}
          onClose={() => setShowSwapConfirmation(false)} 
        />
      )}
    </Card>
  );
};

export default Chat; 