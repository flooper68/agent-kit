import { createHash } from 'crypto';
import type { AgentSessionEvent } from '../../db/schema/agent-session-events';
import type { MessagePart } from '../../db/schema/agent-session-messages';

/**
 * Generate a new secret key with the ak_local_ prefix
 */
export function generateSecretKey(): string {
  return `ak_local_${crypto.randomUUID()}`;
}

/**
 * Hash a secret key using SHA256
 */
export function hashSecretKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a display prefix from a secret key (e.g., "ak_local_abc1...")
 */
export function generateKeyPrefix(key: string): string {
  return key.substring(0, 20) + '...';
}

/**
 * Build a map of approval requests from session events for cross-message lookups.
 * This should be called once with ALL session events, then passed to reconstructPartsFromEvents.
 */
export function buildApprovalRequestMap(
  events: AgentSessionEvent[]
): Map<string, AgentSessionEvent> {
  const approvalRequestMap = new Map<string, AgentSessionEvent>();
  for (const event of events) {
    if (event.type === 'tool_approval_request' && event.toolCallId) {
      approvalRequestMap.set(event.toolCallId, event);
    }
  }
  return approvalRequestMap;
}

/**
 * Reconstruct MessagePart[] from AgentSessionEvent[] rows
 * Used to rebuild message content from streamed events
 * Preserves the original streaming order while coalescing consecutive same-type content
 *
 * @param events - Events for this specific message
 * @param sessionApprovalMap - Optional pre-built map of approval requests from ALL session events.
 *                             This enables cross-message approval info lookup (e.g., when tool_call
 *                             and tool_approval_request are in different messages).
 */
export function reconstructPartsFromEvents(
  events: AgentSessionEvent[],
  sessionApprovalMap?: Map<string, AgentSessionEvent>
): MessagePart[] {
  const parts: MessagePart[] = [];

  // Sort events by sequence to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.sequence - b.sequence);

  // Build a map of tool results for quick lookup
  const toolResultMap = new Map<string, AgentSessionEvent>();
  for (const event of sortedEvents) {
    if (event.type === 'tool_result' && event.toolCallId) {
      toolResultMap.set(event.toolCallId, event);
    }
  }

  // Build a map of approval requests for quick lookup
  // Use session-wide map if provided, otherwise build from message events only
  let approvalRequestMap: Map<string, AgentSessionEvent>;
  if (sessionApprovalMap) {
    approvalRequestMap = sessionApprovalMap;
  } else {
    approvalRequestMap = new Map<string, AgentSessionEvent>();
    for (const event of sortedEvents) {
      if (event.type === 'tool_approval_request' && event.toolCallId) {
        approvalRequestMap.set(event.toolCallId, event);
      }
    }
  }

  // Track current text/reasoning blocks being built
  let currentTextContent = '';
  let currentReasoningContent = '';
  let lastContentType: 'text' | 'reasoning' | null = null;

  // Track reasoning timestamps for duration calculation
  let reasoningStartTime: Date | null = null;
  let reasoningEndTime: Date | null = null;

  // Helper to flush accumulated text content
  const flushText = () => {
    if (currentTextContent) {
      parts.push({ type: 'text', content: currentTextContent });
      currentTextContent = '';
    }
  };

  // Helper to flush accumulated reasoning content
  const flushReasoning = () => {
    if (currentReasoningContent) {
      // Calculate duration in seconds
      let durationSeconds: number | undefined;
      if (reasoningStartTime && reasoningEndTime) {
        durationSeconds = Math.round(
          (reasoningEndTime.getTime() - reasoningStartTime.getTime()) / 1000
        );
      }

      // Keep reasoning blocks expanded in historical messages
      parts.push({
        type: 'reasoning',
        content: currentReasoningContent,
        isCollapsed: false,
        durationSeconds,
      });
      currentReasoningContent = '';
      reasoningStartTime = null;
      reasoningEndTime = null;
    }
  };

  // Helper to flush all accumulated content
  const flushAll = () => {
    // Flush based on what was being accumulated last
    if (lastContentType === 'text') {
      flushText();
      flushReasoning();
    } else {
      flushReasoning();
      flushText();
    }
    lastContentType = null;
  };

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'text_delta':
        // If we were building reasoning, flush it first
        if (lastContentType === 'reasoning') {
          flushReasoning();
        }
        currentTextContent += event.content ?? '';
        lastContentType = 'text';
        break;

      case 'reasoning_delta':
        // If we were building text, flush it first
        if (lastContentType === 'text') {
          flushText();
        }
        // Track timestamps for duration calculation
        if (!reasoningStartTime) {
          reasoningStartTime = event.createdAt;
        }
        reasoningEndTime = event.createdAt;
        currentReasoningContent += event.content ?? '';
        lastContentType = 'reasoning';
        break;

      case 'tool_call': {
        // Flush any pending content before tool calls
        flushAll();

        const result = event.toolCallId
          ? toolResultMap.get(event.toolCallId)
          : undefined;
        const state = result
          ? result.isError
            ? 'error'
            : 'completed'
          : 'running';

        // Look up approval info if this tool went through approval
        const approvalRequest = event.toolCallId
          ? approvalRequestMap.get(event.toolCallId)
          : undefined;

        // Include providerMetadata (e.g., Gemini thought_signature) for reconstruction
        const args = {
          ...(event.toolArgs as Record<string, unknown>) ?? {},
          ...(event.providerMetadata && { _providerMetadata: event.providerMetadata }),
        };

        parts.push({
          type: 'tool_invocation',
          toolCallId: event.toolCallId ?? '',
          toolName: event.toolName ?? '',
          args,
          state,
          // Include approval info if this tool went through approval
          ...(approvalRequest && {
            approvalStatus: approvalRequest.approvalStatus ?? undefined,
            approvalDenialReason: approvalRequest.approvalDenialReason ?? undefined,
            approvedByUserId: approvalRequest.approvedByUserId ?? undefined,
            approvedAt: approvalRequest.approvedAt?.toISOString() ?? undefined,
          }),
        });

        // Add the result if available
        if (result) {
          parts.push({
            type: 'tool_result',
            toolCallId: result.toolCallId ?? '',
            result: result.toolResult,
            isError: result.isError ?? false,
          });
        }
        break;
      }

      case 'tool_result':
        // Tool results are handled when we process tool_call events
        break;

      case 'tool_approval_request': {
        // Flush any pending content before approval request
        flushAll();

        // Look up tool result if available (for approved tools that executed)
        const result = event.toolCallId
          ? toolResultMap.get(event.toolCallId)
          : undefined;

        // IMPORTANT: Keep state as 'pending_approval' for AI SDK message reconstruction.
        // The AI SDK needs the tool-approval-request part to be included (which requires
        // state === 'pending_approval' in agent-job-handler.ts). The actual approval
        // outcome is tracked via approvalStatus field for UI display.
        const state: 'pending' | 'running' | 'completed' | 'error' | 'pending_approval' = 'pending_approval';

        // Add a tool_invocation part
        // This matches the format expected when reconstructing the approval flow
        // Include approvalId and providerMetadata (e.g., Gemini thought_signature) for reconstruction
        parts.push({
          type: 'tool_invocation',
          toolCallId: event.toolCallId ?? '',
          toolName: event.toolName ?? '',
          args: {
            ...(event.toolArgs as Record<string, unknown>) ?? {},
            _approvalId: event.approvalId, // Store approvalId for later use
            ...(event.providerMetadata && { _providerMetadata: event.providerMetadata }),
          },
          state,
          // Include approval status if available (shows result after user responds)
          approvalStatus: event.approvalStatus ?? 'pending',
          approvalDenialReason: event.approvalDenialReason ?? undefined,
          approvedByUserId: event.approvedByUserId ?? undefined,
          approvedAt: event.approvedAt?.toISOString() ?? undefined,
        });

        // Add the result if available (for approved tools that executed)
        if (result) {
          parts.push({
            type: 'tool_result',
            toolCallId: result.toolCallId ?? '',
            result: result.toolResult,
            isError: result.isError ?? false,
          });
        }
        break;
      }
    }
  }

  // Flush any remaining content
  flushAll();

  return parts;
}
