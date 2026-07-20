# comins-grid-layout Test Rules

## Scope

This file applies to `test`.

## Role

The test workspace owns package-local Vitest, Playwright, browser artifacts, and work report routing.

## Rules

- MUST: Vitest tests under `test/vitest`.
- MUST: Playwright specs under `test/playwright/specs`.
- MUST: new package work reports under `reports/YYYY-MM-DD.md`.
- DO NOT: leave active artifacts under repository root `test-results`.
- REPORT: skipped browser checks with the reason and remaining risk.
- Prefer focused tests before package baseline verification.
- MUST: For behavior changes, write or update the smallest failing test before production code unless the change is documentation-only or instruction-only.
- MUST: For GridStack mount/unmount, drag, resize, column-cycle, or 100+ widget changes, run `npm run verify:full`. Its isolated `chromium-resource` project is the automated Chrome DevTools Protocol resource gate.
- MUST: CDP heap gates separate the bounded warm-up/transient peak from final retained-heap growth in a trailing steady-state window. Do not treat a pre-lazy-initialization sample as the permanent final baseline or reject non-monotonic post-GC jitter when final growth remains inside the declared tolerance.
- REPORT: Distinguish automated CDP counter verification from direct Chrome DevTools GUI verification. If direct GUI verification is requested but unavailable, report it as an unverified acceptance item.

## Verification Routing

- RUN: `npm run test:run` for pure state, helper, scheduler, option mapping, and structural guardrail tests.
- RUN: `npm run test:e2e` for rendered UI, example, drag, resize, maximize, minimize, responsive, or browser console behavior.
- RUN: `npm run verify` for package baseline.
- RUN: `npm run verify:full` before completion when browser-visible package behavior changes.
