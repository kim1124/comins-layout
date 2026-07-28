# comins-grid-layout Test Rules

Applies to `test`; this workspace owns package-local Vitest, Playwright, and browser artifacts.

## Rules

- Keep Vitest under `test/vitest` and Playwright specs under `test/playwright/specs`.
- Do not leave active root `test-results`; report skipped browser checks and remaining risk.
- For a reproducible defect or deterministic behavior change, add the smallest regression test first when feasible; otherwise record why and use the closest alternative evidence.
- For GridStack lifecycle or 100+ widget resource changes, follow the [`chromium-resource` gate, steady-state thresholds, and GUI evidence boundary](../docs/04-verification-strategy.md#100-widget-resource-stability-gate).

## Routing

- `npm run test:run`: state, helper, scheduler, option mapping, and structural guardrails.
- `npm run test:e2e`: rendered UI, example, interactions, responsive behavior, and browser console.
