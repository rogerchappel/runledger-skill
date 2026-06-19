# RunLedger Skill PRD

## Summary

`runledger-skill` turns local command-run ledgers into deterministic verification handoffs for agent builders, maintainers, and release reviewers.

## Problem

Agent handoffs often include claims like "tests passed" without a compact ledger that shows the command, status, timing, output reference, and unresolved risk. Raw logs are noisy and hard to review in pull requests.

## Goals

- Parse local JSONL command-run records.
- Emit Markdown and JSON summaries.
- Flag failed commands, missing required checks, secret-like output, and stale evidence.
- Provide a reusable skill document with approval and verification boundaries.
- Avoid hidden network calls, telemetry, and source mutation.

## Non-Goals

- Executing commands.
- Uploading evidence.
- Replacing CI, release approval, or human review.

## Users

- Agents preparing release-candidate evidence.
- Maintainers reviewing local verification claims.
- Operators who need dry-run proof before external action.

## Acceptance Criteria

- Fixture-backed parser, summary, and threshold tests pass.
- CLI smoke command writes a Markdown report from checked-in fixtures.
- README documents quickstart, schema, safety, and limitations.
- `SKILL.md` documents when and how agents should use the skill.

