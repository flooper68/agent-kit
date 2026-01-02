import type { AgentDefinition } from '../types';

export class ListAgentsQuery {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: Map<string, AgentDefinition>) {
    this.agents = agents;
  }

  execute(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }
}
