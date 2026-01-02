import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '@agent-kit/server/trpc';

export const trpc = createTRPCReact<AppRouter>();

function getServerUrl(): string {
  const url = import.meta.env.VITE_SERVER_URL;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

function getWebSocketUrl(): string {
  const url = import.meta.env.VITE_SERVER_URL;
  // Extract host and port, then add 1 to port for WebSocket server
  let host = url;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    host = host.replace(/^https?:\/\//, '');
  }

  // Parse host and port
  const [hostname, portStr] = host.split(':');
  const port = portStr ? parseInt(portStr, 10) : 3000;
  const wsPort = port + 1;

  // Determine ws vs wss based on environment
  const isSecure =
    import.meta.env.PROD ||
    url.startsWith('https://') ||
    window.location.protocol === 'https:';
  const protocol = isSecure ? 'wss' : 'ws';

  return `${protocol}://${hostname}:${wsPort}/trpc`;
}

// Store for WebSocket client - needs to be recreated when token changes
let wsClient: ReturnType<typeof createWSClient> | null = null;
let currentGetToken: (() => Promise<string | null>) | null = null;

function getWSClient(getToken: () => Promise<string | null>) {
  // Recreate if getToken function changed (different user session)
  if (!wsClient || currentGetToken !== getToken) {
    currentGetToken = getToken;
    wsClient = createWSClient({
      url: getWebSocketUrl(),
      connectionParams: async () => {
        const token = await getToken();
        return token ? { token } : {};
      },
    });
  }
  return wsClient;
}

export function getTRPCClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      splitLink({
        // Route subscriptions to WebSocket
        condition: (op) => op.type === 'subscription',
        true: wsLink({
          client: getWSClient(getToken),
        }),
        // Route queries and mutations to HTTP
        false: httpBatchLink({
          url: `${getServerUrl()}/trpc`,
          async headers() {
            const token = await getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      }),
    ],
  });
}
