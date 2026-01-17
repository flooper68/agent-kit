#!/bin/bash
set -e

# Clone repository
if [ -z "$CODER_GIT_REPOSITORY_URL" ]; then
  echo "Error: CODER_GIT_REPOSITORY_URL environment variable is required"
  exit 1
fi

# Check if /workspace already has a git repository
if [ -d "/workspace/.git" ]; then
  echo "Repository already exists in /workspace, fetching latest changes..."
  cd /workspace
  git fetch --all
  if [ -n "$CODER_GIT_BRANCH" ]; then
    echo "Checking out branch: $CODER_GIT_BRANCH"
    git checkout "$CODER_GIT_BRANCH"
    git reset --hard "origin/$CODER_GIT_BRANCH"
  else
    DEFAULT_BRANCH=$(git remote show origin | grep 'HEAD branch' | cut -d' ' -f5)
    git checkout "$DEFAULT_BRANCH"
    git reset --hard "origin/$DEFAULT_BRANCH"
  fi
else
  # Clean workspace if it has non-git content
  if [ "$(ls -A /workspace 2>/dev/null)" ]; then
    echo "Cleaning non-git content from /workspace..."
    rm -rf /workspace/*
    rm -rf /workspace/.[!.]*
  fi

  echo "Cloning repository: $CODER_GIT_REPOSITORY_URL"
  git clone "$CODER_GIT_REPOSITORY_URL" /workspace

  # Checkout specific branch if provided
  if [ -n "$CODER_GIT_BRANCH" ]; then
    echo "Checking out branch: $CODER_GIT_BRANCH"
    cd /workspace
    git checkout "$CODER_GIT_BRANCH"
  fi
fi

# Start the agent
exec coder
