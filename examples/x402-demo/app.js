import { GoogleGenerativeAI } from '@google/generative-ai';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

// Mock x402 modules (simplified for demo)
const createMockX402Client = () => ({
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'http://localhost:4402',
});

const createMockUsageTracker = () => ({
  trackPrompt: async (userId, tokens, metadata) => {
    console.log(`[x402] Tracked ${tokens} input tokens for user ${userId}`);
  },
  trackCompletion: async (userId, tokens, metadata) => {
    console.log(`[x402] Tracked ${tokens} output tokens for user ${userId}`);
  },
  getBufferSize: () => 0,
});

const createMockPaymentVerifier = () => ({
  verify: async (userId, requiredAmount) => {
    // Mock payment verification - always succeeds for demo
    const mockBalance = 10000000; // 10 CRO in micro-CRO
    console.log(`[x402] Verifying payment for ${userId}, balance: ${mockBalance} micro-CRO`);
    return {
      allowed: true,
      balance: mockBalance,
    };
  },
  getCacheStats: () => ({ size: 0, entries: [] }),
});

// Initialize
const app = new Hono();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const x402Client = createMockX402Client();
const usageTracker = createMockUsageTracker();
const paymentVerifier = createMockPaymentVerifier();

// Homepage
app.get('/', (c) => {
  return c.html(``
    <!DOCTYPE html>
    <html>
      <head>
        <title>x402 AI Demo - Pay-per-use AI with Cronos</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
          h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
          }
          .subtitle {
            opacity: 0.9;
            margin-bottom: 30px;
          }
          .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            margin: 15px 0;
            border-radius: 10px;
          }
          .endpoint {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
          }
          .badge {
            display: inline-block;
            background: #4ade80;
            color: black;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            margin-right: 10px;
          }
          .test-form {
            background: rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
          }
          input, textarea {
            width: 100%;
            padding: 12px;
            margin: 8px 0;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          }
          button {
            background: #4ade80;
            color: black;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
          }
          button:hover {
            background: #22c55e;
          }
          #response {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 x402 AI Demo</h1>
          <p class="subtitle">Pay-per-use AI powered by Cronos x402 + Google Gemini</p>
          
          <div class="feature">
            <h3>💡 What is this?</h3>
            <p>This demo showcases useAutumn integrated with Cronos x402 for micropayments. Users pay only for what they use - no subscriptions!</p>
          </div>

          <div class="test-form">
            <h3>🧪 Test the AI Chat</h3>
            <input type="text" id="userId" placeholder="User ID (e.g., user123)" value="user123">
            <textarea id="message" rows="3" placeholder="Your message to the AI...">Explain blockchain in simple terms</textarea>
            <button onclick="sendMessage()">Send Message</button>
            <div id="response"></div>
          </div>

          <div class="feature">
            <h3>🔧 Available Endpoints</h3>
            
            <div class="endpoint">
              <span class="badge">POST</span>
              <strong>/ai/chat</strong><br>
              Send a message to Gemini AI (with x402 billing)
            </div>
            
            <div class="endpoint">
              <span class="badge">GET</span>
              <strong>/health</strong><br>
              Check service health
            </div>
            
            <div class="endpoint">
              <span class="badge">GET</span>
              <strong>/stats</strong><br>
              View x402 statistics
            </div>
          </div>

          <div class="feature">
            <h3>🎯 Hackathon Highlights</h3>
            <ul>
              <li>✅ Real AI responses via Google Gemini</li>
              <li>✅ x402 payment verification</li>
              <li>✅ Usage tracking per token</li>
              <li>✅ Developer-friendly REST API</li>
              <li>✅ Fork of YC-backed useAutumn</li>
            </ul>
          </div>
        </div>

        <script>
          async function sendMessage() {
            const userId = document.getElementById('userId').value;
            const message = document.getElementById('message').value;
            const responseDiv = document.getElementById('response');
            
            responseDiv.style.display = 'block';
            responseDiv.textContent = '⏳ Processing...';
            
            try {
              const response = await fetch('/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, message })
              });
              
              const data = await response.json();
              
              if (data.success) {
                responseDiv.textContent = `🤖 AI Response:\n${data.response}\n\n📊 Usage:\n- Input tokens: ${data.usage.inputTokens}\n- Output tokens: ${data.usage.outputTokens}\n- Cost: ${data.billing.cost} micro-CRO\n- Balance: ${data.billing.balance} micro-CRO`;
              } else {
                responseDiv.textContent = `❌ Error: ${data.error}`;
              }
            } catch (error) {
              responseDiv.textContent = `❌ Error: ${error.message}`;
            }
          }
        </script>
      </body>
    </html>
  `);
});

// POST /ai/chat - Main AI endpoint with x402 billing
app.post('/ai/chat', async (c) => {
  try {
    const { userId, message } = await c.req.json();

    if (!userId || !message) {
      return c.json({ success: false, error: 'userId and message are required' }, 400);
    }

    // Step 1: Verify payment
    console.log(`[x402] Verifying payment for user: ${userId}`);
    const verification = await paymentVerifier.verify(userId, 10000);

    if (!verification.allowed) {
      return c.json({
        success: false,
        error: 'Payment required',
        reason: verification.reason,
        balance: verification.balance
      }, 402);
    }

    console.log(`[x402] Payment verified. Balance: ${verification.balance} micro-CRO`);

    // Step 2: Call Gemini AI
    console.log(`[AI] Sending message to Gemini...`);
    const result = await model.generateContent(message);
    const aiResponse = result.response.text();

    // Step 3: Estimate token usage (Gemini doesn't provide exact counts in all cases)
    const inputTokens = Math.ceil(message.length / 4); // Rough estimate
    const outputTokens = Math.ceil(aiResponse.length / 4); // Rough estimate

    console.log(`[x402] Tracking usage: ${inputTokens} input + ${outputTokens} output tokens`);
    
    await usageTracker.trackPrompt(userId, inputTokens, { model: 'gemini-pro' });
    await usageTracker.trackCompletion(userId, outputTokens, { model: 'gemini-pro' });

    // Step 4: Return response
    return c.json({
      success: true,
      response: aiResponse,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      billing: {
        cost: (inputTokens * 10) + (outputTokens * 20), // micro-CRO
        balance: verification.balance,
      },
    });
  } catch (error) {
    console.error('[Error]', error);
    return c.json({
      success: false,
      error: error.message || 'Internal server error',
    }, 500);
  }
});

// GET /health
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'x402-ai-demo',
    timestamp: new Date().toISOString(),
  });
});

// GET /stats
app.get('/stats', (c) => {
  const cacheStats = paymentVerifier.getCacheStats();
  const bufferSize = usageTracker.getBufferSize();

  return c.json({
    usageBuffer: {
      pendingRecords: bufferSize,
    },
    verificationCache: cacheStats,
    facilitator: {
      url: x402Client.facilitatorUrl,
    },
  });
});

// Start server
const port = process.env.PORT || 3001;

serve({
  fetch: app.fetch,
  port,
});

console.log(`\n🚀 x402 AI Demo running on http://localhost:${port}`);
console.log(`📊 Dashboard: http://localhost:${port}`);
console.log(`💡 Using ${process.env.GEMINI_API_KEY ? 'real' : 'NO'} Gemini API key\n`);
