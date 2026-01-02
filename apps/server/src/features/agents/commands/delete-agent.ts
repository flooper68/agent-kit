import type { AgentDefinition } from '../types';

export class DeleteAgentCommand {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: Map<string, AgentDefinition>) {
    this.agents = agents;
  }

  execute(id: string): boolean {
    return this.agents.delete(id);
  }
}
