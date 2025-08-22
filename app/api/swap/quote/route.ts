import { type NextRequest } from "next/server";
import { SWAP_FEE_CONFIG, isFeesEnabled } from "@/lib/config";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Debug logging for BSC swaps
  const chainId = searchParams.get('chainId');
  if (chainId === '56') {
    console.log('🔍 BSC API Route Debug:');
    console.log('  - Original searchParams:', Object.fromEntries(searchParams.entries()));
  }

  // Clone the search params and modify as needed
  const modifiedParams = new URLSearchParams();

  // Validate the chainId (default to 1 if not provided)
  if (!searchParams.has('chainId')) {
    modifiedParams.append('chainId', '1'); // Default to Ethereum mainnet
  }

  // Convert takerAddress to taker if present (0x API requires "taker" not "takerAddress")
  for (const [key, value] of searchParams.entries()) {
    if (key === 'takerAddress') {
      modifiedParams.append('taker', value);
    } else {
      modifiedParams.append(key, value);
    }
  }

  // Automatically add fee parameters for all swaps (10 bps = 0.1%)
  // Collect fee in the buy token to avoid additional sell-token allowance
  const alreadyHasFeeParams =
    searchParams.has('swapFeeRecipient') &&
    searchParams.has('swapFeeBps') &&
    searchParams.has('swapFeeToken');

  if (isFeesEnabled() && !alreadyHasFeeParams) {
    const buyToken = searchParams.get('buyToken');
    if (buyToken) {
      modifiedParams.append('swapFeeRecipient', SWAP_FEE_CONFIG.RECIPIENT);
      modifiedParams.append('swapFeeBps', SWAP_FEE_CONFIG.BPS.toString());
      modifiedParams.append('swapFeeToken', buyToken);

      console.log(`Added fee parameters: recipient=${SWAP_FEE_CONFIG.RECIPIENT}, bps=${SWAP_FEE_CONFIG.BPS}, token=${buyToken} (buyToken)`);
    }
  }

  const apiUrl = `https://api.0x.org/swap/allowance-holder/quote?${modifiedParams.toString()}`;
  
  // Debug logging for BSC swaps
  if (chainId === '56') {
    console.log('🔍 BSC 0x API Call Debug:');
    console.log('  - Modified params:', Object.fromEntries(modifiedParams.entries()));
    console.log('  - Full 0x API URL:', apiUrl);
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "0x-api-key": process.env.ZERO_X_API_KEY || process.env.NEXT_PUBLIC_ZEROEX_API_KEY || "",
        "0x-version": "v2",
      },
    });

    if (!res.ok) {
      // Enhanced error logging for BSC
      if (chainId === '56') {
        console.error('🔍 BSC 0x API Error Response:');
        console.error('  - Status:', res.status);
        console.error('  - Status Text:', res.statusText);
        console.error('  - Headers:', Object.fromEntries(res.headers.entries()));
      }
      
      const errorText = await res.text();
      console.error('0x API error response:', errorText);
      
      return Response.json({
        success: false,
        error: `0x API returned status ${res.status}`,
        details: `Failed to get quote from 0x API`,
      }, { status: res.status });
    }

    const data = await res.json();

    // Check if the response contains an error
    if (data.code || data.reason || data.validationErrors) {
      return Response.json({
        success: false,
        error: data.reason || data.code || "Unknown API error",
        details: data.validationErrors || data.values || data,
      }, { status: 400 });
    }

    // More lenient check - just ensure we have some data to return
    if (data && typeof data === 'object') {
      // Extract important fields from the response
      const responseData = {
        // If the data has a transaction field, use its structure, otherwise use the top-level fields
        transaction: {
          to: data.transaction?.to || data.to,
          data: data.transaction?.data || data.data,
          value: data.transaction?.value || data.value || "0x0",
          gas: data.transaction?.gas || data.gas,
          gasPrice: data.transaction?.gasPrice || data.gasPrice,
          buyAmount: data.buyAmount,
          sellAmount: data.sellAmount,
        },
        // Also include top-level fields for compatibility
        to: data.transaction?.to || data.to,
        data: data.transaction?.data || data.data,
        value: data.transaction?.value || data.value || "0x0",
        gas: data.transaction?.gas || data.gas,
        gasPrice: data.transaction?.gasPrice || data.gasPrice,
        buyAmount: data.buyAmount,
        sellAmount: data.sellAmount,
        sources: data.sources,
        // Include extras if available
        permit2: data.permit2,
        fees: data.fees,
        route: data.route,
      } as any;

      // Log transaction data details
      if (responseData.transaction?.data) {
        try {
          console.log('Transaction data details:', {
            to: responseData.transaction.to,
            dataLength: responseData.transaction.data.length,
            dataStartsWith: responseData.transaction.data.substring(0, 10),
            dataEndsWith: responseData.transaction.data.substring(responseData.transaction.data.length - 10),
            hasPermit2: !!responseData.permit2,
          });
        } catch {}
      }

      return Response.json({ success: true, data: responseData });
    } else {
      console.error("0x API returned unexpected data structure:", data);
      return Response.json({
        success: false,
        error: "Invalid response from 0x API",
        details: "The API response did not contain expected data format",
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Exception in quote API:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: "An unexpected error occurred while getting quote data",
    }, { status: 500 });
  }
}


