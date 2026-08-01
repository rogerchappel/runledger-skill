import { readFile } from "node:fs/promises";
import type { Severity } from "./types.js";

export interface SkillConfig {
  requiredCommands: string[];
  failOn: Severity;
}

export async function readConfig(path: string | undefined): Promise<SkillConfig> {
  if (!path) return { requiredCommands: [], failOn: "error" };
  const contents = await readFile(path, "utf8");
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in config ${path}: ${detail}`);
  }

  if (!isObject(raw)) {
    throw new Error(`Invalid config ${path}: expected a JSON object`);
  }
  if (!Array.isArray(raw.requiredCommands) || !raw.requiredCommands.every(isString)) {
    throw new Error(`Invalid config ${path}: requiredCommands must be an array of non-empty strings`);
  }
  if (!isSeverity(raw.failOn)) {
    throw new Error(`Invalid config ${path}: failOn must be one of: info, warning, error`);
  }

  return { requiredCommands: raw.requiredCommands, failOn: raw.failOn };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSeverity(value: unknown): value is Severity {
  return value === "info" || value === "warning" || value === "error";
}
