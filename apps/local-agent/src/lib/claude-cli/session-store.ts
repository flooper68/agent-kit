/**
 * In-memory store mapping agent session IDs to CLI session IDs.
 * Used for conversation continuity with --resume flag.
 *
 * The CLI returns a session_id in the init event that can be used
 * with --resume to continue conversations across multiple invocations.
 */
export class SessionStore {
  private sessions = new Map<string, string>();

  /**
   * Get CLI session ID for an agent session.
   * @param agentSessionId - The agent's session identifier
   * @returns CLI session ID if exists, undefined otherwise
   */
  get(agentSessionId: string): string | undefined {
    return this.sessions.get(agentSessionId);
  }

  /**
   * Store CLI session ID for an agent session.
   * @param agentSessionId - The agent's session identifier
   * @param cliSessionId - The CLI's session_id from init event
   */
  set(agentSessionId: string, cliSessionId: string): void {
    this.sessions.set(agentSessionId, cliSessionId);
  }

  /**
   * Remove session mapping.
   * @param agentSessionId - The agent's session identifier
   */
  delete(agentSessionId: string): void {
    this.sessions.delete(agentSessionId);
  }

  /**
   * Check if a session mapping exists.
   * @param agentSessionId - The agent's session identifier
   */
  has(agentSessionId: string): boolean {
    return this.sessions.has(agentSessionId);
  }

  /**
   * Clear all session mappings.
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Get the number of stored sessions.
   */
  get size(): number {
    return this.sessions.size;
  }
}
