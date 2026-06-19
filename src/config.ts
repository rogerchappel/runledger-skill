import { readFile } from "node:fs/promises";
import type { Severity } from "./types.js";

export interface SkillConfig {
  requiredCommands: string[];
  failOn: Severity;
}

export async function readConfig(path: string | undefined): Promise<SkillConfig> {
  if (!path) return { requiredCommands: [], failOn: "error" };
  const raw = JSON.parse(await readFile(path, "utf8")) as Partial<SkillConfig>;
  return {
    requiredCommands: Array.isArray(raw.requiredCommands) ? raw.requiredCommands.filter(isString) : [],
    failOn: raw.failOn === "info" || raw.failOn === "warning" || raw.failOn === "error" ? raw.failOn : "error"
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

