# Ledger Schema

`runledger-skill` accepts newline-delimited JSON. Each line must be a JSON object.

## Required Fields

| Field | Type | Description |
|---|---|---|
| `command` | string | Exact command label from the ledger. |
| `exitCode` | number | Process exit code. Zero is treated as passed. |

## Optional Fields

| Field | Type | Description |
|---|---|---|
| `cwd` | string | Working directory where the command ran. |
| `startedAt` | string | ISO timestamp for command start. |
| `endedAt` | string | ISO timestamp for command end. |
| `durationMs` | number | Duration in milliseconds. |
| `stdout` | string | Short stdout evidence. Secret-like values are redacted. |
| `stderr` | string | Short stderr evidence. Secret-like values are redacted. |
| `outputPath` | string | Local path to a larger evidence artifact. |
| `notes` | string | Human or agent notes. Secret-like values are redacted. |

