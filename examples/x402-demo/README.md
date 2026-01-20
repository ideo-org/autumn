# x402 AI Demo

Pay-per-use AI application powered by Cronos x402 micropayments.

## Overview

This demo showcases how to integrate Cronos x402 billing into an AI application. Users pay only for what they use - no subscriptions, no upfront costs.

## Features

- ✅ Real micropayments via Cronos x402
- ✅ Usage-based billing (pay per token)
- ✅ Automatic payment verification
- ✅ Background usage sync to facilitator
- ✅ Developer-friendly REST API
- ✅ Beautiful web dashboard

## Quick Start

### Prerequisites

- Node.js 18+
- Cronos x402 facilitator running
- Anthropic API key

### Setup

1. Install dependencies:
```bash
cd examples/x402-demo
npm install
```

2. Configure environment:
```bash
cp ../../.env.example .env
# Edit .env and set:
# X402_FACILITATOR_URL=http://localhost:4402
# X402_API_KEY=your_api_key
# ANTHROPIC_API_KEY=your_anthropic_key
```

3. Run the demo:
```bash
npm run dev
```

4. Open http://localhost:3001

## API Endpoints

### POST /ai/chat
Send a message to Claude AI with x402 billing.

**Request:**
```json
{
  "userId": "user123",
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Hello! I'm doing well...",
  "usage": {
    "inputTokens": 5,
    "outputTokens": 10,
    "totalTokens": 15
  },
  "billing": {
    "cost": 250,
    "balance": 1000000
  }
}
```

### GET /stats
View x402 system statistics.

**Response:**
```json
{
  "usageBuffer": {
    "pendingRecords": 3
  },
  "verificationCache": {
    "size": 2,
    "entries": ["user123", "user456"]
  },
  "facilitator": {
    "url": "http://localhost:4402"
  }
}
```

## How it Works

1. **Payment Verification**: Before processing requests, the app verifies the user has sufficient balance via x402
2. **AI Processing**: If payment is verified, the request is sent to Claude AI
3. **Usage Tracking**: Token usage is tracked and queued for billing
4. **Background Sync**: Usage records are automatically synced to the x402 facilitator

## Pricing

- Input tokens: 10 micro-CRO per token
- Output tokens: 20 micro-CRO per token
- Minimum balance: 100,000 micro-CRO (0.1 CRO)

## Hackathon Notes

This project is a fork of [useAutumn](https://github.com/useautumn/autumn) adapted for Cronos x402. The integration demonstrates:

- How to monetize AI APIs with micropayments
- Real-time usage-based billing
- Developer tools for payment infrastructure
- Seamless Cronos blockchain integration

## License

MIT (same as useAutumn)
