import { tool } from 'ai';
import ipaddr from 'ipaddr.js';
import { z } from 'zod';
import type { Tool } from '../types';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB

// IP ranges that are not allowed for SSRF protection
const BLOCKED_IP_RANGES = new Set([
  'unspecified',
  'broadcast',
  'multicast',
  'linkLocal',
  'loopback',
  'carrierGradeNat',
  'private',
  'reserved',
  // IPv6 specific
  'uniqueLocal',
  'ipv4Mapped',
  'rfc6145',
  'rfc6052',
  '6to4',
  'teredo',
  'discard',
]);

/**
 * Validates a URL to prevent SSRF attacks.
 * Blocks private IPs, localhost, and cloud metadata endpoints.
 */
function isUrlAllowed(urlString: string): {
  allowed: boolean;
  reason?: string;
} {
  try {
    const url = new URL(urlString);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        allowed: false,
        reason: 'Only HTTP and HTTPS protocols are allowed',
      };
    }

    const hostname = url.hostname.toLowerCase();

    // Block localhost by name
    if (hostname === 'localhost') {
      return { allowed: false, reason: 'Localhost URLs are not allowed' };
    }

    // Block common cloud metadata endpoints
    if (
      hostname === '169.254.169.254' ||
      hostname === 'metadata.google.internal'
    ) {
      return {
        allowed: false,
        reason: 'Cloud metadata endpoints are not allowed',
      };
    }

    // Check if hostname is an IP address and validate its range
    if (ipaddr.isValid(hostname)) {
      const ip = ipaddr.process(hostname);
      const range = ip.range();

      if (BLOCKED_IP_RANGES.has(range)) {
        return {
          allowed: false,
          reason: `IP address range '${range}' is not allowed`,
        };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: false, reason: 'Invalid URL format' };
  }
}

export const fetchTool: Tool = tool({
  description:
    'Fetch raw content from a public URL using HTTP GET. Use this for APIs, JSON endpoints, or when you need the exact response. For web articles, prefer extractContent which parses and cleans HTML.',
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe('The public URL to fetch (no private/internal URLs)'),
  }),
  execute: async ({ url }) => {
    // Validate URL to prevent SSRF
    const validation = isUrlAllowed(url);
    if (!validation.allowed) {
      return {
        error: 'URL not allowed',
        message: validation.reason,
      };
    }

    // Set up timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'error', // Forbid redirects to prevent SSRF bypass
        headers: {
          'User-Agent': 'AgentKit/1.0',
          Accept: 'application/json, text/plain, text/*',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          error: `HTTP error ${response.status}`,
          status: response.status,
          statusText: response.statusText,
        };
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      // Check content length header if available
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
        return {
          error: 'Response too large',
          message: `Response size (${contentLength} bytes) exceeds limit of ${MAX_RESPONSE_SIZE} bytes`,
        };
      }

      // Only allow text-based content types
      const isTextContent =
        contentType.includes('text/') ||
        contentType.includes('application/json') ||
        contentType.includes('application/xml') ||
        contentType.includes('+json') ||
        contentType.includes('+xml');

      if (!isTextContent && contentType !== '') {
        return {
          error: 'Unsupported content type',
          message: `Only text and JSON content types are supported. Received: ${contentType}`,
        };
      }

      const content = await response.text();

      if (content.length > MAX_RESPONSE_SIZE) {
        return {
          error: 'Response too large',
          message: `Response size (${content.length} bytes) exceeds limit of ${MAX_RESPONSE_SIZE} bytes`,
        };
      }

      return {
        content,
        contentType,
        status: response.status,
        size: content.length,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          message: `Request timed out after ${REQUEST_TIMEOUT_MS}ms`,
        };
      }

      // Handle redirect errors specifically
      if (error instanceof TypeError && error.message.includes('redirect')) {
        return {
          error: 'Redirect not allowed',
          message: 'The URL attempted to redirect, which is not permitted',
        };
      }

      return {
        error: 'Fetch failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
