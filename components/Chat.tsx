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

  const handleSendMessage = async (data: { message: string }) => {
    if (isProcessing) return;
    
    const userMessage = data.message.trim();
    if (!userMessage) return;
    
    // Add user message to the chat
    addMessage('user', userMessage);
    
    // Add loading message from assistant
    const loadingMessage = addMessage('assistant', 'Thinking...', true);
    
    setIsProcessing(true);
    reset();
    
    try {
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
          searchSources: useLiveSearch ? selectedSources : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get a response');
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (result.type === 'swap' && result.data) {
          // Show swap confirmation UI
          setSwapDetails({
            tokenIn: result.data.tokenIn.symbol,
            tokenOut: result.data.tokenOut.symbol,
            amountIn: result.data.amount,
            amountOut: 'Calculating...',
            protocol: result.data.protocol || 'best available',
            chain: result.data.chain
          });
          
          // Update the assistant message
          updateMessage(loadingMessage.id, result.message);
          
          // Fetch price quote
          await fetchSwapQuote(result.data);
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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <Card className="flex flex-col h-full border-none">
        {/* <CardHeader className="pb-2">
          <CardTitle>Snap Agent</CardTitle>
        </CardHeader> */}
        
        <CardContent className="flex-grow overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="h-8 w-8">
                      {message.role === 'assistant' ? (
                        <AvatarImage src="/snapfai-logo.png" alt="SnapFAI" />
                      ) : (
                        <AvatarImage src="/user-avatar.png" alt="User" />
                      )}
                      <AvatarFallback>
                        {message.role === 'assistant' ? 'AI' : 'You'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`rounded-lg px-4 py-2 ${
                      message.role === 'assistant' 
                        ? 'bg-secondary text-secondary-foreground shadow-sm' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {message.isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-current opacity-75 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                            <span className="h-2 w-2 rounded-full bg-current opacity-75 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                            <span className="h-2 w-2 rounded-full bg-current opacity-75 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                          </div>
                          <span>SnapFAI is thinking</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none chat-prose break-words">
                          <ReactMarkdown 
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              a: ({node, ...props}) => (
                                <a 
                                  {...props} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                />
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSubmit(handleSendMessage)} className="w-full">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  type="button"
                  variant={useLiveSearch ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseLiveSearch(!useLiveSearch);
                    if (!useLiveSearch) {
                      setShowSearchOptions(true);
                    } else {
                      setShowSearchOptions(false);
                    }
                  }}
                  className={`text-xs flex items-center gap-1 ${useLiveSearch ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                >
                  <span className={`inline-block w-3 h-3 rounded-full ${useLiveSearch ? "bg-green-400" : "bg-gray-300"}`}></span>
                  {useLiveSearch ? "Live Search: ON" : "Live Search: OFF"}
                </Button>
                
                {useLiveSearch && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearchOptions(!showSearchOptions)}
                      className="text-xs"
                    >
                      {showSearchOptions ? "Hide Options" : "Show Options"}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Using <span className="font-medium text-blue-500">real-time data</span> with <span className="font-medium text-blue-500">sources</span>
                    </span>
                  </>
                )}
              </div>
              
              {showSearchOptions && useLiveSearch && (
                <div className="bg-muted p-2 rounded-md mb-2 flex flex-wrap gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input 
                      type="checkbox" 
                      checked={searchSources.web}
                      onChange={() => setSearchSources({...searchSources, web: !searchSources.web})}
                    />
                    Web
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input 
                      type="checkbox" 
                      checked={searchSources.news}
                      onChange={() => setSearchSources({...searchSources, news: !searchSources.news})}
                    />
                    News
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input 
                      type="checkbox" 
                      checked={searchSources.x}
                      onChange={() => setSearchSources({...searchSources, x: !searchSources.x})}
                    />
                    X (Twitter)
                  </label>
                </div>
              )}
              
              <Textarea
                placeholder="Tell me what DeFi action you want to perform..."
                {...register('message', { required: true })}
                className="min-h-[60px] pr-14 resize-none focus-visible:ring-1 focus-visible:ring-snapfai-amber"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(handleSendMessage)();
                  }
                }}
                disabled={isProcessing}
              />
              <Button 
                type="submit" 
                size="icon"
                className="absolute right-2 bottom-2 h-8 w-8 bg-snapfai-black hover:bg-snapfai-black/90 text-white dark:bg-snapfai-amber dark:hover:bg-snapfai-amber/90 dark:text-snapfai-black rounded-full"
                disabled={isProcessing || !isValid}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
      
      {showSwapConfirmation && swapDetails && (
        <SwapConfirmation
          details={swapDetails}
          onConfirm={handleSwapConfirm}
        />
      )}
    </div>
  );
};

export default Chat; 