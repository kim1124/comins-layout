<!-- comins-reference:managed-start contract=v1.10 -->
# Comins Module AGENTS.md

## Common Policy

- Before changing this repository, read the canonical
  [Comins Contract v1.10](https://github.com/kim1124/comins-governance/blob/main/COMINS_CONTRACT.md)
  or, for explicitly approved local-only adoption, its matching version in the
  verified Governance checkout, once per run. For inspection-only work, load it only when a Contract stage
  is relevant. Stop if it is unavailable or its heading does not match this
  block's version. Governance is the only common-policy owner.
- Report an approved local-only revision as unpublished.
- Load the Contract's license, sensitive-data, or release policy only when its
  corresponding stage is triggered.
- Keep module API, implementation, performance, browser, and checker commands
  in `Module Guidance`; the module owns their CI implementation.
<!-- comins-reference:managed-end -->

## Module Guidance

- Path guidance is under `src/core`, `src/components`, `src/gridstack`,
  `example`, and `test`; read only the instructions applicable to changed paths.
- This repository owns `comins-grid-layout`: root/`/react` compatibility, pure public `/core`, Vue 3.5+ CSR `/vue`, and shared `styles.css`. Vanilla/Svelte renderers are future extensions, not shipped support.
- Support widget CRUD, move, resize, maximize/minimize, arrange, reset, serialization, runtime columns `1`–`12`, interaction toggles, and scheduled content resize signals.
- Keep React/React DOM/Vue as optional peer dependencies; each renderer must work without the opposite framework installed. Exclude Next.js/Nuxt-only APIs, isolate GridStack in the package adapter, and preserve serializable state and widget IDs. Core has no DOM/framework/engine imports; Browser owns shared lifecycle without renderer imports.
- Treat 100 or more widgets and repeated runtime column changes as baseline performance requirements.
- Run `npm run verify` as the package baseline. For browser-visible behavior,
  run only the affected Playwright specs and projects after focused checks;
  reuse split PR CI evidence and rerun only failed or affected jobs. Run
  `npm run verify:full` only for an actual publication or explicit maintainer request.
- Write managed-required reports to `reports/YYYY-MM-DD.md`.
- `npm run check:core` checks source Core/Browser and the DOM-free consumer. `npm run verify` also checks Vue types and built JS/declaration boundaries. `npm run test:consumer` verifies five isolated consumers from one exact tarball; record its hash and versions. Vue resource tests use the existing React budgets without relaxation.
