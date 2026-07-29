# Comins npm Service Identity And Release Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish one non-personal, delivery-capable Comins npm service identity in Governance and prevent Grid Layout from staging or closing a future release when npm metadata contains any other maintainer identity.

**Architecture:** Governance defines the provider-neutral service-identity and release contract without owning module release code. Grid Layout implements a dependency-free, value-redacting npm metadata validator, runs it immediately before trusted staging, and exposes a read-only mobile-dispatchable closure workflow for current-owner and exact-version checks.

**Tech Stack:** Markdown, Node.js 24 built-ins, npm Registry CLI, GitHub Actions, npm 11.15 staged publishing, OIDC trusted publishing, Node's built-in test runner.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-27-comins-npm-service-identity-design.md`.
- Apply Comins Contract v1.4 and synchronize the Grid Layout managed guidance
  block before implementation.
- Follow the Contract v1.4 order: classify license impact first, then security,
  common policy, module implementation, affected checks, Git/CI, and release
  checks only for an actual publication.
- Record the policy/checker implementation license impact as `N/A`: it adds no
  dependency, copied or modified third-party source, generated asset, bundled
  runtime, or package-content change. Do not substitute unrelated license
  evidence.
- Keep Governance policy provider-neutral: the operational mailbox may use Google, but policy says only `delivery-capable Comins service identity`.
- Never record the real service email, recovery email, credentials, tokens, OTPs, recovery codes, or value-derived fingerprints in source, tests, reports, plans, commands, or conversation output.
- Assemble synthetic email fixtures only at test runtime from reserved domains.
- Keep Git commit identity, npm maintainer identity, and trusted-publisher identity as separate contracts.
- Do not add dependencies, a shared runtime package, npm tokens, or a direct `npm publish` path.
- Do not add the network-dependent npm identity check to the ordinary pull-request `npm run verify` path.
- Missing provider secrets, unavailable npm, malformed metadata, multiple maintainers, or identity mismatch must fail closed with one constant message.
- Store the intentionally public expected identity as GitHub repository secrets
  solely for automatic log masking; never use unmasked GitHub configuration
  variables for these values.
- Preserve the existing exact-artifact, Gitleaks, React consumer, GridStack, resource-stability, and staged-publishing gates.
- Do not modify GridStack behavior, public APIs, CSS, dependencies, package version, or lockfile.
- Do not run `npm run verify:full` for the policy/checker implementation; the next actual release still runs it once.
- Keep Governance, Grid Layout, Data Table, and Sortable as independent Git/verification boundaries.
- Data Table and Sortable adoption require separate plans after the Grid Layout pilot passes.
- Do not push, open or merge a pull request, mutate GitHub/npm settings, stage, approve, publish, deprecate, unpublish, create a tag/Release, or contact Support without the operation-specific maintainer approval.
- Before implementation, reconcile the existing dirty Governance and Grid
  Layout worktrees. Preserve existing untracked reports and do not absorb them
  into identity-gate commits. Record new work in an implementation-date report.

---

### Task 1: Add The Common Governance Contract

**Repository:** sibling Governance repository `../governance`

**Files:**
- Modify: `test/policy-contract.test.mjs`
- Modify: `SENSITIVE_DATA_STANDARD.md`
- Modify: `RELEASE_POLICY.md`
- Modify: `MODULE_CHECKLIST.md`
- Modify: `CHANGELOG.md`
- Modify: `reports/2026-07-29.md`
- Inspect unchanged: `COMINS_CONTRACT.md`
- Inspect unchanged: `templates/module/AGENTS.template.md`
- Inspect unchanged: `OSS_LICENSE_POLICY.md`

**Interfaces:**
- Consumes: the Contract v1.4 sensitive-data, license, and release boundaries.
- Produces: one provider-neutral npm account identity contract and pre-stage/post-publication release requirements.
- Does not produce: module scripts, provider values, credentials, or synchronized module source.

- [ ] **Step 1: Start from an isolated clean Governance boundary**

Run:

```bash
git -C ../governance status --short --branch
git -C ../governance diff --check
git -C ../governance log -5 --oneline --decorate
```

Expected: identify and preserve the existing guidance/configuration/report work. If it remains uncommitted, use `superpowers:using-git-worktrees` at execution time and base the implementation worktree on the reviewed current branch; do not stash, reset, or overwrite the existing work.

- [ ] **Step 2: Write the failing policy assertions**

Add this test to `test/policy-contract.test.mjs`, using the existing `section()` helper:

```js
test("requires a delivery-capable npm service identity at release boundaries", () => {
  const allowed = section(standard, "## Allowed");
  const publication = section(release, "## Publication Controls");
  const closure = section(release, "## Post-Publication Closure");
  const beforeRelease = section(checklist, "## Before First Public Release");
  const afterRelease = section(checklist, "## After Every Public Release");

  assert.match(allowed, /delivery-capable Comins service identity/i);
  assert.match(allowed, /permanent public npm metadata/i);
  assert.match(allowed, /GitHub noreply[^.\n]*Git commit/i);
  assert.match(allowed, /not[^.\n]*npm account[^.\n]*(?:verification|recovery)/i);

  assert.match(publication, /current npm maintainer identity/i);
  assert.match(publication, /immediately before[^.\n]*stage/i);
  assert.match(publication, /constant[^.\n]*value-free/i);
  assert.match(publication, /freeze[^.\n]*approval/i);

  assert.match(closure, /exact published version[^.\n]*maintainer/i);
  assert.match(closure, /publisher metadata/i);
  assert.match(beforeRelease, /delivery-capable[^.\n]*service identity/i);
  assert.match(afterRelease, /exact-version[^.\n]*identity/i);

  assert.match(contract, /^# Comins Contract v1\.4$/m);
  assert.doesNotMatch(moduleAgents, /COMINS_NPM_PUBLIC_(?:NAME|EMAIL)/);
});
```

This is deliberately a policy test only. It must not contain a real address, a provider account name, or a derived fingerprint.

- [ ] **Step 3: Run the focused test and confirm RED**

Run:

```bash
node --test test/policy-contract.test.mjs
```

Expected: FAIL only on the new service-identity and release-boundary assertions.

- [ ] **Step 4: Clarify the common policy under Contract v1.4**

Make these exact responsibility changes:

- `SENSITIVE_DATA_STANDARD.md`:
  - define a delivery-capable Comins service identity as purpose-scoped,
    non-personal, controlled by the maintainer, and intentionally acceptable for
    permanent public npm metadata;
  - state that GitHub noreply remains valid for Git commit identity but is not a
    delivery-capable npm verification or recovery address;
  - retain the existing prohibition on actual private values and derived
    fingerprints.
- `RELEASE_POLICY.md`:
  - require a value-free current-maintainer identity check immediately before
    trusted staging;
  - require the maintainer to freeze account email, ownership, and publisher
    configuration until approval and closure;
  - require an exact-version maintainer/publisher identity check after
    publication;
  - keep stage-only OIDC, token disallowance, and 2FA approval unchanged.
- `MODULE_CHECKLIST.md`:
  - before first release, require a verified delivery-capable service mailbox
    and provider-managed expected-identity values;
  - after every release, require an exact-version value-free identity result.
- `CHANGELOG.md`:
  - add one `Unreleased` entry describing the clarification and Grid Layout
    pilot;
  - explicitly state that the clarification does not bump Contract v1.4.
- `templates/module/AGENTS.template.md`:
  - leave unchanged because its current short `service identity` rule already
    routes release work to canonical Governance policy.
- `OSS_LICENSE_POLICY.md`:
  - inspect and leave unchanged because this policy-only clarification adds no
    dependency or distributed third-party material.

- [ ] **Step 5: Run Governance validation**

Run:

```bash
node --test test/policy-contract.test.mjs
node --test test/*.test.mjs
git diff --check
git diff -- COMINS_CONTRACT.md templates/module/AGENTS.template.md
```

Expected:

- all Governance tests pass;
- `COMINS_CONTRACT.md` and the managed module template have no identity-gate diff;
- no independent module product or browser gate is run.

- [ ] **Step 6: Record and commit the Governance change**

Append a section to `reports/2026-07-29.md` containing:

- the policy files changed;
- exact commands and results;
- Contract v1.4 remains current and the managed template is unchanged;
- license impact classified as `N/A`;
- Grid Layout selected as the pilot;
- Data Table and Sortable deferred to separate repository plans;
- no provider/account/publish operation performed;
- legacy npm metadata remains separate.

Stage only the intended Governance files:

```bash
git add SENSITIVE_DATA_STANDARD.md RELEASE_POLICY.md MODULE_CHECKLIST.md CHANGELOG.md test/policy-contract.test.mjs reports/2026-07-29.md
git diff --cached --check
git commit -m "docs: define Comins npm service identity"
```

Expected: the existing unrelated guidance/configuration work is not included.

---

### Task 2: Build The Grid Layout npm Identity Validator

**Repository:** current Grid Layout repository

**Files:**
- Create: `scripts/check-npm-registry-identity.mjs`
- Create: `test/security/npm-registry-identity.node.mjs`
- Modify: `package.json`
- Modify: `test/security/sensitive-data-gates.node.mjs`

**Interfaces:**
- `node scripts/check-npm-registry-identity.mjs`
  validates current top-level npm maintainers.
- `node scripts/check-npm-registry-identity.mjs --version VERSION`
  validates one exact public version, its publisher, and absence of
  `author`/`contributors`.
- Environment:
  - `COMINS_NPM_PUBLIC_NAME`
  - `COMINS_NPM_PUBLIC_EMAIL`
- Success: exit `0`, no stdout/stderr.
- Failure: exit `1`, empty stdout, exactly
  `npm-public-identity-check: failed\n` on stderr.

- [ ] **Step 1: Preserve the current Grid Layout worktree**

Run:

```bash
git status --short --branch
git diff -- .codex/config.toml AGENTS.md reports/2026-07-27.md reports/2026-07-29.md
git log -5 --oneline --decorate
```

Expected: the current guidance/configuration/report work is accounted for. If it remains uncommitted, implement in an isolated worktree rather than modifying or staging those files.

- [ ] **Step 2: Write failing normalization and validation tests**

Create `test/security/npm-registry-identity.node.mjs`. Assemble every synthetic address at runtime:

```js
const email = (local, domain) => [local, "@", domain].join("");
const expected = {
  name: "comins-registry",
  email: email("comins.registry", "example.test"),
};
```

Import these exact exports from the checker:

```js
import {
  normalizeMaintainers,
  validateCurrentIdentity,
  validatePublishedIdentity,
  run,
} from "../../scripts/check-npm-registry-identity.mjs";
```

Cover all of these cases:

```js
assert.deepEqual(
  normalizeMaintainers([{ name: expected.name, email: expected.email }]),
  [expected],
);
assert.deepEqual(
  normalizeMaintainers([`${expected.name} <${expected.email}>`]),
  [expected],
);
assert.equal(validateCurrentIdentity([expected], expected), true);
assert.equal(validateCurrentIdentity([], expected), false);
assert.equal(validateCurrentIdentity([expected, expected], expected), false);
assert.equal(
  validateCurrentIdentity([{ ...expected, name: "different" }], expected),
  false,
);
assert.equal(
  validateCurrentIdentity(
    [{ ...expected, email: email("different", "example.test") }],
    expected,
  ),
  false,
);
```

For published metadata, construct provider fixtures at runtime and assert:

- exact maintainer plus GitHub trusted-publisher structure, exact service
  approver, and empty `author` and `contributors` passes;
- missing or different `_npmUser`, `trustedPublisher`, or approver fails;
- any non-empty `author` or `contributors` fails;
- malformed npm JSON, unavailable npm, missing environment variables, unknown
  arguments, non-exact versions, and multiple maintainers fail;
- every failure from `run()` returns code `1` and emits only the constant
  failure string.

- [ ] **Step 3: Confirm RED**

Run:

```bash
node --test test/security/npm-registry-identity.node.mjs
```

Expected: FAIL because the validator file and exports do not exist.

- [ ] **Step 4: Implement the pure validation boundary**

In `scripts/check-npm-registry-identity.mjs`, implement these exact exports:

```js
export function normalizeMaintainers(value) {}
export function validateCurrentIdentity(maintainers, expected) {}
export function validatePublishedIdentity(metadata, expected) {}
export function run(options = {}) {}
```

Implementation requirements:

- `validatePublishedIdentity()` consumes
  `{ maintainers, npmUser, author, contributors }`;
- `run()` consumes optional
  `{ args, env, execNpm, packageJson, writeError }`, returns only `0` or `1`,
  and the executable entry point assigns that result to `process.exitCode`;
- accept npm maintainer object, string, array-of-object, and array-of-string
  shapes;
- trim comparison input but never print it;
- require exactly one normalized maintainer;
- require exact case-sensitive npm name equality and case-insensitive email
  equality after normalization;
- validate `--version` against an exact Semantic Versioning pattern before
  invoking npm;
- read the package name from `package.json`;
- invoke only:

```js
execFileSync("npm", ["view", packageSpec, "maintainers", "--json"], options);
execFileSync("npm", ["view", packageSpec, "_npmUser", "--json"], options);
execFileSync("npm", ["view", packageSpec, "author", "--json"], options);
execFileSync("npm", ["view", packageSpec, "contributors", "--json"], options);
```

- use `stdio: ["ignore", "pipe", "pipe"]`;
- current-owner mode invokes only the `maintainers` query;
- exact-version mode invokes all four queries;
- treat absent `author`/`contributors` as empty, but reject any non-empty
  person metadata;
- require `_npmUser.name` to equal `GitHub Actions`, its email to use the
  public `github.com` service domain, `trustedPublisher.id` to equal `github`,
  and `trustedPublisher.oidcConfigId` to be a non-empty string;
- require `_npmUser.approver` to match the configured Comins service identity;
- catch every parse, process, environment, network, or validation error and
  emit only:

```js
const FAILURE = "npm-public-identity-check: failed\n";
process.stderr.write(FAILURE);
```

The production CLI must not have a fixture environment switch or any bypass
flag. Tests inject npm results through the `run({ execNpm, env, args,
packageJson })` options object.

- [ ] **Step 5: Add the package script and security contract**

Add only this script to `package.json`:

```json
"check:npm-identity": "node scripts/check-npm-registry-identity.mjs"
```

Do not add it to `verify`; it requires live Registry state and provider-managed
values.

Update `test/security/sensitive-data-gates.node.mjs` to assert:

```js
assert.equal(
  packageJson.scripts["check:npm-identity"],
  "node scripts/check-npm-registry-identity.mjs",
);
assert.doesNotMatch(packageJson.scripts.verify, /check:npm-identity/);
```

Also scan the validator source and require that no complete non-noreply email
literal is tracked.

- [ ] **Step 6: Run focused tests and commit the validator**

Run:

```bash
node --test test/security/npm-registry-identity.node.mjs
node --test test/security/sensitive-data-gates.node.mjs
npm run test:security
git diff --check
```

Expected: all focused security tests pass without network access.

Commit only:

```bash
git add scripts/check-npm-registry-identity.mjs test/security/npm-registry-identity.node.mjs test/security/sensitive-data-gates.node.mjs package.json
git diff --cached --check
git commit -m "security: validate npm public identity"
```

The lockfile must remain unchanged because no dependency or version changes.

---

### Task 3: Enforce The Gate In Trusted Staging And Closure

**Repository:** current Grid Layout repository

**Files:**
- Modify: `.github/workflows/publish.yml`
- Create: `.github/workflows/verify-npm-identity.yml`
- Modify: `test/security/sensitive-data-gates.node.mjs`

**Interfaces:**
- Repository secrets used for log masking:
  - `COMINS_NPM_PUBLIC_NAME`
  - `COMINS_NPM_PUBLIC_EMAIL`
- `publish.yml` validates current owner identity twice before staging.
- `verify-npm-identity.yml` runs current-owner mode when the version input is
  empty and exact-version mode when a version is provided.

- [ ] **Step 1: Write failing workflow contract assertions**

Extend `test/security/sensitive-data-gates.node.mjs` to read
`.github/workflows/verify-npm-identity.yml` and assert:

```js
for (const workflow of [publish, npmIdentity]) {
  assert.match(workflow, /COMINS_NPM_PUBLIC_NAME:\s+\${{ secrets\.COMINS_NPM_PUBLIC_NAME }}/);
  assert.match(workflow, /COMINS_NPM_PUBLIC_EMAIL:\s+\${{ secrets\.COMINS_NPM_PUBLIC_EMAIL }}/);
  assert.doesNotMatch(workflow, /\${{ vars\.COMINS_NPM_PUBLIC_(?:NAME|EMAIL) }}/);
  assert.doesNotMatch(workflow, /set -x|printenv|env\s*$/m);
}

assert.equal(
  publish.match(/check-npm-registry-identity\.mjs/g)?.length,
  2,
);
assert.match(npmIdentity, /workflow_dispatch:/);
assert.match(npmIdentity, /required:\s+false/);
assert.match(npmIdentity, /permissions:\n\s+contents: read/);
assert.match(npmIdentity, /check-npm-registry-identity\.mjs/);
assert.doesNotMatch(npmIdentity, /\n\s+if:\s+github\.ref/);
```

Also require both new workflow checkouts and setup-node actions to use the same
immutable revisions already approved in the repository. Assert that both
manual workflows start with an explicit `GITHUB_REF` main-branch guard that
fails non-main dispatch, and that stage ordering is
`download-artifact < identity recheck < npm stage publish`.

- [ ] **Step 2: Confirm RED**

Run:

```bash
node --test test/security/sensitive-data-gates.node.mjs
```

Expected: FAIL because publish does not run the identity checker and the
read-only workflow does not exist.

- [ ] **Step 3: Add the first current-owner check to `verify-and-pack`**

In `.github/workflows/publish.yml`, add this step after setup-node and before
version validation or `npm ci`:

```yaml
      - name: Verify current npm public identity
        env:
          COMINS_NPM_PUBLIC_NAME: ${{ secrets.COMINS_NPM_PUBLIC_NAME }}
          COMINS_NPM_PUBLIC_EMAIL: ${{ secrets.COMINS_NPM_PUBLIC_EMAIL }}
        run: node scripts/check-npm-registry-identity.mjs
```

The script must fail before the expensive product gate when secrets, npm, or
metadata are unavailable.

- [ ] **Step 4: Recheck immediately before `npm stage publish`**

Add credential-free checkout to the `stage` job before setup-node:

```yaml
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          persist-credentials: false
```

After installing npm `11.15.0` and downloading the transferred artifact, add
this step immediately before `npm stage publish`:

```yaml
      - name: Recheck npm public identity before staging
        env:
          COMINS_NPM_PUBLIC_NAME: ${{ secrets.COMINS_NPM_PUBLIC_NAME }}
          COMINS_NPM_PUBLIC_EMAIL: ${{ secrets.COMINS_NPM_PUBLIC_EMAIL }}
        run: node scripts/check-npm-registry-identity.mjs
```

Do not move, duplicate, or rebuild the exact package artifact. The stage job
must still publish only the archive produced and uploaded by
`verify-and-pack`.

- [ ] **Step 5: Add the mobile-dispatchable read-only workflow**

Create `.github/workflows/verify-npm-identity.yml` with:

```yaml
name: Verify npm identity

on:
  workflow_dispatch:
    inputs:
      version:
        description: Exact published version; leave empty to check current owner
        required: false
        type: string

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Require main branch
        run: test "$GITHUB_REF" = 'refs/heads/main'
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
        with:
          node-version: 24
          package-manager-cache: false
      - name: Verify npm public identity
        env:
          COMINS_NPM_PUBLIC_NAME: ${{ secrets.COMINS_NPM_PUBLIC_NAME }}
          COMINS_NPM_PUBLIC_EMAIL: ${{ secrets.COMINS_NPM_PUBLIC_EMAIL }}
          RELEASE_VERSION: ${{ inputs.version }}
        shell: bash
        run: |
          set -euo pipefail
          if [[ -n "$RELEASE_VERSION" ]]; then
            node scripts/check-npm-registry-identity.mjs --version "$RELEASE_VERSION"
          else
            node scripts/check-npm-registry-identity.mjs
          fi
```

The workflow performs no install, build, artifact, account, or package mutation.
The input is passed through an environment variable and a quoted argument; it
is never interpolated directly into executable shell text.

- [ ] **Step 6: Parse and test the workflows**

Run:

```bash
node --test test/security/sensitive-data-gates.node.mjs
ruby -e 'require "yaml"; %w[.github/workflows/verify.yml .github/workflows/publish.yml .github/workflows/verify-npm-identity.yml].each { |file| YAML.load_file(file); puts "valid #{file}" }'
npm run test:security
git diff --check
```

Expected: all security tests pass; all workflows parse; existing exact-artifact
ordering remains valid.

- [ ] **Step 7: Commit workflow enforcement**

```bash
git add .github/workflows/publish.yml .github/workflows/verify-npm-identity.yml test/security/sensitive-data-gates.node.mjs
git diff --cached --check
git commit -m "ci: block unsafe npm publisher metadata"
```

---

### Task 4: Activate The Comins Service Account And Provider Variables

**External resources:**
- Google account controlled privately by the maintainer.
- Existing npm account profile.
- GitHub repository secrets for `kim1124/comins-layout`, used only to mask the
  intentionally public expected identity in workflow logs.

**Interfaces:**
- npm account email becomes the verified Comins service mailbox.
- GitHub stores the intentionally public expected npm name and email as
  repository secrets so runner output is automatically masked.
- No credential, recovery address, OTP, or recovery code is passed to Codex.

- [ ] **Step 1: Complete the private mailbox setup**

The maintainer completes all of the following outside the repository:

- non-personal Comins profile label;
- private recovery address;
- passkey or 2FA;
- offline recovery codes;
- confirmed inbound mail;
- no unrelated personal-service use.

Codex receives only the statement `Comins mailbox ready`; no values or
screenshots containing values are required.

- [ ] **Step 2: Change and verify the npm account email**

The maintainer uses npm Account settings to change the package-metadata email
and completes the verification message received by the Comins mailbox:

- https://www.npmjs.com/login
- https://docs.npmjs.com/managing-your-profile-settings/

Keep the npm public username unchanged. Clear or reclassify npm `Full name`,
homepage, and linked-profile fields only if they contain personal values; those
are separate account mutations and must be reported before action.

- [ ] **Step 3: Pause for GitHub secret mutation approval**

Before adding repository secrets, report:

- local Governance and Grid Layout commits;
- focused test results;
- the two variable names only;
- confirmation that the values are intended public service metadata;
- confirmation that the values are not credentials and use the secret surface
  only for automatic log masking;
- confirmation that no npm token or credential is being stored.

Obtain explicit approval for the GitHub setting mutation.

- [ ] **Step 4: Add the two repository secrets without logging values**

Use the GitHub web settings page on the maintainer's authenticated device:

https://github.com/kim1124/comins-layout/settings/secrets/actions

Create exactly:

- `COMINS_NPM_PUBLIC_NAME`
- `COMINS_NPM_PUBLIC_EMAIL`

Do not paste either value into chat, a shell transcript, a plan, a report, or a
commit. Do not create an npm token or any additional credential secret.

- [ ] **Step 5: Verify current-owner mode through the read-only workflow**

From the GitHub Actions page on `main`, dispatch `Verify npm identity` with the
version input empty:

https://github.com/kim1124/comins-layout/actions/workflows/verify-npm-identity.yml

Expected: the workflow passes with no identity value in its logs. A failure
blocks the next release and is reported only as an account/provider/metadata
classification, not with the failing value.

---

### Task 5: Complete Local And Pull-Request Verification

**Repository:** current Grid Layout repository

**Files:**
- Create: `reports/2026-07-29.md`

- [ ] **Step 1: Run the complete applicable local gate once**

Run:

```bash
npm run test:security
npm run verify
ruby -e 'require "yaml"; %w[.github/workflows/verify.yml .github/workflows/publish.yml .github/workflows/verify-npm-identity.yml].each { |file| YAML.load_file(file); puts "valid #{file}" }'
git diff --check
git status --short
```

Expected:

- security, licenses, typecheck, Vitest, and build pass;
- workflows parse;
- no browser-visible code changed, so `verify:full` is not run;
- no generated tarball, raw npm metadata, or identity value exists in the
  worktree.

- [ ] **Step 2: Record value-free implementation evidence**

Create `reports/2026-07-29.md` with a distinct
`Comins npm service identity gate` section. Do not modify the existing
untracked `reports/2026-07-27.md`. Record:

- design and plan paths;
- changed files and commits;
- exact validation commands and pass/fail results;
- no dependency, lockfile, API, CSS, GridStack, or browser behavior change;
- account/provider operations performed or still pending;
- legacy versions `0.1.0` through `0.1.5` remain unchanged;
- Data Table and Sortable adoption remains separate.

- [ ] **Step 3: Commit only the report append**

```bash
git add reports/2026-07-29.md
git diff --cached --check
git commit -m "docs: record npm identity gate verification"
```

- [ ] **Step 4: Pause for remote-write approval**

Report:

- exact intended commit list;
- local and `origin/main` state after a fresh fetch;
- focused and baseline validation results;
- current dirty/untracked state;
- no provider value in the diff;
- remaining account and GitHub-variable gates.

Obtain explicit approval before push or pull-request creation.

- [ ] **Step 5: Integrate through the protected pull-request path**

After approval:

- push only the identity-gate branch;
- open a pull request targeting `main`;
- require existing `Sensitive data` and `verify` checks;
- review the diff for value leakage and exact workflow permissions;
- obtain separate approval before merge;
- merge without bypassing branch protection;
- dispatch the current-owner identity workflow from merged `main`.

Do not publish a package as part of this task.

---

### Task 6: Gate The Next Release And Track Legacy Provider Risk

**Release scope:** the next separately approved Grid Layout release, using the
version committed in `package.json` by that release's own plan.

- [ ] **Step 1: Require identity readiness before release preparation**

Before version bump, changelog, or staging:

- current-owner `Verify npm identity` workflow on `main` passes;
- the Comins mailbox remains verified and recovery-capable;
- repository secrets remain configured;
- npm account name, email, owners, and trusted publisher are frozen until
  closure.

Any failure blocks the release before the full product gate.

- [ ] **Step 2: Preserve the existing release gate**

The separately approved release plan must still run exactly once:

```bash
npm run check:licenses
npm run verify:full
npm run test:consumer
npm run verify:package-artifact
```

It must scan the extracted exact artifact with pinned Gitleaks, merge through
the protected branch, stage the exact transferred artifact through OIDC, and
pause for maintainer review and 2FA approval.

- [ ] **Step 3: Recheck the account immediately before staging**

Require both identity checks embedded in `publish.yml` to pass for the exact
merged `main` SHA. A missing repository variable, npm lookup failure, or
mismatch prevents `npm stage publish`.

- [ ] **Step 4: Complete maintainer-controlled stage review**

The maintainer reviews the npm Staged Packages entry and approves it with 2FA:

https://www.npmjs.com/

Codex does not automate approval or request OTP, recovery, or account values.
Do not change npm account identity or ownership between pre-stage validation and
approval.

- [ ] **Step 5: Verify the exact published version before closure**

After the version is public, dispatch `Verify npm identity` with the exact
published version. Require:

- one exact configured maintainer;
- approved trusted-publishing `_npmUser`;
- no `author`;
- no `contributors`;
- constant, value-free workflow output.

Then complete the existing integrity, provenance, public artifact, consumer,
source-merge, report, default-branch, branch, and worktree closure checks.

- [ ] **Step 6: Keep legacy remediation separate and explicit**

Record these unresolved provider risks after the new release:

- versions `0.1.0` through `0.1.5` retain publication-time maintainer metadata;
- `0.1.0` retains its separately detected sensitive-data artifact pattern;
- npm Support/privacy removal remains provider-controlled;
- deprecation of unsupported `0.1.0` through `0.1.4` is a separate public
  mutation;
- GitHub/npm public profile fields require a separate value-free audit.

Before any Support request, deprecation, unpublish, profile mutation, or other
provider write, recheck current policy and obtain explicit maintainer approval.

---

## Completion Gate

- [ ] Governance defines the delivery-capable Comins npm service identity,
  pre-stage check, account freeze, and exact-version closure check while
  Contract v1.4 remains current and the managed module `AGENTS` block is
  synchronized from Governance.
- [ ] Grid Layout's validator accepts supported npm JSON shapes, rejects every
  mismatch or unavailable dependency, and emits only one constant failure.
- [ ] The ordinary PR baseline remains network-independent.
- [ ] Trusted staging checks current npm identity twice without rebuilding the
  exact artifact.
- [ ] The read-only workflow supports empty-input current-owner validation and
  exact-version post-publication validation from a mobile browser.
- [ ] The Comins mailbox is privately secured, npm-verified, and represented by
  provider secrets without storing its value in Git.
- [ ] Focused security tests, `npm run verify`, workflow parse checks, and
  `git diff --check` pass.
- [ ] No release, provider setting, or remote write occurs without its explicit
  approval gate.
- [ ] No next release is closed unless exact public metadata contains the
  approved Comins service identity and no personal author/contributor metadata.
- [ ] Legacy npm versions and profile/provider surfaces remain explicitly
  tracked until their separately approved remediation completes.
