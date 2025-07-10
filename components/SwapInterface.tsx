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
import { getTokensForChain, getDefaultTokenPair, TokenConfig } from '@/lib/tokens';
import { SUPPORTED_CHAINS, getChainById } from '@/lib/chains';

// Network options
const NETWORK_OPTIONS = Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
  value: config.id,
  label: config.name,
  symbol: config.symbol,
  isTestnet: config.isTestnet
}));

export default function SwapInterface() {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { toast } = useToast();
  const { loading, error, getPrice, executeSwap } = useSwap();
  
  const [selectedChainId, setSelectedChainId] = useState(1); // Default Ethereum mainnet
  const [sellToken, setSellToken] = useState<TokenConfig | null>(null);
  const [buyToken, setBuyToken] = useState<TokenConfig | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [refreshQuote, setRefreshQuote] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Initialize tokens when chain changes
  useEffect(() => {
    const tokens = getTokensForChain(selectedChainId);
    const defaultPair = getDefaultTokenPair(selectedChainId);
    
    if (defaultPair) {
      setSellToken(defaultPair[0]);
      setBuyToken(defaultPair[1]);
    } else if (tokens.length >= 2) {
      setSellToken(tokens[0]);
      setBuyToken(tokens[1]);
    }
  }, [selectedChainId]);
  
  // Effect to fetch price quote
  useEffect(() => {
    const fetchPrice = async () => {
      if (!isConnected || !address || !sellAmount || parseFloat(sellAmount) <= 0 || !sellToken || !buyToken) {
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
          sellToken: sellToken as any,
          buyToken: buyToken as any,
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
    if (!sellToken || !buyToken) return;
    
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
    if (!isConnected || !address || !sellAmount || parseFloat(sellAmount) <= 0 || !sellToken || !buyToken) {
      return;
    }
    
    try {
      const result = await executeSwap({
        sellToken: sellToken as any,
        buyToken: buyToken as any,
        amount: parseFloat(sellAmount),
        isSelling: true,
        slippagePercentage: 1, // 1% slippage
        chainId: selectedChainId
      });
      
      if (result) {
        toast({
          title: 'Swap Quote Ready',
          description: `Ready to swap ${sellAmount} ${sellToken.symbol} for approximately ${buyAmount} ${buyToken.symbol}`,
        });
        
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

  if (!sellToken || !buyToken) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Token Swap</CardTitle>
          <CardDescription>Loading tokens...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Token Swap</CardTitle>
        <CardDescription>
          Swap tokens at the best rates across multiple DEXs
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Network Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Network</label>
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
              {NETWORK_OPTIONS.map((network) => (
                <SelectItem key={network.value} value={network.value.toString()}>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{network.label}</div>
                    {network.isTestnet && <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">Testnet</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* From Token */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          
          <div className="flex space-x-2">
            <div className="w-1/2">
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="w-1/2">
              <Select
                value={sellToken.address}
                onValueChange={(value) => {
                  const tokens = getTokensForChain(selectedChainId);
                  const token = tokens.find(t => t.address === value);
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
                  {getTokensForChain(selectedChainId).map((token) => (
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
                  const tokens = getTokensForChain(selectedChainId);
                  const token = tokens.find(t => t.address === value);
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
                  {getTokensForChain(selectedChainId).map((token) => (
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
        {quote && !quote.error && (
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