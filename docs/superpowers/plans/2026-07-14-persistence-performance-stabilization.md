# Persistence and Performance Stabilization Implementation Plan

**Goal:** Persist maximize/minimize restore geometry across JSON round-trips and verify that a 100-widget dashboard remains resource-stable through repeated column changes.

**Architecture:** Persist restore geometry in the core state snapshot as a top-level `previousLayouts` map. Mount 100 widgets through the complete example's existing JSON restore control, then use Chromium CDP counters plus manual Chrome DevTools to judge resource stability.

**Tech Stack:** React 19, TypeScript, GridStack 12, Vite, Vitest, Playwright, Chrome DevTools Protocol.

## Constraints

- Keep React and React DOM as peer dependencies; do not add Next.js APIs.
- Keep GridStack calls inside `src/gridstack`.
- Preserve widget IDs and clamp columns to `1..12`.
- Observe each new behavior test fail before production code changes.
- Retain `gpt-5.6-terra` and `xhigh`; do not modify Codex configuration.
- Defer publishing, dependency policy, license, CI, mobile interaction scope, and keyboard interactions.

## Task 1: Persist Restore Geometry in Full State Snapshots

**Files:** `src/core/types.ts`, `src/core/layout-state.ts`, `test/vitest/layout-state.test.ts`

1. Add failing Vitest coverage for maximize and minimize snapshot rehydration, plus legacy snapshots without `previousLayouts`.
2. Make `DashboardStateSnapshot<TData>` expose `previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>`.
3. In `createDashboardLayoutState`, normalize only restore entries whose key matches `layout.id` and an existing widget. In `serializeDashboardState`, deep-copy defined restore entries.
4. Run focused Vitest RED then GREEN; commit the focused change.

## Task 2: Add 100-Widget Repeated-Column Browser Regression Coverage

**File:** `test/playwright/specs/dashboard-grid.spec.ts`

1. Generate a 100-widget full state snapshot and restore it through the complete example's existing JSON control.
2. Run three `1..12` column cycles, return to 12, drag and resize `stress-0`.
3. Assert 100 GridStack items, no diagnostics, and no remaining drag/resize interaction class. Run the counter scenario in the isolated single-worker `chromium-resource` Playwright project.
4. Capture Chromium CDP `JSHeapUsedSize`, DOM nodes, event listeners, and documents after forced collection. Do not alter runtime code unless this test proves a defect.

## Task 3: Align Public Contract and Leak Verification Gate

**Files:** `README.md`, `docs/03-component-api-draft.md`, `docs/04-verification-strategy.md`, `docs/05-open-questions.md`, `test/playwright/specs/docs-playground-routing.spec.ts`, `reports/2026-07-14.md`

1. Add a failing docs-playground assertion for the exact `previousLayouts` persistence contract.
2. Document the distinction: `serializeState()` persists widgets, columns, and restore geometry; `serializeLayout()` persists geometry only.
3. Replace the resolved persistence open question with the Chrome DevTools gate: after garbage collection, three full stress cycles must show no cumulative DOM/listener growth and no monotonic post-GC heap growth.
4. Record exact counters and remaining risks in the report.

## Final Gate

- `npm run verify:full` passes in an environment permitted to bind Vite.
- Chromium 100-widget scenario passes.
- Chrome DevTools shows stable post-GC JS Heap and no DOM Nodes/Event Listeners accumulation across three cycles.
- `git diff --check` and `git diff --cached --check` pass.
