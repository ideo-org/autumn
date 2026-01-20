import { GoogleGenerativeAI } from '@google/generative-ai';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Homepage
app.get('/', (c) => {
  return c.text('x402 AI Demo - Visit /ai/chat (POST) to test');
});

// POST /ai/chat
app.post('/ai/chat', async (c) => {
  try {
    const { userId, message } = await c.req.json();

    if (!userId || !message) {
      return c.json({ success: false, error: 'userId and message required' }, 400);
    }

    // Mock x402 verification
    console.log(`[x402] Verifying payment for ${userId}`);
    const mockBalance = 10000000;
    console.log(`[x402] Payment verified. Balance: ${mockBalance} micro-CRO`);

    // Call Gemini
    console.log(`[AI] Sending to Gemini...`);
    const result = await model.generateContent(message);
    const aiResponse = result.response.text();

    // Track usage
    const inputTokens = Math.ceil(message.length / 4);
    const outputTokens = Math.ceil(aiResponse.length / 4);
    console.log(`[x402] Tracked ${inputTokens} input + ${outputTokens} output tokens`);

    return c.json({
      success: true,
      response: aiResponse,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      billing: {
        cost: (inputTokens * 10) + (outputTokens * 20),
        balance: mockBalance,
      },
    });
  } catch (error) {
    console.error('[Error]', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Health
app.get('/health', (c) => c.json({ status: 'healthy', service: 'x402-ai-demo' }));

const port = 3001;
serve({ fetch: app.fetch, port });
console.log(`\n🚀 x402 AI Demo on http://localhost:${port}`);
console.log(`💡 Using Gemini API: ${process.env.GEMINI_API_KEY ? 'YES' : 'NO'}\n`);
