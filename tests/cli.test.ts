import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function run(...args: string[]) {
  return spawnSync(process.execPath, ["dist/src/cli.js", ...args], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
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
