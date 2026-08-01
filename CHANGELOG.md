# Changelog

## Unreleased

- Config files now fail clearly on malformed JSON, invalid required-command
  lists, and unsupported severity thresholds instead of silently using defaults.
- Added asserted npm pack smoke coverage for release files and executable CLI
  bin metadata.
- Added an installed-tarball CLI smoke to prove the published package can
  summarize the example ledger after installation.
- Declared the Node.js engine floor and expanded CI to Node.js 20 and 22.

## 0.1.0

- Initial public build.
- Added JSONL parsing, Markdown/JSON reports, policy checks, fixtures, and agent skill instructions.
