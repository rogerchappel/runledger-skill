import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { summarize, shouldFail } from "../src/analyze.js";
import { parseJsonl } from "../src/parser.js";
import { renderJson, renderMarkdown } from "../src/render.js";

test("summarizes pass and fail counts", () => {
  const summary = summarize("fixture", [
    { command: "npm test", exitCode: 0, durationMs: 10, stdout: "ok" },
    { command: "npm run smoke", exitCode: 1, durationMs: 20, stderr: "bad" }
  ], { requiredCommands: ["npm test"], failOn: "warning" });
  assert.equal(summary.total, 2);
  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.durationMs, 30);
  assert.equal(shouldFail(summary.findings, "error"), true);
});

test("flags missing required commands", () => {
  const summary = summarize("fixture", [], { requiredCommands: ["npm test"], failOn: "warning" });
  assert.match(summary.findings[0].message, /Missing required command/);
});

test("renders markdown report", () => {
  const summary = summarize("fixture", [
    { command: "npm test", exitCode: 0, durationMs: 10, stdout: "ok" }
  ], { requiredCommands: [], failOn: "error" });
  assert.match(renderMarkdown(summary), /# Verification Ledger/);
  assert.match(renderMarkdown(summary), /npm test/);
});

test("matches clean expected report fixture", () => {
  const summary = summarize("examples/clean-runs.jsonl", [
    { command: "npm test", exitCode: 0, durationMs: 100, stdout: "ok" },
    { command: "npm run build", exitCode: 0, durationMs: 150, stdout: "ok" }
  ], { requiredCommands: [], failOn: "error" });
  assert.equal(renderMarkdown(summary), readFileSync("examples/expected-report.md", "utf8"));
});

test("reports one redaction warning per parsed record", () => {
  for (const field of ["stdout", "stderr", "notes"] as const) {
    const records = parseJsonl(JSON.stringify({
      command: `check ${field}`,
      exitCode: 0,
      stdout: "ordinary output",
      [field]: "token=abcdefghijklmnop"
    }));
    const summary = summarize("fixture", records, { requiredCommands: [], failOn: "error" });

    assert.equal(summary.findings.filter(({ code }) => code === "redaction-applied").length, 1);
    assert.doesNotMatch(renderMarkdown(summary), /abcdefghijklmnop/);
    assert.doesNotMatch(renderJson(summary), /abcdefghijklmnop/);
  }
});

test("does not report redaction for clean parsed input", () => {
  const records = parseJsonl('{"command":"check","exitCode":0,"stdout":"clean output","stderr":"","notes":"safe"}');
  const summary = summarize("fixture", records, { requiredCommands: [], failOn: "error" });
  assert.equal(summary.findings.some(({ code }) => code === "redaction-applied"), false);
});
