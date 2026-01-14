import { useEffect, useRef } from 'react';
import { trpc } from '../lib/trpc';

/**
 * Heartbeat interval in milliseconds.
 * Sends a heartbeat every 30 seconds while the tab is visible.
 */
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Hook that sends periodic heartbeats to track user activity.
 * Creates activity sessions on the server that group user activity periods.
 *
 * - Sends a heartbeat immediately when mounted
 * - Sends a heartbeat every 30 seconds while the tab is visible
 * - Sends a heartbeat when the tab becomes visible (after being hidden)
 * - Stops sending heartbeats when the tab is hidden
 */
export function useActivityHeartbeat() {
  const heartbeatMutation = trpc.activity.heartbeat.useMutation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sendHeartbeat = () => {
      // Only send heartbeat if tab is visible
      if (document.visibilityState === 'visible') {
        heartbeatMutation.mutate(undefined, {
          // Silently ignore errors - heartbeat is best-effort
          onError: () => {},
        });
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Handle visibility changes - send heartbeat when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mutate is stable, heartbeatMutation object is not
  }, []);
}
