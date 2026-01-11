import type { AgentsFeature } from '../features/agents';

export interface SpawnableAgent {
  id: string;
  name: string;
  description: string;
  isLocal: boolean;
}

/**
 * Skill info for system prompt
 */
export interface SkillInfo {
  id: string;
  key: string;
  name: string;
  description: string;
}

/**
 * Build a system prompt with dynamically injected available agents and skills
 */
export async function buildSystemPrompt(
  basePrompt: string,
  agentsFeature: AgentsFeature,
  userId: string,
  includeSpawnableAgents: boolean,
  allowedSkills?: SkillInfo[],
  parentAgentKey?: string
): Promise<string> {
  let prompt = basePrompt;

  if (includeSpawnableAgents) {
    const spawnableAgentsSection = await generateSpawnableAgentsSection(
      agentsFeature,
      userId,
      parentAgentKey
    );
    prompt = `${prompt}\n\n${spawnableAgentsSection}`;
  }

  // Add skills section if skills are allowed
  if (allowedSkills && allowedSkills.length > 0) {
    const skillsSection = generateSkillsSection(allowedSkills);
    prompt = `${prompt}\n\n${skillsSection}`;
  }

  return prompt;
}

/**
 * Generate the available skills section for the system prompt
 */
function generateSkillsSection(skills: SkillInfo[]): string {
  const lines: string[] = [
    '## Available Skills',
    '',
    'Skills are documentation bundles that teach you how to use related tools. Each skill contains:',
    '- `SKILL.md` - Main index file with overview, available tools, and links to other files',
    '- `references/` - Additional detailed documentation (tips, examples, workflows)',
    '- `assets/` - Supporting files (images, data files)',
    '',
    'The `SKILL.md` file serves as the index - all other files in the skill should be linked from it.',
    '',
    '### Gradual Disclosure',
    '',
    'Load skill information progressively - only read what you need:',
    '1. Review the skill list below to identify relevant skills',
    "2. Read `skillKey/SKILL.md` to understand the skill's tools and workflows",
    '3. Use `listSkillFiles` to see available reference files',
    '4. Read specific reference files only when you need deeper detail',
    '',
    '### Skills',
    '',
  ];

  for (const skill of skills) {
    lines.push(`- **${skill.key}**: ${skill.name} - ${skill.description}`);
  }

  lines.push('');
  lines.push('### Tools');
  lines.push('');
  lines.push('- `listSkillFiles(skillKey)` - List all files in a skill');
  lines.push(
    '- `readSkillFile(path)` - Read a skill file (e.g., "web-research/SKILL.md")'
  );
  lines.push(
    '- `executeCommand(command)` - Execute a tool using CLI-style syntax (e.g., `webSearch --query "topic"`)'
  );

  return lines.join('\n');
}

/**
 * Generate the available agents section for the system prompt
 * Only shows agents that the parent agent is allowed to spawn.
 */
async function generateSpawnableAgentsSection(
  agentsFeature: AgentsFeature,
  userId: string,
  parentAgentKey?: string
): Promise<string> {
  // Get allowed subagents for the parent agent (strict mode: no config = no agents)
  const allowedSubagents = parentAgentKey
    ? await agentsFeature.permissions.getAllowedSubagents(
        parentAgentKey,
        userId
      )
    : [];

  const activeAgents = allowedSubagents.map((a) => ({
    key: a.key,
    name: a.name,
    description: a.description,
  }));

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
