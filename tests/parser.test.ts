import assert from "node:assert/strict";
import test from "node:test";
import { parseJsonl } from "../src/parser.js";

test("parses JSONL run records", () => {
  const records = parseJsonl('{"command":"npm test","exitCode":0,"stdout":"ok"}\n');
  assert.equal(records.length, 1);
  assert.equal(records[0].command, "npm test");
  assert.equal(records[0].exitCode, 0);
});

test("rejects missing command", () => {
  assert.throws(() => parseJsonl('{"exitCode":0}\n'), /missing command/);
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
});
