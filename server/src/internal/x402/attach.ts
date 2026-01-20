/**
 * x402 Attach - Create/upgrade entitlement and generate x402 payment requirements
 * 
 * This module handles the "attach" flow for x402-native billing:
 * 1. Look up plan pricing from Autumn's pricing config
 * 2. Create entitlement record with PENDING_PAYMENT status
 * 3. Generate x402 paymentRequirements via facilitator client
 * 4. Return payment requirements for frontend/agent to settle
 */

import { createPaymentRequirements } from '../../x402/client';
import type { X402PaymentRequirements } from '../../x402/types';

// Mock types - in production, import from Autumn's actual DB schema
interface Plan {
  id: string;
  name: string;
  priceAmount: string; // Amount in smallest unit (e.g., cents, wei)
  billingCycle: 'monthly' | 'yearly' | 'one_time';
}

interface Entitlement {
  id: string;
  customerId: string;
  planId: string;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  x402PaymentId?: string;
  x402TxHash?: string;
  x402VerifiedAt?: Date;
  createdAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
}

/**
 * x402Attach - Create entitlement and generate payment requirements
 */
export async function x402Attach(params: {
  customerId: string;
  planId: string;
  organizationId?: string;
}): Promise<{
  entitlementId: string;
  paymentRequirements: X402PaymentRequirements;
  plan: Plan;
}> {
  const { customerId, planId, organizationId } = params;

  // Step 1: Look up plan pricing
  // In production, query Autumn's actual plans table
  // For hackathon, we'll use a mock plan lookup
  const plan = await mockGetPlan(planId);

  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }

  // Step 2: Create entitlement record with PENDING_PAYMENT status
  // In production, insert into Autumn's subscriptions/entitlements table
  const entitlement = await mockCreateEntitlement({
    customerId,
    planId,
    status: 'PENDING_PAYMENT',
    organizationId,
  });

  // Step 3: Generate x402 payment requirements
  const paymentRequirements = await createPaymentRequirements({
    amount: plan.priceAmount,
    description: `Subscription: ${plan.name} (${plan.billingCycle})`,
    buyer: customerId,
    scheme: 'exact',
  });

  // Step 4: Store payment requirement ID with entitlement
  // In production, update the entitlement record
  await mockUpdateEntitlement(entitlement.id, {
    x402PaymentId: paymentRequirements.id,
  });

  return {
    entitlementId: entitlement.id,
    paymentRequirements,
    plan,
  };
}

/**
 * Mock functions - Replace with actual Autumn DB queries in production
 */

// Mock plan lookup
async function mockGetPlan(planId: string): Promise<Plan | null> {
  // In production: SELECT * FROM plans WHERE id = planId
  const mockPlans: Record<string, Plan> = {
    'pro_monthly': {
      id: 'pro_monthly',
      name: 'Pro Plan',
      priceAmount: '1000000', // 1 USDC (6 decimals)
      billingCycle: 'monthly',
    },
    'starter_monthly': {
      id: 'starter_monthly',
      name: 'Starter Plan',
      priceAmount: '500000', // 0.5 USDC
      billingCycle: 'monthly',
    },
  };

  return mockPlans[planId] || null;
}

// Mock entitlement creation
let mockEntitlementCounter = 1;

async function mockCreateEntitlement(data: {
  customerId: string;
  planId: string;
  status: string;
  organizationId?: string;
}): Promise<Entitlement> {
  // In production: INSERT INTO subscriptions/entitlements ...
  const entitlement: Entitlement = {
    id: `ent_${mockEntitlementCounter++}_${Date.now()}`,
    customerId: data.customerId,
    planId: data.planId,
    status: data.status as Entitlement['status'],
    createdAt: new Date(),
  };

  return entitlement;
}

// Mock entitlement update
async function mockUpdateEntitlement(
  entitlementId: string,
  updates: Partial<Entitlement>
): Promise<void> {
  // In production: UPDATE subscriptions/entitlements SET ... WHERE id = entitlementId
  // For hackathon, we just log the update
  console.log(`[x402] Updated entitlement ${entitlementId}:`, updates);
}
