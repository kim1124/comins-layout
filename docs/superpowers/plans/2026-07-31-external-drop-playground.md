# External Drop Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a visible `300 x 300` consumer-owned external drop deletion
target to the default `/examples/complete` Playground and verify the complete
existing behavior before PR and `main` merge.

**Architecture:** Keep the new package callback non-destructive. The example
passes a stable target selector to `DashboardGrid`, handles the typed event in
`CompleteExample`, and removes controlled widget state through
`useDashboardGrid`. Reuse the example-only `DashboardPreview` wrapper without
changing runtime package code.

**Tech Stack:** React, TypeScript, Vite, GridStack, Playwright, Vitest.

---

## Task 1: Add The Failing Playground Contract

**Files:**

- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`

- [ ] Add a Chromium-only scenario for `/examples/complete`.
- [ ] Assert the target is an ordinary visible `div` with a 300-pixel desktop
      width and height.
- [ ] Drag the `sales` widget to the target using final pointer coordinates.
- [ ] Assert the widget disappears, the count changes from four to three, and
      the live status identifies `sales`.
- [ ] Assert the browser diagnostics collector remains empty.
- [ ] Run the focused scenario and confirm RED because the target is absent.

## Task 2: Implement The Playground Consumer

**Files:**

- Modify: `example/src/main.tsx`
- Modify: `example/src/styles.css`

- [ ] Add one stable external target definition for
      `#complete-widget-trash`.
- [ ] Add status state and an event handler to `CompleteExample`.
- [ ] On target ID `trash`, remove the reported widget through
      `dashboard.commands.removeWidget`.
- [ ] Render the ordinary target and live status in the complete example.
- [ ] Extend `DashboardPreview` only with the optional external-drop props
      required by this example.
- [ ] Add example-scoped 300 x 300 responsive styling.
- [ ] Run the focused Playwright scenario and confirm GREEN.
- [ ] Run the full docs Playground routing spec.

## Task 3: Verify The Integrated Branch

**Files:**

- Modify: `reports/2026-07-31.md`

- [ ] Run `npm run build`.
- [ ] Run `npm run verify:full` once on the final implementation.
- [ ] Run `npm run test:consumer`.
- [ ] Run `git diff --check`, inspect the final diff, and confirm dependency and
      package-version files are unchanged.
- [ ] Record the Playground and final gate evidence in the managed report.
- [ ] Commit only the verified implementation, test, documentation, and report
      changes.

## Task 4: Publish The Verified Branch And Merge

- [ ] Recheck remote, authentication, current remote `main`, and the exact PR
      diff.
- [ ] Ensure the verified branch contains current remote `main` without
      discarding local history.
- [ ] Push the exact verified HEAD and open a ready-for-review PR.
- [ ] Wait for required checks and confirm the PR head SHA is unchanged.
- [ ] Merge the PR into `main`.
- [ ] Confirm the remote default branch contains the merged feature.
- [ ] Do not create a tag, Release, npm stage, or public package publication.
