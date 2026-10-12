import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const checker = join(root, 'scripts', 'verify-package-artifact.mjs');
const failure = 'package-artifact-check: failed\n';

function fixture(files = ['dist', 'README.md', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_LICENSES']) {
  const cwd = mkdtempSync(join(tmpdir(), 'comins-grid-package-'));
  mkdirSync(join(cwd, 'dist'));
  writeFileSync(join(cwd, 'dist', 'index.js'), 'export {};\n');
  const exports = {};
  for (const entry of ['index', 'core', 'react', 'vue']) {
    exports[entry === 'index' ? '.' : './' + entry] = { import: './dist/' + entry + '.js', types: './dist/' + entry + '.d.ts' };
    writeFileSync(join(cwd, 'dist', entry + '.js'), 'export {};\n');
    writeFileSync(join(cwd, 'dist', entry + '.d.ts'), entry === 'vue' ? "export * from './Grid.vue';" : 'export {};\n');
  }
  writeFileSync(join(cwd, 'dist', 'Grid.vue.d.ts'), 'export {};');
  mkdirSync(join(cwd, 'THIRD_PARTY_LICENSES'));
  writeFileSync(join(cwd, 'THIRD_PARTY_LICENSES/lucide.txt'), readFileSync(join(root, 'THIRD_PARTY_LICENSES/lucide.txt')));
  writeFileSync(join(cwd, 'README.md'), '# Fixture\n');
  writeFileSync(join(cwd, 'CHANGELOG.md'), '# Changes\n');
  writeFileSync(join(cwd, 'THIRD_PARTY_NOTICES.md'), '# Third-Party Notices\n');
  writeFileSync(join(cwd, 'LICENSE'), 'MIT\n');
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({
    name: 'comins-artifact-fixture',
    version: '1.0.0',
    type: 'module',
    exports,
    files,
    scripts: {
      prepack: "node -e \"require('node:fs').writeFileSync('should-not-exist','blocked')\"",
    },
  }));
  return cwd;
}

function run(cwd) {
  return spawnSync(process.execPath, [checker], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(cwd, '.npm-cache') },
  });
}

test('creates one ignored-script artifact covered by the files allow-list', () => {
  const cwd = fixture();
  try {
    const result = run(cwd);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    assert.match(result.stdout, /^[a-z0-9._-]+\.tgz\n$/i);
    assert.equal(existsSync(join(cwd, result.stdout.trim())), true);
    assert.equal(existsSync(join(cwd, 'should-not-exist')), false);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

for (const path of ['dist/Grid.vue.d.ts', 'THIRD_PARTY_LICENSES/lucide.txt']) test('rejects missing required boundary file ' + path, () => {
  const cwd = fixture();
  try { rmSync(join(cwd, path)); assert.equal(run(cwd).status, 1); }
  finally { rmSync(cwd, { recursive: true, force: true }); }
});

test('fails closed without a non-empty package files allow-list', () => {
  const cwd = fixture([]);
  try {
    const result = run(cwd);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, failure);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('fails closed when the third-party notice is omitted from the artifact', () => {
  const cwd = fixture(['dist', 'README.md', 'CHANGELOG.md']);
  try {
    const result = run(cwd);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, failure);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('fails closed when the package license is missing from the artifact', () => {
  const cwd = fixture();
  try {
    rmSync(join(cwd, 'LICENSE'));
    const result = run(cwd);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, failure);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
