import type { db as DbType } from '../../../db';
import {
  agentSessionEvents,
  type NewAgentSessionEvent,
} from '../../../db/schema';

export type InsertEventInput = NewAgentSessionEvent;

export type InsertEventResult = void;

export class InsertEventCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(input: InsertEventInput): Promise<InsertEventResult> {
    await this.db.insert(agentSessionEvents).values(input);
  }
}
