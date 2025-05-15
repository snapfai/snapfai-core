import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Simple regex-based parser as fallback when OpenAI quota is exceeded
function fallbackParser(text: string) {
  // Expanded regex patterns to handle more swap command variations
  // Action keywords
  const actionRegex = /(swap|trade|convert|exchange)/i;
  
  // Amount pattern (matches "100 USDT", "5 ETH", etc.)
  const amountRegex = /(\d+(?:\.\d+)?)\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  
  // Token patterns
  const toPattern = /\s+to\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  const forPattern = /\s+for\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  const intoPattern = /\s+into\s+([a-zA-Z0-9]{1,10}|0x[a-fA-F0-9]{40})/i;
  
  // Chain and protocol
  const chainRegex = /on\s+([a-zA-Z]{3,10})/i;
  const protocolRegex = /(?:using|via|with)\s+([a-zA-Z0-9]{1,10})/i;
  
  // Address pattern
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  
  // Extract basic components
  const amountMatch = amountRegex.exec(text);
  const toMatch = toPattern.exec(text);
  const forMatch = forPattern.exec(text);
  const intoMatch = intoPattern.exec(text);
  const chainMatch = chainRegex.exec(text);
  const protocolMatch = protocolRegex.exec(text);
  
  // Get all addresses in the text
  const addresses: string[] = [];
  let addressMatch;
  while ((addressMatch = addressRegex.exec(text)) !== null) {
    addresses.push(addressMatch[0]);
  }
  
  // Parse the data
  let amount: number | null = null;
  let tokenIn: string | null = null;
  let tokenOut: string | null = null;
  
  // Amount and first token
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
    tokenIn = amountMatch[2];
  }
  
  // Second token (from to/for/into patterns)
  if (toMatch) {
    tokenOut = toMatch[1];
  } else if (forMatch) {
    tokenOut = forMatch[1];
  } else if (intoMatch) {
    tokenOut = intoMatch[1];
  }
  
  // If we still don't have tokens, try to use addresses
  if (!tokenIn && addresses.length > 0) {
    tokenIn = addresses[0];
  }
  
  if (!tokenOut && addresses.length > 1) {
    tokenOut = addresses[1];
  }
  
  // Chain (default to Ethereum)
  const chain = chainMatch ? chainMatch[1] : 'Ethereum';
  
  // Protocol (always null - system will determine the best protocol)
  const protocol = null;
  
  // Validity check
  const isValid = amount !== null && tokenIn !== null && tokenOut !== null;
  
  return {
    isValid,
    data: {
      tokenIn,
      tokenOut,
      amount,
      chain,
      protocol
    }
  };
}

export async function POST(request: NextRequest) {
  let text = '';
  try {
    const { text: promptText, userId } = await request.json();
    text = promptText; // Store text for potential fallback use
    
    if (!text) {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // For the MVP, we'll simulate the backend by directly calling OpenAI
    // In production, this would be calling our backend server
    
    // Define system prompt
    const systemPrompt = `You are the AI agent powering SnapFAI, a specialized DeFi automation platform. Your primary function is to interpret user messages and extract actionable DeFi operations, with specific focus on token swaps for this MVP version.

YOUR CORE CAPABILITIES:
1. Parse swap requests by identifying tokenIn, tokenOut, amount, and chain (Ethereum/Arbitrum).
2. Recognize when information is missing and prompt users accordingly.
3. Understand both token symbols (e.g., ETH, USDT) and addresses (0x...).
4. Default to Ethereum when chain is unspecified.
5. Handle protocol selection automatically - users don't need to specify this.

FORMAT FOR EXTRACTING SWAP DETAILS:
- When given "Swap 100 USDT to ETH on Arbitrum" → Extract amount=100, tokenIn=USDT, tokenOut=ETH, chain=Arbitrum
- When given "Trade 5 ETH for WBTC" → Extract amount=5, tokenIn=ETH, tokenOut=WBTC, chain=Ethereum (default)
- When given "Convert 1000 USDC to 0x7a38..." → Extract amount=1000, tokenIn=USDC, tokenOut=0x7a38..., chain=Ethereum (default)

IMPORTANT CONSIDERATIONS:
- You exist only to parse commands - never engage in general conversation
- Always extract numerical amounts precisely
- Recognize variant forms like "trade", "convert", "exchange" as equivalent to "swap"
- Process both token symbols and addresses accurately
- Respond ONLY via function calling with the extracted parameters
- If critical information is missing, do not guess - identify what's missing in your function response
- Do NOT expect users to specify protocols - the system will select the optimal protocol (0x or Odos) based on price

REQUIRED PARAMETERS:
- tokenIn: The token the user wants to swap from (symbol or address)
- tokenOut: The token the user wants to swap to (symbol or address)
- amount: The precise numerical amount of tokenIn to swap
- chain: Either "Ethereum" or "Arbitrum" (default to Ethereum if unspecified)
- protocol: Leave as null - system will determine the best protocol for the user

If any required information is missing (tokenIn, tokenOut, amount, chain), return the function call with what you can determine, setting missing values to null. This will prompt the user to provide the missing information.

Your outputs will be used to facilitate actual on-chain transactions, so accuracy is critical. Always identify the exact amount, tokens, and chain being referenced, but leave protocol selection to the system.`;

    // Define the tools for function calling
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "parse_swap",
          description: "Parse a swap request from a user's prompt",
          parameters: {
            type: "object",
            properties: {
              tokenIn: {
                type: "string",
                description: "The token to swap from (e.g., USDT, ETH, BTC, or an address like 0xA0b...)"
              },
              tokenOut: {
                type: "string",
                description: "The token to swap to (e.g., USDT, ETH, BTC, or an address like 0xC02...)"
              },
              amount: {
                type: "number",
                description: "The amount of tokenIn to swap"
              },
              chain: {
                type: "string",
                description: "The blockchain to execute the swap on (Ethereum or Arbitrum)"
              },
              protocol: {
                type: "string",
                description: "The protocol to use for the swap (optional, can be 0x or Odos)"
              }
            },
            required: ["tokenIn", "tokenOut", "amount", "chain"]
          }
        }
      }
    ];

    try {
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        tools: tools,
        temperature: 0.2,
      });

      // Check if there's a function call
      const message = response.choices[0]?.message;
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        
        if (toolCall.function.name === 'parse_swap') {
          const args = JSON.parse(toolCall.function.arguments);
          
          // For MVP, we'll simulate token resolution
          // In production, this would call our token resolver service
          const tokenIn = {
            symbol: args.tokenIn,
            address: `0x${Math.random().toString(16).substring(2, 42)}`, // Random address for demo
            decimals: 18
          };
          
          const tokenOut = {
            symbol: args.tokenOut,
            address: `0x${Math.random().toString(16).substring(2, 42)}`, // Random address for demo
            decimals: 18
          };
          
          // Return parsed swap data for confirmation
          return NextResponse.json({
            success: true,
            type: 'swap',
            data: {
              tokenIn,
              tokenOut,
              amount: args.amount,
              chain: args.chain,
              protocol: null // System will determine best protocol
            },
            message: `I'll help you swap ${args.amount} ${tokenIn.symbol} to ${tokenOut.symbol} on ${args.chain}. Would you like me to check prices?`
          });
        }
      }
      
      // If we didn't get a function call or it wasn't a swap request
      return NextResponse.json({
        success: true,
        type: 'chat',
        message: message?.content || 'I apologize, but I couldn\'t process your request.'
      });
    } catch (openaiError) {
      console.error('OpenAI API error, using fallback parser:', openaiError);
      
      // Try fallback parser when OpenAI is unavailable
      const fallbackResult = fallbackParser(text);
      
      if (fallbackResult.isValid) {
        const { tokenIn, tokenOut, amount, chain, protocol } = fallbackResult.data;
        
        // Create mock token objects
        const tokenInObj = {
          symbol: tokenIn,
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          decimals: 18
        };
        
        const tokenOutObj = {
          symbol: tokenOut,
          address: `0x${Math.random().toString(16).substring(2, 42)}`,
          decimals: 18
        };
        
        return NextResponse.json({
          success: true,
          type: 'swap',
          data: {
            tokenIn: tokenInObj,
            tokenOut: tokenOutObj,
            amount,
            chain,
            protocol: null // System will determine best protocol
          },
          message: `Using fallback parser: I'll help you swap ${amount} ${tokenIn} to ${tokenOut} on ${chain}. Would you like me to check prices?`,
          fallback: true
        });
      } else {
        return NextResponse.json({
          success: false,
          type: 'chat',
          message: "I couldn't understand your swap request. Please try again with a format like 'Swap 100 USDT to ETH on Arbitrum'.",
          fallback: true
        });
      }
    }
  } catch (error: unknown) {
    console.error('Error in AI service:', error);
    
    // Check for OpenAI quota errors
    const isOpenAIError = (
      typeof error === 'object' && 
      error !== null &&
      (
        ('status' in error && (error as any).status === 429) || 
        ('error' in error && 
         (error as any).error && 
         typeof (error as any).error === 'object' &&
         'code' in (error as any).error && 
         (error as any).error.code === 'insufficient_quota')
      )
    );
    
    if (isOpenAIError) {
      // Use fallback parser when OpenAI quota is exceeded
      try {
        // We already have the text from the earlier request.json() call
        const fallbackResult = fallbackParser(text);
        
        if (fallbackResult.isValid) {
          const { tokenIn, tokenOut, amount, chain, protocol } = fallbackResult.data;
          
          // Create mock token objects
          const tokenInObj = {
            symbol: tokenIn,
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            decimals: 18
          };
          
          const tokenOutObj = {
            symbol: tokenOut,
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            decimals: 18
          };
          
          return NextResponse.json({
            success: true,
            type: 'swap',
            data: {
              tokenIn: tokenInObj,
              tokenOut: tokenOutObj,
              amount,
              chain,
              protocol: null // System will determine best protocol
            },
            message: `Using fallback parser: I'll help you swap ${amount} ${tokenIn} to ${tokenOut} on ${chain}. Would you like me to check prices?`,
            fallback: true
          });
        }
      } catch (fallbackError) {
        console.error('Fallback parser error:', fallbackError);
      }
      
      return NextResponse.json(
        { 
          success: false,
          message: 'OpenAI API quota exceeded. Using simplified parser, but unable to understand your request. Please use a clear format like "Swap 100 USDT to ETH on Arbitrum".'
        },
        { status: 200 } // Returning 200 with error message to handle gracefully on client
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Sorry, I encountered an error while processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
} 