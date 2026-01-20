/**
 * Payment Verification for Cronos x402
 * Validates user payments before granting API access
 */

import { X402Client } from '../../x402/client';
import { logger } from '../../../lib/logger';

export interface PaymentStatus {
  isPaid: boolean;
  balance: number; // in micro-CRO
  lastPayment?: Date;
  expiresAt?: Date;
}

export interface VerificationResult {
  allowed: boolean;
  reason?: string;
  balance: number;
  requiredAmount?: number;
}

export interface VerificationConfig {
  minBalance?: number; // minimum balance in micro-CRO
  cacheTimeout?: number; // milliseconds
  strictMode?: boolean;
}

const DEFAULT_CONFIG: Required<VerificationConfig> = {
  minBalance: 1000000, // 1 CRO in micro-CRO
  cacheTimeout: 300000, // 5 minutes
  strictMode: false,
};

/**
 * Payment verifier for x402
 * Checks if users have sufficient balance before allowing access
 */
export class PaymentVerifier {
  private client: X402Client;
  private config: Required<VerificationConfig>;
  private cache: Map<string, { status: PaymentStatus; timestamp: number }> = new Map();

  constructor(client: X402Client, config: VerificationConfig = {}) {
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Verify if user has valid payment
   */
  async verify(userId: string, requiredAmount?: number): Promise<VerificationResult> {
    try {
      // Check cache first
      const cached = this.getFromCache(userId);
      if (cached) {
        return this.evaluatePayment(cached, requiredAmount);
      }

      // Fetch payment status from x402
      const status = await this.fetchPaymentStatus(userId);
      
      // Cache the result
      this.cache.set(userId, {
        status,
        timestamp: Date.now(),
      });

      return this.evaluatePayment(status, requiredAmount);
    } catch (error) {
      logger.error('Payment verification failed', { error, userId });
      
      if (this.config.strictMode) {
        return {
          allowed: false,
          reason: 'Verification error',
          balance: 0,
        };
      }
      
      // In non-strict mode, allow with warning
      logger.warn('Allowing access despite verification error (non-strict mode)');
      return {
        allowed: true,
        reason: 'Verification unavailable',
        balance: 0,
      };
    }
  }

  /**
   * Verify payment before API call
   */
  async verifyForApiCall(userId: string, estimatedCost: number): Promise<VerificationResult> {
    return this.verify(userId, estimatedCost);
  }

  /**
   * Batch verify multiple users
   */
  async verifyBatch(userIds: string[]): Promise<Map<string, VerificationResult>> {
    const results = new Map<string, VerificationResult>();
    
    await Promise.all(
      userIds.map(async (userId) => {
        const result = await this.verify(userId);
        results.set(userId, result);
      })
    );
    
    return results;
  }

  /**
   * Clear cache for specific user or all users
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
      logger.debug('Cache cleared for user', { userId });
    } else {
      this.cache.clear();
      logger.debug('All cache cleared');
    }
  }

  /**
   * Get payment status from cache
   */
  private getFromCache(userId: string): PaymentStatus | null {
    const cached = this.cache.get(userId);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is still valid
    const age = Date.now() - cached.timestamp;
    if (age > this.config.cacheTimeout) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.status;
  }

  /**
   * Fetch payment status from x402 facilitator
   */
  private async fetchPaymentStatus(userId: string): Promise<PaymentStatus> {
    logger.debug('Fetching payment status from x402', { userId });
    
    // TODO: Implement actual x402 API call
    // For now, simulate with mock data
    
    // In production, this would call:
    // const response = await this.client.getPaymentStatus(userId);
    // return response.data;
    
    // Mock implementation
    const mockBalance = Math.random() * 10000000; // Random balance
    
    return {
      isPaid: mockBalance >= this.config.minBalance,
      balance: Math.floor(mockBalance),
      lastPayment: new Date(Date.now() - Math.random() * 86400000),
      expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
    };
  }

  /**
   * Evaluate if payment status allows access
   */
  private evaluatePayment(
    status: PaymentStatus,
    requiredAmount?: number
  ): VerificationResult {
    const required = requiredAmount || this.config.minBalance;
    
    // Check if expired
    if (status.expiresAt && status.expiresAt < new Date()) {
      return {
        allowed: false,
        reason: 'Payment expired',
        balance: status.balance,
        requiredAmount: required,
      };
    }
    
    // Check balance
    if (status.balance < required) {
      return {
        allowed: false,
        reason: 'Insufficient balance',
        balance: status.balance,
        requiredAmount: required,
      };
    }
    
    // All checks passed
    return {
      allowed: true,
      balance: status.balance,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Create a payment verifier instance
 */
export function createPaymentVerifier(
  client: X402Client,
  config?: VerificationConfig
): PaymentVerifier {
  return new PaymentVerifier(client, config);
}

/**
 * Middleware helper for Express/Hono
 */
export function createVerificationMiddleware(
  verifier: PaymentVerifier
) {
  return async (userId: string, estimatedCost?: number) => {
    const result = await verifier.verify(userId, estimatedCost);
    
    if (!result.allowed) {
      const error: any = new Error(result.reason || 'Payment verification failed');
      error.statusCode = 402;
      error.details = result;
      throw error;
    }
    
    return result;
  };
}