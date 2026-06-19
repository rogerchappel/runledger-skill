# runledger-skill

`runledger-skill` is a local-first agent skill and CLI for turning command-run ledgers into verification handoffs. It is meant for release candidates, PR summaries, and agent handoffs where "tests passed" needs evidence.

## Quickstart

```bash
npm install
npm run build
node dist/src/cli.js summarize examples/runs.jsonl --out VERIFICATION.md
node dist/src/cli.js check examples/clean-runs.jsonl --require "npm test" --require "npm run build" --fail-on warning
```

## CLI

```bash
runledger-skill summarize <runs.jsonl> [--out REPORT.md] [--format markdown|json]
runledger-skill check <runs.jsonl> [--require "npm test"] [--fail-on warning]
```

`summarize` renders a Markdown or JSON report. `check` applies the same analysis and exits non-zero when findings meet the threshold.

## JSONL Schema

Each line is one command run:

```json
{"command":"npm test","exitCode":0,"durationMs":1240,"stdout":"ok","outputPath":"artifacts/test.log"}
```

Required fields are `command` and `exitCode`. Optional fields include `cwd`, `startedAt`, `endedAt`, `durationMs`, `stdout`, `stderr`, `outputPath`, and `notes`.

## Safety Model

- No network calls.
- No telemetry.
- No command execution.
- No source mutation.
- Secret-like values in output and notes are redacted before reporting.
- External actions such as publishing, merging, or rerunning commands require the host agent's approval policy.

## Limitations

- V1 validates ledger shape and obvious evidence gaps; it does not verify referenced artifact hashes.
- Staleness policy is reserved for a future release.
- The CLI expects newline-delimited JSON, not arbitrary terminal transcripts.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```
