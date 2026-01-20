# Stripe Removal Strategy (Pragmatic Hackathon Approach)

## Strategy: Parallel x402 Implementation

For the hackathon MVP, we're taking a pragmatic approach:

### What We'll Do

1. **CREATE new x402-native routers** instead of modifying existing Stripe code
2. **KEEP Stripe code intact** to avoid breaking dependencies
3. **ADD clear documentation** showing which APIs are x402-native
4. **BUILD demo** that exclusively uses the x402 APIs

This approach is:
- ✅ **Faster**: No risk of breaking existing code
- ✅ **Cleaner**: New code is 100% x402-focused
- ✅ **Safer**: Old code remains as reference
- ✅ **Hackathon-friendly**: Judges can see clear before/after

### File Structure

```
server/src/
├── x402/                          # NEW: x402 facilitator client
│   ├── client.ts
│   └── types.ts
├── routers/
│   ├── x402Router.ts              # NEW: x402-native API endpoints
│   ├── apiRouter.ts               # OLD: Stripe-based (kept for reference)
│   ├── internalRouter.ts          # OLD: Stripe internals (kept)
│   └── publicRouter.ts            # MODIFIED: Add x402Router
└── internal/
    ├── x402/                      # NEW: x402-native billing logic
    │   ├── attach.ts
    │   ├── check.ts
    │   └── track.ts
    └── api/                       # OLD: Stripe billing logic (kept)
```

### New x402 API Endpoints

We'll create these routes under `/x402/` prefix:

- `POST /x402/attach` - Create entitlement + generate x402 payment requirements
- `POST /x402/check` - Check feature access and usage limits
- `POST /x402/track` - Record usage events
- `POST /x402/verify` - Verify x402 payment and activate entitlement

### Implementation Steps

1. ✅ Create x402 facilitator client
2. ⬜ Create `server/src/internal/x402/` modules:
   - `attach.ts` - Entitlement creation logic
   - `check.ts` - Permission checking logic
   - `track.ts` - Usage tracking logic
3. ⬜ Create `server/src/routers/x402Router.ts` - HTTP endpoints
4. ⬜ Wire x402Router into main server
5. ⬜ Add database migration for x402 fields
6. ⬜ Build demo AI app that uses x402 APIs

### Existing Stripe Code We'll Keep

**Do NOT modify these** (to avoid breaking things):
- `server/src/internal/api/*` - Stripe API handlers
- `server/src/internal/invoices/*` - Stripe invoice logic
- `server/src/routers/apiRouter.ts` - Original API routes
- Stripe error middleware
- Stripe cron jobs

These will simply remain **unused** in our x402 demo.

### Benefits of This Approach

**For the Hackathon**:
- Clear separation between "old Stripe code" and "new x402 code"
- Can demo both side-by-side if needed
- Judges can see exactly what we built
- No risk of broken builds

**For Judging**:
- `/x402/` prefix makes it obvious which APIs are x402-native
- Clean, focused implementation without legacy cruft
- Easy to extract into standalone library later

**For Production** (if we win residency):
- Clean codebase to iterate on
- Can gradually deprecate Stripe routes
- Or maintain both for hybrid deployments

---

## Next: Implement x402 Billing Logic

Now we'll build the three core modules:

### 1. `server/src/internal/x402/attach.ts`

```typescript
/**
 * Create/upgrade entitlement and generate x402 payment requirements
 */
export async function x402Attach(params: {
  customerId: string;
  planId: string;
}) {
  // 1. Look up plan pricing
  // 2. Create entitlement record (PENDING_PAYMENT)
  // 3. Generate x402 paymentRequirements
  // 4. Return { entitlementId, paymentRequirements }
}
```

### 2. `server/src/internal/x402/check.ts`

```typescript
/**
 * Check if customer can use a feature
 */
export async function x402Check(params: {
  customerId: string;
  featureId: string;
  quantity?: number;
}) {
  // 1. Find active x402-backed entitlements
  // 2. Check usage vs limits
  // 3. Return { allowed, remaining, suggestedPayment? }
}
```

### 3. `server/src/internal/x402/track.ts`

```typescript
/**
 * Record usage event
 */
export async function x402Track(params: {
  customerId: string;
  featureId: string;
  value: number;
}) {
  // 1. Increment usage
  // 2. If over limit, mark status
  // 3. Return { needsPayment?, suggestedPayment? }
}
```

### 4. `server/src/internal/x402/verify.ts`

```typescript
/**
 * Verify x402 payment and activate entitlement
 */
export async function x402Verify(params: {
  entitlementId: string;
  txHash: string;
}) {
  // 1. Call x402 client to verify payment
  // 2. Update entitlement status to ACTIVE
  // 3. Return success
}
```

---

## Database Changes Needed

We'll add x402 fields to existing tables via migration:

```sql
-- Add x402 fields to entitlements or subscriptions table
ALTER TABLE subscriptions ADD COLUMN x402_tx_hash VARCHAR(66);
ALTER TABLE subscriptions ADD COLUMN x402_payment_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN x402_verified_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN x402_status VARCHAR(50);
```

OR create a new x402_entitlements table to keep things completely separate.

---

This strategy lets us ship fast and clean for the hackathon! 🚀
