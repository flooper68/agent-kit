import { describe, it, expect } from 'vitest';
import { buildAgentHmacMessage, buildServerHmacMessage } from '../messages';

describe('buildAgentHmacMessage', () => {
  it('should build message in correct format', () => {
    const serverNonce = 'server-nonce-123';
    const clientNonce = 'client-nonce-456';
    const timestamp = 1704067200000;

    const message = buildAgentHmacMessage(serverNonce, clientNonce, timestamp);

    expect(message).toBe('server-nonce-123|client-nonce-456|1704067200000');
  });

  it('should handle empty strings', () => {
    const message = buildAgentHmacMessage('', '', 0);

    expect(message).toBe('||0');
  });

  it('should handle special characters in nonces', () => {
    const serverNonce = 'abc|def';
    const clientNonce = 'ghi|jkl';
    const timestamp = 123;

    const message = buildAgentHmacMessage(serverNonce, clientNonce, timestamp);

    // Note: The pipe in the nonces will be included as-is
    expect(message).toBe('abc|def|ghi|jkl|123');
  });
});

describe('buildServerHmacMessage', () => {
  it('should build message in correct format', () => {
    const clientNonce = 'client-nonce-456';
    const serverNonce = 'server-nonce-123';
    const agentId = 'agent-uuid-789';

    const message = buildServerHmacMessage(clientNonce, serverNonce, agentId);

    expect(message).toBe('client-nonce-456|server-nonce-123|agent-uuid-789');
  });

  it('should handle UUID format agent IDs', () => {
    const clientNonce = 'abc123';
    const serverNonce = 'def456';
    const agentId = '550e8400-e29b-41d4-a716-446655440000';

    const message = buildServerHmacMessage(clientNonce, serverNonce, agentId);

    expect(message).toBe('abc123|def456|550e8400-e29b-41d4-a716-446655440000');
  });

  it('should produce different messages than buildAgentHmacMessage', () => {
    // Same nonces but different order - messages should differ
    const serverNonce = 'server-nonce';
    const clientNonce = 'client-nonce';
    const timestamp = 123;
    const agentId = '123'; // Same as timestamp for comparison

    const agentMessage = buildAgentHmacMessage(
      serverNonce,
      clientNonce,
      timestamp
    );
    const serverMessage = buildServerHmacMessage(
      clientNonce,
      serverNonce,
      agentId
    );

    // Agent: serverNonce|clientNonce|timestamp
    // Server: clientNonce|serverNonce|agentId
    expect(agentMessage).toBe('server-nonce|client-nonce|123');
    expect(serverMessage).toBe('client-nonce|server-nonce|123');
    expect(agentMessage).not.toBe(serverMessage);
  });
});
