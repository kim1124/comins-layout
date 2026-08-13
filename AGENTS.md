<!-- comins-reference:managed-start contract=v1.5 -->
# Comins Module AGENTS.md

## Scope

- Comins Git boundary. Read closer `AGENTS.md`; use
  [Governance](https://github.com/kim1124/comins-governance) for common rules.
- KMSF is historical. Never commit `AGENTS.override.md`.

## Required Order

- Resolve the Git root and instructions. Follow Contract v1.5: license compliance; security and sensitive data; Comins common rules;
  module rules; smallest change and affected checks; Git, pull request, and CI; release checks only when publishing.

## Work Routing

- **Inspection or research:** report evidence only.
- **Documentation or configuration:** direct edit and matching checks.
- **Product behavior:** acceptance, smallest change, affected checks.
- Plan only for high risk or ambiguity.
- Skills and history must not expand the selected route.
- Subagents require explicit maintainer delegation or approved independent
  parallel work. Never pass full history; use bounded briefs and exact paths.
- Default: one final review and one required broad gate after the final change.
  Recheck affected failures; reuse unchanged evidence.

## Common Boundaries

- Preserve public APIs and types; keep CSS and external engines module-scoped.
- Apply Governance `OSS_LICENSE_POLICY.md` and `SENSITIVE_DATA_STANDARD.md`; the
  module owns its checker commands and CI implementation.
- Remote writes, publishing, tags, Releases, policy exceptions, and destructive
  operations require explicit approval.
- Name new Codex development branches `codex-<short-feature-name>`; append `-2`,
  `-3`, and so on for additional work under the same representative feature.
  Existing and provider-managed branches are exempt.

## Verification

- Run affected checks only. A failed required gate blocks the workflow;
  unrelated gates are not substitutes.
- Report changes, checks, omissions, and blockers. Release closure applies only
  to publication.
<!-- comins-reference:managed-end -->

## Module Guidance

- This repository owns the standalone `comins-grid-layout` React package and public `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, types, and `comins-grid-layout/styles.css` surfaces.
- Support widget CRUD, move, resize, maximize/minimize, arrange, reset, serialization, runtime columns `1`–`12`, interaction toggles, and scheduled content resize signals.
- Keep React/React DOM as peer dependencies, exclude Next.js-only APIs, isolate GridStack in the package adapter, and preserve serializable state and widget IDs.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.
- Run `npm run verify` as the package baseline. For GridStack lifecycle, drag, resize, column-cycle, or other browser-visible behavior changes, run `npm run verify:full` once after focused checks.
- Write managed-required reports to `reports/YYYY-MM-DD.md`.
