# pi-terminal-bench

Harbor agent adapter for [pi](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) coding agent to run [Terminal-Bench](https://tbench.ai/) evaluations.

## Installation

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install harbor
uv tool install harbor

# Install this package (for development)
cd ~/workspaces/pi-terminal-bench
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

## Required: Apply Harbor Fix

There is a bug in Harbor's `upload_dir` function that causes verifier failures when the agent creates a `/tests` directory during task execution. The fix must be applied before running evaluations.

**The Problem:** When using `docker cp /path/to/source container:/target`:
- If `/target` does NOT exist: copies contents of `source` into `/target` ✓
- If `/target` ALREADY exists: copies `source` as a subdirectory `/target/source/` ✗

The pi agent (and other agents) may create `/tests` during task execution, causing the verifier's test files to end up at `/tests/tests/test.sh` instead of `/tests/test.sh`.

**Apply the fix:**

```bash
# Find Harbor's docker.py location
HARBOR_DOCKER=$(python -c "import harbor.environments.docker.docker as m; print(m.__file__)")

# Apply the patch (backs up original first)
cp "$HARBOR_DOCKER" "${HARBOR_DOCKER}.bak"

# Edit the upload_dir function - change this:
#   async def upload_dir(self, source_dir: Path | str, target_dir: str):
#       await self._run_docker_compose_command(
#           ["cp", str(source_dir), f"main:{target_dir}"],
#           check=True,
#       )
#
# To this:
#   async def upload_dir(self, source_dir: Path | str, target_dir: str):
#       # Append /. to source to copy contents, not the directory itself
#       source = str(source_dir).rstrip('/') + '/.'
#       await self._run_docker_compose_command(
#           ["cp", source, f"main:{target_dir}"],
#           check=True,
#       )
```

Or use this one-liner to apply the patch:

```bash
python -c "
import harbor.environments.docker.docker as m
p = m.__file__
t = open(p).read()
old = '''    async def upload_dir(self, source_dir: Path | str, target_dir: str):
        await self._run_docker_compose_command(
            [
                \"cp\",
                str(source_dir),
                f\"main:{target_dir}\",
            ],
            check=True,
        )'''
new = '''    async def upload_dir(self, source_dir: Path | str, target_dir: str):
        # Append /. to source to copy contents, not the directory itself
        source = str(source_dir).rstrip('/') + '/.'
        await self._run_docker_compose_command(
            [
                \"cp\",
                source,
                f\"main:{target_dir}\",
            ],
            check=True,
        )'''
if old in t:
    open(p, 'w').write(t.replace(old, new))
    print('✓ Patch applied successfully')
else:
    print('✗ Already patched or file structure changed')
"
```

**Verify the patch:**

```bash
python -c "from harbor.environments.docker.docker import DockerEnvironment; import inspect; print('PATCHED' if 'rstrip' in inspect.getsource(DockerEnvironment.upload_dir) else 'NOT PATCHED')"
```

See [ERROR.md](./ERROR.md) for detailed investigation of this issue.

## Prerequisites

- Docker running
- API key for your chosen provider:
  ```bash
  # Anthropic (OAuth token preferred)
  export ANTHROPIC_OAUTH_TOKEN="..."
  # OR
  export ANTHROPIC_API_KEY="..."

  # OpenAI
  export OPENAI_API_KEY="..."

  # Google
  export GEMINI_API_KEY="..."
  ```

## Usage

### Run with pi agent on Terminal-Bench

```bash
# Run locally with Docker
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-sonnet-4-5 \
  -n 4

# Run on cloud (Daytona)
export DAYTONA_API_KEY="..."
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-sonnet-4-5 \
  --env daytona \
  -n 32
```

### Validate setup with oracle

```bash
harbor run -d terminal-bench@2.0 -a oracle
```

### Run a single task for testing

```bash
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-sonnet-4-5 \
  --task-ids <task-id>
```

## Leaderboard Submission

To submit results to the Terminal-Bench leaderboard:

```bash
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-sonnet-4-5 \
  --k 5 \
  --jobs-dir "./pi-tbench-results"
```

Then email the jobs directory to:
- mchlmerrill@gmail.com
- alex@laude.org

## Development

```bash
# Run tests
pytest

# Lint
ruff check src/
ruff format src/
```

## License

MIT
