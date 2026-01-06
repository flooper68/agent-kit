// Types
export type {
  ServerChallenge,
  AuthChallenge,
  AuthSuccess,
  AuthError,
  AuthMessage,
} from './types';

// Crypto utilities
export {
  deriveSharedSecret,
  generateNonce,
  computeHmac,
  verifyHmac,
  generateKeyPrefix,
} from './crypto';

// Message builders
export { buildAgentHmacMessage, buildServerHmacMessage } from './messages';

// Validation utilities
export { isTimestampValid, validateConnectionSecurity } from './validation';
