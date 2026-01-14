type EventType =
  | 'text_delta'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'tool_approval_request'
  | 'error'
  | 'unknown';

interface EventTypeBadgeProps {
  type: EventType;
  isError?: boolean;
}

const typeStyles: Record<EventType, string> = {
  text_delta:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  reasoning_delta:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  tool_call:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  tool_result:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  tool_approval_request:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const typeLabels: Record<EventType, string> = {
  text_delta: 'Text',
  reasoning_delta: 'Reasoning',
  tool_call: 'Tool Call',
  tool_result: 'Tool Result',
  tool_approval_request: 'Approval',
  error: 'Error',
  unknown: 'Unknown',
};

export function EventTypeBadge({ type, isError }: EventTypeBadgeProps) {
  // If this is a tool_result with an error, show red styling
  const style =
    type === 'tool_result' && isError ? typeStyles.error : typeStyles[type];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}
    >
      {typeLabels[type]}
    </span>
  );
}
