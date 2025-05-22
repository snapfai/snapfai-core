"use client";

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowUpDown, Info, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useSwap from '@/hooks/useSwap';
import { parseTokenAmount } from '@/lib/swap-utils';

// Common ERC20 tokens for demo purposes
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

// Network options
const NETWORKS = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 8453, name: 'Base' }
];

export default function SwapInterface() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { toast } = useToast();
  const { loading, error, getPrice, executeSwap } = useSwap();
  
  const [sellToken, setSellToken] = useState(TOKENS[0]);
  const [buyToken, setBuyToken] = useState(TOKENS[1]);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [refreshQuote, setRefreshQuote] = useState(0);
  const [selectedChainId, setSelectedChainId] = useState(1); // Default Ethereum mainnet
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Effect to fetch price quote
  useEffect(() => {
    const fetchPrice = async () => {
      if (!isConnected || !address || !sellAmount || parseFloat(sellAmount) <= 0) {
        setBuyAmount('');
        setQuote(null);
        return;
      }
      
      console.log("Fetching price with params:", {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        amount: parseFloat(sellAmount),
        isSelling: true,
        chainId: selectedChainId
      });
      
      try {
        const priceData = await getPrice({
          sellToken,
          buyToken,
          amount: parseFloat(sellAmount),
          isSelling: true,
          chainId: selectedChainId
        });
        
        console.log("Price data received:", priceData);
        
        if (priceData) {
          if (priceData.error) {
            console.error("API error:", priceData.error);
            setQuote(priceData);
            setBuyAmount('');
            return;
          }
          
          // Safely parse buyAmount
          let formattedBuyAmount = '0.00';
          if (priceData.buyAmount && !isNaN(parseFloat(priceData.buyAmount))) {
            formattedBuyAmount = parseTokenAmount(priceData.buyAmount, buyToken.decimals).toFixed(6);
          } else {
            console.warn("Invalid buyAmount:", priceData.buyAmount);
          }
          
          // If price is missing or invalid, calculate it from amounts
          if (!priceData.price || isNaN(parseFloat(priceData.price)) || parseFloat(priceData.price) === 0) {
            const sellAmountInWei = parseFloat(sellAmount) * Math.pow(10, sellToken.decimals);
            const buyAmountInWei = parseFloat(priceData.buyAmount);
            
            if (sellAmountInWei > 0 && buyAmountInWei > 0) {
              // Calculate price as buyAmount/sellAmount
              priceData.price = (buyAmountInWei / sellAmountInWei).toString();
              console.log("Calculated price:", priceData.price);
            }
          }
          
          setBuyAmount(formattedBuyAmount);
          setQuote(priceData);
        }
      } catch (error) {
        console.error("Error fetching price:", error);
        setApiError(error instanceof Error ? error.message : 'Unknown error fetching price');
      }
    };
    
    // Debounce the price fetch
    const handler = setTimeout(fetchPrice, 500);
    return () => clearTimeout(handler);
  }, [sellAmount, sellToken, buyToken, isConnected, address, refreshQuote, selectedChainId]);
  
  // Swap the tokens
  const handleSwapTokens = () => {
    const temp = sellToken;
    setSellToken(buyToken);
    setBuyToken(temp);
    
    // Also swap the amounts if they exist
    if (sellAmount && buyAmount) {
      setSellAmount(buyAmount);
      setBuyAmount(sellAmount);
    }
    
    // Refresh the quote
    setRefreshQuote(prev => prev + 1);
  };
  
  // Handle connect wallet
  const handleConnectWallet = async () => {
    try {
      await open({ view: 'Connect' });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  
  // Execute the swap
  const handleSwap = async () => {
    if (!isConnected || !address || !sellAmount || parseFloat(sellAmount) <= 0) {
      return;
    }
    
    try {
      const result = await executeSwap({
        sellToken,
        buyToken,
        amount: parseFloat(sellAmount),
        isSelling: true,
        slippagePercentage: 1, // 1% slippage
        chainId: selectedChainId
      });
      
      if (result) {
        // In a real implementation, we would now trigger the transaction signing
        // For now, just show a toast with the quote details
        toast({
          title: 'Swap Quote Ready',
          description: `Ready to swap ${sellAmount} ${sellToken.symbol} for approximately ${buyAmount} ${buyToken.symbol}`,
        });
        
        // Here we would use appKit.open({ view: 'SendTransaction' }) to prompt the user to sign and send the transaction
        // For this demo, we'll just log the details
        console.log('Swap quote:', result);
      }
    } catch (error: any) {
      console.error('Error executing swap:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute swap',
        variant: 'destructive',
      });
    }
  };
  
  // Add the handleMaxClick function
  const handleMaxClick = async () => {
    if (!isConnected || !address) return;
    
    try {
      // If balance information is available from wallet
      if (window.ethereum) {
        try {
          // Get account balance
          const accounts = await (window.ethereum as any).request({ 
            method: 'eth_requestAccounts' 
          });
          
          // Get balance for the current account
          const balance = await (window.ethereum as any).request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          // Convert hex balance to decimal and format
          const wei = parseInt(balance, 16);
          const ethBalance = wei / 1e18;
          
          // For ETH, leave a small amount for gas
          if (sellToken.symbol.toUpperCase() === 'ETH') {
            const maxAmount = Math.max(0, ethBalance - 0.01); // Leave 0.01 ETH for gas
            setSellAmount(maxAmount.toString());
          } else {
            // For other tokens, we would need to check ERC20 balance
            // This is a simplified version - in production, you'd check the token balance
            setSellAmount(ethBalance.toString());
          }
        } catch (error) {
          console.error('Error getting max balance:', error);
        }
      }
    } catch (error) {
      console.error('Error setting max amount:', error);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Swap Tokens</CardTitle>
        <CardDescription>Powered by 0x API</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* From Token */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">From</label>
            {isConnected && (
              <button 
                className="text-xs text-primary hover:underline"
                onClick={handleMaxClick}
              >
                Max
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <div className="w-1/2">
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full"
                disabled={!isConnected}
              />
            </div>
            
            <div className="w-1/2">
              <Select
                value={sellToken.address}
                onValueChange={(value) => {
                  const token = TOKENS.find(t => t.address === value);
                  if (token) {
                    setSellToken(token);
                    
                    // If user selects the same token as the buy token, swap them
                    if (token.address === buyToken.address) {
                      setBuyToken(sellToken);
                    }
                    
                    // Refresh the quote
                    setRefreshQuote(prev => prev + 1);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{token.symbol}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full h-8 w-8 bg-muted"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        
        {/* To Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          
          <div className="flex space-x-2">
            <div className="w-1/2">
              <Input
                type="text"
                placeholder="0.0"
                value={buyAmount}
                readOnly
                className="w-full"
              />
            </div>
            
            <div className="w-1/2">
              <Select
                value={buyToken.address}
                onValueChange={(value) => {
                  const token = TOKENS.find(t => t.address === value);
                  if (token) {
                    setBuyToken(token);
                    
                    // If user selects the same token as the sell token, swap them
                    if (token.address === sellToken.address) {
                      setSellToken(buyToken);
                    }
                    
                    // Refresh the quote
                    setRefreshQuote(prev => prev + 1);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {TOKENS.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{token.symbol}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Price and Details */}
        {quote && (
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span>
                1 {sellToken.symbol} = {
                  quote.price && !isNaN(parseFloat(quote.price)) 
                    ? (parseFloat(quote.price) * Math.pow(10, sellToken.decimals - buyToken.decimals)).toFixed(6)
                    : '0.00'
                } {buyToken.symbol}
              </span>
            </div>
            
            {quote.sources && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>
                  {quote.sources
                    .filter((s: any) => s && s.proportion && parseFloat(s.proportion) > 0)
                    .map((s: any) => `${s.name} (${Math.round(parseFloat(s.proportion) * 100)}%)`)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {apiError && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{apiError}</span>
          </div>
        )}
        
        {/* API Error Display */}
        {quote?.error && (
          <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">API Error:</p>
              <p>{quote.error.reason || quote.error.message || 'Unknown error'}</p>
            </div>
          </div>
        )}
        
        {/* Network Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
          
          <div className="flex space-x-2">
            <div className="w-1/2">
              <Select
                value={selectedChainId.toString()}
                onValueChange={(value) => {
                  setSelectedChainId(parseInt(value));
                  setRefreshQuote(prev => prev + 1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network.id} value={network.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{network.name}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        {!isConnected ? (
          <Button 
            className="w-full"
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={handleSwap}
            disabled={loading || !sellAmount || parseFloat(sellAmount) <= 0 || !quote}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Swap'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 