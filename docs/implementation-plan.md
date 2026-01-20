# Autumn-x402 Implementation Plan

## Phase 1: Core x402 Integration (Priority 1)

### 1.1 Create x402 Facilitator Client
**File**: `server/src/x402/client.ts`

```typescript
// Wrapper around Cronos x402 Facilitator API
- createPaymentRequirements(amount, description, assetAddress, seller)
- verifyPayment(txHash)
- getPaymentStatus(paymentId)
```

**Environment Variables** (`server/.env.example`):
```
CRONOS_NETWORK=cronos-testnet
X402_FACILITATOR_URL=https://x402-facilitator-api.cronos.org
SELLER_ADDRESS=0x...
ASSET_ADDRESS=0x... # devUSDC.e on testnet
```

### 1.2 Remove Stripe Dependencies
**Files to modify**:
- `server/package.json` - remove `stripe` package
- Search codebase for `stripe` imports and replace/remove
- Delete Stripe checkout/billing portal logic

### 1.3 Rewire Core APIs to x402

#### `/attach` endpoint
**Current behavior**: Creates Stripe session
**New behavior**:
1. Look up plan pricing
2. Create entitlement record (status: PENDING_PAYMENT)
3. Call x402 client to generate paymentRequirements
4. Return: `{ entitlementId, paymentRequirements }`

#### `/check` endpoint  
**Current behavior**: Checks Stripe subscription status + usage
**New behavior**:
1. Query entitlements backed by verified x402 payments
2. Check usage against limits
3. Return: `{ allowed, remaining, suggestedPayment? }`

#### `/track` endpoint
**Current behavior**: Increment usage, queue Stripe invoice if needed
**New behavior**:
1. Increment usage
2. If limit crossed, set status and return `{ needsPayment: true, suggestedPayment }`

---

## Phase 2: Data Model Updates

### 2.1 Database Schema Changes
**Migration**: `scripts/migrations/add_x402_fields.sql`

Add to `entitlements` table:
```sql
- x402TxHash VARCHAR(66)
- x402PaymentId VARCHAR(255)
- x402VerifiedAt TIMESTAMP
- status ENUM('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED')
```

Add `credit_balances` table (if using credits):
```sql
CREATE TABLE credit_balances (
  customerId UUID PRIMARY KEY,
  credits DECIMAL(18,8) NOT NULL DEFAULT 0,
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 3: Pricing Patterns Implementation

### 3.1 Free Tier + Metered Overage
- Config: `freeUnitsPerPeriod`, `pricePerUnit`, `unitSize`
- Logic: `check` allows until free units consumed, then suggests x402 payment for overage pack

### 3.2 Credits Wallet
- Config: features have `costPerUnitInCredits`
- Top-up via x402 → adds credits
- `track` decrements credits
- `check` returns suggestedPayment when credits low

### 3.3 Subscription with Limits
- Config: `pricePerPeriod`, `billingCycle`, `includedUnitsPerFeature`
- Initial x402 payment activates subscription
- For hackathon: manual renewal button (stretch: auto-renew cron)

---

## Phase 4: Dashboard Updates

### 4.1 Payment History View
- Show x402 transactions instead of Stripe invoices
- Columns: txHash, amount, asset, status, timestamp
- Link to Cronos explorer for each tx

### 4.2 Entitlements View
- Show active/pending entitlements with x402 verification status
- Display last x402TxHash and verification time

---

## Phase 5: Demo AI App (Reference Implementation)

### 5.1 Simple AI Chat Frontend
**Location**: `examples/ai-app/`

- Text input → calls backend AI endpoint
- Before each call: `POST /api/entitlements/check` with `featureId='ai_calls'`
- If not allowed: show "Upgrade / Top up" modal
- Modal triggers `POST /api/entitlements/attach` → displays x402 paymentRequirements
- After user settles payment: poll or callback to mark entitlement active
- After successful AI response: `POST /api/entitlements/track`

### 5.2 x402 Payment Flow UI
- Display payment requirements (amount, asset, seller)
- Show "Sign & Pay" button (for hackathon, can simulate or use MetaMask)
- After settlement, show success + tx hash link to Cronos explorer

---

## Phase 6: Testing & Polish

### 6.1 Unit Tests
- x402 client: mock facilitator responses
- attach/check/track: verify correct x402 flows

### 6.2 Integration Test
- End-to-end flow: create plan → attach → mock x402 payment → verify entitlement active → check/track

### 6.3 Documentation
- Update README with x402-specific setup
- Add "Quickstart on Cronos" guide
- Document pricing patterns with x402 examples

---

## Commit Strategy

1. ✅ `chore: document autumn-x402 fork goals and setup`
2. `refactor: remove stripe billing integration`
3. `feat: add x402 facilitator client for cronos`
4. `feat: implement x402-based attach/check/track APIs`
5. `feat: add entitlements and x402 payment tracking schema`
6. `feat: update dashboard for x402 payments view`
7. `feat: add demo AI app using autumn-x402`
8. `docs: add cronos x402 quickstart and pricing patterns`

---

## Success Criteria for Hackathon

- [ ] Autumn APIs (`attach`, `check`, `track`) work with x402 instead of Stripe
- [ ] At least one pricing pattern fully demonstrated (free tier + overage)
- [ ] Demo AI app showing end-to-end flow with x402 payment
- [ ] Dashboard displays x402 transactions with Cronos explorer links
- [ ] Clear differentiation from "Stripe-Grade x402 dashboard" project
- [ ] Documentation explains how other Cronos builders can use Autumn-x402
