/**
 * Centralized route definitions and validation utilities.
 *
 * This module is the single source of truth for route validation,
 * used by both server and client to validate navigation requests.
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
  { path: '/app/commands/:id/edit' },
  { path: '/app/users' },
  { path: '/app/analytics' },
] as const;

export interface ValidationResult {
  valid: boolean;
  matchedRoute?: string;
  error?: string;
}

// Cache for compiled route regexes
const routeRegexCache = new Map<string, RegExp>();

/**
 * Convert a route pattern to a regular expression.
 *
 * @param pattern - Route pattern (e.g., '/app/agents/:id/edit')
 * @returns RegExp that matches paths for this route
 */
function patternToRegex(pattern: string): RegExp {
  const cached = routeRegexCache.get(pattern);
  if (cached) {
    return cached;
  }

  // Escape special regex characters except : and *
  let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

  // Replace :param with capture group for dynamic segments
  // Matches any non-empty, non-slash sequence
  regexStr = regexStr.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '([^/]+)');

  // Handle wildcard suffix /*
  // Matches optional trailing path segments
  if (regexStr.endsWith('/\\*')) {
    regexStr = regexStr.slice(0, -3) + '(?:/.*)?';
  }

  // Anchor the pattern to match the full path
  const regex = new RegExp(`^${regexStr}$`);
  routeRegexCache.set(pattern, regex);

  return regex;
}

/**
 * Normalize a path for validation.
 *
 * - Removes trailing slashes (except for root)
 * - Removes query strings
 * - Removes hash fragments
 *
 * @param path - Path to normalize
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  // Remove query string and hash
  let normalized = path.split('?')[0]?.split('#')[0] ?? path;

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Check if a path matches any known route.
 *
 * @param path - Path to validate (e.g., '/app/agents/123/edit')
 * @returns true if the path matches a known route
 */
export function isValidRoute(path: string): boolean {
  const normalized = normalizePath(path);

  for (const route of VALID_ROUTES) {
    const regex = patternToRegex(route.path);
    if (regex.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate a path against known routes.
 *
 * @param path - Path to validate
 * @returns ValidationResult with details about the match
 */
export function validateRoute(path: string): ValidationResult {
  const normalized = normalizePath(path);

  for (const route of VALID_ROUTES) {
    const regex = patternToRegex(route.path);
    if (regex.test(normalized)) {
      return {
        valid: true,
        matchedRoute: route.path,
      };
    }
  }

  return {
    valid: false,
    error: `Path "${path}" does not match any known route`,
  };
}
