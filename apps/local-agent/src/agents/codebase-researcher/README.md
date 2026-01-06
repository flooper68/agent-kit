# Codebase Researcher Agent

A local agent specialized for exploring and analyzing codebases. Provides structured research output with file references and code snippets.

## Tools

### File Exploration

- **Read**: Read file contents (with offset/limit for large files)
- **Glob**: Find files by pattern (e.g., `**/*.ts`)
- **Grep**: Search contents with regex

### Sub-Agents

- **Task**: Spawn sub-agents for parallel exploration

### Web Research

- **WebSearch**: Search for documentation, libraries, best practices
- **WebFetch**: Fetch content from specific URLs

### Output

- **writeArtifact**: Save findings to server

## Output Format

All tasks produce a **concise** structured artifact. Artifacts consume context, so brevity is critical.

### Required Sections

1. **Summary**: 2-4 sentences max, key findings only
2. **Files Explored**: `path:line` references with brief descriptions
3. **Key Code Snippets**: Only essential excerpts
4. **Findings**: Bullet points, not paragraphs

### Optional Sections

5. **Architecture Notes**: Only if directly relevant
6. **Recommendations**: Only if actionable

### Quality Standards

- Prefer `file:line` references over copying code
- Omit sections that aren't relevant
- No redundant information
- Use bullet points, not prose

## Environment Variables

| Variable                   | Required | Default               | Description                 |
| -------------------------- | -------- | --------------------- | --------------------------- |
| `AGENT_API_KEY`            | **Yes**  | -                     | Secret API key              |
| `SERVER_URL`               | No       | `ws://localhost:3001` | WebSocket server URL        |
| `WORKING_DIRECTORY`        | No       | Current directory     | Base directory for file ops |
| `MODEL`                    | No       | -                     | Claude model                |
| `MAX_THINKING_TOKENS`      | No       | 10000                 | Extended thinking budget    |
| `INCLUDE_PARTIAL_MESSAGES` | No       | true                  | Enable streaming            |

## Running

### Local

```bash
cd apps/local-agent
export AGENT_API_KEY=your_key
export WORKING_DIRECTORY=/path/to/codebase
bun run dev:codebase-researcher
```

### Docker

```bash
docker build -f agents/codebase-researcher/Dockerfile -t codebase-researcher ../../..
docker run -it \
  -e AGENT_API_KEY=your_key \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v /path/to/codebase:/workspace \
  codebase-researcher
```

## Use Cases

- Architecture analysis
- Pattern discovery
- Dependency mapping
- Code review prep
- Onboarding to unfamiliar codebases
- Refactoring planning
