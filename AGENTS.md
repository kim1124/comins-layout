<!-- comins-reference:managed-start contract=v1.4 -->
# Comins Module AGENTS.md

## Scope

- Treat this as an independent Comins Git boundary. Read closer `AGENTS.md`;
  consult [Governance](https://github.com/kim1124/comins-governance) for common
  scope, security, license, and release policy.
- Keep KMSF historical; never commit `AGENTS.override.md`.

## Required Order

- Resolve the Git root and applicable instructions first. Then follow Contract
  v1.4: license compliance; security and sensitive data; Comins common rules;
  module rules; smallest change and affected checks; Git, pull request, and CI;
  release checks only when publishing.

## Work Routing

- **Inspection or research:** report evidence only.
- **Documentation or configuration:** edit directly and run matching checks.
- **Product behavior:** define acceptance, make the smallest change, and run the
  module's affected checks.
- **High-risk or ambiguous work:** close decisions and plan only when needed.

## Common Boundaries

- Preserve public APIs and types unless authorized. Keep CSS and external-engine
  behavior module-scoped.
- Apply Governance `OSS_LICENSE_POLICY.md` and `SENSITIVE_DATA_STANDARD.md`; the
  module owns its checker commands and CI implementation.
- Remote writes, publishing, tags, Releases, policy exceptions, and destructive
  operations require explicit approval.

## Verification

- Run only checks required by the affected surface. A required failed or
  unavailable gate blocks that workflow; do not substitute unrelated gates.
- Report meaningful changes, executed checks, omissions, and unresolved
  blockers. Release closure applies only to an actual public release.
<!-- comins-reference:managed-end -->

## Module Guidance

- This repository owns the standalone `comins-grid-layout` React package and public `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, types, and `comins-grid-layout/styles.css` surfaces.
- Support widget CRUD, move, resize, maximize/minimize, arrange, reset, serialization, runtime columns `1`–`12`, interaction toggles, and scheduled content resize signals.
- Keep React/React DOM as peer dependencies, exclude Next.js-only APIs, isolate GridStack in the package adapter, and preserve serializable state and widget IDs.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.
- Run `npm run verify` as the package baseline. For GridStack lifecycle, drag, resize, column-cycle, or other browser-visible behavior changes, run `npm run verify:full` once after focused checks.
- Write managed-required reports to `reports/YYYY-MM-DD.md`.
