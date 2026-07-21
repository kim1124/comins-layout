import { execFileSync } from 'node:child_process';

const FAILURE = 'public-identity-check: failed\n';
const SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const NOREPLY = /^(?:[0-9]+\+)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))@users\.noreply\.github\.com$/;
const SERVICES = new Map([
  ['github-actions[bot]', new Set([
    '41898282+github-actions[bot]@users.noreply.github.com',
    ['action', 'github.com'].join('@'),
  ])],
  ['dependabot[bot]', new Set([
    '49699333+dependabot[bot]@users.noreply.github.com',
  ])],
]);

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function isPublicIdentity(name, email) {
  if (SERVICES.get(name)?.has(email)) return true;
  const match = NOREPLY.exec(email);
  return match !== null && name === match[1];
}

function localIdentities() {
  return [[
    git(['config', '--get', 'user.name']).trim(),
    git(['config', '--get', 'user.email']).trim(),
  ]];
}

function rangeIdentities(base, head) {
  if (!SHA.test(base) || !SHA.test(head)) throw new Error('invalid range');
  execFileSync('git', ['merge-base', '--is-ancestor', base, head], {
    stdio: 'ignore',
  });
  const output = git([
    'log',
    '--format=%an%x00%ae%x00%cn%x00%ce%x00',
    `${base}..${head}`,
  ]);
  const identities = [];
  for (const record of output.split('\n')) {
    if (record === '') continue;
    const fields = record.split('\0');
    if (fields.length !== 5 || fields[4] !== '') throw new Error('invalid log');
    identities.push([fields[0], fields[1]], [fields[2], fields[3]]);
  }
  return identities;
}

try {
  const args = process.argv.slice(2);
  if (args.length !== 0 && args.length !== 2) throw new Error('invalid arguments');
  const identities = args.length === 0
    ? localIdentities()
    : rangeIdentities(args[0], args[1]);
  if (!identities.every(([name, email]) => isPublicIdentity(name, email))) {
    throw new Error('non-public identity');
  }
} catch {
  process.stderr.write(FAILURE);
  process.exitCode = 1;
}
