/**
 * Cronos x402 Router
 * HTTP endpoints for x402 payment and billing
 */

import { Hono } from 'hono';
import { createX402Client } from '../x402/client';
import {
  attachX402Billing,
  checkX402Payment,
  createUsageTracker,
  createPaymentVerifier,
} from '../internal/x402';
import { logger } from '../../lib/logger';

// Initialize x402 router
export const x402Router = new Hono();

// Initialize x402 client
const x402Client = createX402Client({
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'http://localhost:4402',
  apiKey: process.env.X402_API_KEY,
});

// Initialize usage tracker and verifier
const usageTracker = createUsageTracker(x402Client);
const paymentVerifier = createPaymentVerifier(x402Client);

// Start auto-sync for usage tracking
usageTracker.startAutoSync();

/**
 * POST /x402/attach
 * Attach x402 billing to a user
 */
x402Router.post('/attach', async (c) => {
  try {
    const { userId, planId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }
    
    const result = await attachX402Billing(x402Client, userId, {
      planId: planId || 'default',
    });
    
    logger.info('x402 billing attached', { userId, result });
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to attach x402 billing', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to attach billing',
      },
      500
    );
  }
});

/**
 * GET /x402/check/:userId
 * Check payment status for a user
 */
x402Router.get('/check/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const check = await checkX402Payment(x402Client, userId);
    
    return c.json({
      success: true,
      data: check,
    });
  } catch (error: any) {
    logger.error('Failed to check payment', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to check payment',
      },
      500
    );
  }
});

/**
 * POST /x402/track
 * Track usage event
 */
x402Router.post('/track', async (c) => {
  try {
    const { userId, eventType, quantity, metadata } = await c.req.json();
    
    if (!userId || !eventType || !quantity) {
      return c.json(
        { error: 'userId, eventType, and quantity are required' },
        400
      );
    }
    
    await usageTracker.track({
      userId,
      eventType,
      quantity,
      metadata,
      timestamp: new Date(),
    });
    
    return c.json({
      success: true,
      message: 'Usage tracked',
      bufferSize: usageTracker.getBufferSize(),
    });
  } catch (error: any) {
    logger.error('Failed to track usage', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to track usage',
      },
      500
    );
  }
});

/**
 * POST /x402/verify
 * Verify payment before allowing access
 */
x402Router.post('/verify', async (c) => {
  try {
    const { userId, requiredAmount } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400);
    }
    
    const result = await paymentVerifier.verify(userId, requiredAmount);
    
    if (!result.allowed) {
      return c.json(
        {
          success: false,
          error: result.reason,
          details: result,
        },
        402 // Payment Required
      );
    }
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to verify payment', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to verify payment',
      },
      500
    );
  }
});

/**
 * POST /x402/flush
 * Manually flush usage records
 */
x402Router.post('/flush', async (c) => {
  try {
    const beforeSize = usageTracker.getBufferSize();
    await usageTracker.flush();
    
    return c.json({
      success: true,
      message: 'Usage records flushed',
      recordsFlushed: beforeSize,
    });
  } catch (error: any) {
    logger.error('Failed to flush usage records', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to flush records',
      },
      500
    );
  }
});

/**
 * GET /x402/stats
 * Get x402 system statistics
 */
x402Router.get('/stats', async (c) => {
  try {
    const cacheStats = paymentVerifier.getCacheStats();
    const bufferSize = usageTracker.getBufferSize();
    
    return c.json({
      success: true,
      data: {
        usageBuffer: {
          size: bufferSize,
        },
        verificationCache: cacheStats,
        facilitator: {
          url: x402Client.facilitatorUrl,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to get stats', { error });
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get stats',
      },
      500
    );
  }
});

/**
 * Health check endpoint
 */
x402Router.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'x402-billing',
    timestamp: new Date().toISOString(),
  });
});

logger.info('x402 router initialized');

export default x402Router;