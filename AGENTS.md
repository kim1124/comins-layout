<!-- comins-reference:managed-start contract=v1.7 -->
# Comins Module AGENTS.md

## Common Policy

- Before changing this repository, read the canonical
  [Comins Contract v1.7](https://github.com/kim1124/comins-governance/blob/main/COMINS_CONTRACT.md)
  once per run. For inspection-only work, load it only when a Contract stage
  is relevant. Stop if it is unavailable or its heading does not match this
  block's version. Governance is the only common-policy owner.
- Load the Contract's license, sensitive-data, or release policy only when its
  corresponding stage is triggered.
- Keep module API, implementation, performance, browser, and checker commands
  in `Module Guidance`; the module owns their CI implementation.
<!-- comins-reference:managed-end -->

## Module Guidance

- This repository owns the standalone `comins-grid-layout` React package and public `DashboardGrid`, `useDashboardGrid`, layout/state helpers, option mapper, types, and `comins-grid-layout/styles.css` surfaces.
- Support widget CRUD, move, resize, maximize/minimize, arrange, reset, serialization, runtime columns `1`–`12`, interaction toggles, and scheduled content resize signals.
- Keep React/React DOM as peer dependencies, exclude Next.js-only APIs, isolate GridStack in the package adapter, and preserve serializable state and widget IDs.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.
- Run `npm run verify` as the package baseline. For browser-visible behavior,
  run only the affected Playwright specs and projects after focused checks;
  reuse split PR CI evidence and rerun only failed or affected jobs. Run
  `npm run verify:full` only for an actual publication or explicit maintainer request.
- Write managed-required reports to `reports/YYYY-MM-DD.md`.
