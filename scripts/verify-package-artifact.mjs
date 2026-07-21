import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, isAbsolute } from 'node:path';

const FAILURE = 'package-artifact-check: failed\n';

function normalize(value) {
  const path = value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
  if (!path || isAbsolute(path) || path.split('/').includes('..') || /[*?[\]]/.test(path)) {
    throw new Error('invalid path');
  }
  return path;
}

function covered(path, roots) {
  return path === 'package.json'
    || /^licen[cs]e(?:\.[a-z0-9]+)?$/i.test(path)
    || roots.some((root) => path === root || path.startsWith(`${root}/`));
}

try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    throw new Error('missing files');
  }
  const roots = packageJson.files.map((entry) => normalize(entry));
  const packed = JSON.parse(execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ));
  if (!Array.isArray(packed) || packed.length !== 1) throw new Error('invalid pack');

  const [{ filename, files }] = packed;
  if (typeof filename !== 'string' || basename(filename) !== filename || !/^[a-z0-9._-]+\.tgz$/i.test(filename)) {
    throw new Error('invalid artifact');
  }
  if (!Array.isArray(files) || files.length === 0) throw new Error('missing artifact files');
  const paths = files.map((entry) => normalize(entry?.path ?? ''));
  if (!paths.every((path) => covered(path, roots))) throw new Error('unexpected artifact file');
  if (!roots.every((root) => paths.some((path) => path === root || path.startsWith(`${root}/`)))) {
    throw new Error('missing allow-list root');
  }
  process.stdout.write(`${filename}\n`);
} catch {
  process.stderr.write(FAILURE);
  process.exitCode = 1;
}
