# Safety Notes

`runledger-skill` is intentionally passive.

## Allowed

- Read a specified JSONL file.
- Write a report to `--out`.
- Exit non-zero when findings meet `--fail-on`.
- Redact common token-like strings in reportable text.

## Not Allowed

- Execute commands.
- Read unrelated files.
- Upload logs.
- Publish packages.
- Merge, release, or deploy.

## Review Guidance

Treat warnings as unresolved evidence gaps. Treat errors as blockers unless a human explicitly accepts the risk in the surrounding workflow.

