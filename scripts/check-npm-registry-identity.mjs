import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FAILURE = 'npm-public-identity-check: failed\n';
const EXACT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const root = dirname(dirname(fileURLToPath(import.meta.url)));

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeMaintainer(value) {
  if (typeof value === 'string') {
    const match = value.match(/^\s*(.+?)\s*<([^<>]+)>\s*$/);
    if (!match) return null;
    const name = match[1].trim();
    const email = match[2].trim();
    return name && isEmailAddress(email) ? { name, email } : null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (typeof value.name !== 'string' || typeof value.email !== 'string') return null;
  const name = value.name.trim();
  const email = value.email.trim();
  return name && isEmailAddress(email) ? { name, email } : null;
}

function sameIdentity(actual, expected) {
  return actual.name === expected.name
    && actual.email.toLowerCase() === expected.email.toLowerCase();
}

function isEmptyPersonMetadata(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function isGitHubTrustedPublisher(npmUser, expected) {
  if (!npmUser || typeof npmUser !== 'object' || Array.isArray(npmUser)) return false;
  if (typeof npmUser.name !== 'string' || npmUser.name.trim() !== 'GitHub Actions') {
    return false;
  }
  if (typeof npmUser.email !== 'string') return false;
  const providerEmail = npmUser.email.trim().toLowerCase().split('@');
  if (
    providerEmail.length !== 2
    || providerEmail[0].length === 0
    || providerEmail[1] !== 'github.com'
  ) {
    return false;
  }
  const trustedPublisher = npmUser.trustedPublisher;
  if (
    !trustedPublisher
    || typeof trustedPublisher !== 'object'
    || Array.isArray(trustedPublisher)
    || trustedPublisher.id !== 'github'
    || typeof trustedPublisher.oidcConfigId !== 'string'
    || trustedPublisher.oidcConfigId.trim() === ''
  ) {
    return false;
  }
  return validateCurrentIdentity(npmUser.approver, expected);
}

function loadPackageJson() {
  return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
}

function parseNpmJson(value, field) {
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);
  if (text.trim() === '') return null;
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) return parsed;
  // npm 12 wraps each `npm view --json` field result in one outer array.
  if (field === 'maintainers' || field === 'contributors') {
    return parsed.length === 1 && Array.isArray(parsed[0]) ? parsed[0] : parsed;
  }
  return parsed.length === 1 ? parsed[0] : parsed;
}

function defaultExecNpm(args, options) {
  return execFileSync('npm', args, { ...options, encoding: 'utf8' });
}

function fail(writeError) {
  try {
    writeError(FAILURE);
  } catch {
    // The result must still fail closed when the output sink is unavailable.
  }
  return 1;
}

export function normalizeMaintainers(value) {
  const input = Array.isArray(value) ? value : [value];
  if (input.length === 0) return [];
  const normalized = input.map(normalizeMaintainer);
  return normalized.some((entry) => entry === null) ? [] : normalized;
}

export function validateCurrentIdentity(maintainers, expected) {
  const normalized = normalizeMaintainers(maintainers);
  const normalizedExpected = normalizeMaintainers(expected);
  return normalized.length === 1
    && normalizedExpected.length === 1
    && sameIdentity(normalized[0], normalizedExpected[0]);
}

export function validatePublishedIdentity(
  { maintainers, npmUser, author, contributors } = {},
  expected,
) {
  return validateCurrentIdentity(maintainers, expected)
    && isGitHubTrustedPublisher(npmUser, expected)
    && isEmptyPersonMetadata(author)
    && isEmptyPersonMetadata(contributors);
}

export function run(options = {}) {
  const args = options.args ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const execNpm = options.execNpm ?? defaultExecNpm;
  const writeError = options.writeError ?? ((value) => process.stderr.write(value));

  try {
    if (!Array.isArray(args)) return fail(writeError);
    let version = null;
    if (args.length !== 0) {
      if (
        args.length !== 2
        || args[0] !== '--version'
        || typeof args[1] !== 'string'
        || !EXACT_SEMVER.test(args[1])
      ) {
        return fail(writeError);
      }
      version = args[1];
    }

    const name = typeof env.COMINS_NPM_PUBLIC_NAME === 'string'
      ? env.COMINS_NPM_PUBLIC_NAME.trim()
      : '';
    const email = typeof env.COMINS_NPM_PUBLIC_EMAIL === 'string'
      ? env.COMINS_NPM_PUBLIC_EMAIL.trim()
      : '';
    const expected = normalizeMaintainers({ name, email });
    if (expected.length !== 1) return fail(writeError);

    const packageJson = options.packageJson ?? loadPackageJson();
    if (!packageJson || typeof packageJson.name !== 'string' || packageJson.name.trim() === '') {
      return fail(writeError);
    }
    const packageSpec = version
      ? `${packageJson.name.trim()}@${version}`
      : packageJson.name.trim();
    const query = (field) => parseNpmJson(execNpm(
      ['view', packageSpec, field, '--json'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    ), field);

    const maintainers = query('maintainers');
    const valid = version === null
      ? validateCurrentIdentity(maintainers, expected[0])
      : validatePublishedIdentity({
          maintainers,
          npmUser: query('_npmUser'),
          author: query('author'),
          contributors: query('contributors'),
        }, expected[0]);
    return valid ? 0 : fail(writeError);
  } catch {
    return fail(writeError);
  }
}

if (
  process.argv[1]
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = run();
}
