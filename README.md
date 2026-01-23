# Autumn x402

🚀 **Blockchain micropayments for AI inference using Cronos zkEVM's x402 protocol**

## Overview

Autumn x402 integrates Cronos zkEVM's x402 micropayment protocol with AI inference APIs, enabling seamless blockchain payments for AI model usage. This hackathon project demonstrates how x402 can revolutionize AI API monetization with instant, low-cost transactions.

## Key Features

- **Micropayment Integration**: Pay-per-use AI model inference with x402
- **Developer-Friendly**: Simple API integration for AI developers
- **Low-Cost Transactions**: Leverage Cronos zkEVM for efficient payments
- **Real-Time Billing**: Automatic payment tracking and verification
- **No Stripe Required**: All payments settled via x402 on Cronos

## Technical Stack

- **Frontend**: Next.js + TypeScript
- **Backend**: Node.js with x402 integration
- **Blockchain**: Cronos zkEVM testnet
- **Payment Protocol**: x402 for microtransactions
- **Database**: Supabase for tracking

## x402 Implementation

This project implements x402 payment flow:

1. **Attach**: Create x402 payment requirements for API calls
2. **Check**: Verify user payment status
3. **Track**: Monitor usage and billing
4. **Verify**: Confirm x402 transactions on Cronos

## Getting Started

### Prerequisites

- Node.js 18+
- Bun runtime
- Cronos zkEVM wallet with testnet tokens

### Installation

```bash
bun install
```

### Configuration

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
CRONOS_RPC_URL=https://evm-t3.cronos.org
X402_CONTRACT_ADDRESS=0x...
```

### Run Development Server

```bash
bun dev
```

Navigate to `http://localhost:3000`

## Use Cases

- **AI API Monetization**: Charge per inference with x402
- **Agent-to-Agent Payments**: Autonomous AI agents pay each other
- **Developer Tooling**: Built-in billing for AI platforms
- **Microtransactions**: Sub-cent payments for AI usage

## Demo

Watch our demo video: [YouTube Link]

Live demo: [https://autumn-x402.vercel.app](https://autumn-x402.vercel.app)

## Architecture

```
User Request → x402 Check → AI Inference → x402 Verify → Response
```

All payments are settled on Cronos zkEVM using the x402 protocol, eliminating traditional payment overhead.

## Hackathon Project

This is a fork of [useAutumn](https://useautumn.com), re-architected for the Cronos Hackathon to showcase x402 payments for AI applications. Stripe has been completely removed; all payments flow through x402.

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Apache 2.0 - see [LICENSE](LICENSE)

## Links

- [DoraHacks BUIDL](https://dorahacks.io/buidl/xxxxx)
- [GitHub Repository](https://github.com/ideo-org/autumn)
- [Cronos Documentation](https://docs.cronos.org/x402)
- [x402 Protocol](https://docs.cronos.org/x402)

## Contact

Telegram: [@ideoorg](https://t.me/ideoorg)  
Twitter: [@ideo_org](https://twitter.com/ideo_org)
