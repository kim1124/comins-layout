import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const checker = join(root, 'scripts', 'check-public-identities.mjs');
const failure = 'public-identity-check: failed\n';
const email = (local, domain) => [local, '@', domain].join('');
const safeName = 'comins-ci';
const safeEmail = email(safeName, 'users.noreply.github.com');
const unsafeName = ['Local', 'Author'].join(' ');
const unsafeEmail = email('local.author', 'private.test');

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function repository() {
  const cwd = mkdtempSync(join(tmpdir(), 'comins-grid-identity-'));
  git(cwd, 'init', '--quiet');
  git(cwd, 'config', 'user.name', safeName);
  git(cwd, 'config', 'user.email', safeEmail);
  return cwd;
}

function commit(cwd, message) {
  writeFileSync(join(cwd, 'change.txt'), `${message}\n`, { flag: 'a' });
  git(cwd, 'add', 'change.txt');
  git(cwd, 'commit', '--quiet', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}

function run(cwd, ...args) {
  return spawnSync(process.execPath, [checker, ...args], { cwd, encoding: 'utf8' });
}

function constantFailure(result) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, failure);
}

test('adopts the lean Contract v1.4 module policy', () => {
  const agents = read('AGENTS.md');
  const security = read('SECURITY.md');
  const packageJson = JSON.parse(read('package.json'));
  const packageLock = JSON.parse(read('package-lock.json'));
  const changelog = read('CHANGELOG.md');

  assert.match(agents, /managed-start contract=v1\.4/);
  assert.match(
    agents,
    /license compliance; security and sensitive data; Comins common rules;/,
  );
  assert.match(agents, /`OSS_LICENSE_POLICY\.md` and `SENSITIVE_DATA_STANDARD\.md`/);
  assert.match(agents, /module owns its checker commands and CI implementation/);
  assert.match(agents, /release checks only when publishing/);
  assert.match(security, /credential\/PII incident/i);
  assert.match(security, /stop the affected release/i);
  assert.match(security, /without public disclosure/i);
  assert.match(
    security,
    /Before 1\.0\.0, only the latest published version receives security fixes\./,
  );
  assert.equal(packageJson.version, '0.1.6');
  assert.equal(packageLock.version, '0.1.6');
  assert.equal(packageLock.packages[''].version, '0.1.6');
  assert.match(security, /\| 0\.1\.6 \| Yes \|/);
  assert.match(security, /\| < 0\.1\.6 \| No \|/);
  assert.match(changelog, /^## 0\.1\.6$/m);
  assert.match(changelog, /npm service-identity/i);
  assert.match(changelog, /development tooling/i);
  assert.match(changelog, /No runtime or public API changes\./);
});

test('pins shared Gitleaks, hooks, scripts, and workflows', () => {
  const config = read('.gitleaks.toml');
  const preCommit = read('.githooks/pre-commit');
  const prePush = read('.githooks/pre-push');
  const verify = read('.github/workflows/verify.yml');
  const publish = read('.github/workflows/publish.yml');
  const npmIdentity = read('.github/workflows/verify-npm-identity.yml');
  const npmIdentityChecker = read('scripts/check-npm-registry-identity.mjs');
  const packageJson = JSON.parse(read('package.json'));

  assert.match(config, /^minVersion = "v8\.30\.1"$/m);
  for (const id of [
    'comins-non-placeholder-email',
    'comins-local-account-path',
    'comins-korean-sensitive-number',
    'comins-sensitive-filename',
  ]) assert.match(config, new RegExp(`^id = "${id}"$`, 'm'));
  assert.doesNotMatch(config, /^\[\[allowlists\]\]$/m);
  assert.match(config, /Approved npm package version coordinates/);

  assert.match(preCommit, /check-public-identities\.mjs/);
  assert.match(preCommit, /gitleaks git --pre-commit/);
  assert.match(preCommit, /--staged/);
  assert.match(preCommit, /mktemp/);
  assert.match(preCommit, /sensitive-data-check: failed/);
  assert.match(prePush, /check-public-identities\.mjs "\$base_sha" "\$local_sha"/);
  assert.match(prePush, /--log-opts="\$base_sha\.\.\$local_sha"/);

  const actionPins = new Map([
    ['actions/checkout', '3d3c42e5aac5ba805825da76410c181273ba90b1'],
    ['actions/setup-node', '820762786026740c76f36085b0efc47a31fe5020'],
    ['actions/upload-artifact', '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a'],
    ['actions/download-artifact', '3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c'],
  ]);

  for (const workflow of [verify, publish, npmIdentity]) {
    const uses = [...workflow.matchAll(/uses:\s+([^@\s]+)@([^\s#]+)/g)];
    assert.ok(uses.length > 0);
    for (const [, action, revision] of uses) {
      assert.equal(actionPins.get(action), revision);
      assert.match(revision, /^[0-9a-f]{40}$/);
    }
    assert.match(workflow, /persist-credentials: false/);
  }
  for (const workflow of [publish, npmIdentity]) {
    assert.match(
      workflow,
      /COMINS_NPM_PUBLIC_NAME:\s+\${{ secrets\.COMINS_NPM_PUBLIC_NAME }}/,
    );
    assert.match(
      workflow,
      /COMINS_NPM_PUBLIC_EMAIL:\s+\${{ secrets\.COMINS_NPM_PUBLIC_EMAIL }}/,
    );
    assert.doesNotMatch(workflow, /\${{ vars\.COMINS_NPM_PUBLIC_(?:NAME|EMAIL) }}/);
    assert.doesNotMatch(workflow, /set -x|printenv|env\s*$/m);
  }
  assert.match(verify, /fetch-depth: 0/);
  assert.match(verify, /--log-opts="\$BASE_SHA\.\.\$HEAD_SHA"/);
  assert.match(publish, /verify-package-artifact\.mjs/);
  assert.match(publish, /tar -xzf "\$package_file"/);
  assert.match(publish, /gitleaks dir/);
  const packIndex = publish.indexOf('id: pack');
  const consumerIndex = publish.indexOf('npm run test:consumer -- "${{ steps.pack.outputs.package-file }}"');
  const uploadIndex = publish.indexOf('actions/upload-artifact@');
  assert.ok(packIndex >= 0);
  assert.ok(consumerIndex > packIndex);
  assert.ok(uploadIndex > consumerIndex);
  assert.equal(publish.match(/npm run test:consumer/g)?.length, 1);
  assert.match(publish, /npm stage publish \.\/package-artifact\/\*\.tgz/);
  assert.equal(
    publish.match(/check-npm-registry-identity\.mjs/g)?.length,
    2,
  );
  assert.doesNotMatch(publish, /\n\s+if:\s+github\.ref/);
  const publishBranchGuardIndex = publish.indexOf(
    'run: test "$GITHUB_REF" = \'refs/heads/main\'',
  );
  const publishCheckoutIndex = publish.indexOf('actions/checkout@');
  assert.ok(publishBranchGuardIndex >= 0);
  assert.ok(publishCheckoutIndex > publishBranchGuardIndex);
  assert.match(npmIdentity, /workflow_dispatch:/);
  assert.match(npmIdentity, /required:\s+false/);
  assert.match(npmIdentity, /permissions:\n\s+contents: read/);
  assert.match(npmIdentity, /check-npm-registry-identity\.mjs/);
  assert.doesNotMatch(npmIdentity, /\n\s+if:\s+github\.ref/);
  const branchGuardIndex = npmIdentity.indexOf(
    'run: test "$GITHUB_REF" = \'refs/heads/main\'',
  );
  const identityCheckoutIndex = npmIdentity.indexOf('actions/checkout@');
  assert.ok(branchGuardIndex >= 0);
  assert.ok(identityCheckoutIndex > branchGuardIndex);

  const stage = publish.slice(publish.indexOf('\n  stage:'));
  const downloadIndex = stage.indexOf('actions/download-artifact@');
  const recheckIndex = stage.indexOf('Recheck npm public identity before staging');
  const stagePublishIndex = stage.indexOf('npm stage publish');
  assert.ok(downloadIndex >= 0);
  assert.ok(recheckIndex > downloadIndex);
  assert.ok(stagePublishIndex > recheckIndex);

  assert.equal(packageJson.scripts['check:security'], 'node scripts/check-public-identities.mjs');
  assert.equal(packageJson.scripts['check:licenses'], 'node scripts/check-third-party-notices.mjs');
  assert.equal(
    packageJson.scripts['check:npm-identity'],
    'node scripts/check-npm-registry-identity.mjs',
  );
  assert.match(packageJson.scripts['test:security'], /node --test/);
  assert.equal(packageJson.scripts['verify:package-artifact'], 'node scripts/verify-package-artifact.mjs');
  assert.doesNotMatch(packageJson.scripts.verify, /check:security/);
  assert.doesNotMatch(packageJson.scripts.verify, /check:npm-identity/);
  assert.match(packageJson.scripts.verify, /check:licenses/);
  assert.match(packageJson.scripts.verify, /test:security/);
  assert.doesNotMatch(
    npmIdentityChecker,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
});

test('accepts a matching public noreply identity', () => {
  const cwd = repository();
  const result = run(cwd);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('accepts GitHub service committer on a Dependabot commit', () => {
  const cwd = repository();
  const base = commit(cwd, 'base');
  git(cwd, 'config', 'user.name', 'dependabot[bot]');
  git(cwd, 'config', 'user.email', email('49699333+dependabot[bot]', 'users.noreply.github.com'));
  writeFileSync(join(cwd, 'change.txt'), 'dependency update\n', { flag: 'a' });
  git(cwd, 'add', 'change.txt');
  const committed = spawnSync('git', ['commit', '--quiet', '-m', 'dependency update'], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_COMMITTER_NAME: 'GitHub',
      GIT_COMMITTER_EMAIL: email('noreply', 'github.com'),
    },
  });
  assert.equal(committed.status, 0, committed.stderr);
  const head = git(cwd, 'rev-parse', 'HEAD');

  const result = run(cwd, base, head);

  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('rejects unsafe local and range identities without values', () => {
  const cwd = repository();
  const base = commit(cwd, 'safe');
  git(cwd, 'config', 'user.name', unsafeName);
  git(cwd, 'config', 'user.email', unsafeEmail);
  const head = commit(cwd, 'unsafe');

  constantFailure(run(cwd));
  constantFailure(run(cwd, base, head));
});

test('rejects an unsafe identity hidden by mailmap', () => {
  const cwd = repository();
  const base = commit(cwd, 'safe');
  git(cwd, 'config', 'user.name', unsafeName);
  git(cwd, 'config', 'user.email', unsafeEmail);
  commit(cwd, 'unsafe');
  git(cwd, 'config', 'user.name', safeName);
  git(cwd, 'config', 'user.email', safeEmail);
  writeFileSync(join(cwd, '.mailmap'), `${safeName} <${safeEmail}> ${unsafeName} <${unsafeEmail}>\n`);
  git(cwd, 'add', '.mailmap');
  const head = commit(cwd, 'mailmap');

  constantFailure(run(cwd, base, head));
});
