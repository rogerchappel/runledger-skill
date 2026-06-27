import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    process.exit(result.status || 1);
  }

  return result;
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = mkdtempSync(join(tmpdir(), 'runledger-skill-install-'));
const packResult = run('npm', ['pack', '--silent'], { cwd: repoRoot });
const tarballName = packResult.stdout.trim().split(/\r?\n/).at(-1);
const tarballPath = join(repoRoot, tarballName);
const reportPath = join(tmpDir, 'verification.md');

try {
  run('npm', ['init', '-y', '--silent'], { cwd: tmpDir });
  run('npm', ['install', '--silent', tarballPath], { cwd: tmpDir });

  const binPath = join(tmpDir, 'node_modules', '.bin', 'runledger-skill');
  run(binPath, ['summarize', join(repoRoot, 'examples', 'runs.jsonl'), '--out', reportPath], { cwd: tmpDir });

  if (!existsSync(reportPath)) {
    console.error('install smoke failed; summarize did not create a report');
    process.exit(1);
  }

  console.log(`install smoke passed; installed ${pkg.name} and summarized examples/runs.jsonl`);
} finally {
  rmSync(tarballPath, { force: true });
  rmSync(tmpDir, { recursive: true, force: true });
}
