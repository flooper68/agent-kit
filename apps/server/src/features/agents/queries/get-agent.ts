import type { AgentDefinition } from '../types';

export class GetAgentQuery {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: Map<string, AgentDefinition>) {
    this.agents = agents;
  }

  execute(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }
}
