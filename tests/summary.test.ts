import assert from "node:assert/strict";
import test from "node:test";
import { summarize, shouldFail } from "../src/analyze.js";
import { renderMarkdown } from "../src/render.js";

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

