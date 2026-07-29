import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  normalizeMaintainers,
  run,
  validateCurrentIdentity,
  validatePublishedIdentity,
} from '../../scripts/check-npm-registry-identity.mjs';

const failure = 'npm-public-identity-check: failed\n';
const checker = fileURLToPath(
  new URL('../../scripts/check-npm-registry-identity.mjs', import.meta.url),
);
const email = (local, domain) => [local, '@', domain].join('');
const expected = {
  name: 'comins-registry',
  email: email('comins.registry', 'example.test'),
};
const provider = {
  name: 'GitHub Actions',
  email: email('actions', 'github.com'),
  approver: expected,
  trustedPublisher: {
    id: 'github',
    oidcConfigId: 'provider-managed-id',
  },
};

function metadata(overrides = {}) {
  return {
    maintainers: [expected],
    npmUser: provider,
    author: null,
    contributors: [],
    ...overrides,
  };
}

function runner(overrides = {}) {
  const errors = [];
  const calls = [];
  const outputs = {
    maintainers: [expected],
    _npmUser: provider,
    author: null,
    contributors: [],
    ...overrides.outputs,
  };
  const execNpm = overrides.execNpm ?? ((args, options) => {
    calls.push({ args, options });
    const field = args[2];
    const value = outputs[field];
    return value === undefined ? '' : JSON.stringify(value);
  });
  const code = run({
    args: overrides.args ?? [],
    env: overrides.env ?? {
      COMINS_NPM_PUBLIC_NAME: expected.name,
      COMINS_NPM_PUBLIC_EMAIL: expected.email,
    },
    execNpm,
    packageJson: overrides.packageJson ?? { name: 'comins-grid-layout' },
    writeError: (value) => errors.push(value),
  });
  return { calls, code, errors };
}

function assertConstantFailure(result) {
  assert.equal(result.code, 1);
  assert.deepEqual(result.errors, [failure]);
}

test('normalizes supported npm maintainer shapes', () => {
  assert.deepEqual(
    normalizeMaintainers([{ name: expected.name, email: expected.email }]),
    [expected],
  );
  assert.deepEqual(
    normalizeMaintainers([`${expected.name} <${expected.email}>`]),
    [expected],
  );
  assert.deepEqual(
    normalizeMaintainers({ name: ` ${expected.name} `, email: ` ${expected.email} ` }),
    [expected],
  );
  assert.deepEqual(
    normalizeMaintainers(`${expected.name} <${expected.email}>`),
    [expected],
  );
  assert.deepEqual(normalizeMaintainers([{ name: expected.name }]), []);
  assert.deepEqual(normalizeMaintainers('malformed'), []);
});

test('requires exactly one matching current maintainer', () => {
  assert.equal(validateCurrentIdentity([expected], expected), true);
  assert.equal(validateCurrentIdentity([], expected), false);
  assert.equal(validateCurrentIdentity([expected, expected], expected), false);
  assert.equal(
    validateCurrentIdentity([{ ...expected, name: 'different' }], expected),
    false,
  );
  assert.equal(
    validateCurrentIdentity(
      [{ ...expected, email: email('different', 'example.test') }],
      expected,
    ),
    false,
  );
  assert.equal(
    validateCurrentIdentity(
      [{ ...expected, email: expected.email.toUpperCase() }],
      expected,
    ),
    true,
  );
});

test('requires the trusted publisher and service approver for a published version', () => {
  assert.equal(validatePublishedIdentity(metadata(), expected), true);
  assert.equal(
    validatePublishedIdentity(metadata({ npmUser: null }), expected),
    false,
  );
  assert.equal(
    validatePublishedIdentity(
      metadata({ npmUser: { ...provider, name: 'different' } }),
      expected,
    ),
    false,
  );
  assert.equal(
    validatePublishedIdentity(
      metadata({
        npmUser: {
          ...provider,
          email: email('actions', 'example.test'),
        },
      }),
      expected,
    ),
    false,
  );
  assert.equal(
    validatePublishedIdentity(
      metadata({
        npmUser: {
          ...provider,
          trustedPublisher: { ...provider.trustedPublisher, id: 'different' },
        },
      }),
      expected,
    ),
    false,
  );
  assert.equal(
    validatePublishedIdentity(
      metadata({
        npmUser: {
          ...provider,
          trustedPublisher: { ...provider.trustedPublisher, oidcConfigId: '' },
        },
      }),
      expected,
    ),
    false,
  );
  assert.equal(
    validatePublishedIdentity(
      metadata({
        npmUser: {
          ...provider,
          approver: { ...expected, email: email('different', 'example.test') },
        },
      }),
      expected,
    ),
    false,
  );
  assert.equal(
    validatePublishedIdentity(metadata({ author: expected }), expected),
    false,
  );
  assert.equal(
    validatePublishedIdentity(metadata({ contributors: [expected] }), expected),
    false,
  );
});

test('queries only maintainers in current-owner mode', () => {
  const result = runner();

  assert.equal(result.code, 0);
  assert.deepEqual(result.errors, []);
  assert.equal(result.calls.length, 1);
  assert.deepEqual(
    result.calls[0].args,
    ['view', 'comins-grid-layout', 'maintainers', '--json'],
  );
  assert.deepEqual(result.calls[0].options.stdio, ['ignore', 'pipe', 'pipe']);
});

test('queries exact publication metadata in version mode', () => {
  const result = runner({ args: ['--version', '1.2.3-beta.1+build.5'] });

  assert.equal(result.code, 0);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.calls.map(({ args }) => args),
    [
      ['view', 'comins-grid-layout@1.2.3-beta.1+build.5', 'maintainers', '--json'],
      ['view', 'comins-grid-layout@1.2.3-beta.1+build.5', '_npmUser', '--json'],
      ['view', 'comins-grid-layout@1.2.3-beta.1+build.5', 'author', '--json'],
      ['view', 'comins-grid-layout@1.2.3-beta.1+build.5', 'contributors', '--json'],
    ],
  );
});

test('accepts npm 12 array-wrapped view results in both modes', () => {
  const current = runner({
    outputs: { maintainers: [[expected]] },
  });
  const published = runner({
    args: ['--version', '1.2.3'],
    outputs: {
      maintainers: [[expected]],
      _npmUser: [provider],
      author: [null],
      contributors: [[]],
    },
  });

  assert.equal(current.code, 0);
  assert.deepEqual(current.errors, []);
  assert.equal(published.code, 0);
  assert.deepEqual(published.errors, []);
});

test('fails closed with one constant message for invalid input and unavailable npm', () => {
  for (const args of [
    ['--unknown'],
    ['--version'],
    ['--version', 'v1.2.3'],
    ['--version', '1.2'],
    ['--version', '1.2.3 || 2.0.0'],
    ['--version', '01.2.3'],
  ]) {
    assertConstantFailure(runner({ args }));
  }

  assertConstantFailure(runner({ env: {} }));
  const malformedExpected = {
    name: expected.name,
    email: 'malformed',
  };
  assertConstantFailure(runner({
    env: {
      COMINS_NPM_PUBLIC_NAME: malformedExpected.name,
      COMINS_NPM_PUBLIC_EMAIL: malformedExpected.email,
    },
    outputs: { maintainers: [malformedExpected] },
  }));
  assertConstantFailure(runner({ packageJson: {} }));
  assertConstantFailure(runner({
    execNpm: () => {
      throw new Error('unavailable');
    },
  }));
  assertConstantFailure(runner({ execNpm: () => '{' }));
  assertConstantFailure(runner({
    outputs: { maintainers: [expected, expected] },
  }));
});

test('fails version mode for unsafe publisher or person metadata', () => {
  const cases = [
    { _npmUser: null },
    { _npmUser: { ...provider, approver: null } },
    { _npmUser: { ...provider, trustedPublisher: null } },
    { author: expected },
    { contributors: [expected] },
  ];

  for (const outputs of cases) {
    assertConstantFailure(runner({ args: ['--version', '1.2.3'], outputs }));
  }
});

test('CLI entrypoint keeps success silent and failure constant', {
  skip: process.platform === 'win32',
}, () => {
  const fakeBin = mkdtempSync(join(tmpdir(), 'comins-grid-fake-npm-'));
  const fakeNpm = join(fakeBin, 'npm');
  writeFileSync(fakeNpm, [
    '#!/usr/bin/env node',
    "if (process.argv[4] !== 'maintainers') process.exit(2);",
    'process.stdout.write(JSON.stringify([{',
    '  name: process.env.FAKE_NPM_NAME,',
    '  email: process.env.FAKE_NPM_EMAIL,',
    '}]) + "\\n");',
    '',
  ].join('\n'));
  chmodSync(fakeNpm, 0o755);

  try {
    const success = spawnSync(process.execPath, [checker], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: [fakeBin, process.env.PATH ?? ''].join(delimiter),
        COMINS_NPM_PUBLIC_NAME: expected.name,
        COMINS_NPM_PUBLIC_EMAIL: expected.email,
        FAKE_NPM_NAME: expected.name,
        FAKE_NPM_EMAIL: expected.email,
      },
    });
    assert.equal(success.status, 0);
    assert.equal(success.stdout, '');
    assert.equal(success.stderr, '');

    const missingEnv = { ...process.env };
    delete missingEnv.COMINS_NPM_PUBLIC_NAME;
    delete missingEnv.COMINS_NPM_PUBLIC_EMAIL;
    const failed = spawnSync(process.execPath, [checker], {
      encoding: 'utf8',
      env: missingEnv,
    });
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, '');
    assert.equal(failed.stderr, failure);
  } finally {
    rmSync(fakeBin, { recursive: true });
  }
});
