# Ledger Schema

`runledger-skill` accepts newline-delimited JSON. Each line must be a JSON object.

## Required Fields

| Field | Type | Description |
|---|---|---|
| `command` | string or string[] | Compact command label, or the non-empty argv array used by canonical `runledger.v1`. Array elements must be non-empty strings. |
| `exitCode` | number or null | Non-negative integer process exit code, or null for signal termination. |

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
| `signal` | string or null | Termination signal. A non-empty signal is required when `exitCode` is null. |

## Compatible Record Shapes

The compact shape uses a string command and numeric exit code:

```json
{"command":"npm test","exitCode":0,"stdout":"ok"}
```

Canonical `runledger.v1` output uses an argv array and nullable process status:

```json
{"schema":"runledger.v1","command":["npm","test"],"exitCode":null,"signal":"SIGTERM","stdout":"","stderr":"terminated"}
```

Command arrays are joined with one ASCII space, in their original order. Thus
`["npm", "test"]` becomes `npm test` in reports and matches
`--require "npm test"`. This normalization is for display and matching; the
skill does not execute or shell-quote the command.

An exit code of zero with no signal is passed. A non-zero exit code or a
non-empty signal is failed. When `exitCode` is null, `signal` must be a
non-empty string so termination cannot be mistaken for success. Missing,
negative, fractional, or otherwise malformed exit codes remain rejected.
Unknown canonical fields are ignored, allowing an unmodified `runledger.v1`
JSONL file to be consumed. An executable cross-package fixture lives at
`tests/fixtures/runledger.v1.jsonl`.

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
