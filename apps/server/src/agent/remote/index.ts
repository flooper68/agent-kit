// Remote agent exports (external agents that connect via WebSocket)

// WebSocket service
export { ExternalAgentWebSocketService } from './websocket-service';

// WebSocket registry
export { ExternalAgentWebSocketRegistry } from './websocket-registry';

// Connection management
export { ExternalAgentsConnectionManager } from './connection-manager';
export type {
  ExternalAgentConnection,
  ConnectionStatusUpdate,
} from './connection-manager';
