import type { CreateMessageCommand } from './create-message';
import type { InsertEventCommand } from './insert-event';
import type { UpdateSessionTimestampCommand } from './update-session-timestamp';

export interface SendUserMessageInput {
  sessionId: string;
  content: string;
}

export interface SendUserMessageResult {
  userMessageId: string;
  assistantMessageId: string;
}

/**
 * SendUserMessageCommand - Orchestrates the creation of a user message and assistant placeholder
 * Business logic for the user message lifecycle:
 * 1. Creates the user message record
 * 2. Inserts the text content as an event
 * 3. Creates an assistant message placeholder (status: streaming)
 * 4. Updates the session timestamp
 */
export class SendUserMessageCommand {
  constructor(
    private createMessageCommand: CreateMessageCommand,
    private insertEventCommand: InsertEventCommand,
    private updateSessionTimestampCommand: UpdateSessionTimestampCommand
  ) {}

  async execute(input: SendUserMessageInput): Promise<SendUserMessageResult> {
    const { sessionId, content } = input;

    // Create the user message
    const userMessage = await this.createMessageCommand.execute({
      sessionId,
      role: 'user',
      status: 'complete',
    });

    // Insert user message content event
    await this.insertEventCommand.execute({
      sessionId,
      messageId: userMessage.id,
      sequence: 0,
      type: 'text_delta',
      content,
    });

    // Create assistant message placeholder
    const assistantMessage = await this.createMessageCommand.execute({
      sessionId,
      role: 'assistant',
      status: 'streaming',
    });

    // Update session timestamp
    await this.updateSessionTimestampCommand.execute(sessionId);

    return {
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    };
  }
}
