import { Code, DataList, Text } from '@agent-kit/ui';
import { TokenBreakdownBar } from './TokenBreakdownBar';

interface TokenBreakdown {
  systemPrompt: number;
  toolDefinitions: number;
  conversationHistory: number;
  toolResults: number;
  userInput: number;
  completion?: number;
}

interface SessionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  currentContextTokens?: number;
  tokenBreakdown?: TokenBreakdown;
  estimatedCost: number;
  totalLatency: number;
  averageLatency: number;
  messageCount: number;
  turnCount: number;
  lastModel: string;
  lastProvider: string;
}

interface SessionData {
  id: string;
  userId: string;
  agentId: string;
  agentName: string;
  isLocalAgent: boolean;
  title: string | null;
  description: string | null;
  status: string;
  messageCount: number;
  usage: SessionUsage | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface SessionMetadataHeaderProps {
  session: SessionData;
}

function getStatusBadge(status: string) {
  const statusStyles: Record<string, string> = {
    active:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    completed:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status] ?? statusStyles.cancelled}`}
    >
      {status}
    </span>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function SessionMetadataHeader({ session }: SessionMetadataHeaderProps) {
  return (
    <DataList className="border-0 rounded-none">
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Session ID</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Code className="text-xs">{session.id}</Code>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Status</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <div className="flex items-center gap-2">
            {getStatusBadge(session.status)}
            {session.isLocalAgent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Local Agent
              </span>
            )}
          </div>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Agent</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Text className="text-sm">{session.agentName}</Text>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">User</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Code className="text-xs">{session.userId}</Code>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Messages</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Text className="text-sm">
            {session.messageCount}
            {session.usage?.turnCount !== undefined && (
              <span className="text-muted-foreground">
                {' '}
                ({session.usage.turnCount} turns)
              </span>
            )}
          </Text>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Created</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Text className="text-sm">{formatDate(session.createdAt)}</Text>
        </DataList.Cell>
      </DataList.Item>
      <DataList.Item className="hover:bg-transparent px-0 py-2">
        <DataList.Cell shrink className="w-24">
          <Text className="text-sm text-muted-foreground">Updated</Text>
        </DataList.Cell>
        <DataList.Cell grow>
          <Text className="text-sm">{formatDate(session.updatedAt)}</Text>
        </DataList.Cell>
      </DataList.Item>
      {session.usage && (
        <>
          <DataList.Item className="hover:bg-transparent px-0 py-2">
            <DataList.Cell shrink className="w-24">
              <Text className="text-sm text-muted-foreground">Tokens</Text>
            </DataList.Cell>
            <DataList.Cell grow>
              <Text className="text-sm">
                {session.usage.totalTokens.toLocaleString()} (
                {session.usage.promptTokens.toLocaleString()} in /{' '}
                {session.usage.completionTokens.toLocaleString()} out)
              </Text>
            </DataList.Cell>
          </DataList.Item>
          {(session.usage.cacheReadTokens !== undefined ||
            session.usage.cacheWriteTokens !== undefined) && (
            <DataList.Item className="hover:bg-transparent px-0 py-2">
              <DataList.Cell shrink className="w-24">
                <Text className="text-sm text-muted-foreground">Cache</Text>
              </DataList.Cell>
              <DataList.Cell grow>
                <Text className="text-sm">
                  {(session.usage.cacheReadTokens ?? 0).toLocaleString()} read /{' '}
                  {(session.usage.cacheWriteTokens ?? 0).toLocaleString()}{' '}
                  written
                </Text>
              </DataList.Cell>
            </DataList.Item>
          )}
          {session.usage.currentContextTokens !== undefined && (
            <DataList.Item className="hover:bg-transparent px-0 py-2">
              <DataList.Cell shrink className="w-24">
                <Text className="text-sm text-muted-foreground">Context</Text>
              </DataList.Cell>
              <DataList.Cell grow>
                <Text className="text-sm">
                  {session.usage.currentContextTokens.toLocaleString()} tokens
                </Text>
              </DataList.Cell>
            </DataList.Item>
          )}
          {session.usage.tokenBreakdown && (
            <DataList.Item className="hover:bg-transparent px-0 py-2">
              <DataList.Cell shrink className="w-24">
                <Text className="text-sm text-muted-foreground">Breakdown</Text>
              </DataList.Cell>
              <DataList.Cell grow>
                <TokenBreakdownBar breakdown={session.usage.tokenBreakdown} />
              </DataList.Cell>
            </DataList.Item>
          )}
          <DataList.Item className="hover:bg-transparent px-0 py-2">
            <DataList.Cell shrink className="w-24">
              <Text className="text-sm text-muted-foreground">Cost</Text>
            </DataList.Cell>
            <DataList.Cell grow>
              <Text className="text-sm">
                {formatCost(session.usage.estimatedCost)}
              </Text>
            </DataList.Cell>
          </DataList.Item>
          <DataList.Item className="hover:bg-transparent px-0 py-2">
            <DataList.Cell shrink className="w-24">
              <Text className="text-sm text-muted-foreground">Latency</Text>
            </DataList.Cell>
            <DataList.Cell grow>
              <Text className="text-sm">
                {formatLatency(session.usage.averageLatency)} avg (
                {formatLatency(session.usage.totalLatency)} total)
              </Text>
            </DataList.Cell>
          </DataList.Item>
          <DataList.Item className="hover:bg-transparent px-0 py-2 border-b-0">
            <DataList.Cell shrink className="w-24">
              <Text className="text-sm text-muted-foreground">Model</Text>
            </DataList.Cell>
            <DataList.Cell grow>
              <Text className="text-sm">
                {session.usage.lastModel} ({session.usage.lastProvider})
              </Text>
            </DataList.Cell>
          </DataList.Item>
        </>
      )}
    </DataList>
  );
}
