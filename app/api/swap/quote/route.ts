import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
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
  
  const apiUrl = `https://api.0x.org/swap/permit2/quote?${modifiedParams.toString()}`;
  
  console.log("0x API URL:", apiUrl);
  console.log("0x API parameters:", modifiedParams.toString());

  try {
    console.log("Calling 0x quote API:", apiUrl);
    
    const res = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        "0x-api-key": process.env.ZERO_X_API_KEY || process.env.NEXT_PUBLIC_ZEROEX_API_KEY || "",
        "0x-version": "v2",
      },
    });

    if (!res.ok) {
      console.error(`0x API error: ${res.status}`, await res.text());
      return Response.json({
        success: false,
        error: `0x API returned status ${res.status}`,
        details: `Failed to get quote from 0x API`,
      }, { status: res.status });
    }

    const data = await res.json();

    // Log the full response for debugging
    console.log("0x API raw response:", JSON.stringify(data, null, 2));
    
    // Specifically log Permit2 data if present
    if (data.permit2) {
      console.log("Permit2 data found:", {
        type: data.permit2.type,
        hash: data.permit2.hash,
        hasEip712: !!data.permit2.eip712,
        eip712Keys: data.permit2.eip712 ? Object.keys(data.permit2.eip712) : [],
        messageKeys: data.permit2.eip712?.message ? Object.keys(data.permit2.eip712.message) : []
      });
    } else {
      console.log("No Permit2 data in response");
    }

    // Check if the response contains an error
    if (data.code || data.reason || data.validationErrors) {
      console.error("0x API returned error:", data);
      return Response.json({
        success: false,
        error: data.reason || data.code || "Unknown API error",
        details: data.validationErrors || data.values || data,
      }, { status: 400 });
    }

    // More lenient check - just ensure we have some data to return
    // Different 0x endpoints may return data in different formats
    if (data && typeof data === 'object') {
      console.log("0x quote data received:", data);
      
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
        // Include Permit2 data if available
        permit2: data.permit2
      };
      
      // Log transaction data details
      if (responseData.transaction.data) {
        console.log('Transaction data details:', {
          to: responseData.transaction.to,
          dataLength: responseData.transaction.data.length,
          dataStartsWith: responseData.transaction.data.substring(0, 10),
          dataEndsWith: responseData.transaction.data.substring(responseData.transaction.data.length - 10),
          hasPermit2: !!responseData.permit2
        });
      }
      
      // Return success with the expected format
      return Response.json({
        success: true,
        data: responseData,
      });
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