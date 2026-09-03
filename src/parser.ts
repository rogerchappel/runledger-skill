import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { hasSecretLikeValue, markRedacted, redact } from "./redact.js";
import type { RunRecord } from "./types.js";

const GENESIS_HASH = "0".repeat(64);

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}

function recordHash(raw: Record<string, unknown>): string {
  const { hash: _hash, ...payload } = raw;
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function validateCanonical(raw: Record<string, unknown>, line: number, expectedPrev: string): string | undefined {
  const isCanonical = "schema" in raw || "hash" in raw || "prevHash" in raw;
  if (!isCanonical) return undefined;
  if (raw.schema !== "runledger.v1" || typeof raw.hash !== "string" || typeof raw.prevHash !== "string") {
    throw new Error(`Line ${line} is not a valid runledger.v1 record; expected schema, hash, and prevHash`);
  }
  if (raw.prevHash !== expectedPrev) {
    throw new Error(`Line ${line} has prevHash mismatch; expected ${expectedPrev}, got ${raw.prevHash}`);
  }
  const actual = recordHash(raw);
  if (raw.hash !== actual) {
    throw new Error(`Line ${line} has hash mismatch; expected ${actual}, got ${raw.hash}`);
  }
  validateCanonicalFields(raw, line);
  return raw.hash;
}

function validateCanonicalFields(raw: Record<string, unknown>, line: number): void {
  if (!Array.isArray(raw.command) || raw.command.length === 0 || raw.command.some((part) => typeof part !== "string" || part === "")) {
    throw new Error(`Line ${line} has invalid command; expected a non-empty string array`);
  }
  for (const field of ["id", "cwd", "startedAt", "finishedAt", "stdout", "stderr"] as const) {
    if (typeof raw[field] !== "string" || (field !== "stdout" && field !== "stderr" && raw[field].trim() === "")) {
      throw new Error(`Line ${line} has invalid ${field}; expected ${field === "stdout" || field === "stderr" ? "a string" : "a non-empty string"}`);
    }
  }
  if (raw.status !== "passed" && raw.status !== "failed") {
    throw new Error(`Line ${line} has invalid status; expected passed or failed`);
  }
  if (typeof raw.redacted !== "boolean") {
    throw new Error(`Line ${line} has invalid redacted; expected a boolean`);
  }
  const started = Date.parse(raw.startedAt as string);
  const finished = Date.parse(raw.finishedAt as string);
  if (!Number.isFinite(started)) throw new Error(`Line ${line} has invalid startedAt; expected a timestamp`);
  if (!Number.isFinite(finished)) throw new Error(`Line ${line} has invalid finishedAt; expected a timestamp`);
  if (finished < started) throw new Error(`Line ${line} finishedAt precedes startedAt`);
  if (typeof raw.durationMs === "number" && raw.durationMs > finished - started) {
    throw new Error(`Line ${line} durationMs exceeds elapsed time between startedAt and finishedAt`);
  }
  const passed = raw.exitCode === 0 && (raw.signal === null || raw.signal === undefined);
  if ((raw.status === "passed") !== passed) {
    throw new Error(`Line ${line} status does not match exitCode and signal`);
  }
}

function asRecord(value: unknown, line: number): RunRecord {
  if (!value || typeof value !== "object") {
    throw new Error(`Line ${line} is not a JSON object`);
  }
  const raw = value as Record<string, unknown>;
  const command = normalizeCommand(raw.command);
  if (command === undefined) {
    throw new Error(`Line ${line} is missing command`);
  }
  if (raw.exitCode !== null && (!Number.isInteger(raw.exitCode) || (raw.exitCode as number) < 0)) {
    throw new Error(`Line ${line} has invalid exitCode; expected null or a non-negative integer`);
  }
  if (raw.signal !== undefined && raw.signal !== null && (typeof raw.signal !== "string" || raw.signal.trim() === "")) {
    throw new Error(`Line ${line} has invalid signal; expected null or a non-empty string`);
  }
  if (raw.exitCode === undefined) {
    throw new Error(`Line ${line} is missing exitCode`);
  }
  if (raw.exitCode === null && (typeof raw.signal !== "string" || raw.signal.trim() === "")) {
    throw new Error(`Line ${line} with null exitCode requires a signal`);
  }
  for (const field of ["cwd", "startedAt", "endedAt", "stdout", "stderr", "outputPath", "notes"] as const) {
    if (raw[field] !== undefined && typeof raw[field] !== "string") {
      throw new Error(`Line ${line} has invalid ${field}; expected a string`);
    }
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
    command,
    cwd: typeof raw.cwd === "string" ? raw.cwd : undefined,
    exitCode: raw.exitCode as number | null,
    signal: typeof raw.signal === "string" ? raw.signal.trim() : raw.signal === null ? null : undefined,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
    endedAt: typeof raw.finishedAt === "string"
      ? raw.finishedAt
      : typeof raw.endedAt === "string" ? raw.endedAt : undefined,
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

function normalizeCommand(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (!Array.isArray(value) || value.length === 0 || value.some((part) => typeof part !== "string" || part === "")) {
    return undefined;
  }
  return value.map(renderArg).join(" ");
}

function renderArg(value: string): string {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function parseJsonl(text: string): RunRecord[] {
  let expectedPrev = GENESIS_HASH;
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
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return asRecord(value, lineNumber);
      }
      const canonicalHash = validateCanonical(value as Record<string, unknown>, lineNumber, expectedPrev);
      if (canonicalHash !== undefined) expectedPrev = canonicalHash;
      return asRecord(value, lineNumber);
    });
}

export async function readLedger(path: string): Promise<RunRecord[]> {
  return parseJsonl(await readFile(path, "utf8"));
}
