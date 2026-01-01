import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@agent-kit/server/trpc';

export const trpc = createTRPCReact<AppRouter>();

function getServerUrl(): string {
  const url = import.meta.env.VITE_SERVER_URL;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

export function getTRPCClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getServerUrl()}/trpc`,
        async headers() {
          const token = await getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
