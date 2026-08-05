import { readFile } from "node:fs/promises";
import { hasSecretLikeValue, markRedacted, redact } from "./redact.js";
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
  if (!Number.isInteger(raw.exitCode) || raw.exitCode < 0) {
    throw new Error(`Line ${line} has invalid exitCode; expected a non-negative integer`);
  }
  if (
    raw.durationMs !== undefined &&
    (typeof raw.durationMs !== "number" || !Number.isFinite(raw.durationMs) || raw.durationMs < 0)
  ) {
    throw new Error(`Line ${line} has invalid durationMs; expected a finite non-negative number`);
  }
  const stdout = typeof raw.stdout === "string" ? raw.stdout : undefined;
  const stderr = typeof raw.stderr === "string" ? raw.stderr : undefined;
  const notes = typeof raw.notes === "string" ? raw.notes : undefined;
  const record: RunRecord = {
    command: raw.command.trim(),
    cwd: typeof raw.cwd === "string" ? raw.cwd : undefined,
    exitCode: raw.exitCode,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
    endedAt: typeof raw.endedAt === "string" ? raw.endedAt : undefined,
    durationMs: raw.durationMs,
    stdout: redact(stdout),
    stderr: redact(stderr),
    outputPath: typeof raw.outputPath === "string" ? raw.outputPath : undefined,
    notes: redact(notes)
  };
  return hasSecretLikeValue(stdout) || hasSecretLikeValue(stderr) || hasSecretLikeValue(notes)
    ? markRedacted(record)
    : record;
}

export function parseJsonl(text: string): RunRecord[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line !== "")
    .map(({ line, lineNumber }) => {
      let value: unknown;
      try {
        value = JSON.parse(line);
      } catch (error: unknown) {
        const detail = error instanceof Error ? `: ${error.message}` : "";
        throw new Error(`Line ${lineNumber} contains malformed JSON${detail}`);
      }
      return asRecord(value, lineNumber);
    });
}

export async function readLedger(path: string): Promise<RunRecord[]> {
  return parseJsonl(await readFile(path, "utf8"));
}
