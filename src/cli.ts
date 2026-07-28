#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { readLedger } from "./parser.js";
import { renderJson, renderMarkdown } from "./render.js";
import { shouldFail, summarize } from "./analyze.js";
import { readConfig } from "./config.js";
import type { Severity } from "./types.js";

interface Args {
  command: "summarize" | "check" | "help";
  input?: string;
  out?: string;
  format: "markdown" | "json";
  require: string[];
  failOn?: Severity;
  config?: string;
}

function parseArgs(argv: string[]): Args {
  const [command = "help", input, ...rest] = argv;
  const args: Args = {
    command: command === "summarize" || command === "check" ? command : "help",
    input,
    format: "markdown",
    require: []
  };

  const optionValue = (option: string, index: number): string => {
    const value = rest[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${option}`);
    }
    return value;
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--out") args.out = optionValue(arg, index++);
    else if (arg === "--format") {
      const format = optionValue(arg, index++);
      if (format !== "markdown" && format !== "json") {
        throw new Error(`Unsupported format: ${format}`);
      }
      args.format = format;
    }
    else if (arg === "--require") args.require.push(optionValue(arg, index++));
    else if (arg === "--fail-on") args.failOn = parseSeverity(rest[++index]);
    else if (arg === "--config") args.config = optionValue(arg, index++);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function parseSeverity(value: string | undefined): Severity {
  if (value === "info" || value === "warning" || value === "error") return value;
  throw new Error(`Invalid severity: ${value}`);
}

function help(): string {
  return `runledger-skill

Usage:
  runledger-skill summarize <runs.jsonl> [--out REPORT.md] [--format markdown|json]
  runledger-skill check <runs.jsonl> [--require "npm test"] [--fail-on warning] [--config .runledger-skill.json]
`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help" || !args.input) {
    process.stdout.write(help());
    process.exitCode = args.command === "help" ? 0 : 1;
    return;
  }

  const records = await readLedger(args.input);
  const config = await readConfig(args.config);
  const summary = summarize(args.input, records, {
    requiredCommands: [...config.requiredCommands, ...args.require],
    failOn: args.failOn ?? config.failOn
  });
  const output = args.format === "json" ? renderJson(summary) : renderMarkdown(summary);

  if (args.out) {
    await writeFile(args.out, output);
  } else {
    process.stdout.write(output);
  }

  if (args.command === "check" && shouldFail(summary.findings, args.failOn ?? config.failOn)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
