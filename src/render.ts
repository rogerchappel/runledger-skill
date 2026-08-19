import type { Summary } from "./types.js";

export function renderMarkdown(summary: Summary): string {
  const lines = [
    "# Verification Ledger",
    "",
    `Source: ${inlineCode(summary.source)}`,
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
    const exit = record.exitCode === null ? `signal: ${record.signal}` : String(record.exitCode);
    lines.push(`| ${inlineCode(record.command, true)} | ${exit} | ${record.durationMs ?? 0}ms | ${escapeText(evidence, true)} |`);
  }

  lines.push("", "## Findings", "");
  if (summary.findings.length === 0) {
    lines.push("No findings.");
  } else {
    for (const finding of summary.findings) {
      lines.push(
        `- **${escapeText(finding.severity)}** ${escapeText(finding.code)}: ${escapeText(finding.message)}` +
        `${finding.command ? ` (${inlineCode(finding.command)})` : ""}`
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

export function renderJson(summary: Summary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

function escapeText(value: string, tableCell = false): string {
  const flattened = value.replace(/\r\n?|\n/g, " ");
  const escaped = flattened.replace(/([\\`*_{}\[\]<>#+.!-])/g, "\\$1");
  return tableCell ? escaped.replace(/\|/g, "\\|") : escaped;
}

function inlineCode(value: string, tableCell = false): string {
  let flattened = value.replace(/\r\n?|\n/g, " ");
  if (tableCell) flattened = flattened.replace(/\|/g, "\\|");
  const longestRun = Math.max(0, ...Array.from(flattened.matchAll(/`+/g), (match) => match[0].length));
  const fence = "`".repeat(longestRun + 1);
  const padding = flattened.startsWith("`") || flattened.endsWith("`") ? " " : "";
  return `${fence}${padding}${flattened}${padding}${fence}`;
}
