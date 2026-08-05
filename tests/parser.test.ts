import assert from "node:assert/strict";
import test from "node:test";
import { parseJsonl } from "../src/parser.js";
import { wasRedacted } from "../src/redact.js";

test("parses JSONL run records", () => {
  const records = parseJsonl('{"command":"npm test","exitCode":0,"stdout":"ok"}\n');
  assert.equal(records.length, 1);
  assert.equal(records[0].command, "npm test");
  assert.equal(records[0].exitCode, 0);
});

test("rejects missing command", () => {
  assert.throws(() => parseJsonl('{"exitCode":0}\n'), /missing command/);
});

test("rejects invalid exit codes with physical line numbers", () => {
  for (const exitCode of [0.5, -1]) {
    assert.throws(
      () => parseJsonl(`{"command":"npm test","exitCode":0}\n\n{"command":"npm test","exitCode":${exitCode}}\n`),
      /Line 3 has invalid exitCode/
    );
  }
});

test("rejects invalid durations with physical line numbers", () => {
  for (const durationMs of [-1, "1e309"]) {
    assert.throws(
      () => parseJsonl(`{"command":"npm test","exitCode":0}\n\n{"command":"npm test","exitCode":0,"durationMs":${durationMs}}\n`),
      /Line 3 has invalid durationMs/
    );
  }
});

test("accepts zero and positive numeric values", () => {
  const records = parseJsonl(
    '{"command":"zero","exitCode":0,"durationMs":0}\n{"command":"positive","exitCode":2,"durationMs":1.5}\n'
  );
  assert.deepEqual(
    records.map(({ exitCode, durationMs }) => ({ exitCode, durationMs })),
    [
      { exitCode: 0, durationMs: 0 },
      { exitCode: 2, durationMs: 1.5 }
    ]
  );
});

test("preserves physical line numbers across blank lines", () => {
  assert.throws(
    () => parseJsonl('{"command":"npm test","exitCode":0}\n\n{"exitCode":0}\n'),
    /Line 3 is missing command/
  );
});

test("reports the physical line containing malformed JSON", () => {
  assert.throws(
    () => parseJsonl('{"command":"npm test","exitCode":0}\n\n{"command":\n'),
    /Line 3 contains malformed JSON/
  );
});

test("redacts secret-like values while parsing", () => {
  const records = parseJsonl('{"command":"check","exitCode":0,"stdout":"token=abcdefghijklmnop"}\n');
  assert.equal(records[0].stdout, "token=[REDACTED]");
  assert.equal(wasRedacted(records[0]), true);
});

test("does not mark clean records as redacted", () => {
  const records = parseJsonl('{"command":"check","exitCode":0,"stdout":"clean output"}\n');
  assert.equal(wasRedacted(records[0]), false);
});
