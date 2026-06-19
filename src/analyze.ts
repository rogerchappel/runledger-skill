import { hasSecretLikeValue } from "./redact.js";
import type { CheckOptions, Finding, RunRecord, Severity, Summary } from "./types.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  warning: 1,
  error: 2
};

export function shouldFail(findings: Finding[], failOn: Severity): boolean {
  return findings.some((finding) => SEVERITY_ORDER[finding.severity] >= SEVERITY_ORDER[failOn]);
}

export function summarize(source: string, records: RunRecord[], options: CheckOptions): Summary {
  const findings: Finding[] = [];
  const commands = new Set(records.map((record) => record.command));

  for (const required of options.requiredCommands) {
    if (!commands.has(required)) {
      findings.push({
        severity: "error",
        code: "missing-required-command",
        message: `Missing required command: ${required}`,
        command: required
      });
    }
  }

  for (const record of records) {
    if (record.exitCode !== 0) {
      findings.push({
        severity: "error",
        code: "command-failed",
        message: `Command exited with ${record.exitCode}`,
        command: record.command
      });
    }
    if (!record.outputPath && !record.stdout && !record.stderr) {
      findings.push({
        severity: "warning",
        code: "missing-output-reference",
        message: "Command has no stdout, stderr, or outputPath evidence",
        command: record.command
      });
    }
    if (hasSecretLikeValue(record.stdout) || hasSecretLikeValue(record.stderr) || hasSecretLikeValue(record.notes)) {
      findings.push({
        severity: "warning",
        code: "redaction-applied",
        message: "Secret-like text was detected and redacted",
        command: record.command
      });
    }
  }

  return {
    source,
    generatedAt: new Date(0).toISOString(),
    total: records.length,
    passed: records.filter((record) => record.exitCode === 0).length,
    failed: records.filter((record) => record.exitCode !== 0).length,
    durationMs: records.reduce((sum, record) => sum + (record.durationMs ?? 0), 0),
    records,
    findings
  };
}

