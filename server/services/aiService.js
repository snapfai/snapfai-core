const { OpenAI } = require('openai');
const { resolveTokenSymbol } = require('../lib/tokenResolver');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process a user prompt using OpenAI's GPT-4
 * @param {string} prompt - The user's prompt text
 * @param {string} userId - The user's ID
 * @param {object} redisClient - Redis client for caching
 * @returns {object} - The processed result
 */
async function processPrompt(prompt, userId, redisClient) {
  try {
    // Check if we have user context in Redis
    const userContext = await redisClient.get(`userContext:${userId}`);
    let context = userContext ? JSON.parse(userContext) : { chain: null };
    
    // Define system prompt
    const systemPrompt = `You are an agent who manages the SnapFAI platform, a chat-based DeFi interaction layer that simplifies token swapping on Ethereum and Arbitrum. 

When a user asks you to swap tokens, you need to extract:
- tokenIn (the token they want to swap from)
- tokenOut (the token they want to swap to)
- amount (the amount of tokenIn)
- chain (Ethereum or Arbitrum)
- protocol (optional, can be 0x or Odos)

If the chain isn't specified, default to ${context.chain || 'Ethereum'}.
If any required information is missing, ask the user to provide it.
`;

    // Define the tools for function calling
    const tools = [
      {
        type: "function",
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

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      tools: tools,
      temperature: 0.2,
    });

    // Check if there's a function call
    if (response.choices[0]?.message?.tool_calls?.length > 0) {
      const toolCall = response.choices[0].message.tool_calls[0];
      
      if (toolCall.function.name === 'parse_swap') {
        const args = JSON.parse(toolCall.function.arguments);
        
        // Resolve token symbols to addresses
        const resolvedTokenIn = await resolveTokenSymbol(args.tokenIn);
        const resolvedTokenOut = await resolveTokenSymbol(args.tokenOut);
        
        if (!resolvedTokenIn || !resolvedTokenOut) {
          return {
            success: false,
            message: `I couldn't recognize one of the tokens you mentioned. Please try using a different token symbol or provide the token address directly.`
          };
        }
        
        // Save user context
        await redisClient.set(`userContext:${userId}`, JSON.stringify({
          chain: args.chain
        }));
        
        // Return parsed swap data for confirmation
        return {
          success: true,
          type: 'swap',
          data: {
            tokenIn: resolvedTokenIn,
            tokenOut: resolvedTokenOut,
            amount: args.amount,
            chain: args.chain,
            protocol: args.protocol
          },
          message: `I'll help you swap ${args.amount} ${resolvedTokenIn.symbol} to ${resolvedTokenOut.symbol} on ${args.chain}. Would you like me to check prices?`
        };
      }
    }
    
    // If we didn't get a function call or it wasn't a swap request
    return {
      success: true,
      type: 'chat',
      message: response.choices[0].message.content
    };
  } catch (error) {
    console.error('Error in AI service:', error);
    return {
      success: false,
      message: 'Sorry, I encountered an error while processing your request. Please try again.'
    };
  }
}

module.exports = { processPrompt }; 