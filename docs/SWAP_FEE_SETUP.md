# Swap Fee Setup Guide

This guide explains how to set up the 10 bps (0.1%) swap fee system for monetizing trades on SnapFAI.

## Overview

The swap fee system automatically collects a 0.1% fee on all token swaps made through the platform. This fee is collected in the token being sold and sent to a designated recipient wallet.

## Configuration

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# 0x Swap Fee Configuration
# The wallet address that will receive swap fees (10 bps = 0.1%)
# Default: 0x12a377514F19Af5A626Bb6250065673874c708aB
SWAP_FEE_RECIPIENT=0x12a377514F19Af5A626Bb6250065673874c708aB
# Fee amount in basis points (10 = 0.1%)
SWAP_FEE_BPS=10
```

**Important:** 
- The default fee recipient is `0x12a377514F19Af5A626Bb6250065673874c708aB`
- You can change this to your own wallet address by setting `SWAP_FEE_RECIPIENT`
- If you don't set this variable, fees will still be collected and sent to the default address

### 2. Fee Structure

- **Fee Rate**: 10 basis points (0.1%)
- **Fee Collection**: Fees are collected in the token being sold
- **Fee Recipient**: The address specified in `SWAP_FEE_RECIPIENT`
- **Automatic**: Fees are automatically applied to all swaps

## How It Works

### 1. Fee Collection Process

1. User initiates a swap (e.g., 100 USDC to ETH)
2. 0x API calculates the swap with the fee included
3. Fee is deducted from the sell amount (100 USDC)
4. User receives slightly less ETH due to the fee
5. Fee amount is sent to your designated wallet

### 2. Example Calculation

**User Swap**: 100 USDC → ETH
- **Fee**: 0.1% of 100 USDC = 0.1 USDC
- **User Receives**: ETH equivalent to 99.9 USDC
- **You Receive**: 0.1 USDC

## API Integration

The fee system is automatically integrated into:

- `/api/swap/quote` - For getting swap quotes
- `/api/swap/price` - For getting price information

Both endpoints automatically include the fee parameters when calling the 0x API.

## Fee Display

Users will see the fee information in the swap confirmation:

```
💰 Platform Fee: 0.100000 USDC (0.1%)
```

## Security Considerations

1. **Fee Recipient**: Only you can change the fee recipient address
2. **Fee Rate**: The 0.1% rate is hardcoded for consistency
3. **Transparency**: Users are always informed about fees before executing swaps

## Testing

To test the fee system:

1. Set up the environment variables
2. Make a test swap through the UI
3. Check that the fee is displayed in the confirmation
4. Verify the fee is collected in your wallet after the swap

## Troubleshooting

### Fees Not Being Collected

1. Check that `SWAP_FEE_RECIPIENT` is set correctly (or use the default)
2. Ensure the address is not the zero address (0x0000...)
3. Verify `SWAP_FEE_BPS` is set to 10
4. Check console logs for fee parameter confirmation
5. **Note**: If no `SWAP_FEE_RECIPIENT` is set, fees will be sent to the default address: `0x12a377514F19Af5A626Bb6250065673874c708aB`

### Fee Display Issues

1. Ensure the 0x API is returning fee information
2. Check that the fee calculation logic is working
3. Verify the UI is properly displaying fee data

## Revenue Optimization

- **Competitive Pricing**: 0.1% is competitive with other DEX aggregators
- **Volume-Based**: Higher trading volume = higher fee revenue
- **Token Diversity**: Fees are collected in various tokens, providing portfolio diversification

## Support

If you encounter issues with the fee system, check:

1. Environment variable configuration
2. 0x API key validity
3. Network connectivity
4. Console logs for error messages
