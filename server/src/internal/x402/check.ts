/**
 * x402 Check - Authorization and usage limit checking
 * 
 * This module handles the "check" flow for x402-native billing:
 * 1. Find active x402-backed entitlements for the customer
 * 2. Check usage against limits (free tier, included units, etc.)
 * 3. Return permission status and suggested payment if needed
 */

import type { X402PaymentRequirements } from '../../x402/types';
import { createPaymentRequirements } from '../../x402/client';

// Mock types
interface Feature {
  id: string;
  name: string;
  freeUnitsPerPeriod?: number;
  pricePerUnit?: string; // For overage/top-ups
  unitSize?: number; // e.g., 1000 tokens per unit
}

interface UsageRecord {
  customerId: string;
  featureId: string;
  totalUsage: number;
  periodStart: Date;
  periodEnd: Date;
}

interface CheckResult {
  allowed: boolean;
  remaining?: number;
  reason?: 'NO_PLAN' | 'LIMIT_REACHED' | 'NO_CREDITS' | 'OK';
  suggestedPayment?: {
    type: 'TOP_UP' | 'SUBSCRIPTION' | 'OVERAGE';
    amount: string;
    description: string;
    paymentRequirements: X402PaymentRequirements;
  };
}

/**
 * x402Check - Check if customer can use a feature
 */
export async function x402Check(params: {
  customerId: string;
  featureId: string;
  quantity?: number;
}): Promise<CheckResult> {
  const { customerId, featureId, quantity = 1 } = params;

  // Step 1: Look up feature configuration
  const feature = await mockGetFeature(featureId);

  if (!feature) {
    return {
      allowed: false,
      reason: 'NO_PLAN',
    };
  }

  // Step 2: Check if customer has active x402-backed entitlements
  const hasActiveEntitlement = await mockCheckActiveEntitlement(customerId, featureId);

  if (!hasActiveEntitlement && !feature.freeUnitsPerPeriod) {
    // No active entitlement and no free tier
    const paymentRequirements = await createPaymentRequirements({
      amount: feature.pricePerUnit || '1000000', // Default 1 USDC
      description: `Access to ${feature.name}`,
      buyer: customerId,
    });

    return {
      allowed: false,
      reason: 'NO_PLAN',
      suggestedPayment: {
        type: 'SUBSCRIPTION',
        amount: feature.pricePerUnit || '1000000',
        description: `Subscribe to access ${feature.name}`,
        paymentRequirements,
      },
    };
  }

  // Step 3: Check usage against limits
  const usage = await mockGetUsage(customerId, featureId);
  const limit = feature.freeUnitsPerPeriod || Number.POSITIVE_INFINITY;
  const remaining = Math.max(0, limit - usage.totalUsage);

  if (remaining < quantity) {
    // Limit reached, suggest overage payment
    const overageUnits = feature.unitSize || 1000;
    const overageAmount = feature.pricePerUnit || '100000'; // 0.1 USDC default

    const paymentRequirements = await createPaymentRequirements({
      amount: overageAmount,
      description: `Top up ${overageUnits} ${feature.name} units`,
      buyer: customerId,
    });

    return {
      allowed: false,
      remaining: 0,
      reason: 'LIMIT_REACHED',
      suggestedPayment: {
        type: 'OVERAGE',
        amount: overageAmount,
        description: `Buy ${overageUnits} more units for ${feature.name}`,
        paymentRequirements,
      },
    };
  }

  // Step 4: Allow usage
  return {
    allowed: true,
    remaining,
    reason: 'OK',
  };
}

/**
 * Mock functions - Replace with actual Autumn DB queries in production
 */

async function mockGetFeature(featureId: string): Promise<Feature | null> {
  // In production: SELECT * FROM features WHERE id = featureId
  const mockFeatures: Record<string, Feature> = {
    'ai_calls': {
      id: 'ai_calls',
      name: 'AI API Calls',
      freeUnitsPerPeriod: 10, // 10 free calls per period
      pricePerUnit: '100000', // 0.1 USDC per 100 calls
      unitSize: 100,
    },
    'ai_tokens': {
      id: 'ai_tokens',
      name: 'AI Tokens',
      freeUnitsPerPeriod: 1000, // 1k free tokens
      pricePerUnit: '10000', // 0.01 USDC per 1k tokens
      unitSize: 1000,
    },
  };

  return mockFeatures[featureId] || null;
}

async function mockCheckActiveEntitlement(
  customerId: string,
  featureId: string
): Promise<boolean> {
  // In production: Query subscriptions/entitlements for active x402-backed plans
  // For hackathon, assume customer has active entitlement if we've seen them before
  return Math.random() > 0.3; // 70% have active entitlements
}

async function mockGetUsage(
  customerId: string,
  featureId: string
): Promise<UsageRecord> {
  // In production: SELECT SUM(value) FROM usage_events WHERE customerId = ... AND featureId = ...
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    customerId,
    featureId,
    totalUsage: Math.floor(Math.random() * 15), // Random usage between 0-15
    periodStart,
    periodEnd,
  };
}
