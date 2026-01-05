import { tool } from 'ai';
import { z } from 'zod';
import type { Tool } from '../types';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB

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

    // Block localhost
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
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

    // Block private IP ranges
    const ipv4Match = hostname.match(
      /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    );
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      // 10.0.0.0/8
      if (a === 10) {
        return {
          allowed: false,
          reason: 'Private IP addresses are not allowed',
        };
      }
      // 172.16.0.0/12
      if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
        return {
          allowed: false,
          reason: 'Private IP addresses are not allowed',
        };
      }
      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return {
          allowed: false,
          reason: 'Private IP addresses are not allowed',
        };
      }
      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) {
        return {
          allowed: false,
          reason: 'Link-local addresses are not allowed',
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
        headers: {
          'User-Agent': 'AgentKit/1.0',
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

      // Read response with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          error: 'Failed to read response',
          message: 'Response body is not readable',
        };
      }

      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalSize += value.length;
        if (totalSize > MAX_RESPONSE_SIZE) {
          reader.cancel();
          return {
            error: 'Response too large',
            message: `Response exceeded limit of ${MAX_RESPONSE_SIZE} bytes`,
          };
        }
        chunks.push(value);
      }

      const content = new TextDecoder().decode(
        new Uint8Array(
          chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[])
        )
      );

      return {
        content,
        contentType,
        status: response.status,
        size: totalSize,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          error: 'Request timeout',
          message: `Request timed out after ${REQUEST_TIMEOUT_MS}ms`,
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
