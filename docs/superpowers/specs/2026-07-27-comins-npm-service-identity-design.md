# Comins npm Service Identity And Release Gate Design

## Goal

Prevent any future Comins npm release from publishing a maintainer's personal
email address. Use one delivery-capable, purpose-scoped Comins mailbox as the
public npm service identity while keeping every module's source, trusted
publisher, artifact, approval, and release evidence independent.

## Confirmed Decisions

- The maintainer will create a new Comins Google account and retain private
  control of its recovery channels.
- The mailbox will be a Comins service identity, not a personal identity and
  not a general-purpose login account.
- Git commits continue to use an approved GitHub noreply identity.
- npm uses the delivery-capable Comins mailbox because npm requires a working
  address for verification, security, recovery, and package metadata.
- The actual mailbox value, recovery address, credentials, tokens, OTPs,
  recovery codes, and value-derived fingerprints are never recorded in source,
  plans, reports, fixtures, logs, or conversation output.
- The existing npm user remains the package maintainer. This design changes the
  account email and release controls; it does not create a second npm user.
- No package version, publish, deprecation, unpublish, Support request, provider
  setting, or remote write is authorized by this design.

## Scope And Repository Boundaries

### Governance

The sibling Governance repository (`../governance`) remains the canonical
source for the shared definition and release requirements:

- `SENSITIVE_DATA_STANDARD.md` defines a public npm service identity as a
  working, purpose-scoped, non-personal address whose permanent publication is
  accepted.
- `RELEASE_POLICY.md` requires a value-free pre-stage identity gate, a
  maintainer-controlled account freeze through approval, and an exact-version
  post-publication identity gate.
- `MODULE_CHECKLIST.md` adds the account and provider-variable prerequisites.
- Contract v1.4 remains the governing contract. The module-managed `AGENTS`
  block is synchronized from Governance before implementation, while detailed
  npm identity operations remain in canonical Governance policy rather than
  being repeated in every module instruction surface.

Governance does not own module release code, npm credentials, artifacts, or
publishing workflows.

### Grid Layout Pilot

This Grid Layout repository is the first independent module to
enforce the common policy:

- a repository-local, dependency-free Node validator;
- focused synthetic tests;
- a fail-closed check immediately before trusted staging;
- a read-only exact-version closure workflow suitable for mobile dispatch;
- a release report that records only constant pass/fail evidence.

Data Table and Sortable adoption follows in separate repository plans after the
Grid Layout pilot passes. They reuse the policy and validator contract, not a
shared runtime package.

## Service Identity Lifecycle

The account owner performs these private operations without sharing values with
Codex or storing them in a repository:

1. Create a durable Comins mailbox with a non-personal profile label.
2. Configure a private recovery address, a passkey or 2FA, and offline recovery
   codes.
3. Keep the mailbox dedicated to Comins package administration and provider
   notifications.
4. Change the existing npm account's package-metadata email to the new mailbox
   and complete email verification.
5. Configure the same intentionally public npm name and email as
   provider-managed GitHub repository secrets in each module when that module
   adopts the gate. Secrets are used for log masking, not because the values
   are credentials.
6. Freeze npm name, email, ownership, and trusted-publisher settings from the
   pre-stage check until post-publication closure.

The mailbox may be common across Comins modules. Long-lived npm tokens,
artifacts, workflow trust, versioning, and release approval remain isolated per
module.

## Validator Contract

Grid Layout adds `scripts/check-npm-registry-identity.mjs`.

### Inputs

- Package name comes from the repository's `package.json`.
- Expected public npm name comes from `COMINS_NPM_PUBLIC_NAME`.
- Expected public npm email comes from `COMINS_NPM_PUBLIC_EMAIL`.
- No positional arguments validate the package's current top-level
  `maintainers`.
- `--version VERSION` validates one exact published version.

The expected identity is intentionally public service metadata but remains
provider-managed rather than tracked in Git. GitHub configuration variables
render unmasked by default, so workflows consume repository secrets solely to
obtain automatic log masking. Missing secrets fail closed.

### Current-Owner Mode

The script invokes npm through `execFileSync` with argument arrays and reads the
package's current `maintainers` JSON. It accepts exactly one maintainer whose
name and email exactly match the two configured values. It handles npm's
observed object, string, array-of-object, and array-of-string shapes. It also
normalizes npm 12's single outer result array while retaining fail-closed
behavior for multiple results or additional nesting.

### Published-Version Mode

The script validates all current-owner requirements against the exact version
and additionally requires:

- `_npmUser` to identify GitHub Actions with a public `github.com` service
  address, a `trustedPublisher.id` of `github`, and a non-empty
  `oidcConfigId`;
- `_npmUser.approver` to match the configured Comins service identity;
- `author` and `contributors` to be absent or empty;
- the requested version to be an exact valid Semantic Versioning value.

The npm Registry documents `_npmUser` as publication metadata, while trusted
publishing documents OIDC and provenance but does not guarantee a stable
provider email literal. The validator therefore checks the observed structured
trusted-publisher boundary and approver identity without recording or
fingerprinting the provider-managed values.

Unexpected shapes, additional maintainers, missing fields, network failures,
npm failures, or mismatches fail closed. npm 11 direct field results and npm 12
single-array-wrapped field results are both covered by focused tests.

### Output

- Success: exit `0`, empty stdout, empty stderr.
- Failure: exit `1`, empty stdout, exactly
  `npm-public-identity-check: failed` on stderr.

The script never prints npm output, environment values, field values, error
details, or comparisons. Synthetic test identities are assembled only at
runtime from reserved domains.

## Release Flow

1. The maintainer completes and verifies the Comins mailbox and npm account
   change.
2. The Grid Layout repository receives the two expected-identity secrets
   through an explicitly approved provider-setting operation.
3. The publish workflow checks the current npm maintainer identity before the
   expensive package gate.
4. The normal full verification, exact-artifact, extracted Gitleaks, consumer,
   artifact-transfer, and trusted staging gates remain unchanged.
5. The stage job checks the current identity again immediately before
   `npm stage publish`.
6. The maintainer reviews the staged package on npmjs.com and approves it with
   2FA. npm account identity and ownership remain frozen during this interval.
7. After approval, a separate read-only workflow validates the exact public
   version's maintainer and publisher metadata.
8. Only after the identity check and all existing release-closure checks pass
   is the release recorded as closed.

OIDC can stage the package, but npm's interactive stage review and approval
remain maintainer operations. The automated workflow does not attempt to
replace proof of presence.

## Failure And Incident Handling

- Missing mailbox verification or provider secrets block staging.
- Any registry shape or identity mismatch blocks staging or closure with a
  constant failure.
- A mismatch found after publication is a privacy incident: keep the release
  published but not closed, stop later releases, preserve only redacted
  evidence, and request a separately approved provider remediation.
- A failed external lookup is an execution-environment or provider blocker; it
  is not converted into a passing result and does not justify repeating the
  unchanged full product gate.

## Verification

### Required-Order Classification

- Inspect `OSS_LICENSE_POLICY.md` before the security implementation.
- The policy/checker implementation adds no dependency, copied or modified
  third-party source, generated asset, bundled runtime, or package-content
  change, so its implementation-time license impact is `N/A`.
- An actual public release still runs the module's applicable license and
  exact-artifact license gates before publication.

### Governance

- Focused policy-contract test first, then all Governance Node tests.
- Contract v1.4, managed-template, and canonical-policy consistency.
- Markdown/reference checks and `git diff --check`.
- No independent module product gate.

### Grid Layout

- Focused Node tests for accepted and rejected npm JSON shapes, exact matching,
  malformed inputs, additional maintainers, unavailable npm, trusted publisher
  validation, and constant output.
- Security contract tests for workflow wiring, immutable action pins, missing
  variable failure, and absence from the ordinary PR verification path.
- `npm run test:security`, `npm run verify`, workflow parse checks, and
  `git diff --check`.
- `npm run verify:full` is not required for the policy/checker implementation
  because no GridStack or browser-visible behavior changes.
- The next actual release still runs the unchanged full release and browser
  gates once.

## Legacy And Residual Risks

- Versions `0.1.0` through `0.1.5` retain the email metadata captured when they
  were published. Updating the npm account does not rewrite them.
- The public `0.1.0` artifact retains a separately identified sensitive-data
  pattern. npm Support or removal action remains an external, separately
  approved remediation.
- Deprecating unsupported legacy versions is a separate public mutation.
- A common mailbox centralizes recovery risk across Comins modules. Passkeys or
  2FA, private recovery, offline recovery codes, stage-only trusted publishing,
  and disallowed tokens reduce but do not eliminate that risk.
- GitHub and npm public profile fields outside package metadata require a
  separate value-free audit and separately approved account changes.
- The account email could be changed after the last pre-stage check. The
  maintainer-controlled account freeze and exact-version closure check are
  required compensating controls.

## Acceptance Criteria

- Governance defines one delivery-capable, non-personal npm service identity
  without recording its value or duplicating operational policy in the
  Contract v1.4 managed module block.
- Grid Layout cannot stage when the configured identity is missing, malformed,
  additional, or different from the current npm maintainer identity.
- The exact public version cannot close when maintainer, publisher, author, or
  contributor metadata violates the contract.
- All user-visible and retained evidence is constant and value-free.
- Git commit identity, package identity, and provider publishing identity remain
  separate and are validated according to their actual operational roles.
- No next Grid Layout release is approved until the account change, provider
  secrets, local implementation, focused verification, staged review, and
  exact-version closure checks are complete.

## Official References

- npm profile settings:
  https://docs.npmjs.com/managing-your-profile-settings/
- npm package maintainer metadata:
  https://docs.npmjs.com/files/package.json/
- npm CLI v12 JSON output change:
  https://github.com/npm/cli/releases/tag/v12.0.0-pre.0.0
- npm privacy and working-email requirements:
  https://docs.npmjs.com/policies/privacy/
- npm staged publishing:
  https://docs.npmjs.com/staged-publishing/
- npm trusted publishing:
  https://docs.npmjs.com/trusted-publishers/
