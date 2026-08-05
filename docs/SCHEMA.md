# Ledger Schema

`runledger-skill` accepts newline-delimited JSON. Each line must be a JSON object.

## Required Fields

| Field | Type | Description |
|---|---|---|
| `command` | string | Exact command label from the ledger. |
| `exitCode` | number | Non-negative integer process exit code. Zero is treated as passed. |

## Optional Fields

| Field | Type | Description |
|---|---|---|
| `cwd` | string | Working directory where the command ran. |
| `startedAt` | string | ISO timestamp for command start. |
| `endedAt` | string | ISO timestamp for command end. |
| `durationMs` | number | Finite, non-negative duration in milliseconds. Fractional values are allowed. |
| `stdout` | string | Short stdout evidence. Secret-like values are redacted. |
| `stderr` | string | Short stderr evidence. Secret-like values are redacted. |
| `outputPath` | string | Local path to a larger evidence artifact. |
| `notes` | string | Human or agent notes. Secret-like values are redacted. |

## Policy Config

`--config` accepts a small JSON file:

```json
{
  "requiredCommands": ["npm test", "npm run build"],
  "failOn": "warning"
}
```

Both fields are required. `requiredCommands` must be an array containing only
non-empty strings. `failOn` must be one of `info`, `warning`, or `error` and
sets the lowest finding severity that makes `check` exit nonzero. Malformed
JSON and values outside this contract are reported as config errors; they are
never replaced with defaults. When `--config` is omitted, the defaults are an
empty required-command list and a failure threshold of `error`.
