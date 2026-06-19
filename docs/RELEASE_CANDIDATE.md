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

- `npm test`
- `npm run check`
- `npm run build`
- `npm run smoke`
- `bash scripts/validate.sh`

## Known Limits

- Does not execute or record commands.
- Does not verify artifact hashes yet.
- Does not upload evidence.

