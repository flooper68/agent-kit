/**
 * Check if a timestamp is within the valid window (default 30 seconds)
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeMs: number = 30000
): boolean {
  return Math.abs(Date.now() - timestamp) <= maxAgeMs;
}

/**
 * Validate that the server URL uses WSS for non-localhost connections.
 * Throws an error if attempting to use insecure ws:// to a remote host.
 */
export function validateConnectionSecurity(serverUrl: string): void {
  const url = new URL(serverUrl);
  const hostname = url.hostname.toLowerCase();
  // IPv6 addresses may be wrapped in brackets (e.g., [::1])
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === 'host.docker.internal' ||
    hostname === '[::1]';
  const isSecure = url.protocol === 'wss:';

  if (!isLocalhost && !isSecure) {
    throw new Error(
      `Security error: WSS required for non-localhost connections. ` +
        `Use wss:// to connect to ${url.hostname}`
    );
  }
}
