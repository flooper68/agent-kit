import type { AgentsFeature } from '../features/agents';

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
  userId: string,
  includeSpawnableAgents: boolean
): Promise<string> {
  if (!includeSpawnableAgents) {
    return basePrompt;
  }

  const spawnableAgentsSection = await generateSpawnableAgentsSection(
    agentsFeature,
    userId
  );

  return `${basePrompt}\n\n${spawnableAgentsSection}`;
}

/**
 * Generate the available agents section for the system prompt
 * All enabled agents are available for spawning.
 */
async function generateSpawnableAgentsSection(
  agentsFeature: AgentsFeature,
  userId: string
): Promise<string> {
  // Get custom agents (both external and server)
  const agentsResult = await agentsFeature.customAgents.list(userId);

  // Combine external and server agents with their keys
  const allAgents = [
    ...agentsResult.external.map((a) => ({
      key: a.key,
      name: a.name,
      description: a.description,
      disabled: a.disabled,
    })),
    ...agentsResult.server.map((a) => ({
      key: a.key,
      name: a.name,
      description: a.description,
      disabled: a.disabled,
    })),
  ];

  const activeAgents = allAgents.filter((agent) => !agent.disabled);

  // Build the section
  const lines: string[] = [
    '## Available Agents for Spawning',
    '',
    'You can use the `spawnAgent` tool to delegate tasks to other agents. Each spawned agent runs in its own fresh session with only the message you provide.',
    '',
  ];

  if (activeAgents.length > 0) {
    lines.push('### Available Agents');
    for (const agent of activeAgents) {
      // Use key (not UUID) as the identifier for spawning
      lines.push(
        `- **${agent.key}**: ${agent.name} - ${agent.description ?? 'No description'}`
      );
    }
    lines.push('');
  } else {
    lines.push('No agents are currently available for spawning.');
    lines.push('');
  }

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
  userId: string
): Promise<SpawnableAgent[]> {
  // Get custom agents - use key (not UUID) as the id for spawning
  const agentsResult = await agentsFeature.customAgents.list(userId);

  // Combine external and server agents
  const activeAgents = [
    ...agentsResult.external
      .filter((a) => !a.disabled)
      .map((a) => ({
        id: a.key,
        name: a.name,
        description: a.description ?? 'External agent',
        isLocal: true,
      })),
    ...agentsResult.server
      .filter((a) => !a.disabled)
      .map((a) => ({
        id: a.key,
        name: a.name,
        description: a.description ?? 'Server agent',
        isLocal: true,
      })),
  ];

  return activeAgents;
}
