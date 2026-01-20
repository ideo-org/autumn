/**
 * Cronos x402 Facilitator Client
 * Handles payment requirements creation and verification for x402 payments on Cronos EVM
 */

import type {
  X402PaymentRequirements,
  X402PaymentVerification,
  X402Config,
} from './types';

// Load configuration from environment variables
const config: X402Config = {
  network: (process.env.CRONOS_NETWORK as 'cronos-testnet' | 'cronos') || 'cronos-testnet',
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://x402-facilitator-api.cronos.org',
  sellerAddress: process.env.SELLER_ADDRESS || '',
  assetAddress: process.env.ASSET_ADDRESS || '', // devUSDC.e testnet default
};

/**
 * Create x402 payment requirements for a given amount
 * @param params Payment details
 * @returns Payment requirements object that frontend/agent can use to settle
 */
export async function createPaymentRequirements(params: {
  amount: string; // Amount in smallest unit (wei-equivalent for token)
  description: string;
  buyer?: string;
  scheme?: 'exact' | 'minimum' | 'maximum';
}): Promise<X402PaymentRequirements> {
  const { amount, description, buyer, scheme = 'exact' } = params;

  // For hackathon: mock/simplified x402 facilitator call
  // In production, this would be an HTTP request to the x402 facilitator API
  // e.g., POST /payment-requirements
  
  // TODO: Replace with actual x402 facilitator API call
  // const response = await fetch(`${config.facilitatorUrl}/payment-requirements`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     seller: config.sellerAddress,
  //     buyer,
  //     assetAddress: config.assetAddress,
  //     amount,
  //     description,
  //     scheme,
  //   }),
  // });
  // const data = await response.json();
  // return data;

  // Hackathon mock response
  const paymentRequirements: X402PaymentRequirements = {
    id: `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    seller: config.sellerAddress,
    buyer,
    assetAddress: config.assetAddress,
    amount,
    description,
    scheme,
    createdAt: new Date().toISOString(),
  };

  return paymentRequirements;
}

/**
 * Verify an x402 payment via transaction hash
 * @param txHash Transaction hash to verify
 * @returns Payment verification details
 */
export async function verifyPayment(txHash: string): Promise<X402PaymentVerification> {
  // For hackathon: mock/simplified verification
  // In production, this would query the x402 facilitator or directly check Cronos chain
  // e.g., GET /verify/{txHash}

  // TODO: Replace with actual x402 facilitator API call or on-chain verification
  // const response = await fetch(`${config.facilitatorUrl}/verify/${txHash}`);
  // const data = await response.json();
  // return data;

  // Hackathon mock response (assumes all txHashes starting with '0x' are valid for demo)
  const isValidFormat = txHash.startsWith('0x') && txHash.length === 66;
  
  const verification: X402PaymentVerification = {
    txHash,
    verified: isValidFormat, // In real impl, would check on-chain
    amount: '1000000', // Mock amount (1 USDC with 6 decimals)
    from: '0x' + '1'.repeat(40), // Mock buyer address
    to: config.sellerAddress,
    blockNumber: isValidFormat ? Math.floor(Math.random() * 1000000) + 5000000 : undefined,
    timestamp: isValidFormat ? Math.floor(Date.now() / 1000) : undefined,
  };

  return verification;
}

/**
 * Get payment status by payment ID
 * @param paymentId x402 payment requirement ID
 * @returns Current status
 */
export async function getPaymentStatus(paymentId: string): Promise<'PENDING' | 'VERIFIED' | 'EXPIRED'> {
  // For hackathon: simplified status check
  // In production, query facilitator or on-chain state
  
  // TODO: Replace with actual status check
  // const response = await fetch(`${config.facilitatorUrl}/status/${paymentId}`);
  // const data = await response.json();
  // return data.status;

  // Hackathon mock: assume all payments are pending initially
  return 'PENDING';
}

/**
 * Get the current x402 configuration
 * @returns Current config
 */
export function getConfig(): X402Config {
  return { ...config };
}

/**
 * Update x402 configuration (useful for testing different networks)
 * @param updates Partial config updates
 */
export function updateConfig(updates: Partial<X402Config>): void {
  Object.assign(config, updates);
}
