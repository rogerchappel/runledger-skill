import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const requiredFiles = [
  'package.json',
  'dist/src/cli.js',
  'dist/src/index.js',
  'dist/src/parser.js',
  'dist/src/render.js',
  'dist/src/redact.js',
  'SKILL.md',
  'README.md',
  'LICENSE',
  'docs/RELEASE_CANDIDATE.md',
  'docs/SCHEMA.md',
  'examples/runs.jsonl',
  'examples/expected-report.md',
];

const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf8',
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}

const [packument] = JSON.parse(result.stdout);
const packedFiles = new Set(packument.files.map((file) => file.path));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));
const binTarget = pkg.bin['runledger-skill'].replace(/^\.\//, '');
const packedBin = packument.files.find((file) => file.path === binTarget);

if (missing.length > 0) {
  console.error(`package smoke failed; missing files: ${missing.join(', ')}`);
  process.exit(1);
}

if (!packedBin) {
  console.error(`package smoke failed; bin target is not packed: ${binTarget}`);
  process.exit(1);
}

if ((packedBin.mode & 0o111) === 0) {
  console.error(`package smoke failed; bin target is not executable in pack output: ${binTarget}`);
  process.exit(1);
}

console.log(`package smoke passed; checked ${requiredFiles.length} files and executable bin metadata`);
