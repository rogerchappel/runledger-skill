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

test("redacts secret-like values while parsing", () => {
  const records = parseJsonl('{"command":"check","exitCode":0,"stdout":"token=abcdefghijklmnop"}\n');
  assert.equal(records[0].stdout, "token=[REDACTED]");
});

