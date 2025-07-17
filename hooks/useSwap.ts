import { useState } from 'react';
import { useAppKitAccount, useAppKit } from '@reown/appkit/react';
import { getSwapPrice, getSwapQuote, formatTokenAmount } from '@/lib/swap-utils';

interface SwapToken {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

interface SwapQuoteParams {
  sellToken: SwapToken;
  buyToken: SwapToken;
  amount: number;
  isSelling: boolean;
  chainId?: number;
}

interface SwapExecuteParams {
  sellToken: SwapToken;
  buyToken: SwapToken;
  amount: number;
  isSelling: boolean;
  slippagePercentage?: number;
  chainId?: number;
}

interface SwapQuoteResult {
  sellAmount: string;
  buyAmount: string;
  price: string;
  estimatedGas: string;
  estimatedGasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  sources: Array<{ name: string; proportion: string }>;
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
}

interface UseSwapResult {
  loading: boolean;
  error: string | null;
  getPrice: (params: SwapQuoteParams) => Promise<any>;
  executeSwap: (params: SwapExecuteParams) => Promise<any>;
  resetState: () => void;
}

export default function useSwap(): UseSwapResult {
  const { address } = useAppKitAccount();
  const appKit = useAppKit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state
  const resetState = () => {
    setLoading(false);
    setError(null);
  };

  // Get price quote
  const getPrice = async (params: SwapQuoteParams) => {
    try {
      setLoading(true);
      setError(null);

      const { sellToken, buyToken, amount, isSelling, chainId } = params;

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Format amount based on token decimals
      const formattedAmount = formatTokenAmount(amount, isSelling ? sellToken.decimals : buyToken.decimals);

      // Get price quote
      const quoteParams = {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        ...(isSelling ? { sellAmount: formattedAmount } : { buyAmount: formattedAmount }),
        takerAddress: address,
        ...(chainId ? { chainId } : {})
      };

      const priceData = await getSwapPrice(quoteParams);

      if (!priceData) {
        throw new Error('Failed to get price quote');
      }

      return priceData;
    } catch (error: any) {
      console.error('Error getting price:', error);
      setError(error.message || 'Failed to get price quote');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Execute swap with firm quote
  const executeSwap = async (params: SwapExecuteParams) => {
    try {
      setLoading(true);
      setError(null);

      const { sellToken, buyToken, amount, isSelling, slippagePercentage = 1, chainId } = params;

      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Format amount based on token decimals
      const formattedAmount = formatTokenAmount(amount, isSelling ? sellToken.decimals : buyToken.decimals);

      // 1. Get firm quote (which includes allowance info)
      const quoteParams = {
        sellToken: sellToken.address,
        buyToken: buyToken.address,
        ...(isSelling ? { sellAmount: formattedAmount } : { buyAmount: formattedAmount }),
        takerAddress: address,
        slippagePercentage,
        ...(chainId ? { chainId } : {})
      };

      const quoteData = await getSwapQuote(quoteParams);

      if (!quoteData) {
        throw new Error('Failed to get swap quote');
      }

      // 2. Check if we need to set allowance
      // This would come from quoteData.issues?.allowance
      const needsAllowance = quoteData.issues?.allowance;
      
      if (needsAllowance) {
        // In a real implementation, you would:
        // 1. Get the spender address from needsAllowance.spender
        // 2. Use a library like ethers, viem, or wagmi to approve token allowance
        // 3. Wait for the approval transaction to be mined
        console.log('Allowance needed:', needsAllowance);
      }

      // 3. For now, we'll return the quote data
      // In a real implementation, you'd:
      // 1. Sign the Permit2 EIP-712 message if quoteData.permit2?.eip712 exists
      // 2. Append signature to transaction data
      // 3. Submit the transaction with appKit or wallet provider
      
      return {
        quoteData,
        // The frontend will need to handle signing and submitting the transaction
      };
    } catch (error: any) {
      console.error('Error executing swap:', error);
      setError(error.message || 'Failed to execute swap');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getPrice,
    executeSwap,
    resetState
  };
} 