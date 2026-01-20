# Autumn-x402 Hackathon Engineering Notes

## Project Overview

This is a fork of Autumn (YC-backed billing infrastructure) reworked into **Autumn-x402**, a Cronos-first, x402-native pricing and billing engine for AI apps and agents.

- **Original Autumn**: Sits between apps and Stripe, managing pricing, features, usage, and credits
- **Autumn-x402**: Replaces Stripe entirely with x402 Facilitator on Cronos EVM for all payment settlement
- **Target hackathon**: Cronos x402 Payment Hackathon (Main Track + Dev Tooling Track)

---

## Architecture Understanding

### Original Autumn Components

1. **Pricing Layer** (`server/src/internal/pricing`):
   - Products, Plans, Features stored in Postgres
   - Flexible pricing models: usage & overage, credits, seat-based, pay upfront
   - Exposed via server APIs for config management

2. **Billing Engine** (`server/src/internal/billing`):
   - Decides `allowed/remaining` based on entitlements + usage
   - Three core APIs: `/attach`, `/check`, `/track`
   - Originally tied to Stripe subscriptions and invoices

3. **Dashboard** (React/Vite app):
   - Reading from the same APIs for analytics and configuration
   - Shows customers, usage, payments, and plan management

4. **External Integrations**:
   - Stripe for payments (Checkout, Billing Portal, webhooks)
   - Supabase for Postgres DB
   - Optional: ClickHouse, Axiom, SVIX for analytics/events

### What We Learned from Codebase Exploration

**Stripe Usage Points** (from grep search):
- `server/src/cron/invoiceCron/runInvoiceCron.ts` - invoice processing
- `server/src/honoMiddlewares/errorMiddleware.ts` - Stripe error handling
- `server/src/honoMiddlewares/errorSkipMiddleware.ts` - more Stripe error handling
- `server/src/utils/authUtils/afterOrgCreated.ts` - Stripe Connect account creation

These are the main integration points we need to replace/remove for x402.

---

## x402 Integration Design

### New x402 Module (`server/src/x402/`)

Created two core files:

#### 1. `types.ts` - TypeScript Interfaces
```typescript
- X402PaymentRequirements: represents a payment request (id, seller, buyer, amount, etc.)
- X402PaymentVerification: verification result from on-chain tx
- X402Config: network, facilitatorUrl, sellerAddress, assetAddress
- PaymentStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED'
```

#### 2. `client.ts` - x402 Facilitator Client
```typescript
- createPaymentRequirements(amount, description): generates x402 payment request
- verifyPayment(txHash): checks if on-chain payment is valid
- getPaymentStatus(paymentId): queries status
- getConfig() / updateConfig(): config management
```

**Note**: Current implementation uses mocks for hackathon speed. TODOs mark where real x402 facilitator API calls should go.

### Environment Configuration

Replaced Stripe env vars in `server/.env.example`:
```env
# OLD (Stripe)
ENCRYPTION_IV=
ENCRYPTION_PASSWORD=
STRIPE_WEBHOOK_URL=
LOCALTUNNEL_RESERVED_KEY=

# NEW (x402)
CRONOS_NETWORK=cronos-testnet
X402_FACILITATOR_URL=https://x402-facilitator-api.cronos.org
SELLER_ADDRESS=0xYourSellerAddress
ASSET_ADDRESS=0xYourAssetAddress  # devUSDC.e on testnet
```

---

## API Transformation Plan

### `/attach` (create/upgrade entitlement)

**Original flow**:
1. Look up plan pricing
2. Create Stripe session/subscription
3. Return Stripe Checkout URL

**New x402 flow**:
1. Look up plan pricing
2. Create entitlement record (status: PENDING_PAYMENT)
3. Call `createPaymentRequirements()` from x402 client
4. Return `{ entitlementId, paymentRequirements }` to frontend/agent
5. Frontend/agent signs & settles via x402
6. Callback/poll marks entitlement ACTIVE after verification

### `/check` (authorization & limit check)

**Original flow**:
1. Query Stripe subscription status
2. Check usage against limits
3. Return `{ allowed, remaining, reason }`

**New x402 flow**:
1. Query entitlements backed by verified x402 payments
2. Check usage against limits
3. Return `{ allowed, remaining, suggestedPayment? }`
4. `suggestedPayment` contains x402 params for top-up/upgrade

### `/track` (usage event)

**Original flow**:
1. Increment usage counters
2. Queue Stripe invoice if overage

**New x402 flow**:
1. Increment usage counters
2. When crossing thresholds, set status and return:
   `{ needsPayment: true, suggestedPayment: { amount, description } }`

---

## Key Decisions & Tradeoffs

### Why Fork Autumn?
- Proven pricing logic and ergonomics (used by YC startups)
- Well-architected separation of pricing/billing/dashboard
- Saves weeks of building billing primitives from scratch
- Clear differentiation: "Autumn for Cronos/x402" vs "Stripe for x402"

### Why Remove Stripe Entirely?
- Cleaner narrative: "x402-native" not "hybrid"
- Simpler implementation for hackathon timeline
- Shows full commitment to Cronos ecosystem
- Easier to explain: "Autumn but x402 instead of Stripe"

### Hackathon Scope Choices
- **Mocked facilitator**: speeds up dev, TODOs mark real API spots
- **Manual renewal**: skip auto-recurring cron for hackathon MVP
- **Single asset**: devUSDC.e only (no multi-token complexity)
- **Simplified verification**: accept valid txHash format as proof

---

## Differentiation from Competing Projects

### vs "Stripe-Grade x402 Dashboard"

**Their angle**: Subscription SaaS with dashboard for sellers/buyers
- Focus: checkout UX + analytics for video/content subscriptions
- Architecture: end-user product with embedded dashboard

**Our angle**: Reusable pricing & billing engine for all Cronos builders
- Focus: **infra** that any AI/x402 app plugs into
- Architecture: open-source SDK/library + reference demo
- Value prop: "Don't build billing yourself; use Autumn-x402"

Judges can award both: theirs for "best subscription app", ours for "best dev tooling".

---

## Next Steps (Implementation Order)

1. ✅ Document fork goals (README)
2. ✅ Create x402 client module
3. ✅ Update environment config
4. ⬜ Remove Stripe integration code
5. ⬜ Rewire `/attach`, `/check`, `/track` to x402
6. ⬜ Add database schema for x402 fields
7. ⬜ Update dashboard to show x402 transactions
8. ⬜ Build demo AI app with end-to-end flow
9. ⬜ Polish docs and demo video

---

## Learnings & Gotchas

- Autumn uses Bun as runtime (not Node), so ensure compatibility
- Database migrations via Drizzle ORM in `scripts/migrations/`
- Hono framework for server (fast, minimal)
- Environment setup script: `bun setup` auto-generates .env and Supabase instance
- OTP login via console (no email in dev mode) makes demo easier

---

## Demo Video Script (Draft)

1. **Intro (15s)**: "Autumn-x402 brings Stripe-grade billing to Cronos x402. It's a fork of Autumn, YC's pricing infra, reworked to use x402 instead of Stripe."

2. **Problem (20s)**: "Every AI app on Cronos needs pricing: free tiers, usage limits, credits, subscriptions. Building this from scratch takes weeks."

3. **Solution (30s)**: Show dashboard, configure a plan with free tier + overage, define features.

4. **Live Demo (60s)**:
   - Open demo AI app
   - Show `/check` allows N free calls
   - Hit limit, see "Top up" modal
   - Show x402 paymentRequirements
   - Simulate payment (mock txHash)
   - Verify entitlement active, continue using app

5. **Tech Deep Dive (30s)**: Quick code walkthrough of `attach/check/track` and x402 client.

6. **Ecosystem Value (15s)**: "Any Cronos AI builder can now add usage-based billing in hours. Open-source, x402-native, production-ready."

---

## Commit Log (for judges)

- `chore: document autumn-x402 fork goals and setup`
- `feat: add x402 facilitator client for cronos`
- (next) `refactor: remove stripe billing integration`
- (next) `feat: implement x402-based attach/check/track APIs`
- ...
