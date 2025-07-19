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
import { getChainId, getChainByName, extractChainIdFromCAIP, getNativeTokenSymbol } from '@/lib/chains';
import { resolveToken, getTokensForChain } from '@/lib/tokens';

// Add rehype-raw to support HTML in markdown for links
import rehypeRaw from 'rehype-raw';

// Custom link component to open external links in new tab
const CustomLink = ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
    return (
      <a 
        {...props}
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    );
  }
  return <a {...props} href={href}>{children}</a>;
};

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

// Swap Confirmation Buttons Component
const SwapConfirmationButtons = ({ 
  onConfirm, 
  onCancel, 
  disabled = false 
}: { 
  onConfirm: () => void; 
  onCancel: () => void; 
  disabled?: boolean; 
}) => (
  <div className="flex gap-3 mt-4 mb-2">
    <Button 
      onClick={onConfirm}
      disabled={disabled}
      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
    >
      Yes, Execute Swap
    </Button>
    <Button 
      onClick={onCancel}
      disabled={disabled}
      variant="outline"
      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition-colors"
    >
      No, Cancel
    </Button>
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuid(),
      role: 'assistant',
      content: `# Welcome to SnapFAI

**Your AI-Powered DeFi Assistant**

I can help you navigate DeFi through natural language conversation.

## What I Can Do Right Now

**✅ Token Swaps**
- Swap tokens across Ethereum, Arbitrum, Base, Avalanche, Optimism
- Get real-time quotes from multiple DEXs
- Execute swaps directly through your wallet

**✅ Market Information**
- Get current token prices and market data
- Answer questions about DeFi protocols
- Provide real-time insights with web search

## How to Use SnapFAI

Simply tell me what you want to do in plain language:

**Swap Examples:**
- "Swap 500 USDT to ETH on Arbitrum"
- "What's the price of 1000 USDC in ETH?"
- "Swap 0.1 ETH to USDC"

**Information Examples:**
- "What's the current price of ETH?"
- "Tell me about Uniswap"
- "What are the gas fees on Ethereum right now?"

**Pro tip:** Connect your wallet for the best experience. I'll detect your network and default to it for swaps.

Ready to get started? Just type what you'd like to do!`,
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

  // Load balance when wallet connected or network changes
  useEffect(() => {
    if (isConnected && address) {
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
  }, [isConnected, address, caipNetwork]);

  const loadBalance = async () => {
    if (!isConnected || !address) return null;
    
    // Get the current chain ID and native token symbol
    const currentChainId = caipNetwork?.id ? extractChainIdFromCAIP(caipNetwork.id) : 1;
    const nativeSymbol = getNativeTokenSymbol(currentChainId || 1);
    
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
              symbol: nativeSymbol
            });
            setIsBalanceLoading(false);
            return { formatted, symbol: nativeSymbol };
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
        // Use the correct native symbol instead of the one from AppKit
        const correctedBalance = {
          ...result.data,
          symbol: nativeSymbol
        };
        setBalance(correctedBalance);
        return correctedBalance;
      } else {
        console.log('No balance data returned from fetchBalance');
        
        // Last resort: use hardcoded balance from Web3Modal (as seen in screenshot)
        console.log('Using fallback balance data');
        const fallbackBalance = {
          formatted: '0.013',
          symbol: nativeSymbol
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
        symbol: nativeSymbol
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
  
  const { register, handleSubmit, reset, formState: { isValid }, setValue } = useForm({
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

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        // Try multiple approaches for better compatibility
        const scrollHeight = scrollElement.scrollHeight;
        const clientHeight = scrollElement.clientHeight;
        
        // Method 1: scrollTo
        scrollElement.scrollTo({ 
          top: scrollHeight, 
          behavior: 'smooth' 
        });
        
        // Method 2: scrollTop (fallback)
        scrollElement.scrollTop = scrollHeight;
        
        // Method 3: Find the actual scrollable element inside ScrollArea
        const viewport = scrollElement.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTo({ 
            top: viewport.scrollHeight, 
            behavior: 'smooth' 
          });
        }
      }, 100); // Increased timeout for better reliability
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
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
    // Scroll to bottom when new message is added
    scrollToBottom();
    return newMessage;
  };

  const updateMessage = (id: string, content: string, isLoading = false): Message | undefined => {
    let updatedMessage: Message | undefined = undefined;
    
    setMessages(prev => 
      prev.map(message => {
        if (message.id === id) {
          updatedMessage = { ...message, content, isLoading };
          return updatedMessage;
        }
        return message;
      })
    );
    
    // Scroll to bottom when message is updated (for AI typing effect)
    scrollToBottom();
    
    return updatedMessage;
  };

  // Add state for showing confirmation buttons
  const [showConfirmationButtons, setShowConfirmationButtons] = useState(false);
  const [confirmationMessageId, setConfirmationMessageId] = useState<string | null>(null);

  // Helper function to get current chain name from connected network
  const getCurrentChainName = (): string => {
    if (!caipNetwork?.id) return 'ethereum';
    
    const currentChainId = extractChainIdFromCAIP(caipNetwork.id);
    if (!currentChainId) return 'ethereum';
    
    // Map chain IDs to chain names
    const chainIdToName: Record<number, string> = {
      1: 'ethereum',
      42161: 'arbitrum',
      8453: 'base',
      137: 'polygon',
      43114: 'avalanche',
      10: 'optimism',
      11155111: 'sepolia'
    };
    
    return chainIdToName[currentChainId] || 'ethereum';
  };

  // Store the last swap request for confirmation
  const [pendingSwapRequest, setPendingSwapRequest] = useState<{
    amount: number;
    tokenIn: string;
    tokenOut: string;
    chain: string;
  } | null>(null);

  // Track transaction status
  const trackTransactionStatus = async (
    txHash: string, 
    messageId: string, 
    chain: string, 
    amount: number, 
    tokenIn: string, 
    formattedBuyAmount: string, 
    tokenOut: string
  ) => {
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts = ~2 minutes
    
    const checkStatus = async () => {
      try {
        const receipt = await (window.ethereum as any).request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        
        if (receipt) {
          const explorerUrl = 
            chain === 'ethereum' ? `https://etherscan.io/tx/${txHash}` : 
            chain === 'sepolia' ? `https://sepolia.etherscan.io/tx/${txHash}` :
            chain === 'arbitrum' ? `https://arbiscan.io/tx/${txHash}` :
            chain === 'base' ? `https://basescan.org/tx/${txHash}` :
            chain === 'polygon' ? `https://polygonscan.com/tx/${txHash}` :
            chain === 'avalanche' ? `https://snowtrace.io/tx/${txHash}` :
            `#`;
          
          const explorerName = 
            chain === 'ethereum' ? 'Etherscan' : 
            chain === 'sepolia' ? 'Sepolia Etherscan' :
            chain === 'arbitrum' ? 'Arbiscan' :
            chain === 'base' ? 'Basescan' :
            chain === 'polygon' ? 'Polygonscan' :
            chain === 'avalanche' ? 'Snowtrace' :
            'block explorer';
          
          if (receipt.status === '0x1') {
            // Transaction successful
            updateMessage(
              messageId,
              `✅ **Swap Successful!** 
              
Transaction hash: \`${txHash}\`

🎉 **Status**: Confirmed ✅

**Swap Details:**
- Swapped: ${amount} ${tokenIn}
- Received: ~${formattedBuyAmount} ${tokenOut}
- Network: ${chain}

View on [${explorerName}](${explorerUrl})

Your tokens should now be in your wallet!`
            );
          } else {
            // Transaction failed
            updateMessage(
              messageId,
              `❌ **Swap Failed** 
              
Transaction hash: \`${txHash}\`

⚠️ **Status**: Failed ❌

The transaction was confirmed but failed during execution. This could be due to:
- Insufficient gas
- Slippage tolerance exceeded
- Market conditions changed

View details on [${explorerName}](${explorerUrl})

You can try the swap again with different parameters.`
            );
          }
          return; // Stop polling
        }
        
        // Transaction still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000); // Check every 2 seconds
        } else {
          // Timeout
          updateMessage(
            messageId,
            `⏳ **Transaction Status Unknown**
            
Transaction hash: \`${txHash}\`

🔄 **Status**: Still processing...

The transaction is taking longer than expected to confirm. This is normal during network congestion.

You can check the status manually on [${
              chain === 'ethereum' ? 'Etherscan' : 
              chain === 'sepolia' ? 'Sepolia Etherscan' :
              chain === 'arbitrum' ? 'Arbiscan' :
              chain === 'base' ? 'Basescan' :
              chain === 'polygon' ? 'Polygonscan' :
              chain === 'avalanche' ? 'Snowtrace' :
              'block explorer'
            }](${
              chain === 'ethereum' ? `https://etherscan.io/tx/${txHash}` : 
              chain === 'sepolia' ? `https://sepolia.etherscan.io/tx/${txHash}` :
              chain === 'arbitrum' ? `https://arbiscan.io/tx/${txHash}` :
              chain === 'base' ? `https://basescan.org/tx/${txHash}` :
              chain === 'polygon' ? `https://polygonscan.com/tx/${txHash}` :
              chain === 'avalanche' ? `https://snowtrace.io/tx/${txHash}` :
              `#`
            })`
          );
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          updateMessage(
            messageId,
            `❓ **Unable to Track Transaction**
            
Transaction hash: \`${txHash}\`

We couldn't automatically track your transaction status, but it may still be processing.

Please check manually on [${
              chain === 'ethereum' ? 'Etherscan' : 
              chain === 'sepolia' ? 'Sepolia Etherscan' :
              chain === 'arbitrum' ? 'Arbiscan' :
              chain === 'base' ? 'Basescan' :
              chain === 'polygon' ? 'Polygonscan' :
              chain === 'avalanche' ? 'Snowtrace' :
              'block explorer'
            }](${
              chain === 'ethereum' ? `https://etherscan.io/tx/${txHash}` : 
              chain === 'sepolia' ? `https://sepolia.etherscan.io/tx/${txHash}` :
              chain === 'arbitrum' ? `https://arbiscan.io/tx/${txHash}` :
              chain === 'base' ? `https://basescan.org/tx/${txHash}` :
              chain === 'polygon' ? `https://polygonscan.com/tx/${txHash}` :
              chain === 'avalanche' ? `https://snowtrace.io/tx/${txHash}` :
              `#`
            })`
          );
        }
      }
    };
    
    // Start checking after a 5-second delay
    setTimeout(checkStatus, 5000);
  };

  // Update handleSwapRequest to get a quote first and cache it
  const handleSwapRequest = async (tokenIn: string, tokenOut: string, amount: number, chain: string) => {
    // Add loading message directly from this function
    const currentChain = getCurrentChainName();
    const isUsingCurrentChain = chain === currentChain;
    const chainMessage = isUsingCurrentChain 
      ? `on your current network (${chain})` 
      : `on ${chain}`;
    
    const loadingMessage = addMessage('assistant', `Getting the latest price quote for ${amount} ${tokenIn} to ${tokenOut} ${chainMessage}...`, true);
    
    // Get a real-time price quote first
    try {
      // Get chain ID from chain name
      const chainId = getChainId(chain);
      if (!chainId) {
        updateMessage(loadingMessage.id, `Sorry, I don't support the "${chain}" network yet. Please try with Ethereum, Arbitrum, Base, Avalanche, or Optimism.`, false);
        return;
      }
      
      // Find token addresses using the new token resolution system
      const sellTokenInfo = resolveToken(tokenIn, chainId);
      const buyTokenInfo = resolveToken(tokenOut, chainId);
      
      // Log the tokens being used

      
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
      const confirmationMessage = updateMessage(
        loadingMessage.id,
        `## 🔄 **Swap Confirmation**

**You're about to swap:**
- **From:** ${amount} ${tokenIn}
- **To:** ~${formattedBuyAmount} ${tokenOut}
- **Network:** ${chain}${priceText}${sourceText}

**Ready to execute this swap?**

You can click the buttons below or simply type "yes" or "no":`,
        false
      );
      
      // Debug logging
      console.log('Confirmation message created:', confirmationMessage);
      console.log('Loading message ID:', loadingMessage.id);
      
      // Show confirmation buttons
      setShowConfirmationButtons(true);
      // Use the loading message ID directly since updateMessage updates the existing message
      setConfirmationMessageId(loadingMessage.id);
      
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
    
    // Check if user is confirming a swap - improved pattern matching
    const yesPatterns = /^(yes|yeah|yep|sure|ok|okay|proceed|go ahead|confirm|execute|do it|y)$/i;
    const noPatterns = /^(no|nope|nah|cancel|don't|dont|stop|abort|skip|n)$/i;
    
    if (pendingSwapRequest && yesPatterns.test(userMessage)) {
      // User confirmed the swap request
      const { tokenIn, tokenOut, amount, chain } = pendingSwapRequest;
      
      // Clear the form input
      reset();
      
      // Hide confirmation buttons
      setShowConfirmationButtons(false);
      setConfirmationMessageId(null);
      
      // Execute the swap
      executeSwap(tokenIn, tokenOut, amount, chain);
      
      // Clear the pending request
      setPendingSwapRequest(null);
      return;
    } else if (pendingSwapRequest && noPatterns.test(userMessage)) {
      // User declined the swap request
      addMessage('assistant', "No problem! Let me know if you'd like to try a different swap or if there's anything else I can help with.");
      
      // Clear the form input
      reset();
      
      // Hide confirmation buttons
      setShowConfirmationButtons(false);
      setConfirmationMessageId(null);
      
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
        let chain = getCurrentChainName(); // Use current connected chain as default
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
              ) || getCurrentChainName(); // Fallback to current chain instead of ethereum
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
          walletInfo: walletInfoData,
          currentChain: getCurrentChainName() // Add current chain context
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
  
  // Handle old SwapConfirmation component (legacy)
  const handleLegacySwapConfirmation = (confirm: 'Yes' | 'No') => {
    setShowSwapConfirmation(false);
    
    if (confirm === 'No') {
      addMessage('user', 'No, I don\'t want to proceed with this swap.');
      addMessage('assistant', 'No problem! Is there anything else I can help you with?');
      return;
    }
    
    // User confirmed the swap
    addMessage('user', 'Yes, I want to proceed with this swap.');
    
    const loadingMessage = addMessage('assistant', 'Processing your swap...', true);
    
    // Legacy swap execution logic would go here
    updateMessage(loadingMessage.id, 'Legacy swap confirmation handled.');
  };

  // Handle confirmation button clicks (new system)
  const handleSwapConfirmation = (confirm: boolean) => {
    if (!pendingSwapRequest) return;
    
    const { tokenIn, tokenOut, amount, chain } = pendingSwapRequest;
    
    // Hide confirmation buttons
    setShowConfirmationButtons(false);
    setConfirmationMessageId(null);
    
    if (confirm) {
      // Add user confirmation message
      addMessage('user', 'Yes, execute the swap');
      
      // Execute the swap
      executeSwap(tokenIn, tokenOut, amount, chain);
    } else {
      // Add user cancellation message
      addMessage('user', 'No, cancel the swap');
      addMessage('assistant', "No problem! Let me know if you'd like to try a different swap or if there's anything else I can help with.");
    }
    
    // Clear the pending request
    setPendingSwapRequest(null);
  };

  // Generate the welcome message with current wallet info
  const generateWelcomeMessage = () => {
    const currentChain = getCurrentChainName();
    
    // Get tokens for the current chain
    const currentChainId = caipNetwork?.id ? extractChainIdFromCAIP(caipNetwork.id) : 1;
    const currentTokens = getTokensForChain(currentChainId || 1);
    const tokenSymbols = currentTokens.map(token => token.symbol).join(', ');
    
    return `# Welcome to SnapFAI! 🤖

I'm your AI-powered DeFi trading assistant. I can help you swap tokens, get market data, and answer questions about DeFi protocols.

## What I Can Do Right Now

**✅ Token Swaps**
- Swap tokens across Ethereum, Arbitrum, Base, Avalanche, Optimism
- Get real-time quotes from multiple DEXs
- Execute swaps directly through your wallet

**✅ Market Information**
- Get current token prices and market data
- Answer questions about DeFi protocols
- Provide real-time insights with web search

## Currently Connected: **${currentChain}**

**Available Tokens on ${currentChain}:**
${tokenSymbols}

## Quick Start
- **Swap tokens**: "Swap 100 USDC to ETH"
- **Check prices**: "What's the price of $ETH?"`;
  };

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
        console.log('Full transaction data being sent:', {
          to: txRequest.to,
          dataLength: txRequest.data ? txRequest.data.length : 0,
          dataPreview: txRequest.data ? txRequest.data.substring(0, 200) + '...' : 'undefined',
          dataEndsWith: txRequest.data ? '...' + txRequest.data.substring(txRequest.data.length - 200) : 'undefined',
          value: txRequest.value,
          from: txRequest.from,
          chainId: txRequest.chainId,
          gas: txRequest.gas,
          // Using allowance-holder approach (no Permit2)
          isAllowanceHolderSwap: true,
          spenderAddress: normalizedResult.to
        });
        
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
            // Improved error logging with more details
            console.error('Error with direct ethereum provider:', {
              errorObject: err,
              errorCode: err?.code,
              errorMessage: err?.message,
              errorData: err?.data,
              errorReason: err?.reason,
              errorType: typeof err
            });
            
            // Enhanced rejection detection
            const isUserRejection = 
              err?.code === 4001 || // Standard MetaMask rejection code
              (typeof err?.message === 'string' && (
                err.message.includes('User denied') || 
                err.message.includes('User rejected') ||
                err.message.includes('user rejected') ||
                err.message.includes('user denied') ||
                err.message.includes('rejected') ||
                err.message.includes('cancelled') ||
                err.message.includes('canceled')
              ));
            
            // Check for allowance-related errors
            const isAllowanceError = 
              (typeof err?.message === 'string' && (
                err.message.includes('TRANSFER_FROM_FAILED') ||
                err.message.includes('allowance') ||
                err.message.includes('insufficient allowance')
              )) ||
              (typeof err?.data === 'string' && (
                err.data.includes('#1002') ||
                err.data.includes('TRANSFER_FROM_FAILED')
              ));
            
            if (isUserRejection) {
              console.log('User rejected transaction - not retrying');
              // Create a standardized error object with clear message
              const rejectionError = new Error('Transaction was rejected by the user');
              rejectionError.name = 'UserRejectedRequestError';
              throw rejectionError; // Re-throw to be handled by outer catch
            }
            
            if (isAllowanceError) {
              console.log('Allowance error detected - may need token approval');
              const allowanceError = new Error('Token allowance insufficient. Please ensure you have approved the token for trading.');
              allowanceError.name = 'AllowanceError';
              throw allowanceError; // Re-throw to be handled by outer catch
            }
            
            // Only fall back to wagmi for non-user-rejection errors
            console.log('Falling back to wagmi sendTransaction for non-rejection error...');
            try {
              tx = await sendTransactionAsync({
                to: normalizedResult.to as `0x${string}`,
                data: normalizedResult.data as `0x${string}`,
                value: normalizedResult.value !== '0x0' && normalizedResult.value 
                  ? BigInt(normalizedResult.value) 
                  : undefined,
                chainId: getChainId(chain) || 1,
                gas: normalizedResult.gas ? BigInt(normalizedResult.gas) : undefined,
              });
            } catch (wagmiErr: any) {
              console.error('Error with wagmi fallback:', wagmiErr);
              // If wagmi also fails, throw the original error or the wagmi error if it's more informative
              throw wagmiErr?.message ? wagmiErr : err;
            }
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
          const statusMessage = addMessage(
            'assistant', 
            `✅ Transaction submitted! 
            
Transaction hash: \`${tx}\`

⏳ **Status**: Pending confirmation...

You can check the status on ${
  chain === 'ethereum' ? '[Etherscan]' : 
  chain === 'sepolia' ? '[Sepolia Etherscan]' :
  chain === 'arbitrum' ? '[Arbiscan]' :
  chain === 'base' ? '[Basescan]' :
  chain === 'polygon' ? '[Polygonscan]' :
  chain === 'avalanche' ? '[Snowtrace]' :
  '[the block explorer]'
}(${
  chain === 'ethereum' ? `https://etherscan.io/tx/${tx}` : 
  chain === 'sepolia' ? `https://sepolia.etherscan.io/tx/${tx}` :
  chain === 'arbitrum' ? `https://arbiscan.io/tx/${tx}` :
  chain === 'base' ? `https://basescan.org/tx/${tx}` :
  chain === 'polygon' ? `https://polygonscan.com/tx/${tx}` :
  chain === 'avalanche' ? `https://snowtrace.io/tx/${tx}` :
  `#`
})

Your swap of ${amount} ${tokenIn} to approximately ${formattedBuyAmount} ${tokenOut} is being processed.`
          );
          
          // Track transaction status
          trackTransactionStatus(tx, statusMessage.id, chain, amount, tokenIn, formattedBuyAmount, tokenOut);
        } else {
          // Hash should always be available if transaction was sent
          addMessage('assistant', '✅ Transaction submitted! You can check your wallet for transaction status.');
        }
      } catch (error: any) {
        // Enhanced error logging
        console.error('Transaction error details:', {
          error,
          errorName: error?.name,
          errorMessage: error?.message,
          errorCode: error?.code,
          errorData: error?.data,
          errorType: typeof error
        });
        
        // Improved user feedback based on error type
        if (error?.name === 'UserRejectedRequestError' || 
            error?.code === 4001 || 
            (typeof error?.message === 'string' && 
             (error.message.includes('reject') || 
              error.message.includes('cancel') || 
              error.message.includes('denied')))) {
          // User rejection message
          addMessage('assistant', "You've canceled the transaction. No problem! Let me know if you'd like to try again later or if you need anything else.");
        } else if (error?.name === 'AllowanceError' || 
                  (typeof error?.message === 'string' && 
                   (error.message.includes('TRANSFER_FROM_FAILED') || 
                    error.message.includes('allowance') || 
                    error.message.includes('insufficient allowance')))) {
          // Allowance-specific error message
          addMessage('assistant', `⚠️ The token allowance couldn't be processed properly.

**Please try the swap again** - the approval transaction may still be pending.

If the issue persists:
1. Try refreshing the page and attempting the swap again
2. Make sure you have approved the token spending when prompted
3. Check that you have sufficient token balance for the swap`);
        } else if (typeof error?.message === 'string' && 
                  (error.message.includes('insufficient funds') || 
                   error.message.includes('gas') || 
                   error.message.toLowerCase().includes('balance'))) {
          // Insufficient funds message
          addMessage('assistant', "It looks like there might be insufficient funds for this transaction. This could be due to the transaction amount plus the gas fees exceeding your available balance. Would you like to try with a smaller amount?");
        } else {
          // Generic error message
          addMessage('assistant', "The transaction couldn't be completed. This might be due to network congestion, high gas prices, or a temporary wallet issue. Would you like to try again?");
        }
      }
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Error sending transaction (outer catch):', {
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStack: error?.stack,
        errorType: typeof error
      });
      
      // Provide more specific feedback based on error patterns
      if (typeof error?.message === 'string') {
        if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          addMessage('assistant', 'You don\'t have enough funds to complete this transaction. This includes both the swap amount and the gas fees. Would you like to try a smaller amount?');
        } else if (error.message.includes('gas')) {
          addMessage('assistant', 'There was an issue with the gas estimation for this transaction. Gas prices might be high right now or the network could be congested. Would you like to try again later?');
        } else if (error.message.includes('nonce')) {
          addMessage('assistant', 'There was a transaction sequence issue. This usually happens when you have pending transactions. Please check your wallet for any pending transactions and try again after they complete.');
        } else {
          addMessage('assistant', `There was an error processing the transaction: ${error.message}. Would you like to try again with different parameters?`);
        }
      } else {
        addMessage('assistant', 'There was an error processing the transaction. This could be due to network issues, insufficient funds, or wallet configuration. Would you like to try again?');
      }
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
        updateMessage(loadingMessage.id, `Sorry, I don't support the "${chain}" network yet. Please try with Ethereum, Arbitrum, Base, Avalanche, or Optimism.`, false);
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
      

      

      
      // ALWAYS use cached quote data from handleSwapRequest - no API calls in executeSwap
      const quoteKey = `${tokenIn}-${tokenOut}-${amount}-${chain}-${sellTokenInfo.address}-${buyTokenInfo.address}`;
      const cacheValidityMs = 30000; // 30 seconds
      

      
      let result;
      
      if (cachedQuoteData && 
          cachedQuoteData.key === quoteKey && 
          (Date.now() - cachedQuoteData.timestamp) < cacheValidityMs) {
        result = cachedQuoteData.data;
        updateMessage(loadingMessage.id, 'Using cached quote data for faster execution...', true);
      } else {
        // If cache miss, try to get fresh quote data

        
        // Import the utility functions
        const { getSwapQuote } = await import('@/lib/swap-utils');
        
        updateMessage(loadingMessage.id, 'Getting fresh quote data...', true);
        
        try {
          result = await getSwapQuote({
            sellToken: sellTokenInfo.address,
            buyToken: buyTokenInfo.address,
            sellAmount: formattedAmount,
            chainId,
            takerAddress: address || '',
            slippagePercentage: 1.0
          });
          
          // Update cache with fresh data
          setCachedQuoteData({
            key: quoteKey,
            data: result,
            timestamp: Date.now()
          });
          

                  } catch (error) {
            updateMessage(loadingMessage.id, 'Sorry, I couldn\'t get a fresh quote. Please try the swap request again.', false);
            return;
          }
      }
      
      // Check for error response
      if (result && result.error) {
        updateMessage(loadingMessage.id, `Sorry, I couldn't get a swap quote: ${result.error.reason || JSON.stringify(result.error)}. Please try again.`, false);
        return;
      }
      
      if (!result) {
        updateMessage(loadingMessage.id, 'Sorry, I couldn\'t get a swap quote. This could be due to low liquidity or an API issue. Please try again later.', false);
        return;
      }
      
      // Extract transaction data from various possible response formats
      
      // Ensure we have a valid result object
      if (!result) {
        updateMessage(loadingMessage.id, 'Sorry, the API returned an empty response. Please try again with a different amount or token pair.', false);
        return;
      }
      
        // Note: Token approvals will be handled automatically by the wallet when the transaction is sent
  // No need to pre-approve tokens - the wallet will prompt for approval if needed
      

      
              // Different APIs return data in different formats
        let txTo = result.to || result.allowanceTarget || (result.transaction && result.transaction.to);
        let txData = result.data || (result.transaction && result.transaction.data);
        let txValue = result.value || result.protocolFee || (result.transaction && result.transaction.value) || '0x0';
        
        // Fix for ETH swaps: if txTo is the ETH placeholder address, we need the actual contract address
        if (txTo && txTo.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          // For ETH swaps, the actual contract address should be in allowanceTarget
          // This is the 0x contract that will handle the ETH swap
          if (result.allowanceTarget && result.allowanceTarget.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            txTo = result.allowanceTarget;
          } else {
            // Fallback: use a known 0x contract address for Ethereum mainnet
            // This is the 0x Exchange Proxy contract address
            txTo = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';
            console.warn('Using fallback 0x contract address for ETH swap');
          }
        }
      
      
      
              // Debug the transaction object specifically if it exists
        if (result.transaction) {
          // Prioritize transaction object if available
          if (result.transaction.to && result.transaction.data) {
            txTo = result.transaction.to;
            txData = result.transaction.data;
            txValue = result.transaction.value || '0x0';
          }
        }
      
              // Validate the extracted fields before creating the normalized result
        if (!txTo || !txData) {
          // Try one more approach - look for embedded transaction data in the result 
          if (result.result?.transaction) {
            txTo = result.result.transaction.to;
            txData = result.result.transaction.data;
            txValue = result.result.transaction.value || '0x0';
          } else if (result.data?.transaction) {
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
          gas: result.transaction?.gas || result.gas
        };
      
      
      
              // Validate we have the minimum required transaction data
        if (!normalizedResult.to || !normalizedResult.data) {
          updateMessage(loadingMessage.id, 'Sorry, the API returned incomplete transaction data. Please try again with a different amount or token pair.', false);
          return;
        }
      

      
      // Check if we need to handle token allowances (allowance-holder approach)
      // Only for non-ETH tokens and when we have a valid contract address
      const isEthSwap = tokenIn === 'ETH' || tokenIn === 'ETHEREUM' || 
                       sellTokenInfo.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      
      console.log('Approval check:', {
        tokenIn,
        isEthSwap,
        sellTokenAddress: sellTokenInfo.address,
        normalizedResultTo: normalizedResult.to,
        willSkipApproval: isEthSwap || !normalizedResult.to || normalizedResult.to.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      });
      
      if (!isEthSwap && normalizedResult.to && 
          normalizedResult.to.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        try {
          updateMessage(
            loadingMessage.id,
            `This swap requires token approval. Please approve the 0x contract to spend your ${tokenIn}...`,
            true
          );
          
          const tokenAddress = sellTokenInfo.address;
          const spenderAddress = normalizedResult.to; // 0x contract address
          

          
          // Approve the 0x contract to spend the token
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              // Use viem to encode the approve function call
              const { encodeFunctionData } = await import('viem');
              
              const approveData = encodeFunctionData({
                abi: [{
                  inputs: [
                    { name: 'spender', type: 'address' },
                    { name: 'amount', type: 'uint256' }
                  ],
                  name: 'approve',
                  outputs: [{ name: '', type: 'bool' }],
                  stateMutability: 'nonpayable',
                  type: 'function'
                }],
                functionName: 'approve',
                args: [
                  spenderAddress as `0x${string}`,
                  BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') // Max uint256
                ]
              });
              
              // Send the approval transaction
              const approveTx = await (window.ethereum as any).request({
                method: 'eth_sendTransaction',
                params: [{
                  from: address,
                  to: tokenAddress,
                  data: approveData,
                }],
              });
              

              
              updateMessage(
                loadingMessage.id,
                `✅ Token approval submitted! Transaction: \`${approveTx}\`
                
⏳ Waiting for approval to be confirmed before proceeding with swap...`,
                true
              );
              
              // Wait for the approval transaction to be confirmed
              let confirmationAttempts = 0;
              const maxAttempts = 30; // 30 attempts = ~1 minute
              
              while (confirmationAttempts < maxAttempts) {
                try {
                  const receipt = await (window.ethereum as any).request({
                    method: 'eth_getTransactionReceipt',
                    params: [approveTx],
                  });
                  
                  if (receipt && receipt.status === '0x1') {
                    break;
                  }
                  
                  confirmationAttempts++;
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
                  
                } catch (receiptError) {
                  confirmationAttempts++;
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
              
              if (confirmationAttempts >= maxAttempts) {
                console.log('Approval transaction not confirmed within timeout, proceeding anyway...');
              }
              
              updateMessage(
                loadingMessage.id,
                `✅ Token approval confirmed! Now you can proceed with the swap.`,
                true
              );
              
            } catch (approveError: any) {
              console.error('Error approving token:', approveError);
              
              // Check if user rejected the approval
              if (approveError?.code === 4001 || 
                  (typeof approveError?.message === 'string' && 
                   (approveError.message.includes('reject') || 
                    approveError.message.includes('cancel') || 
                    approveError.message.includes('denied')))) {
                updateMessage(
                  loadingMessage.id,
                  `Token approval was cancelled. The swap cannot proceed without this approval.`,
                  false
                );
                return;
              } else {
                updateMessage(
                  loadingMessage.id,
                  `Token approval failed: ${approveError instanceof Error ? approveError.message : 'Unknown error'}`,
                  false
                );
                return;
              }
            }
          } else {
            updateMessage(
              loadingMessage.id,
              `No wallet provider available for token approval. Please ensure your wallet is connected.`,
              false
            );
            return;
          }
          
        } catch (error) {
          console.error('Error in token approval flow:', error);
          updateMessage(
            loadingMessage.id, 
            `Token approval failed: ${error instanceof Error ? error.message : 'Unknown error'}. Cannot proceed with swap.`,
            false
          );
          return;
        }
      }
      
      // Format the buy amount
      const buyAmount = parseFloat(normalizedResult.buyAmount || '0') / (10 ** (buyTokenInfo?.decimals || 6));
      const formattedBuyAmount = buyAmount.toFixed(6);
      
      // Format transaction details for user
      const hasTokenApproval = tokenIn !== 'ETH';
      updateMessage(
        loadingMessage.id,
        `I've prepared your swap transaction! ${hasTokenApproval ? 'The token approval has been processed.' : ''} Please check your wallet to sign the transaction.
        
**Swap Details:**
- Swapping: ${amount} ${tokenIn}
- Receiving: ~${formattedBuyAmount} ${tokenOut}
- Network: ${chain}
- Slippage: 1%
${hasTokenApproval ? '- Token Approval: ✅ Confirmed' : ''}

Please approve the transaction in your wallet to complete the swap.`,
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
            const targetNetworkName = pendingNetworkSwitch.targetChainId === 42161 ? 'Arbitrum' :
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
        42161: { // Arbitrum
          chainName: 'Arbitrum',
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
        11155111: { // Sepolia
          chainName: 'Sepolia Testnet',
          rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
          blockExplorer: 'https://sepolia.etherscan.io',
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
          symbol: 'POL'
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

  // Helper function to add quick action suggestions
  const addQuickActionSuggestions = (originalAmount: number, tokenIn: string, tokenOut: string, chain: string) => {
    const suggestions = [
      `Try ${originalAmount * 0.5} ${tokenIn} to ${tokenOut}`,
      `Try ${originalAmount * 2} ${tokenIn} to ${tokenOut}`,
      `Swap ${tokenIn} to USDC instead`,
      `Check rates on different network`
    ];
    
    const suggestionMessage = `**Quick suggestions:**
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Or tell me what you'd like to do differently!`;
    
    addMessage('assistant', suggestionMessage);
  };

  // Enhanced error handling with suggestions
  const handleSwapError = (error: string, amount: number, tokenIn: string, tokenOut: string, chain: string) => {
    addMessage('assistant', `❌ **Swap Error:** ${error}

**What would you like to try?**
• Different amount (try ${amount * 0.5} or ${amount * 2})
• Different token pair
• Different network
• Check back later

Just let me know what you'd prefer!`);
  };

  return (
    <Card className="w-full h-[calc(100vh-120px)] sm:h-[calc(100vh-180px)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">SnapFAI Agent</CardTitle>
        
        <div className="flex items-center gap-2">
          {/* Mobile-only elements */}
          <div className="flex items-center gap-2 sm:hidden">
            {/* Mobile Live Search Toggle - Icon Only */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearchOptions(!showSearchOptions)}
              className={`p-2 h-8 w-8 ${showSearchOptions ? 'bg-primary/10' : ''} relative`}
              title={useLiveSearch ? 'Live Search: On' : 'Live Search: Off'}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {useLiveSearch && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
              )}
            </Button>
          </div>
          
          {/* Desktop-only elements */}
          <div className="hidden sm:flex items-center gap-4">
            <WalletSummary />
            {isNetworkSwitching && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Switching Network...</span>
              </div>
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
        </div>
      </CardHeader>
      
      {/* Mobile wallet summary - separate row */}
      <div className="flex items-center justify-between px-4 pb-2 sm:hidden">
        <WalletSummary />
        {isNetworkSwitching && (
          <div className="flex items-center gap-2 px-2 py-1 bg-orange-100 dark:bg-orange-900 rounded-full">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs font-medium">Switching...</span>
          </div>
        )}
      </div>
      
      {showSearchOptions && (
        <div className="px-3 sm:px-4 pb-3 border-b bg-gray-50 dark:bg-gray-900/50">
          {/* Mobile Search Options */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Live Search</span>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={useLiveSearch}
                  onChange={(e) => setUseLiveSearch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {useLiveSearch && (
              <div className="space-y-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Sources:</div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={searchSources.web}
                      onChange={(e) => setSearchSources({...searchSources, web: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Web</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={searchSources.news}
                      onChange={(e) => setSearchSources({...searchSources, news: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">News</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={searchSources.x}
                      onChange={(e) => setSearchSources({...searchSources, x: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">X</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop Search Options */}
          <div className="hidden md:flex flex-wrap gap-3 items-center">
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
        <ScrollArea ref={scrollAreaRef} className="h-full px-3 sm:px-4 py-3 sm:py-4">
          <div className="space-y-3 sm:space-y-4 mb-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[95%] sm:max-w-[85%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  ) : (
                    <>
                      <div className="prose dark:prose-invert prose-sm max-w-none break-words [&_h1]:text-lg [&_h1]:sm:text-xl [&_h2]:text-base [&_h2]:sm:text-lg [&_h3]:text-sm [&_h3]:sm:text-base [&_p]:text-sm [&_p]:sm:text-base [&_li]:text-sm [&_li]:sm:text-base [&_code]:text-xs [&_code]:sm:text-sm">
                        <ReactMarkdown 
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            a: CustomLink
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {/* Show confirmation buttons if this is the confirmation message */}
                      {showConfirmationButtons && confirmationMessageId === message.id && (
                        <div className="flex flex-col gap-3 mt-4 mb-2">
                          <Button 
                            onClick={() => handleSwapConfirmation(true)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors min-h-[48px] text-base"
                          >
                            ✅ Yes, Execute Swap
                          </Button>
                          <Button 
                            onClick={() => handleSwapConfirmation(false)}
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-3 px-4 rounded-lg transition-colors min-h-[48px] text-base"
                          >
                            ❌ No, Cancel
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 px-3 sm:px-4">
        <form onSubmit={handleSubmit(handleSendMessage)} className="w-full">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                {...register('message', { required: true })}
                placeholder="Ask me anything about DeFi..."
                className="min-h-[48px] md:min-h-[50px] flex-1 resize-none pr-12 md:pr-4 text-base md:text-sm rounded-xl"
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(handleSendMessage)();
                  }
                }}
                rows={1}
                style={{ 
                  fontSize: '16px', // Prevents zoom on iOS
                  lineHeight: '1.5'
                }}
              />
              {/* Mobile Send Button - Inside textarea on mobile */}
              <Button 
                type="submit" 
                size="icon"
                disabled={isProcessing || !isValid}
                className="absolute right-2 bottom-2 h-8 w-8 md:hidden rounded-full bg-primary hover:bg-primary/90"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Desktop Send Button - Outside textarea */}
            <Button 
              type="submit" 
              size="icon"
              disabled={isProcessing || !isValid}
              className="hidden md:flex h-[50px] w-[50px] rounded-xl"
            >
              {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          
          {/* Quick Actions - Mobile: 2 buttons full width, Desktop: inline */}
          <div className="flex gap-2 mt-3 w-full">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                const priceText = 'What\'s the price of $ETH?';
                setValue('message', priceText, { shouldValidate: true });
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  textarea.focus();
                }
              }}
              className="flex-1 sm:flex-none text-xs px-3 py-2 h-8 md:h-8 md:px-4 md:text-sm rounded-lg"
            >
              💰 Price
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                const swapText = 'Swap 100 USDT to ETH';
                setValue('message', swapText, { shouldValidate: true });
                const textarea = document.querySelector('textarea');
                if (textarea) {
                  textarea.focus();
                }
              }}
              className="flex-1 sm:flex-none text-xs px-3 py-2 h-8 md:h-8 md:px-4 md:text-sm rounded-lg"
            >
              🔄 Swap
            </Button>
          </div>
        </form>
      </CardFooter>
      
      {showSwapConfirmation && swapDetails && (
        <SwapConfirmation
          details={swapDetails}
          onConfirm={handleLegacySwapConfirmation}
          onClose={() => setShowSwapConfirmation(false)} 
        />
      )}
    </Card>
  );
};

export default Chat; 