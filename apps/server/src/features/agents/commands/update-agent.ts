import type { AgentDefinition } from '../types';

export class UpdateAgentCommand {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: Map<string, AgentDefinition>) {
    this.agents = agents;
  }

  execute(
    id: string,
    updates: Partial<Omit<AgentDefinition, 'id'>>
  ): AgentDefinition | undefined {
    const existing = this.agents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.agents.set(id, updated);
    return updated;
  }
}
