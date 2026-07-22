# comins-grid-layout Test Rules

## Scope

This file applies to `test`.

## Role

The test workspace owns package-local Vitest, Playwright, and browser artifacts.

## Rules

- MUST: Vitest tests under `test/vitest`.
- MUST: Playwright specs under `test/playwright/specs`.
- DO NOT: leave active artifacts under repository root `test-results`.
- REPORT: skipped browser checks with the reason and remaining risk.
- For a reproducible defect or deterministic behavior change, add the smallest regression test first when feasible; otherwise record why and use the closest alternative evidence.
- The isolated `chromium-resource` project in `npm run verify:full` is the automated Chrome DevTools Protocol resource gate for GridStack lifecycle and 100+ widget changes.
- MUST: CDP heap gates separate the bounded warm-up/transient peak from final retained-heap growth in a trailing steady-state window. Do not treat a pre-lazy-initialization sample as the permanent final baseline or reject non-monotonic post-GC jitter when final growth remains inside the declared tolerance.
- REPORT: Distinguish automated CDP counter verification from direct Chrome DevTools GUI verification. If direct GUI verification is requested but unavailable, report it as an unverified acceptance item.

## Verification Routing

- RUN: `npm run test:run` for pure state, helper, scheduler, option mapping, and structural guardrail tests.
- RUN: `npm run test:e2e` for rendered UI, example, drag, resize, maximize, minimize, responsive, or browser console behavior.
