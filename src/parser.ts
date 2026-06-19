import { readFile } from "node:fs/promises";
import { redact } from "./redact.js";
import type { RunRecord } from "./types.js";

function asRecord(value: unknown, line: number): RunRecord {
  if (!value || typeof value !== "object") {
    throw new Error(`Line ${line} is not a JSON object`);
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.command !== "string" || raw.command.trim() === "") {
    throw new Error(`Line ${line} is missing command`);
  }
  if (typeof raw.exitCode !== "number") {
    throw new Error(`Line ${line} is missing numeric exitCode`);
  }
  return {
    command: raw.command.trim(),
    cwd: typeof raw.cwd === "string" ? raw.cwd : undefined,
    exitCode: raw.exitCode,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
    endedAt: typeof raw.endedAt === "string" ? raw.endedAt : undefined,
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : undefined,
    stdout: redact(typeof raw.stdout === "string" ? raw.stdout : undefined),
    stderr: redact(typeof raw.stderr === "string" ? raw.stderr : undefined),
    outputPath: typeof raw.outputPath === "string" ? raw.outputPath : undefined,
    notes: redact(typeof raw.notes === "string" ? raw.notes : undefined)
  };
}

export function parseJsonl(text: string): RunRecord[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => asRecord(JSON.parse(line), index + 1));
}

export async function readLedger(path: string): Promise<RunRecord[]> {
  return parseJsonl(await readFile(path, "utf8"));
}

