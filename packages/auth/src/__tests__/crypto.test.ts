import { describe, it, expect } from 'vitest';
import {
  deriveSharedSecret,
  generateNonce,
  computeHmac,
  verifyHmac,
  generateKeyPrefix,
} from '../crypto';

describe('deriveSharedSecret', () => {
  it('should derive consistent SHA256 hash from API key', () => {
    const apiKey = 'test-api-key-12345';
    const secret1 = deriveSharedSecret(apiKey);
    const secret2 = deriveSharedSecret(apiKey);

    expect(secret1).toBe(secret2);
    expect(secret1).toHaveLength(64); // SHA256 hex is 64 chars
  });

  it('should derive different secrets for different keys', () => {
    const secret1 = deriveSharedSecret('key-1');
    const secret2 = deriveSharedSecret('key-2');

    expect(secret1).not.toBe(secret2);
  });
});

describe('generateNonce', () => {
  it('should generate a 64-character hex string', () => {
    const nonce = generateNonce();

    expect(nonce).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(nonce).toMatch(/^[0-9a-f]+$/);
  });

  it('should generate unique nonces', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce());
    }

    expect(nonces.size).toBe(100);
  });
});

describe('computeHmac', () => {
  it('should compute consistent HMAC for same inputs', () => {
    const secret = 'my-secret';
    const message = 'hello world';

    const hmac1 = computeHmac(secret, message);
    const hmac2 = computeHmac(secret, message);

    expect(hmac1).toBe(hmac2);
    expect(hmac1).toHaveLength(64); // SHA256 HMAC hex is 64 chars
  });

  it('should produce different HMACs for different secrets', () => {
    const message = 'hello world';

    const hmac1 = computeHmac('secret-1', message);
    const hmac2 = computeHmac('secret-2', message);

    expect(hmac1).not.toBe(hmac2);
  });

  it('should produce different HMACs for different messages', () => {
    const secret = 'my-secret';

    const hmac1 = computeHmac(secret, 'message-1');
    const hmac2 = computeHmac(secret, 'message-2');

    expect(hmac1).not.toBe(hmac2);
  });
});

describe('verifyHmac', () => {
  it('should return true for valid HMAC', () => {
    const secret = 'my-secret';
    const message = 'hello world';
    const hmac = computeHmac(secret, message);

    expect(verifyHmac(secret, message, hmac)).toBe(true);
  });

  it('should return false for invalid HMAC', () => {
    const secret = 'my-secret';
    const message = 'hello world';

    expect(verifyHmac(secret, message, 'invalid-hmac')).toBe(false);
  });

  it('should return false for wrong secret', () => {
    const message = 'hello world';
    const hmac = computeHmac('correct-secret', message);

    expect(verifyHmac('wrong-secret', message, hmac)).toBe(false);
  });

  it('should return false for wrong message', () => {
    const secret = 'my-secret';
    const hmac = computeHmac(secret, 'correct-message');

    expect(verifyHmac(secret, 'wrong-message', hmac)).toBe(false);
  });

  it('should return false for malformed hex', () => {
    const secret = 'my-secret';
    const message = 'hello world';

    expect(verifyHmac(secret, message, 'not-valid-hex!')).toBe(false);
  });

  it('should return false for wrong length', () => {
    const secret = 'my-secret';
    const message = 'hello world';

    expect(verifyHmac(secret, message, 'abc123')).toBe(false);
  });

  it('should be timing-safe (consistent behavior)', () => {
    const secret = 'my-secret';
    const message = 'hello world';
    const validHmac = computeHmac(secret, message);

    // Run multiple times to ensure consistent behavior
    for (let i = 0; i < 10; i++) {
      expect(verifyHmac(secret, message, validHmac)).toBe(true);
      expect(verifyHmac(secret, message, 'wrong')).toBe(false);
    }
  });
});

describe('generateKeyPrefix', () => {
  it('should return first 20 chars plus ellipsis', () => {
    const apiKey = 'abcdefghijklmnopqrstuvwxyz';
    const prefix = generateKeyPrefix(apiKey);

    expect(prefix).toBe('abcdefghijklmnopqrst...');
    expect(prefix).toHaveLength(23);
  });

  it('should handle short keys', () => {
    const apiKey = 'short';
    const prefix = generateKeyPrefix(apiKey);

    expect(prefix).toBe('short...');
  });

  it('should handle exactly 20 char keys', () => {
    const apiKey = '12345678901234567890';
    const prefix = generateKeyPrefix(apiKey);

    expect(prefix).toBe('12345678901234567890...');
  });
});
