import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isTimestampValid, validateConnectionSecurity } from '../validation';

describe('isTimestampValid', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true for current timestamp', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    expect(isTimestampValid(now)).toBe(true);
  });

  it('should return true for timestamp within default 30s window', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    // 15 seconds ago
    expect(isTimestampValid(now - 15000)).toBe(true);

    // 15 seconds in future
    expect(isTimestampValid(now + 15000)).toBe(true);

    // Exactly 30 seconds ago
    expect(isTimestampValid(now - 30000)).toBe(true);

    // Exactly 30 seconds in future
    expect(isTimestampValid(now + 30000)).toBe(true);
  });

  it('should return false for timestamp outside default 30s window', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    // 31 seconds ago
    expect(isTimestampValid(now - 31000)).toBe(false);

    // 31 seconds in future
    expect(isTimestampValid(now + 31000)).toBe(false);
  });

  it('should respect custom maxAgeMs parameter', () => {
    const now = 1000000;
    vi.setSystemTime(now);

    // 5 second window
    expect(isTimestampValid(now - 4000, 5000)).toBe(true);
    expect(isTimestampValid(now - 6000, 5000)).toBe(false);

    // 60 second window
    expect(isTimestampValid(now - 55000, 60000)).toBe(true);
    expect(isTimestampValid(now - 65000, 60000)).toBe(false);
  });
});

describe('validateConnectionSecurity', () => {
  describe('localhost connections', () => {
    it('should allow ws:// to localhost', () => {
      expect(() =>
        validateConnectionSecurity('ws://localhost:8080')
      ).not.toThrow();
    });

    it('should allow ws:// to 127.0.0.1', () => {
      expect(() =>
        validateConnectionSecurity('ws://127.0.0.1:8080')
      ).not.toThrow();
    });

    it('should allow ws:// to ::1 (IPv6 localhost)', () => {
      expect(() => validateConnectionSecurity('ws://[::1]:8080')).not.toThrow();
    });

    it('should allow wss:// to localhost', () => {
      expect(() =>
        validateConnectionSecurity('wss://localhost:8080')
      ).not.toThrow();
    });

    it('should be case-insensitive for localhost', () => {
      expect(() =>
        validateConnectionSecurity('ws://LOCALHOST:8080')
      ).not.toThrow();
      expect(() =>
        validateConnectionSecurity('ws://LocalHost:8080')
      ).not.toThrow();
    });
  });

  describe('remote connections', () => {
    it('should allow wss:// to remote hosts', () => {
      expect(() =>
        validateConnectionSecurity('wss://api.example.com')
      ).not.toThrow();
      expect(() =>
        validateConnectionSecurity('wss://192.168.1.100:443')
      ).not.toThrow();
    });

    it('should reject ws:// to remote hosts', () => {
      expect(() => validateConnectionSecurity('ws://api.example.com')).toThrow(
        /WSS required for non-localhost/
      );
    });

    it('should reject ws:// to IP addresses', () => {
      expect(() =>
        validateConnectionSecurity('ws://192.168.1.100:8080')
      ).toThrow(/WSS required for non-localhost/);
    });

    it('should include hostname in error message', () => {
      expect(() =>
        validateConnectionSecurity('ws://insecure.example.com')
      ).toThrow(/insecure.example.com/);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs without ports', () => {
      expect(() =>
        validateConnectionSecurity('wss://example.com')
      ).not.toThrow();
      expect(() => validateConnectionSecurity('ws://localhost')).not.toThrow();
    });

    it('should handle URLs with paths', () => {
      expect(() =>
        validateConnectionSecurity('wss://example.com/agents')
      ).not.toThrow();
      expect(() =>
        validateConnectionSecurity('ws://localhost/agents')
      ).not.toThrow();
    });

    it('should throw for invalid URLs', () => {
      expect(() => validateConnectionSecurity('not-a-url')).toThrow();
    });
  });
});
