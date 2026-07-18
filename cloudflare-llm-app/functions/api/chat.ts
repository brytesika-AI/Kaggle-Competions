interface Env {
  AI: any;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const requestBody: any = await context.request.json();
    const { messages, model, systemPrompt, temperature } = requestBody;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedModel = model || '@cf/meta/llama-3-8b-instruct';
    
    // Inject system prompt if provided
    let finalMessages = [...messages];
    if (systemPrompt && systemPrompt.trim()) {
      // Check if there is already a system message
      const existingSystemIndex = finalMessages.findIndex((m) => m.role === 'system');
      if (existingSystemIndex >= 0) {
        finalMessages[existingSystemIndex] = { role: 'system', content: systemPrompt };
      } else {
        finalMessages.unshift({ role: 'system', content: systemPrompt });
      }
    }

    // Check if AI binding is available
    if (!context.env.AI) {
      // In local development without bindings configured, we can fallback to standard mock responses
      // to allow testing the UI without needing wrangler configuration credentials.
      console.warn('Cloudflare Workers AI (env.AI) binding not found. Using local mock fallback.');
      
      const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
      const mockReply = `[Local Mock AI Fallback]
The Cloudflare Workers AI binding (env.AI) is not configured in this environment. 

To enable real AI responses:
1. Bind Workers AI to your Pages project in your wrangler.toml or the Cloudflare Dashboard.
2. In wrangler, add:
   [env]
   AI = { binding = "AI" }

Here is how I would reply to "${lastUserMsg}":
This is a simulated message showing that the React frontend is communicating successfully with the serverless Pages Function at /api/chat!`;

      return new Response(
        JSON.stringify({ response: mockReply }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          },
        }
      );
    }

    // Call Cloudflare Workers AI model
    const aiResponse = await context.env.AI.run(selectedModel, {
      messages: finalMessages,
      temperature: Number(temperature) || 0.6,
    });

    // Workers AI returns a text response or a stream. For Llama instruct, it usually returns:
    // { response: "text" } or text depending on configuration.
    // Let's normalize it to { response: string }
    let resultText = '';
    if (typeof aiResponse === 'string') {
      resultText = aiResponse;
    } else if (aiResponse && typeof aiResponse === 'object') {
      resultText = aiResponse.response || aiResponse.text || JSON.stringify(aiResponse);
    }

    return new Response(
      JSON.stringify({ response: resultText }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Server error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Enable OPTIONS CORS preflight requests
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
};
