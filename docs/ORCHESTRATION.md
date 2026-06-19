# Orchestration

`runledger-skill` is designed for local-first agent workflows.

## Typical Flow

1. A separate tool records command runs into JSONL.
2. The agent invokes `runledger-skill summarize` to prepare review evidence.
3. The agent invokes `runledger-skill check` with required commands and failure thresholds.
4. The agent includes the Markdown report in a PR body, handoff, or release-candidate note.

## Side Effects

The CLI only reads requested input files and writes to `--out` when provided. It does not execute commands, contact networks, or mutate source files.

## Approval Boundary

Any external action, release, publish, merge, or command execution remains outside this skill and requires the host agent's normal approval policy.

