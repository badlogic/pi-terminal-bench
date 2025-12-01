# Terminal-Bench Verifier Error Investigation

## Problem Summary

When running the pi agent on Terminal-Bench tasks via Harbor, some tasks fail during the **verifier stage** with:

```
RewardFileNotFoundError: No reward file found at .../verifier/reward.txt or .../verifier/reward.json
```

The verifier's test-stdout.txt shows:
```
bash: cannot set terminal process group (-1): Inappropriate ioctl for device
bash: no job control in this shell
bash: /tests/test.sh: No such file or directory
```

## Root Cause (CONFIRMED)

**Docker cp behavior when target directory exists:**

When using `docker cp /path/to/source container:/target`:
- If `/target` **does NOT exist**: Docker creates `/target` and copies the **contents** of `source` into it
  - Result: `/target/test.sh` ✓
- If `/target` **ALREADY exists**: Docker copies `source` **as a subdirectory** of `/target`
  - Result: `/target/source/test.sh` ✗

**The pi agent creates `/tests` directory during its run** to help solve tasks. When the verifier then calls:
```python
await self._environment.upload_dir(
    source_dir=self._task.paths.tests_dir,  # e.g., ~/.cache/harbor/tasks/.../tests
    target_dir="/tests",
)
```

The tests end up at `/tests/tests/test.sh` instead of `/tests/test.sh`.

**Harbor's upload_dir implementation:**
```python
async def upload_dir(self, source_dir: Path | str, target_dir: str):
    await self._run_docker_compose_command(
        ["cp", str(source_dir), f"main:{target_dir}"],
        check=True,
    )
```

This doesn't handle the case where the target directory already exists.

## Evidence

1. **Agent creates /tests directory:**
   ```
   mkdir -p /tests && cp /app/filter.py /tests/filter.py
   ```
   This happens because the task's `test_outputs.py` references `/tests/filter.py`, and the agent tries to make tests work.

2. **Verifier test-stdout.txt:**
   ```
   bash: /tests/test.sh: No such file or directory
   ```
   The test.sh is actually at `/tests/tests/test.sh`.

3. **Reproduction with docker cp:**
   ```bash
   # Create container with /tests already existing
   docker run -d --name test alpine tail -f /dev/null
   docker exec test mkdir -p /tests
   docker exec test sh -c "echo 'agent_file' > /tests/agent.txt"
   
   # Copy tests directory to /tests
   docker cp /path/to/tests test:/tests
   
   # Result: tests are at /tests/tests/ not /tests/
   docker exec test ls -la /tests/
   # Shows: agent.txt, tests/
   docker exec test ls -la /tests/tests/
   # Shows: test.sh, etc.
   ```

## Solutions

### Option 1: Fix Harbor's upload_dir (Recommended)

Modify `harbor/environments/docker/docker.py`:

```python
async def upload_dir(self, source_dir: Path | str, target_dir: str):
    # Append /. to source to copy contents, not the directory itself
    # This ensures correct behavior whether target exists or not
    source = str(source_dir).rstrip('/') + '/.'
    await self._run_docker_compose_command(
        ["cp", source, f"main:{target_dir}"],
        check=True,
    )
```

This makes `docker cp /path/tests/. container:/tests` which always copies the **contents** of the source directory.

### Option 2: Remove target before copying in verifier

Modify `harbor/verifier/verifier.py`:

```python
async def verify(self) -> VerifierResult:
    # Remove /tests if it exists to ensure clean copy
    await self._environment.exec("rm -rf /tests")
    
    try:
        await self._environment.upload_dir(
            source_dir=self._task.paths.tests_dir,
            target_dir="/tests",
        )
    except Exception as e:
        raise AddTestsDirError(...)
```

### Option 3: Use different target path

Change verifier to use `/verifier_tests` instead of `/tests`, and update test.sh scripts accordingly. (Not ideal, requires task changes.)

## Why Oracle Works

The Oracle agent uses a different execution path and may not create the `/tests` directory during its run, so the docker cp works correctly.

## Verification

After applying Option 1:
```bash
# With fix: source/. copies contents regardless of target existence
docker cp /path/tests/. container:/tests
# Result: /tests/test.sh ✓
```

## Reproduction

```bash
cd /Users/badlogic/workspaces/pi-terminal-bench
source .venv/bin/activate
export ANTHROPIC_API_KEY="..."

# This fails on tasks where agent creates /tests:
harbor run \
  -d terminal-bench@2.0 \
  --agent-import-path pi_terminal_bench:PiAgent \
  -m anthropic/claude-sonnet-4-5 \
  -n 1

# This works (oracle doesn't create /tests):
harbor run -d terminal-bench@2.0 -a oracle -n 1
```

## Next Steps

1. Submit PR to Harbor with Option 1 fix
2. Alternatively, monkey-patch upload_dir locally for testing
