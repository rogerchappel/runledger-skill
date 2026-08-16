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

Command arrays use a deterministic, boundary-preserving display form in their
original order. Elements containing only ASCII letters, digits, or
`_@%+=:,./-` are emitted unchanged. Every other element is enclosed in POSIX
single quotes; an embedded `'` is emitted as `'"'"'`. Elements are separated
by one ASCII space. Thus `["npm", "test"]` becomes `npm test`, while
`["node", "-e", "console.log(\"a b\")"]` becomes
`node -e 'console.log("a b")'`. The distinct argv
`["node", "-e", "console.log(\"a", "b\")"]` becomes
`node -e 'console.log("a' 'b")'` and cannot satisfy the first command's
requirement.

`requiredCommands` and `--require` match the rendered command string exactly.
Use the displayed boundary-preserving form for canonical argv records. Compact
string commands are not interpreted or rewritten beyond trimming leading and
trailing whitespace, preserving existing string-ledger requirements. The
display notation is unambiguous but is not executed by this skill.

An exit code of zero with no signal is passed. A non-zero exit code or a
non-empty signal is failed. When `exitCode` is null, `signal` must be a
non-empty string so termination cannot be mistaken for success. Missing,
negative, fractional, or otherwise malformed exit codes remain rejected.
Unknown canonical fields are ignored, allowing an unmodified `runledger.v1`
JSONL file to be consumed. An executable cross-package fixture lives at
`tests/fixtures/runledger.v1.jsonl`.

Canonical records are integrity-validated before a report is produced. The
first `prevHash` must be 64 zeroes, each later `prevHash` must equal the prior
record's `hash`, and every `hash` must be the SHA-256 of the stable,
key-sorted JSON record with the `hash` field omitted. Records containing any
of `schema`, `hash`, or `prevHash` must provide all three and use
`schema: "runledger.v1"`. Malformed schema and chain or record-hash mismatches
are rejected with the physical JSONL line number; `summarize` and `check`
produce no handoff from an untrusted canonical ledger.

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
