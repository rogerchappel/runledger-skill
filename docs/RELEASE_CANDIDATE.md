# Release Candidate Notes

## Classification

Ship.

## Included

- Agent skill instructions in `SKILL.md`.
- Local-first TypeScript CLI.
- JSONL parser, redaction, findings, Markdown and JSON reporters.
- Fixture-backed tests and smoke command.
- Validation script plus package and installed-tarball smokes for local release
  readiness.

## Verification Checklist

- `npm test` - pass
- `npm run check` - pass
- `npm run build` - pass
- `npm run smoke` - pass
- `npm run package:smoke` - pass
- `npm run install:smoke` - pass
- `bash scripts/validate.sh` - pass
- `npm run release:check` - pass

## Release Candidate Result

The initial public build is ready for review. The package is classified as
`ship` because it has a complete local-first CLI, reusable skill instructions,
fixture-backed tests, smoke coverage, package content assertions, installed CLI
verification, and documented side-effect boundaries.

## Known Limits

- Does not execute or record commands.
- Does not verify artifact hashes yet.
- Does not upload evidence.
