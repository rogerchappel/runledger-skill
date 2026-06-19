# RunLedger Skill

Use this skill when an agent needs to convert local command-run evidence into a concise verification handoff.

## When To Use

- Preparing a release-candidate pull request.
- Summarizing `npm test`, `npm run build`, smoke, or validation evidence.
- Checking whether a handoff includes required verification commands.
- Reviewing failed or stale command evidence before asking for approval.

## Required Inputs

- A local JSONL file where each line describes one command run.
- Optional required command names passed with `--require`.
- Optional threshold passed with `--fail-on`.

## Side-Effect Boundaries

This skill reads local files and may write a report only when `--out` is provided. It does not execute commands, push branches, publish packages, merge pull requests, or contact external services.

## Approval Requirements

Ask for the host environment's normal approval before taking any action outside the summary itself, including rerunning commands, uploading logs, merging changes, publishing packages, or creating releases.

## Validation Workflow

1. Inspect the ledger source path and confirm it is local.
2. Run `runledger-skill summarize <ledger> --out VERIFICATION.md`.
3. Run `runledger-skill check <ledger> --require "npm test" --fail-on warning`.
4. Include the report and exact command results in the handoff.
5. Treat failures, missing required commands, stale records, or redaction findings as blockers until resolved or explained.

## Examples

```bash
runledger-skill summarize examples/runs.jsonl --out VERIFICATION.md
runledger-skill check examples/runs.jsonl --require "npm test" --require "npm run build" --fail-on warning
runledger-skill summarize examples/runs.jsonl --format json
```

