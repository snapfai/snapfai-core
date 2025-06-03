import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  try {
    const res = await fetch(
      `https://api.0x.org/swap/permit2/allowance?${searchParams}`,
      {
        headers: {
          "0x-api-key": process.env.ZERO_X_API_KEY || "dummy-api-key",
          "0x-version": "v2",
        },
      }
    );
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('0x API error:', errorData);
      return Response.json({ 
        success: false, 
        error: errorData?.reason || 'Failed to fetch allowance data' 
      }, { status: res.status });
    }
    
    const data = await res.json();
    console.log("Allowance data retrieved successfully");
    
    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in allowance API:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 