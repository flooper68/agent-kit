import { CollapsibleList, Text, Code } from '@agent-kit/ui';
import { EventTypeBadge } from './EventTypeBadge';

type EventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'unknown';

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
}

interface SessionEventsTimelineProps {
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
    case 'error':
      return event.errorCode ?? event.errorMessage ?? 'Unknown error';
    case 'unknown':
      return event.rawEventType ?? 'Unknown event';
    default:
      return '';
  }
}

export function SessionEventsTimeline({ events }: SessionEventsTimelineProps) {
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
    <CollapsibleList>
      {events.map((event) => (
        <CollapsibleList.Item key={event.id}>
          <CollapsibleList.Trigger>
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
            <EventContent event={event} />
          </CollapsibleList.Content>
        </CollapsibleList.Item>
      ))}
    </CollapsibleList>
  );
}
