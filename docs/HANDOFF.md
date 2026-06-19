# Handoff Pattern

Use this pattern when an agent needs to include verification evidence in a PR body or launch note.

## Recommended Steps

1. Generate a report from the local ledger.
2. Run `check` with the commands that matter for the release.
3. Copy the report summary into the handoff.
4. Link or attach larger artifacts separately when safe.
5. Explain every warning or error before asking for approval.

## Suggested PR Section

```markdown
## Verification

- `npm test`: passed
- `npm run build`: passed
- `npm run smoke`: failed, fixed in follow-up commit

Evidence: generated with `runledger-skill summarize examples/runs.jsonl`.
```

