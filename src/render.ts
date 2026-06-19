import type { Summary } from "./types.js";

export function renderMarkdown(summary: Summary): string {
  const lines = [
    "# Verification Ledger",
    "",
    `Source: \`${summary.source}\``,
    `Runs: ${summary.total} total, ${summary.passed} passed, ${summary.failed} failed`,
    `Recorded duration: ${summary.durationMs}ms`,
    "",
    "## Commands",
    "",
    "| Command | Exit | Duration | Evidence |",
    "|---|---:|---:|---|"
  ];

  for (const record of summary.records) {
    const evidence = record.outputPath ?? record.stdout ?? record.stderr ?? "missing";
    lines.push(`| \`${record.command}\` | ${record.exitCode} | ${record.durationMs ?? 0}ms | ${escapeCell(evidence)} |`);
  }

  lines.push("", "## Findings", "");
  if (summary.findings.length === 0) {
    lines.push("No findings.");
  } else {
    for (const finding of summary.findings) {
      lines.push(`- **${finding.severity}** ${finding.code}: ${finding.message}${finding.command ? ` (\`${finding.command}\`)` : ""}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

export function renderJson(summary: Summary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

