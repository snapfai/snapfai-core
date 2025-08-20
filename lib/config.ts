// Swap Fee Configuration
export const SWAP_FEE_CONFIG = {
  // Fee recipient address - set this to your wallet address
  RECIPIENT: process.env.SWAP_FEE_RECIPIENT || '0x12a377514F19Af5A626Bb6250065673874c708aB',
  // Fee amount in basis points (10 = 0.1%)
  BPS: parseInt(process.env.SWAP_FEE_BPS || '10'),
  // Fee percentage for display (0.1%)
  PERCENTAGE: 0.1,
  // Fee description
  DESCRIPTION: 'Platform Fee'
};

// Check if fees are enabled
export const isFeesEnabled = () => {
  // Fees are enabled by default since we have a valid recipient address
  // Only disable if explicitly set to zero address or invalid address
  return SWAP_FEE_CONFIG.RECIPIENT && 
         SWAP_FEE_CONFIG.RECIPIENT !== '0x0000000000000000000000000000000000000000' && 
         SWAP_FEE_CONFIG.BPS > 0;
};

// Get fee amount in human readable format
export const getFeeAmount = (amount: number, decimals: number = 18): number => {
  return (amount * SWAP_FEE_CONFIG.BPS) / 10000; // Convert bps to decimal
};

// Format fee for display
export const formatFeeDisplay = (feeAmount: number, tokenSymbol: string): string => {
  return `${feeAmount.toFixed(6)} ${tokenSymbol} (${SWAP_FEE_CONFIG.PERCENTAGE}%)`;
};
