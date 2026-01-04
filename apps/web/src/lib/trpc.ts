import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '@agent-kit/server/trpc';

export const trpc = createTRPCReact<AppRouter>();

// WebSocket connection state for debugging UI
export type WSConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

export interface WSConnectionState {
  status: WSConnectionStatus;
  reconnectAttempts: number;
}

// Connection state store with subscribers
let connectionState: WSConnectionState = {
  status: 'disconnected',
  reconnectAttempts: 0,
};

type ConnectionStateListener = (state: WSConnectionState) => void;
const listeners = new Set<ConnectionStateListener>();

function updateConnectionState(update: Partial<WSConnectionState>) {
  connectionState = { ...connectionState, ...update };
  listeners.forEach((listener) => listener(connectionState));
}

export function subscribeToConnectionState(
  listener: ConnectionStateListener
): () => void {
  listeners.add(listener);
  // Immediately call with current state
  listener(connectionState);
  return () => listeners.delete(listener);
}

export function getConnectionState(): WSConnectionState {
  return connectionState;
}

function getServerUrl(): string {
  const url = import.meta.env.VITE_SERVER_URL;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

function getWebSocketUrl(): string {
  const url = import.meta.env.VITE_SERVER_URL;
  // Extract host - WebSocket runs on the same port as HTTP
  let host = url;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    host = host.replace(/^https?:\/\//, '');
  }

  // Determine ws vs wss based on environment
  const isSecure =
    import.meta.env.PROD ||
    url.startsWith('https://') ||
    window.location.protocol === 'https:';
  const protocol = isSecure ? 'wss' : 'ws';

  return `${protocol}://${host}/trpc`;
}

// Store for WebSocket client - needs to be recreated when token changes
let wsClient: ReturnType<typeof createWSClient> | null = null;
let currentGetToken: (() => Promise<string | null>) | null = null;

function getWSClient(getToken: () => Promise<string | null>) {
  // Recreate if getToken function changed (different user session)
  if (!wsClient || currentGetToken !== getToken) {
    currentGetToken = getToken;
    const wsUrl = getWebSocketUrl();
    console.log('[tRPC] Creating WebSocket client:', wsUrl);
    updateConnectionState({ status: 'connecting', reconnectAttempts: 0 });

    wsClient = createWSClient({
      url: wsUrl,
      connectionParams: async () => {
        const token = await getToken();
        console.log('[tRPC] WebSocket connectionParams:', {
          hasToken: !!token,
        });
        return token ? { token } : {};
      },
      // Exponential backoff for reconnection: 1s, 2s, 4s, 8s... up to 30s
      retryDelayMs: (attemptIndex) => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
        console.log(
          `[tRPC] Reconnecting in ${delay}ms (attempt ${attemptIndex + 1})`
        );
        updateConnectionState({
          status: 'reconnecting',
          reconnectAttempts: attemptIndex + 1,
        });
        return delay;
      },
      onOpen: () => {
        console.log('[tRPC] WebSocket opened');
        updateConnectionState({ status: 'connected', reconnectAttempts: 0 });
      },
      onClose: (cause) => {
        console.log('[tRPC] WebSocket closed:', cause);
        // Always set to disconnected - retryDelayMs will set to reconnecting if retrying
        updateConnectionState({ status: 'disconnected' });
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
