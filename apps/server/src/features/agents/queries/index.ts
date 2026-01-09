// Session queries
export { GetSessionByIdQuery } from './get-session-by-id';
export type {
  GetSessionByIdInput,
  GetSessionByIdResult,
} from './get-session-by-id';
export { GetSessionByIdForUserQuery } from './get-session-by-id-for-user';
export type {
  GetSessionByIdForUserInput,
  GetSessionByIdForUserResult,
} from './get-session-by-id-for-user';
export { GetAgentIdForSessionQuery } from './get-agent-id-for-session';
export type {
  GetAgentIdForSessionInput,
  GetAgentIdForSessionResult,
} from './get-agent-id-for-session';
export {
  GetSessionAgentInfoQuery,
  type SessionAgentInfo,
} from './get-session-agent-info';
export { GetSessionWithMessagesQuery } from './get-session-with-messages';
export type {
  GetSessionWithMessagesInput,
  GetSessionWithMessagesResult,
  SessionWithMessages,
} from './get-session-with-messages';
export { ListSessionsByUserQuery } from './list-sessions-by-user';
export type {
  ListSessionsByUserInput,
  ListSessionsByUserResult,
  SessionFilter,
} from './list-sessions-by-user';
export { VerifySessionOwnershipQuery } from './verify-session-ownership';
export type {
  VerifySessionOwnershipInput,
  VerifySessionOwnershipResult,
} from './verify-session-ownership';

// Message queries
export { GetMessagesBySessionIdQuery } from './get-messages-by-session-id';
export type {
  GetMessagesBySessionIdInput,
  GetMessagesBySessionIdResult,
  MessageWithParts,
} from './get-messages-by-session-id';

// Session resource queries
export { GetSessionResourcesQuery } from './get-session-resources';
export type {
  SessionResources,
  ArtifactResource,
  WebsiteResource,
} from './get-session-resources';
export {
  GetSessionMessagesAndEventsQuery,
  type SessionMessageInfo,
  type SessionEventInfo,
  type SessionMessagesAndEvents,
} from './get-session-messages-and-events';

// Session streaming queries
export { GetActiveSessionIdsQuery } from './get-active-session-ids';
export type { GetActiveSessionIdsResult } from './get-active-session-ids';

// Session hierarchy queries
export { GetSessionChildrenQuery } from './get-session-children';
export type {
  GetSessionChildrenInput,
  GetSessionChildrenResult,
} from './get-session-children';
export {
  GetSessionLineageQuery,
  type LineageItem,
} from './get-session-lineage';

// Custom agent queries
export { ListAgentsForUserQuery } from './list-agents-for-user';
export type {
  ListAgentsForUserInput,
  ListAgentsForUserResult,
  ExternalAgentListItem,
  ServerAgentListItem,
  AgentsListResponse,
} from './list-agents-for-user';
export { ListExternalAgentsQuery } from './list-external-agents';
export type {
  ListExternalAgentsInput,
  ListExternalAgentsResult,
} from './list-external-agents';
export { ListServerAgentsQuery } from './list-server-agents';
export type {
  ListServerAgentsInput,
  ListServerAgentsResult,
} from './list-server-agents';
export { ListActiveAgentsQuery } from './list-active-agents';
export type {
  ListActiveAgentsInput,
  ListActiveAgentsResult,
} from './list-active-agents';
export { GetAgentByIdQuery } from './get-agent-by-id';
export type {
  GetAgentByIdInput,
  GetAgentByIdResult,
} from './get-agent-by-id';
export { GetAgentByKeyQuery } from './get-agent-by-key';
export type { GetAgentByKeyInput, AgentByKeyResult } from './get-agent-by-key';
export { ValidateAgentKeyQuery } from './validate-agent-key';
export type {
  ValidateAgentKeyInput,
  ValidateAgentKeyResult,
} from './validate-agent-key';
export { FindAgentByKeyPrefixQuery } from './find-agent-by-key-prefix';
export type {
  FindAgentByKeyPrefixInput,
  FindAgentByKeyPrefixResult,
} from './find-agent-by-key-prefix';

// Agent selector queries (for UI dropdown)
export { ListAgentsForSelectorQuery } from './list-agents-for-selector';
export type {
  ListAgentsForSelectorInput,
  ListAgentsForSelectorResult,
  AgentForSelector,
} from './list-agents-for-selector';
export { GetAgentForSelectorQuery } from './get-agent-for-selector';
export type {
  GetAgentForSelectorInput,
  GetAgentForSelectorResult,
  AgentForSelectorDetail,
} from './get-agent-for-selector';

// Model queries
export { ListModelsQuery } from './list-models';
export type { ListModelsInput, ListModelsResult } from './list-models';

// Permission queries
export { CheckSpawnPermissionQuery } from './check-spawn-permission';
export type {
  CheckSpawnPermissionInput,
  CheckSpawnPermissionResult,
} from './check-spawn-permission';
export { GetAllowedSubagentsQuery } from './get-allowed-subagents';
export type {
  GetAllowedSubagentsInput,
  AllowedSubagentInfo,
} from './get-allowed-subagents';
