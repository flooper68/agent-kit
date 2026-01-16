/**
 * Hook for validated navigation.
 *
 * Wraps react-router's useNavigate with route validation to prevent
 * navigation to unknown routes.
 */

import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { isValidRoute } from '../validation';

export interface ValidatedNavigateOptions extends NavigateOptions {
  /**
   * Skip route validation. Use for special cases like browser back/forward.
   */
  skipValidation?: boolean;
}

export interface ValidatedNavigateResult {
  success: boolean;
  error?: string;
}

/**
 * Hook that provides a navigate function with route validation.
 *
 * @returns Object containing the validated navigate function
 */
export function useValidatedNavigate() {
  const navigate = useNavigate();

  /**
   * Navigate to a path after validating it against known routes.
   *
   * @param path - Path to navigate to
   * @param options - Navigation options including skipValidation
   * @returns Result indicating success or failure with error message
   */
  const validatedNavigate = useCallback(
    (
      path: string,
      options?: ValidatedNavigateOptions
    ): ValidatedNavigateResult => {
      const { skipValidation, ...navigateOptions } = options ?? {};

      if (skipValidation) {
        navigate(path, navigateOptions);
        return { success: true };
      }

      if (!isValidRoute(path)) {
        if (import.meta.env.DEV) {
          console.warn(
            `[useValidatedNavigate] Blocked navigation to unknown route: ${path}`
          );
        }
        return {
          success: false,
          error: `Unknown route: ${path}`,
        };
      }

      navigate(path, navigateOptions);
      return { success: true };
    },
    [navigate]
  );

  return { navigate: validatedNavigate };
}
