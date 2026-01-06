import type { AgentHandler, ClaudeCodeHandlerConfig } from '../types';

/** Factory function type for creating handlers */
export type HandlerFactory = (config: ClaudeCodeHandlerConfig) => AgentHandler;

/** Registry of available handler factories */
const handlerFactories = new Map<string, HandlerFactory>();

/**
 * Create a handler instance by type.
 *
 * @param type - Handler type identifier (e.g., 'claude-code')
 * @param config - Handler configuration
 * @returns Handler instance
 * @throws Error if handler type is not registered
 */
export function createHandler(
  type: string,
  config: ClaudeCodeHandlerConfig
): AgentHandler {
  const factory = handlerFactories.get(type);
  if (!factory) {
    const available = listHandlerTypes().join(', ');
    throw new Error(
      `Unknown handler type: "${type}". Available handlers: ${available}`
    );
  }
  return factory(config);
}

/**
 * Register a custom handler factory.
 *
 * @param type - Handler type identifier
 * @param factory - Factory function to create handler instances
 */
export function registerHandler(type: string, factory: HandlerFactory): void {
  handlerFactories.set(type, factory);
}

/**
 * List available handler types.
 *
 * @returns Array of registered handler type identifiers
 */
export function listHandlerTypes(): string[] {
  return Array.from(handlerFactories.keys());
}
