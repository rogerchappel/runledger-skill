import assert from "node:assert/strict";
import test from "node:test";
import { readConfig } from "../src/config.js";

test("reads required command policy", async () => {
  const config = await readConfig("examples/runledger-skill.config.json");
  assert.deepEqual(config.requiredCommands, ["npm test", "npm run build"]);
  assert.equal(config.failOn, "warning");
});

test("uses safe defaults without config", async () => {
  const config = await readConfig(undefined);
  assert.deepEqual(config.requiredCommands, []);
  assert.equal(config.failOn, "error");
});

