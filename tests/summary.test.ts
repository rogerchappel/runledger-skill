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

test("matches normalized runledger.v1 commands and reports signal failures", () => {
  const records = parseJsonl(readFileSync("tests/fixtures/runledger.v1.jsonl", "utf8"));
  const summary = summarize("fixture", records, {
    requiredCommands: [`node -e 'console.log('"'"'fixture ok'"'"')'`],
    failOn: "error"
  });

  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.findings.some(({ code }) => code === "missing-required-command"), false);
  assert.match(summary.findings.find(({ code }) => code === "command-failed")?.message ?? "", /SIGTERM/);
  assert.match(renderMarkdown(summary), /signal: SIGTERM/);
});

test("only the exact canonical argv rendering satisfies a requirement", () => {
  const exact = `node -e 'console.log("a b")'`;
  const split = parseJsonl(JSON.stringify({
    command: ["node", "-e", 'console.log("a', 'b")'],
    exitCode: 0
  }));

  const summary = summarize("fixture", split, { requiredCommands: [exact], failOn: "warning" });
  assert.equal(summary.findings.some(({ code }) => code === "missing-required-command"), true);

  const matching = parseJsonl(JSON.stringify({ command: ["node", "-e", 'console.log("a b")'], exitCode: 0 }));
  const matchingSummary = summarize("fixture", matching, { requiredCommands: [exact], failOn: "warning" });
  assert.equal(matchingSummary.findings.some(({ code }) => code === "missing-required-command"), false);
});

test("keeps compact string command matching unchanged", () => {
  const records = parseJsonl(JSON.stringify({ command: `node -e console.log("a b")`, exitCode: 0 }));
  const summary = summarize("fixture", records, {
    requiredCommands: [`node -e console.log("a b")`],
    failOn: "warning"
  });
  assert.equal(summary.findings.some(({ code }) => code === "missing-required-command"), false);
});

test("renders markdown report", () => {
  const summary = summarize("fixture", [
    { command: "npm test", exitCode: 0, durationMs: 10, stdout: "ok" }
  ], { requiredCommands: [], failOn: "error" });
  assert.match(renderMarkdown(summary), /# Verification Ledger/);
  assert.match(renderMarkdown(summary), /npm test/);
});

test("keeps compact and argv commands inside one readable markdown table cell", () => {
  const records = parseJsonl([
    JSON.stringify({ command: "printf `left|right`\nnext", exitCode: 0, stdout: "line|one\nline `two`" }),
    JSON.stringify({ command: ["node", "-e", "console.log(`a|b`)"], exitCode: 0, stdout: "ok" })
  ].join("\n"));
  const summary = summarize("ledger|`source`\nname", records, {
    requiredCommands: [records[0].command, records[1].command],
    failOn: "error"
  });

  const markdown = renderMarkdown(summary);
  assert.match(markdown, /Source: ``ledger\|`source` name``/);
  assert.match(markdown, /\| ``printf `left\\\|right` next`` \| 0 \| 0ms \| line\\\|one line \\`two\\` \|/);
  assert.match(markdown, /\| ``node -e 'console\.log\(`a\\\|b`\)'`` \| 0 \| 0ms \| ok \|/);
  assert.equal(markdown.split("\n").filter((line) => line.startsWith("| ``")).length, 2);
  assert.equal(summary.findings.some(({ code }) => code === "missing-required-command"), false);
});

test("escapes markdown control delimiters in finding text and commands", () => {
  const command = "check `value|other`\nnext";
  const summary = summarize("fixture", [], { requiredCommands: [command], failOn: "warning" });
  const markdown = renderMarkdown(summary);

  assert.match(markdown, /Missing required command: check \\`value\|other\\` next/);
  assert.match(markdown, /\(``check `value\|other` next``\)/);
  assert.equal(markdown.split("\n").filter((line) => line.startsWith("- **error**")).length, 1);
  assert.equal(renderJson(summary), `${JSON.stringify(summary, null, 2)}\n`);
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
