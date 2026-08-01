import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readConfig } from "../src/config.js";

async function configFile(value: unknown): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "runledger-config-test-"));
  const path = join(directory, "config.json");
  await writeFile(path, typeof value === "string" ? value : JSON.stringify(value));
  return path;
}

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

test("rejects requiredCommands with the wrong container type", async () => {
  const path = await configFile({ requiredCommands: "npm test", failOn: "error" });
  await assert.rejects(readConfig(path), /requiredCommands must be an array of non-empty strings/);
});

for (const invalid of ["", "   ", 42, null]) {
  test(`rejects invalid requiredCommands entry ${JSON.stringify(invalid)}`, async () => {
    const path = await configFile({ requiredCommands: ["npm test", invalid], failOn: "error" });
    await assert.rejects(readConfig(path), /requiredCommands must be an array of non-empty strings/);
  });
}

test("rejects an unsupported failOn severity", async () => {
  const path = await configFile({ requiredCommands: [], failOn: "critical" });
  await assert.rejects(readConfig(path), /failOn must be one of: info, warning, error/);
});

test("rejects malformed JSON with the config path", async () => {
  const path = await configFile("{not-json");
  await assert.rejects(readConfig(path), new RegExp(`Invalid JSON in config ${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`));
});
