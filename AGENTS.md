<!-- comins-reference:managed-start contract=v1.2 -->
# Comins Module AGENTS.md

## Scope

- Treat this as an independent Comins Git boundary. Read only applicable closer `AGENTS.md` files; load [Governance policy](https://github.com/kim1124/comins-governance) only for API, security, release, license, or shared-policy work.
- Do not use KMSF workflows except for migration-history work; keep `AGENTS.override.md` temporary and uncommitted.

## Work Routing

- **Inspection or research:** report evidence; no edits, reports, or product gates.
- **Documentation, guidance, or configuration:** edit directly; run applicable diff, reference, instruction, and parse checks only.
- **Clear local behavior:** define acceptance or reproduce, add a regression test first when it materially improves confidence, implement, run focused checks, then the baseline once.
- **Complex or high-risk:** close material unknowns/decisions, plan when needed, test incrementally, then run the applicable broad gate once.
- **Security, release, external, or destructive:** follow Governance and obtain approval.

## Change Boundaries

- Preserve public APIs, types, and local conventions unless scope expands; namespace CSS/custom properties, avoid global resets, and isolate external engines behind module adapters.
- Do not push, publish, tag, or create a GitHub Release without an explicit maintainer command.

## Sensitive Data

- Adopt Comins Contract v1.2 and the governance `SENSITIVE_DATA_STANDARD.md`. Never track personal names, personal email addresses, local account paths, credentials, tokens, secrets, or value-derived fingerprints.
- Use only an approved public handle, GitHub noreply identity, service identity, explicit placeholder, or repository-relative path; run required Gitleaks/security CI and, when a package boundary exists, the exact package-artifact gate.
- Redact detector output, fail closed when unavailable, and audit legacy exposure separately.

## Verification

- Select checks by change type, report failed/unrun required checks, and classify failures as product, test-contract, or environment before changing code or retrying.

## Reporting

- Update reports only for meaningful behavior, public API, configuration, security, release, or test-contract changes when that convention exists.
- For a public release only, closure requires Governance post-publication closure evidence, local/remote default-branch reconciliation, and remaining release branches/worktrees; deletion needs separate maintainer approval.
<!-- comins-reference:managed-end -->

## Module Guidance

- This repository owns the standalone `comins-grid-layout` React package and public `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, types, and `comins-grid-layout/styles.css` surfaces.
- Support widget CRUD, move, resize, maximize/minimize, arrange, reset, serialization, runtime columns `1`–`12`, interaction toggles, and scheduled content resize signals.
- Keep React/React DOM as peer dependencies, exclude Next.js-only APIs, isolate GridStack in the package adapter, and preserve serializable state and widget IDs.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.
- Run `npm run verify` as the package baseline. For GridStack lifecycle, drag, resize, column-cycle, or other browser-visible behavior changes, run `npm run verify:full` once after focused checks.
- Write managed-required reports to `reports/YYYY-MM-DD.md`.
