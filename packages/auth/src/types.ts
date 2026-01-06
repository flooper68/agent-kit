/**
 * Server challenge sent immediately upon WebSocket connection
 */
export interface ServerChallenge {
  type: 'server_challenge';
  serverNonce: string;
  timestamp: number;
}

/**
 * Agent's response to server challenge, proving agent identity
 */
export interface AuthChallenge {
  type: 'auth_challenge';
  keyPrefix: string;
  clientNonce: string;
  serverNonceHmac: string;
  timestamp: number;
}

/**
 * Server's success response, proving server identity
 */
export interface AuthSuccess {
  type: 'auth_success';
  agentId: string;
  clientNonceHmac: string;
}

/**
 * Authentication error response
 */
export interface AuthError {
  type: 'auth_error';
  error: string;
}

/**
 * Union of all auth message types
 */
export type AuthMessage =
  | ServerChallenge
  | AuthChallenge
  | AuthSuccess
  | AuthError;
