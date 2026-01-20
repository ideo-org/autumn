/**
 * Types for Cronos x402 Facilitator integration
 */

export interface X402PaymentRequirements {
  id: string;
  seller: string;
  buyer?: string;
  assetAddress: string;
  amount: string; // Wei/smallest unit as string
  description: string;
  scheme: 'exact' | 'minimum' | 'maximum';
  createdAt: string;
  expiresAt?: string;
}

export interface X402PaymentVerification {
  txHash: string;
  verified: boolean;
  amount: string;
  from: string;
  to: string;
  blockNumber?: number;
  timestamp?: number;
}

export interface X402Config {
  network: 'cronos-testnet' | 'cronos';
  facilitatorUrl: string;
  sellerAddress: string;
  assetAddress: string; // devUSDC.e or other token
}

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
