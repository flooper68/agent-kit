import { useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import type { ClientToolRequest } from './useAgentSession';
import { trpc } from '../lib/trpc';

/**
 * Options for the useClientToolCommands hook.
 */
interface UseClientToolCommandsOptions {
  /**
   * Current session ID.
   * Required for stateful tools that need to send responses back to the server.
   */
  sessionId: string | null;
}

/**
 * Gather current UI state from the browser.
 *
 * Collects information about the current route, page title, parameters,
 * and navigation context. Used by the `getCurrentUIState` tool.
 *
 * @param pathname - Current route pathname from React Router
 * @param params - Route parameters from React Router
 * @returns UI state object matching the server's UIStateResponseSchema
 */
function gatherUIState(
  pathname: string,
  params: Record<string, string | undefined>
) {
  // Filter out undefined params
  const cleanParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      cleanParams[key] = value;
    }
  }

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: string[] = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment) {
      // Capitalize and clean up segment for display
      breadcrumbs.push(
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      );
    }
  }

  // Determine active section from path
  const activeSection = segments[1]; // e.g., 'projects', 'artifacts', 'analytics'

  return {
    path: pathname,
    title: document.title,
    params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
    breadcrumbs: breadcrumbs.length > 0 ? breadcrumbs : undefined,
    activeSection,
  };
}

/**
 * Hook for handling client-side tool commands from the AI agent.
 *
 * Supports both fire-and-forget tools (like navigateTo) and stateful tools
 * (like getCurrentUIState) that require sending responses back to the server.
 *
 * @param options.sessionId - Current session ID (required for stateful tools)
 * @see /docs/architecture/client-tool-relaying.md
 */
export function useClientToolCommands({
  sessionId,
}: UseClientToolCommandsOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Use refs to always get current values (avoid stale closure issues)
  const locationRef = useRef(location);
  const paramsRef = useRef(params);

  useEffect(() => {
    locationRef.current = location;
    paramsRef.current = params;
  }, [location, params]);

  const respondMutation = trpc.clientTools.respond.useMutation();

  const handleClientToolRequest = useCallback(
    async (request: ClientToolRequest) => {
      console.log('[ClientToolCommands] Received request:', request);

      switch (request.toolName) {
        case 'navigateTo': {
          // Fire-and-forget - just navigate, no response needed
          const path = request.params.path;

          // Type guard
          if (typeof path !== 'string') {
            console.warn(
              '[ClientToolCommands] Invalid path type:',
              typeof path
            );
            return;
          }

          // Strict validation: must be a relative app path (defense in depth)
          const isValidPath =
            path.startsWith('/') &&
            !path.startsWith('//') &&
            !path.startsWith('/\\') &&
            !path.includes('://');

          if (isValidPath) {
            console.log('[ClientToolCommands] Navigating to:', path);
            navigate(path);
          } else {
            console.warn(
              '[ClientToolCommands] Invalid or suspicious navigation path:',
              path
            );
          }
          break;
        }

        case 'getCurrentUIState': {
          // Stateful tool - gather UI state and respond
          if (!sessionId) {
            console.warn(
              '[ClientToolCommands] Cannot respond to getCurrentUIState: no sessionId'
            );
            return;
          }

          try {
            // Use refs to get current values at call time
            const uiState = gatherUIState(
              locationRef.current.pathname,
              paramsRef.current
            );
            console.log('[ClientToolCommands] Sending UI state:', uiState);

            await respondMutation.mutateAsync({
              sessionId,
              requestId: request.requestId,
              response: uiState,
            });
          } catch (error) {
            console.error(
              '[ClientToolCommands] Failed to send UI state response:',
              error
            );
          }
          break;
        }

        default:
          console.warn('[ClientToolCommands] Unknown tool:', request.toolName);
      }
    },
    [navigate, sessionId, respondMutation]
  );

  return { handleClientToolRequest };
}
