import type { AgentsFeature } from '../features/agents';
import type { LocalAgentsFeature } from '../features/local-agents';

export interface SpawnableAgent {
  id: string;
  name: string;
  description: string;
  isLocal: boolean;
}

/**
 * Build a system prompt with dynamically injected available agents for spawning
 */
export async function buildSystemPrompt(
  basePrompt: string,
  agentsFeature: AgentsFeature,
  localAgentsFeature: LocalAgentsFeature,
  userId: string,
  includeSpawnableAgents: boolean
): Promise<string> {
  if (!includeSpawnableAgents) {
    return basePrompt;
  }

  const spawnableAgentsSection = await generateSpawnableAgentsSection(
    agentsFeature,
    localAgentsFeature,
    userId
  );

  return `${basePrompt}\n\n${spawnableAgentsSection}`;
}

/**
 * Generate the available agents section for the system prompt
 */
async function generateSpawnableAgentsSection(
  agentsFeature: AgentsFeature,
  localAgentsFeature: LocalAgentsFeature,
  userId: string
): Promise<string> {
  // Get built-in agents
  const builtInAgents = agentsFeature.agents.list();

  // Get local agents
  const localAgents = await localAgentsFeature.list(userId);
  const activeLocalAgents = localAgents.filter((agent) => !agent.disabled);

  // Build the section
  const lines: string[] = [
    '## Available Agents for Spawning',
    '',
    'You can use the `spawnAgent` tool to delegate tasks to other agents. Each spawned agent runs in its own fresh session with only the message you provide.',
    '',
    '### Built-in Agents',
  ];

  for (const agent of builtInAgents) {
    lines.push(`- **${agent.id}**: ${agent.name} - ${agent.description}`);
  }

  lines.push('');
  lines.push('### Local Agents');

  if (activeLocalAgents.length === 0) {
    lines.push('No local agents available.');
  } else {
    for (const agent of activeLocalAgents) {
      // Use key (not UUID) as the identifier for spawning
      lines.push(
        `- **${agent.key}** (local): ${agent.name} - ${agent.description ?? 'No description'}`
      );
    }
  }

  lines.push('');
  lines.push(
    'Use `spawnAgent` when you need specialized help, want to delegate a subtask, or need to run multiple tasks in parallel.'
  );

  return lines.join('\n');
}

/**
 * Get all available agents for spawning
 */
export async function getAvailableAgents(
  agentsFeature: AgentsFeature,
  localAgentsFeature: LocalAgentsFeature,
  userId: string
): Promise<SpawnableAgent[]> {
  // Get built-in agents
  const builtInAgents = agentsFeature.agents.list().map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    isLocal: false,
  }));

  // Get local agents - use key (not UUID) as the id for spawning
  const localAgents = await localAgentsFeature.list(userId);
  const activeLocalAgents = localAgents
    .filter((agent) => !agent.disabled)
    .map((agent) => ({
      id: agent.key,
      name: agent.name,
      description: agent.description ?? 'Local agent',
      isLocal: true,
    }));

  return [...builtInAgents, ...activeLocalAgents];
}
