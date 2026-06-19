# Release Candidate Notes

## Classification

Ship.

## Included

- Agent skill instructions in `SKILL.md`.
- Local-first TypeScript CLI.
- JSONL parser, redaction, findings, Markdown and JSON reporters.
- Fixture-backed tests and smoke command.
- Validation script for local release readiness.

## Verification Checklist

- `npm test` - pass
- `npm run check` - pass
- `npm run build` - pass
- `npm run smoke` - pass
- `bash scripts/validate.sh` - pass

## Release Candidate Result

The initial public build is ready for review. The package is classified as `ship` because it has a complete local-first CLI, reusable skill instructions, fixture-backed tests, smoke coverage, and documented side-effect boundaries.

## Known Limits

- Does not execute or record commands.
- Does not verify artifact hashes yet.
- Does not upload evidence.
