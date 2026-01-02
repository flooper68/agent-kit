import type { db as DbType } from '../../../db';
import { agentSessionEvents } from '../../../db/schema';
import type { NewAgentSessionEvent } from '../types';

export class InsertEventCommand {
  private db: typeof DbType;

  constructor(db: typeof DbType) {
    this.db = db;
  }

  async execute(event: NewAgentSessionEvent): Promise<void> {
    await this.db.insert(agentSessionEvents).values(event);
  }
}
