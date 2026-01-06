import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Derive the shared secret from the plaintext API key.
 * This produces SHA256(apiKey) which matches what the server has stored.
 */
export function deriveSharedSecret(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate a cryptographically secure random nonce (32 bytes hex-encoded)
 */
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Compute HMAC-SHA256 of a message using the shared secret
 */
export function computeHmac(secret: string, message: string): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verify an HMAC using constant-time comparison to prevent timing attacks
 */
export function verifyHmac(
  secret: string,
  message: string,
  receivedHmac: string
): boolean {
  const expectedHmac = computeHmac(secret, message);
  try {
    return timingSafeEqual(
      Buffer.from(expectedHmac, 'hex'),
      Buffer.from(receivedHmac, 'hex')
    );
  } catch {
    // Handle case where receivedHmac is not valid hex or wrong length
    return false;
  }
}

/**
 * Generate the key prefix from the API key (first 20 chars + "...")
 */
export function generateKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 20) + '...';
}
