import type { AgentDefinition } from '../types';

export class RegisterAgentCommand {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: Map<string, AgentDefinition>) {
    this.agents = agents;
  }

  execute(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }
}
