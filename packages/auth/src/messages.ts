/**
 * Build the HMAC message for agent proving identity to server
 * Message format: serverNonce|clientNonce|timestamp
 */
export function buildAgentHmacMessage(
  serverNonce: string,
  clientNonce: string,
  timestamp: number
): string {
  return `${serverNonce}|${clientNonce}|${timestamp}`;
}

/**
 * Build the HMAC message for server proving identity to agent
 * Message format: clientNonce|serverNonce|agentId
 */
export function buildServerHmacMessage(
  clientNonce: string,
  serverNonce: string,
  agentId: string
): string {
  return `${clientNonce}|${serverNonce}|${agentId}`;
}
