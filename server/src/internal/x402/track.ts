/**
 * Track Usage for Cronos x402 Billing
 * Records API usage events and syncs to x402 facilitator
 */

import { X402Client } from '../../x402/client';
import { logger } from '../../../lib/logger';

export interface UsageEvent {
  userId: string;
  eventType: 'prompt' | 'completion' | 'api_call' | 'custom';
  quantity: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface UsageRecord {
  id: string;
  userId: string;
  eventType: string;
  quantity: number;
  cost: number; // in micro-CRO
  metadata: Record<string, any>;
  timestamp: Date;
  synced: boolean;
}

export interface TrackingConfig {
  batchSize?: number;
  syncInterval?: number; // milliseconds
  retryAttempts?: number;
}

const DEFAULT_CONFIG: Required<TrackingConfig> = {
  batchSize: 50,
  syncInterval: 60000, // 1 minute
  retryAttempts: 3,
};

/**
 * Usage tracking manager for x402 billing
 * Handles local buffering and background sync to x402
 */
export class UsageTracker {
  private client: X402Client;
  private config: Required<TrackingConfig>;
  private buffer: UsageRecord[] = [];
  private syncTimer?: NodeJS.Timeout;

  constructor(client: X402Client, config: TrackingConfig = {}) {
    this.client = client;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a usage event
   */
  async track(event: UsageEvent): Promise<void> {
    try {
      const record: UsageRecord = {
        id: this.generateId(),
        userId: event.userId,
        eventType: event.eventType,
        quantity: event.quantity,
        cost: this.calculateCost(event),
        metadata: event.metadata || {},
        timestamp: event.timestamp,
        synced: false,
      };

      // Add to buffer
      this.buffer.push(record);

      // Log for debugging
      logger.debug('Usage tracked', {
        eventType: event.eventType,
        userId: event.userId,
        quantity: event.quantity,
      });

      // Trigger batch sync if buffer is full
      if (this.buffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } catch (error) {
      logger.error('Failed to track usage', { error, event });
      throw error;
    }
  }

  /**
   * Track prompt usage (input tokens)
   */
  async trackPrompt(userId: string, tokens: number, metadata?: Record<string, any>): Promise<void> {
    return this.track({
      userId,
      eventType: 'prompt',
      quantity: tokens,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Track completion usage (output tokens)
   */
  async trackCompletion(userId: string, tokens: number, metadata?: Record<string, any>): Promise<void> {
    return this.track({
      userId,
      eventType: 'completion',
      quantity: tokens,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Track API call
   */
  async trackApiCall(userId: string, metadata?: Record<string, any>): Promise<void> {
    return this.track({
      userId,
      eventType: 'api_call',
      quantity: 1,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Flush all pending records to x402
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const recordsToSync = [...this.buffer];
    this.buffer = [];

    try {
      // TODO: Implement actual x402 sync via facilitator
      // For now, simulate sync
      logger.info('Syncing usage records to x402', { count: recordsToSync.length });
      
      // In production, this would call:
      // await this.client.submitUsage(recordsToSync);
      
      // Mark as synced
      recordsToSync.forEach(record => {
        record.synced = true;
      });

      logger.debug('Usage records synced successfully', { count: recordsToSync.length });
    } catch (error) {
      logger.error('Failed to sync usage records', { error });
      // Re-add to buffer for retry
      this.buffer.push(...recordsToSync);
      throw error;
    }
  }

  /**
   * Start automatic background sync
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        logger.error('Auto-sync failed', { error });
      }
    }, this.config.syncInterval);

    logger.info('Usage auto-sync started', { interval: this.config.syncInterval });
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      logger.info('Usage auto-sync stopped');
    }
  }

  /**
   * Get current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Calculate cost for usage event (in micro-CRO)
   * TODO: Implement actual pricing model
   */
  private calculateCost(event: UsageEvent): number {
    const PRICING = {
      prompt: 10, // 10 micro-CRO per token
      completion: 20, // 20 micro-CRO per token
      api_call: 1000, // 1000 micro-CRO per call
      custom: 0,
    };

    const unitPrice = PRICING[event.eventType] || 0;
    return unitPrice * event.quantity;
  }

  /**
   * Generate unique ID for usage record
   */
  private generateId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a usage tracker instance
 */
export function createUsageTracker(
  client: X402Client,
  config?: TrackingConfig
): UsageTracker {
  return new UsageTracker(client, config);
}