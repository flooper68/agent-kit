# Codebase Researcher Agent

A local agent specialized for exploring and analyzing codebases. Provides structured research output with file references and code snippets.

## Tools

### File Exploration

- **Read**: Read file contents (with offset/limit for large files)
- **Glob**: Find files by pattern (e.g., `**/*.ts`)
- **Grep**: Search contents with regex

### Git Operations

- **git status**: Check working tree status
- **git branch**: List and manage branches
- **git log**: View commit history
- **git diff**: View changes between commits/branches
- **git show**: Show commit details
- **git remote**: List and manage remotes
- **git fetch**: Fetch refs from remote
- **git checkout**: Switch branches
- **git pull**: Pull latest changes
- **git ls-files**: List tracked files
- **git ls-tree**: List tree contents
- **git rev-parse**: Parse git revisions
- **git describe**: Describe commits with tags
- **git tag**: List tags

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

| Variable              | Required | Default               | Description                      |
| --------------------- | -------- | --------------------- | -------------------------------- |
| `AGENT_API_KEY`       | **Yes**  | -                     | Secret API key                   |
| `GIT_REPOSITORY_URL`  | **Yes**  | -                     | Git repository URL to clone      |
| `GIT_BRANCH`          | No       | default branch        | Branch to checkout after cloning |
| `SERVER_URL`          | No       | `ws://localhost:3001` | WebSocket server URL             |
| `WORKING_DIRECTORY`   | No       | `/workspace`          | Base directory for file ops      |
| `MODEL`               | No       | -                     | Claude model                     |
| `MAX_THINKING_TOKENS` | No       | 10000                 | Extended thinking budget         |

## Running

### Local

```bash
cd apps/local-agent
export AGENT_API_KEY=your_key
export GIT_REPOSITORY_URL=https://github.com/user/repo.git
export WORKING_DIRECTORY=/path/to/codebase
bun run dev:codebase-researcher
```

### Docker Compose (Recommended)

```bash
cd apps/local-agent

# Configure environment
cat >> .env << EOF
CODEBASE_RESEARCHER_AGENT_API_KEY=your_key
CODEBASE_RESEARCHER_GIT_REPOSITORY_URL=https://github.com/user/repo.git
CODEBASE_RESEARCHER_GIT_BRANCH=main
EOF

# Build and run
docker compose build codebase-researcher
docker compose up codebase-researcher
```

### Docker (Manual)

```bash
# Build from monorepo root
docker build -f apps/local-agent/src/agents/codebase-researcher/Dockerfile -t codebase-researcher .

# Run with required mounts
docker run -it \
  -e AGENT_API_KEY=your_key \
  -e GIT_REPOSITORY_URL=https://github.com/user/repo.git \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v ~/.claude/.credentials.json:/home/agent/.claude/.credentials.json:ro \
  -v ~/.gitconfig:/home/agent/.gitconfig:ro \
  -v ~/.config/gh:/home/agent/.config/gh:ro \
  codebase-researcher
```

### Required Host Files

For Docker, these files must exist on the host:

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth (run `claude` locally first) |
| `~/.gitconfig`                | Git user configuration                    |
| `~/.config/gh/`               | GitHub CLI auth (for private repos)       |

## Use Cases

- Architecture analysis
- Pattern discovery
- Dependency mapping
- Code review prep
- Onboarding to unfamiliar codebases
- Refactoring planning
