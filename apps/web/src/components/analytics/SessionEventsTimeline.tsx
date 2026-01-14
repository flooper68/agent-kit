import { useMemo } from 'react';
import { CollapsibleList, CopyButton, Text, Code, cn } from '@agent-kit/ui';
import { EventTypeBadge } from './EventTypeBadge';

type EventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'tool_approval_request'
  | 'error'
  | 'unknown';

type MessageRole = 'user' | 'assistant' | 'system';
type MessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'interrupted'
  | 'awaiting_approval';

interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  latency?: number;
  finishReason?: string;
  contextTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

interface SessionMessage {
  id: string;
  role: MessageRole;
  status: MessageStatus;
  metadata: MessageMetadata | null;
  createdAt: Date | string;
}

type ApprovalStatus = 'pending' | 'approved' | 'denied';

interface SessionEvent {
  id: string;
  messageId: string;
  sequence: number;
  type: EventType;
  createdAt: Date | string;
  content: string | null;
  toolCallId: string | null;
  toolName: string | null;
  toolArgs: Record<string, unknown> | null;
  toolResult?: unknown;
  isError: boolean | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorRetryable: boolean | null;
  errorDetails: Record<string, unknown> | null;
  rawEventType: string | null;
  rawData?: unknown;
  // Approval fields
  approvalId: string | null;
  approvalStatus: ApprovalStatus | null;
  approvalDenialReason: string | null;
  approvedByUserId: string | null;
  approvedAt: Date | string | null;
}

interface SessionEventsTimelineProps {
  events: SessionEvent[];
  messages: SessionMessage[];
}

interface MessageGroup {
  message: SessionMessage;
  events: SessionEvent[];
}

function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncateContent(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function EventContent({ event }: { event: SessionEvent }) {
  switch (event.type) {
    case 'text_delta':
    case 'reasoning_delta':
      return (
        <div className="space-y-2">
          <Text className="text-sm text-muted-foreground">Content:</Text>
          <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md overflow-x-auto">
            {event.content}
          </pre>
        </div>
      );

    case 'tool_call':
      return (
        <div className="space-y-3">
          <div>
            <Text className="text-sm text-muted-foreground">Tool Name:</Text>
            <Code className="mt-1">{event.toolName}</Code>
          </div>
          {event.toolCallId && (
            <div>
              <Text className="text-sm text-muted-foreground">Call ID:</Text>
              <Code className="mt-1 text-xs">{event.toolCallId}</Code>
            </div>
          )}
          {event.toolArgs && (
            <div>
              <Text className="text-sm text-muted-foreground">Arguments:</Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md mt-1 overflow-x-auto">
                {JSON.stringify(event.toolArgs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );

    case 'tool_result':
      return (
        <div className="space-y-3">
          {event.toolCallId && (
            <div>
              <Text className="text-sm text-muted-foreground">Call ID:</Text>
              <Code className="mt-1 text-xs">{event.toolCallId}</Code>
            </div>
          )}
          {event.isError && (
            <div>
              <Text className="text-sm text-red-500">Error Result</Text>
            </div>
          )}
          <div>
            <Text className="text-sm text-muted-foreground">Result:</Text>
            <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md mt-1 overflow-x-auto">
              {formatValue(event.toolResult)}
            </pre>
          </div>
        </div>
      );

    case 'error':
      return (
        <div className="space-y-3">
          {event.errorCode && (
            <div>
              <Text className="text-sm text-muted-foreground">Error Code:</Text>
              <Code className="mt-1 text-red-500">{event.errorCode}</Code>
            </div>
          )}
          {event.errorMessage && (
            <div>
              <Text className="text-sm text-muted-foreground">Message:</Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-red-50 dark:bg-red-900/20 p-3 rounded-md mt-1">
                {event.errorMessage}
              </pre>
            </div>
          )}
          {event.errorRetryable !== null && (
            <div>
              <Text className="text-sm text-muted-foreground">Retryable:</Text>
              <Text className="text-sm mt-1">
                {event.errorRetryable ? 'Yes' : 'No'}
              </Text>
            </div>
          )}
          {event.errorDetails && (
            <div>
              <Text className="text-sm text-muted-foreground">Details:</Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md mt-1 overflow-x-auto">
                {JSON.stringify(event.errorDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );

    case 'unknown':
      return (
        <div className="space-y-3">
          {event.rawEventType && (
            <div>
              <Text className="text-sm text-muted-foreground">
                Original Type:
              </Text>
              <Code className="mt-1">{event.rawEventType}</Code>
            </div>
          )}
          {event.rawData !== undefined && event.rawData !== null ? (
            <div>
              <Text className="text-sm text-muted-foreground">Raw Data:</Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md mt-1 overflow-x-auto">
                {formatValue(event.rawData)}
              </pre>
            </div>
          ) : null}
        </div>
      );

    case 'tool_approval_request':
      return (
        <div className="space-y-3">
          {event.approvalId && (
            <div>
              <Text className="text-sm text-muted-foreground">
                Approval ID:
              </Text>
              <Code className="mt-1 text-xs">{event.approvalId}</Code>
            </div>
          )}
          {event.toolName && (
            <div>
              <Text className="text-sm text-muted-foreground">Tool Name:</Text>
              <Code className="mt-1">{event.toolName}</Code>
            </div>
          )}
          {event.toolCallId && (
            <div>
              <Text className="text-sm text-muted-foreground">
                Tool Call ID:
              </Text>
              <Code className="mt-1 text-xs">{event.toolCallId}</Code>
            </div>
          )}
          {event.toolArgs && (
            <div>
              <Text className="text-sm text-muted-foreground">Arguments:</Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-muted/50 p-3 rounded-md mt-1 overflow-x-auto">
                {JSON.stringify(event.toolArgs, null, 2)}
              </pre>
            </div>
          )}
          {event.approvalStatus && (
            <div>
              <Text className="text-sm text-muted-foreground">Status:</Text>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1',
                  event.approvalStatus === 'approved'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : event.approvalStatus === 'denied'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                )}
              >
                {event.approvalStatus}
              </span>
            </div>
          )}
          {event.approvedByUserId && (
            <div>
              <Text className="text-sm text-muted-foreground">
                {event.approvalStatus === 'approved'
                  ? 'Approved By:'
                  : 'Denied By:'}
              </Text>
              <Code className="mt-1 text-xs">{event.approvedByUserId}</Code>
            </div>
          )}
          {event.approvedAt && (
            <div>
              <Text className="text-sm text-muted-foreground">
                Decision Time:
              </Text>
              <Text className="text-sm mt-1">
                {new Date(event.approvedAt).toLocaleString()}
              </Text>
            </div>
          )}
          {event.approvalDenialReason && (
            <div>
              <Text className="text-sm text-muted-foreground">
                Denial Reason:
              </Text>
              <pre className="text-sm whitespace-pre-wrap break-words bg-red-50 dark:bg-red-900/20 p-3 rounded-md mt-1">
                {event.approvalDenialReason}
              </pre>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function getEventPreview(event: SessionEvent): string {
  switch (event.type) {
    case 'text_delta':
    case 'reasoning_delta':
      return event.content ? truncateContent(event.content) : 'Empty content';
    case 'tool_call':
      return event.toolName ?? 'Unknown tool';
    case 'tool_result':
      return event.isError ? 'Error result' : 'Success';
    case 'tool_approval_request': {
      const toolName = event.toolName ?? 'Unknown tool';
      if (event.approvalStatus === 'approved') return `${toolName} - Approved`;
      if (event.approvalStatus === 'denied') return `${toolName} - Denied`;
      return `${toolName} - Pending`;
    }
    case 'error':
      return event.errorCode ?? event.errorMessage ?? 'Unknown error';
    case 'unknown':
      return event.rawEventType ?? 'Unknown event';
    default:
      return '';
  }
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getRoleBadge(role: MessageRole) {
  const styles: Record<MessageRole, string> = {
    user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    assistant:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    system: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function getStatusBadge(status: MessageStatus) {
  const styles: Record<MessageStatus, string> = {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    streaming:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    complete:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    interrupted:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    awaiting_approval:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function MessageHeader({
  message,
  events,
}: {
  message: SessionMessage;
  events: SessionEvent[];
}) {
  const meta = message.metadata;

  const copyContent = JSON.stringify({ message, events }, null, 2);

  return (
    <div className="bg-muted/30 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        {getRoleBadge(message.role)}
        {getStatusBadge(message.status)}
        <div className="ml-auto flex items-center gap-2">
          <CopyButton content={copyContent} />
          <Text className="text-xs text-muted-foreground font-mono">
            {formatTime(message.createdAt)}
          </Text>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          ID: <Code className="text-xs">{message.id}</Code>
        </span>
        {meta?.tokensUsed !== undefined && (
          <span>Tokens: {meta.tokensUsed.toLocaleString()}</span>
        )}
        {meta?.contextTokens !== undefined && (
          <span>Context: {meta.contextTokens.toLocaleString()}</span>
        )}
        {meta?.latency !== undefined && (
          <span>Latency: {formatLatency(meta.latency)}</span>
        )}
        {meta?.model && <span>Model: {meta.model}</span>}
        {(meta?.cacheReadTokens !== undefined ||
          meta?.cacheWriteTokens !== undefined) && (
          <span>
            Cache: {(meta.cacheReadTokens ?? 0).toLocaleString()} read /{' '}
            {(meta.cacheWriteTokens ?? 0).toLocaleString()} written
          </span>
        )}
        {meta?.finishReason && <span>Finish: {meta.finishReason}</span>}
      </div>
    </div>
  );
}

export function SessionEventsTimeline({
  events,
  messages,
}: SessionEventsTimelineProps) {
  // Group events by message
  const messageGroups = useMemo(() => {
    const messageMap = new Map<string, SessionMessage>();
    for (const msg of messages) {
      messageMap.set(msg.id, msg);
    }

    const groups: MessageGroup[] = [];
    const eventsByMessage = new Map<string, SessionEvent[]>();

    for (const event of events) {
      const existing = eventsByMessage.get(event.messageId);
      if (existing) {
        existing.push(event);
      } else {
        eventsByMessage.set(event.messageId, [event]);
      }
    }

    // Create groups in message order
    for (const msg of messages) {
      const msgEvents = eventsByMessage.get(msg.id);
      if (msgEvents && msgEvents.length > 0) {
        groups.push({ message: msg, events: msgEvents });
      }
    }

    // Handle orphan events (events without matching message)
    for (const [msgId, msgEvents] of eventsByMessage) {
      if (!messageMap.has(msgId)) {
        groups.push({
          message: {
            id: msgId,
            role: 'assistant',
            status: 'complete',
            metadata: null,
            createdAt: msgEvents[0]?.createdAt ?? new Date(),
          },
          events: msgEvents,
        });
      }
    }

    return groups;
  }, [events, messages]);

  if (events.length === 0) {
    return (
      <CollapsibleList>
        <CollapsibleList.Empty>
          No events recorded for this session
        </CollapsibleList.Empty>
      </CollapsibleList>
    );
  }

  return (
    <div className="space-y-4">
      {messageGroups.map((group) => (
        <div key={group.message.id}>
          <MessageHeader message={group.message} events={group.events} />
          <CollapsibleList>
            {group.events.map((event) => (
              <CollapsibleList.Item key={event.id}>
                <CollapsibleList.Trigger>
                  <Text className="shrink-0 text-xs text-muted-foreground font-mono w-8">
                    #{event.sequence}
                  </Text>
                  <EventTypeBadge
                    type={event.type}
                    isError={event.isError ?? undefined}
                  />
                  <Text className="flex-1 min-w-0 text-sm truncate text-muted-foreground">
                    {getEventPreview(event)}
                  </Text>
                  <Text className="shrink-0 text-xs text-muted-foreground font-mono">
                    {formatTime(event.createdAt)}
                  </Text>
                </CollapsibleList.Trigger>
                <CollapsibleList.Content>
                  <div className="mb-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground flex-1">
                        <span>
                          Event ID: <Code className="text-xs">{event.id}</Code>
                        </span>
                      </div>
                      <CopyButton content={JSON.stringify(event, null, 2)} />
                    </div>
                  </div>
                  <EventContent event={event} />
                </CollapsibleList.Content>
              </CollapsibleList.Item>
            ))}
          </CollapsibleList>
        </div>
      ))}
    </div>
  );
}
