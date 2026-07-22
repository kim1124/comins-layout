<!-- comins-reference:managed-start contract=v1.2 -->
# Comins Module AGENTS.md

## Scope

- This repository is one independent Comins module and Git change boundary.
- Read this file and only the closer `AGENTS.md` files that apply to the target path. Read Governance policy explicitly only for public API, security, release, licensing, or common-policy work.
- Do not use KMSF workspace commands, source synchronization, or release flows without a migration-history request. Keep `AGENTS.override.md` temporary and uncommitted.

## Work Routing

- **Inspection or research:** inspect relevant sources and report evidence; do not edit, create a work report, or run product gates by default.
- **Documentation, guidance, or configuration:** make the scoped change directly; run diff, reference, instruction, and parse checks without product TDD or browser gates.
- **Clear local behavior:** define acceptance or reproduce the defect, add the smallest regression test first when it materially improves confidence, implement, run focused checks, then run the module baseline once.
- **Complex or high-risk behavior:** research material unknowns, close decisions, use an approved design or plan when needed, test incrementally, and run the applicable broad gate once after the meaningful change.
- **Security, release, external, or destructive work:** follow the canonical Governance policy and obtain the approval required for the affected operation.

## Change Boundaries

- Preserve documented APIs, types, and package-local conventions unless the request explicitly expands them.
- Namespace CSS and custom properties, avoid global resets, and keep external engines behind module-owned adapters.
- Do not publish, tag, create a GitHub Release, or push a remote branch without an explicit maintainer command.

## Sensitive Data

- Adopt Comins Contract v1.2 and the governance `SENSITIVE_DATA_STANDARD.md`.
- Never track personal names, personal email addresses, local account paths, credentials, tokens, secrets, or value-derived fingerprints.
- Use only an approved public handle, GitHub noreply identity, service identity, explicit placeholder, or repository-relative path; run the required local Gitleaks hook and security CI, and when a package boundary exists run the exact package-artifact gate.
- Redact detector output, fail closed when a required scanner is unavailable, and handle legacy remediation through a separate audit.

## Verification

- Select checks by change type, report failed or unrun required checks, and run the unchanged broad gate only once unless new evidence or changed state justifies a retry.
- Classify failures as product behavior, test contract, or execution environment before changing code or repeating a gate.

## Reporting

- Update the repository's work report only for meaningful behavior, public API, configuration, security, release, or test-contract changes when that repository has a report convention.
<!-- comins-reference:managed-end -->

## Module Guidance

### Repository and Public Surface

- This repository owns the standalone `comins-grid-layout` React package, GitHub repository `kim1124/comins-layout`, default integration branch `main`, and its source, example, tests, documentation, reports, and release preparation.
- The public package surface includes `DashboardGrid`, `useDashboardGrid`, layout and state helpers, the option mapper, public types, and `comins-grid-layout/styles.css`.

### Product and Implementation

- Support create, read, update, move, resize, maximize, minimize, arrange, reset, and serialize widget flows.
- Support runtime column counts from `1` through `12`, movement and resize toggles, and scheduled resize signals for widget content.
- Keep React and React DOM as peer dependencies, and do not introduce Next.js-only APIs.
- Keep direct GridStack interaction inside the package-owned adapter boundary; use serializable layout state and preserve widget IDs across all operations.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.

### Module Verification

- Run `npm run verify` as the package baseline. For GridStack lifecycle, drag, resize, column-cycle, or other browser-visible behavior changes, run `npm run verify:full` once after focused checks.
- Store an applicable work report under `reports/YYYY-MM-DD.md`.
