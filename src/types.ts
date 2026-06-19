export type Severity = "info" | "warning" | "error";

export interface RunRecord {
  command: string;
  cwd?: string;
  exitCode: number;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
  outputPath?: string;
  notes?: string;
}

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  command?: string;
}

export interface Summary {
  source: string;
  generatedAt: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  records: RunRecord[];
  findings: Finding[];
}

export interface CheckOptions {
  requiredCommands: string[];
  failOn: Severity;
  maxAgeHours?: number;
}

