# Coder Agent

A local agent for implementing features, fixing bugs, refactoring code, and creating pull requests. Has full read/write access to the codebase with git and GitHub CLI integration.

## Tools

### File Operations

- **Read**: Read file contents (with offset/limit for large files)
- **Write**: Create new files
- **Edit**: Modify existing files
- **Glob**: Find files by pattern (e.g., `**/*.ts`)
- **Grep**: Search contents with regex

### Git Operations

- **git status**: Check working tree status
- **git branch**: List and manage branches
- **git checkout**: Switch/create branches
- **git add**: Stage changes
- **git commit**: Commit changes
- **git push**: Push to remote
- **git pull**: Pull latest changes
- **git fetch**: Fetch refs from remote
- **git diff**: View changes
- **git log**: View commit history
- **git show**: Show commit details
- **git stash**: Stash changes
- **git merge**: Merge branches
- **git rebase**: Rebase branches
- **git reset**: Reset changes

### GitHub CLI (PR Operations)

- **gh pr create**: Create pull request
- **gh pr list**: List open PRs
- **gh pr view**: View PR details
- **gh pr checkout**: Checkout a PR locally
- **gh issue list**: List issues
- **gh issue view**: View issue details

### Sub-Agents

- **Task**: Spawn sub-agents for parallel work

## Capabilities

- Implement new features
- Fix bugs
- Refactor code
- Create and manage branches
- Commit and push changes
- Create pull requests with descriptions
- Code review and improvements

## Environment Variables

| Variable                  | Required | Default               | Description                      |
| ------------------------- | -------- | --------------------- | -------------------------------- |
| `CODER_AGENT_API_KEY`     | **Yes**  | -                     | Secret API key                   |
| `CODER_GIT_REPOSITORY_URL`| **Yes**  | -                     | Git repository URL to clone      |
| `CODER_GIT_BRANCH`        | No       | default branch        | Branch to checkout after cloning |
| `SERVER_URL`              | No       | `ws://localhost:3001` | WebSocket server URL             |
| `CODER_WORKING_DIRECTORY` | No       | `/workspace`          | Base directory for file ops      |
| `CODER_AGENT_ID`          | No       | -                     | Agent ID for logging             |

## Running

### Local

```bash
cd apps/local-agent
export CODER_AGENT_API_KEY=your_key
export CODER_GIT_REPOSITORY_URL=https://github.com/user/repo.git
export CODER_WORKING_DIRECTORY=/path/to/codebase
bun run dev:coder
```

### Docker Compose (Recommended)

```bash
cd apps/local-agent

# Configure environment
cat >> .env << EOF
SERVER_URL=ws://host.docker.internal:3001
CODER_AGENT_API_KEY=your_key
CODER_GIT_REPOSITORY_URL=https://github.com/user/repo.git
CODER_GIT_BRANCH=main
EOF

# Build and run
docker compose build coder
docker compose up coder
```

### Docker (Manual)

```bash
# Build from monorepo root
docker build -f apps/local-agent/src/agents/coder/Dockerfile -t coder .

# Run with required mounts
docker run -it \
  -e CODER_AGENT_API_KEY=your_key \
  -e CODER_GIT_REPOSITORY_URL=https://github.com/user/repo.git \
  -e SERVER_URL=ws://host.docker.internal:3001 \
  -v ~/.claude/.credentials.json:/home/agent/.claude/.credentials.json:ro \
  -v ~/.gitconfig:/home/agent/.gitconfig:ro \
  -v ~/.config/gh:/home/agent/.config/gh:ro \
  coder
```

### Required Host Files

For Docker, these files must exist on the host:

| File                          | Purpose                                   |
| ----------------------------- | ----------------------------------------- |
| `~/.claude/.credentials.json` | Claude OAuth (run `claude` locally first) |
| `~/.gitconfig`                | Git user configuration                    |
| `~/.config/gh/`               | GitHub CLI auth (for PRs)                 |

## PR Workflow

The coder agent follows this workflow when creating PRs:

1. Create a feature branch (`git checkout -b feat/<description>`)
2. Make changes using Write/Edit tools
3. Stage changes (`git add -A`)
4. Commit with conventional message (`git commit -m "feat: ..."`)
5. Push branch (`git push -u origin feat/<description>`)
6. Create PR via GitHub CLI (`gh pr create --title "..." --body "..."`)

## Use Cases

- Implement new features from specs
- Fix bugs with code changes
- Refactor code for improvements
- Create PRs with proper descriptions
- Code review and apply suggestions
- Dependency updates
