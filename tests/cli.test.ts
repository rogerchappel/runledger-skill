import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function run(...args: string[]) {
  return spawnSync(process.execPath, ["dist/src/cli.js", ...args], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
}

function configFile(contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), "runledger-cli-test-"));
  const path = join(directory, "config.json");
  writeFileSync(path, contents);
  return path;
}

test("rejects unsupported output formats", () => {
  const result = run("summarize", "examples/clean-runs.jsonl", "--format", "yaml");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unsupported format: yaml/);
  assert.equal(result.stdout, "");
});

for (const option of ["--out", "--format", "--require", "--config"]) {
  test(`rejects a missing value for ${option}`, () => {
    const result = run("summarize", "examples/clean-runs.jsonl", option);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`Missing value for ${option}`));
    assert.equal(result.stdout, "");
  });
}

test("reports malformed config JSON as a CLI error", () => {
  const path = configFile("{not-json");
  const result = run("check", "examples/clean-runs.jsonl", "--config", path);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid JSON in config .*config\.json:/);
  assert.equal(result.stdout, "");
});

test("a valid config enforces required commands", () => {
  const path = configFile(JSON.stringify({ requiredCommands: ["npm run missing"], failOn: "warning" }));
  const result = run("check", "examples/clean-runs.jsonl", "--config", path, "--format", "json");
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  const report = JSON.parse(result.stdout) as { findings: Array<{ message: string }> };
  assert.ok(report.findings.some((finding) => finding.message.includes("npm run missing")));
});

test("reports redaction without exposing the original value in JSON output", () => {
  const directory = mkdtempSync(join(tmpdir(), "runledger-cli-test-"));
  const ledger = join(directory, "runs.jsonl");
  writeFileSync(ledger, '{"command":"deploy","exitCode":0,"stdout":"token=abcdefghijklmnop"}\n');

  const result = run("summarize", ledger, "--format", "json");
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /abcdefghijklmnop/);
  const report = JSON.parse(result.stdout) as { records: Array<{ stdout: string }>; findings: Array<{ code: string }> };
  assert.equal(report.records[0].stdout, "token=[REDACTED]");
  assert.equal(report.findings.filter(({ code }) => code === "redaction-applied").length, 1);
});
