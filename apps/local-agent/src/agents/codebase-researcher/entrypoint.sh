#!/bin/bash
set -e

# Clone repository
if [ -z "$GIT_REPOSITORY_URL" ]; then
  echo "Error: GIT_REPOSITORY_URL environment variable is required"
  exit 1
fi

echo "Cloning repository: $GIT_REPOSITORY_URL"
git clone "$GIT_REPOSITORY_URL" /workspace

# Checkout specific branch if provided
if [ -n "$GIT_BRANCH" ]; then
  echo "Checking out branch: $GIT_BRANCH"
  cd /workspace
  git checkout "$GIT_BRANCH"
fi

# Start the agent
exec codebase-researcher
