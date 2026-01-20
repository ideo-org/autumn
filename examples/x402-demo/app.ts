/**
 * x402 Demo Application
 * Demonstrates Cronos x402 payment integration with AI services
 */

import { Hono } from 'hono';
import { Anthropic } from '@anthropic-ai/sdk';
import { createX402Client } from '../../../server/src/x402/client';
import {
  createUsageTracker,
  createPaymentVerifier,
} from '../../../server/src/internal/x402';

// Initialize app
const app = new Hono();

// Initialize x402 client
const x402Client = createX402Client({
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'http://localhost:4402',
  apiKey: process.env.X402_API_KEY,
});

// Initialize usage tracker and payment verifier
const usageTracker = createUsageTracker(x402Client, {
  batchSize: 10,
  syncInterval: 30000, // 30 seconds
});

const paymentVerifier = createPaymentVerifier(x402Client, {
  minBalance: 100000, // 0.1 CRO in micro-CRO
  cacheTimeout: 60000, // 1 minute
  strictMode: false, // Allow access during verification errors for demo
});

// Start auto-sync
usageTracker.startAutoSync();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Homepage
 */
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>x402 AI Demo - Pay-per-use AI with Cronos</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
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
          a {
            color: #4ade80;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 x402 AI Demo</h1>
          <p class="subtitle">Pay-per-use AI powered by Cronos x402</p>
          
          <div class="feature">
            <h3>💡 What is this?</h3>
            <p>This demo showcases a fork of useAutumn integrated with Cronos x402 for micropayments. Users pay only for what they use - no subscriptions, no upfront costs.</p>
          </div>

          <div class="feature">
            <h3>🔧 Available Endpoints</h3>
            
            <div class="endpoint">
              <span class="badge">POST</span>
              <strong>/ai/chat</strong><br>
              Send a message to Claude AI (requires payment)
            </div>
            
            <div class="endpoint">
              <span class="badge">GET</span>
              <strong>/health</strong><br>
              Check service health
            </div>
            
            <div class="endpoint">
              <span class="badge">GET</span>
              <strong>/stats</strong><br>
              View x402 billing statistics
            </div>
          </div>

          <div class="feature">
            <h3>📊 Try it out</h3>
            <p>Example curl command:</p>
            <div class="endpoint">
              curl -X POST http://localhost:3001/ai/chat \<br>
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br>
              &nbsp;&nbsp;-d '{"userId": "user123", "message": "Hello!"}'<br>
            </div>
          </div>

          <div class="feature">
            <h3>🎯 Hackathon Highlights</h3>
            <ul>
              <li>✅ Real micropayments via Cronos x402</li>
              <li>✅ Usage-based billing (pay per token)</li>
              <li>✅ Automatic payment verification</li>
              <li>✅ Background usage sync to facilitator</li>
              <li>✅ Developer-friendly REST API</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

/**
 * POST /ai/chat
 * Send a message to Claude AI with x402 billing
 */
app.post('/ai/chat', async (c) => {
  try {
    const { userId, message } = await c.req.json();

    if (!userId || !message) {
      return c.json(
        { error: 'userId and message are required' },
        400
      );
    }

    // Step 1: Verify payment
    console.log(`[x402] Verifying payment for user: ${userId}`);
    const verification = await paymentVerifier.verify(userId, 10000); // Require 0.01 CRO

    if (!verification.allowed) {
      return c.json(
        {
          error: 'Payment required',
          reason: verification.reason,
          balance: verification.balance,
          requiredAmount: verification.requiredAmount,
        },
        402
      );
    }

    console.log(`[x402] Payment verified. Balance: ${verification.balance} micro-CRO`);

    // Step 2: Call AI API
    console.log(`[AI] Sending message to Claude...`);
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // Step 3: Track usage
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    console.log(`[x402] Tracking usage: ${inputTokens} input + ${outputTokens} output tokens`);
    
    await usageTracker.trackPrompt(userId, inputTokens, {
      model: 'claude-3-haiku',
      requestId: response.id,
    });

    await usageTracker.trackCompletion(userId, outputTokens, {
      model: 'claude-3-haiku',
      requestId: response.id,
    });

    // Step 4: Return response
    const aiResponse = response.content[0];
    const text = aiResponse.type === 'text' ? aiResponse.text : '';

    return c.json({
      success: true,
      response: text,
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
  } catch (error: any) {
    console.error('[Error]', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      500
    );
  }
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'x402-ai-demo',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /stats
 * Get x402 statistics
 */
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
console.log(`🚀 x402 AI Demo starting on port ${port}`);
console.log(`📊 Dashboard: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};code examples/x402-demo/README.md
