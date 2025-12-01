#!/bin/bash
set -e

cd "$(dirname "$0")"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$ANTHROPIC_OAUTH_TOKEN" ]; then
    echo "Error: ANTHROPIC_API_KEY or ANTHROPIC_OAUTH_TOKEN must be set"
    exit 1
fi

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

# Activate venv
source .venv/bin/activate

# Run Terminal-Bench with pi agent
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-opus-4-5 \
  --n-attempts 5 \
  --jobs-dir "./pi-tbench-results" \
  -n 4
