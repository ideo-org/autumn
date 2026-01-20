# Quick Start Guide - x402 AI Demo

## 🚀 Get Running in 2 Minutes

### Step 1: Get Your Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy your API key

### Step 2: Setup

```bash
cd examples/x402-demo
npm install
cp .env.example .env
```

### Step 3: Add Your API Key

Edit `.env` file and add your key:
```
GEMINI_API_KEY=YOUR_ACTUAL_KEY_HERE
```

### Step 4: Run

```bash
npm run dev
```

### Step 5: Test

Open your browser to: http://localhost:3001

---

## 🧪 Test the API

### Interactive Web UI
Just open http://localhost:3001 and use the form!

### cURL Command
```bash
curl -X POST http://localhost:3001/ai/chat \\
  -H "Content-Type: application/json" \\
  -d '{"userId": "user123", "message": "Explain Cronos blockchain"}'
```

### Expected Response
```json
{
  "success": true,
  "response": "Cronos is...",
  "usage": {
    "inputTokens": 5,
    "outputTokens": 50,
    "totalTokens": 55
  },
  "billing": {
    "cost": 1050,
    "balance": 10000000
  }
}
```

---

## 📊 What This Demonstrates

✅ **Payment Verification**: Every request checks x402 balance first  
✅ **Usage Tracking**: Tracks input/output tokens automatically  
✅ **Real AI**: Actual Gemini API responses  
✅ **Micropayments**: Shows cost in micro-CRO per request  

---

## 🐛 Troubleshooting

### "No API key" error
- Make sure you added `GEMINI_API_KEY` to `.env`
- The key should start with `AI...`

### Port already in use
- Change `PORT=3002` in `.env`
- Or kill the process using port 3001

### Dependencies issue
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🎆 Ready for Demo!

Once running, you can:
1. Show the beautiful web UI
2. Test live AI chat with x402 billing
3. Show console logs with payment tracking
4. Record a quick video demo

