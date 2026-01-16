/**
 * Centralized route definitions for client-side navigation validation.
 *
 * This file defines all valid routes in the application, used to validate
 * navigation requests before they are executed.
 */

export interface RouteDefinition {
  path: string;
}

/**
 * All valid routes in the application.
 *
 * Route patterns:
 * - `:param` - Dynamic parameter (matches any non-empty segment)
 * - `/*` - Wildcard suffix (matches any trailing path)
 */
export const VALID_ROUTES: readonly RouteDefinition[] = [
  // Public routes
  { path: '/' },
  { path: '/sign-in/*' },
  { path: '/sign-up/*' },
  { path: '/sso-callback' },

  // App routes
  { path: '/app' },
  { path: '/app/no-project' },
  { path: '/app/agents' },
  { path: '/app/agents/new' },
  { path: '/app/agents/new/external' },
  { path: '/app/agents/:id/edit' },
  { path: '/app/artifacts' },
  { path: '/app/artifacts/:id' },
  { path: '/app/projects' },
  { path: '/app/projects/:projectId' },
  { path: '/app/projects/:projectId/artifacts/:artifactId' },
  { path: '/app/skills' },
  { path: '/app/skills/new' },
  { path: '/app/skills/:id' },
  { path: '/app/skills/:id/edit' },
  { path: '/app/commands' },
  { path: '/app/users' },
  { path: '/app/analytics' },
] as const;
