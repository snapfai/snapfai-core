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
  
  const apiUrl = `https://api.0x.org/swap/permit2/price?${modifiedParams.toString()}`;

  try {
    console.log("Calling 0x price API:", apiUrl);
    
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
        details: `Failed to get price from 0x API`,
      }, { status: res.status });
    }

    const data = await res.json();

    // Log the full response for debugging
    console.log("0x API raw response:", JSON.stringify(data));
    console.log("Sell token:", modifiedParams.get('sellToken'));
    console.log("Buy token:", modifiedParams.get('buyToken'));
    console.log("Sell amount:", modifiedParams.get('sellAmount'));

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
      console.log("0x price data received:", data);
      
      // Return success with the expected format
      return Response.json({
        success: true,
        data: data,
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
    console.error("Exception in price API:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: "An unexpected error occurred while getting price data",
    }, { status: 500 });
  }
} 