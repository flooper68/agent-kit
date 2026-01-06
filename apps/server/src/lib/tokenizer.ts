import { encode } from 'gpt-tokenizer';

/**
 * Token breakdown for context analysis
 */
export interface TokenBreakdown {
  // Input context breakdown (estimated before API call)
  systemPrompt: number;
  toolDefinitions: number;
  conversationHistory: number;
  toolResults: number;
  userInput: number;
  // Output (added after API call completes)
  completion?: number;
}

/**
 * Count tokens in a text string using cl100k_base encoding (GPT-4/Claude compatible)
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

/**
 * Count tokens in tool definitions (serialized to JSON)
 */
export function countToolDefinitionTokens(
  tools: Record<string, unknown>
): number {
  if (!tools || Object.keys(tools).length === 0) return 0;
  const serialized = JSON.stringify(tools);
  return countTokens(serialized);
}

/**
 * Count tokens in a message array (conversation history)
 */
export function countMessagesTokens(
  messages: Array<{ role: string; content: unknown }>
): number {
  if (!messages || messages.length === 0) return 0;
  return messages.reduce((sum, message) => {
    const content =
      typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content);
    // Add overhead for role and message structure (~4 tokens per message)
    return sum + countTokens(content) + 4;
  }, 0);
}

interface ContentPart {
  type: string;
  [key: string]: unknown;
}

/**
 * Count tokens in messages, separating tool results from other content
 */
export function countMessagesTokensWithToolResults(
  messages: Array<{ role: string; content: unknown }>
): { conversationTokens: number; toolResultsTokens: number } {
  if (!messages || messages.length === 0) {
    return { conversationTokens: 0, toolResultsTokens: 0 };
  }

  let conversationTokens = 0;
  let toolResultsTokens = 0;

  for (const message of messages) {
    // Add overhead for role and message structure (~4 tokens per message)
    conversationTokens += 4;

    if (typeof message.content === 'string') {
      conversationTokens += countTokens(message.content);
    } else if (Array.isArray(message.content)) {
      for (const part of message.content as ContentPart[]) {
        const partStr = JSON.stringify(part);
        // Check for tool-result (AI SDK format) or tool_result (our internal format)
        if (part.type === 'tool-result' || part.type === 'tool_result') {
          toolResultsTokens += countTokens(partStr);
        } else {
          conversationTokens += countTokens(partStr);
        }
      }
    } else if (message.content) {
      conversationTokens += countTokens(JSON.stringify(message.content));
    }
  }

  return { conversationTokens, toolResultsTokens };
}

/**
 * Calculate full token breakdown for a context
 * Called after streaming completes, so messages include the full conversation
 */
export function calculateTokenBreakdown(params: {
  systemPrompt: string;
  tools: Record<string, unknown>;
  messages: Array<{ role: string; content: unknown }>;
}): TokenBreakdown {
  const { systemPrompt, tools, messages } = params;

  const systemPromptTokens = countTokens(systemPrompt);
  const toolDefinitionsTokens = countToolDefinitionTokens(tools);

  // Find the last user message for "userInput"
  let lastUserMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') {
      lastUserMessageIndex = i;
      break;
    }
  }

  // Messages before the last user message are "history"
  const historyMessages =
    lastUserMessageIndex > 0 ? messages.slice(0, lastUserMessageIndex) : [];

  // The last user message
  const userMessage =
    lastUserMessageIndex >= 0 ? messages[lastUserMessageIndex] : undefined;

  // Messages after the last user message (assistant responses with tool results)
  const responseMessages =
    lastUserMessageIndex >= 0 ? messages.slice(lastUserMessageIndex + 1) : [];

  // Count history tokens, separating tool results
  const {
    conversationTokens: historyConversation,
    toolResultsTokens: historyToolResults,
  } = countMessagesTokensWithToolResults(historyMessages);

  // Count response tokens (current turn's assistant message with tool results)
  const {
    conversationTokens: responseConversation,
    toolResultsTokens: responseToolResults,
  } = countMessagesTokensWithToolResults(responseMessages);

  // User input is just the last user message
  const userInputTokens = userMessage ? countMessagesTokens([userMessage]) : 0;

  return {
    systemPrompt: systemPromptTokens,
    toolDefinitions: toolDefinitionsTokens,
    // History = previous turns' conversation (text + tool calls)
    conversationHistory: historyConversation + responseConversation,
    // Tool results from all messages (history + current turn)
    toolResults: historyToolResults + responseToolResults,
    userInput: userInputTokens,
  };
}
