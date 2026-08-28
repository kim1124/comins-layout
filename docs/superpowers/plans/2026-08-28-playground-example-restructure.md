# Playground Example Restructure Implementation Plan

**Status:** Approved for planning on 2026-08-28. Implementation has not started.

**Goal:** Rebuild the `comins-grid-layout` Playground with the same shell and navigation pattern as the Data Table Playground, then split Widget, Layout, and Advanced capabilities into focused submenu routes that exercise controlled public package APIs.

**Architecture:** Keep React state and `useDashboardGrid()` as the source of truth. GridStack remains isolated in `src/gridstack`; examples must not use raw `addWidget()`, `removeWidget()`, `destroy()`, `load()`, or engine internals. Preserve existing public APIs and add typed callbacks or safe handle methods only where the approved examples cannot be implemented truthfully through the current contract.

**Reference baseline:** The advanced scope is based on the installed GridStack `13.0.1` package and its [versioned demo index](https://github.com/gridstack/gridstack.js/blob/v13.0.1/demo/index.html). Method semantics must be checked against the [official GridStack API](https://gridstackjs.com/doc/html/classes/GridStack.html). Newer demos, including print support introduced after `13.0.1`, are outside this plan.

## Approved Decisions

- Add real public `before / action / after` callbacks for move, resize, and title double-click. The Event Playground must not synthesize lifecycle names from unrelated callbacks.
- Cover framework-neutral GridStack capabilities supported by Comins. Exclude AniJS, Knockout, Web Component, generic React integration pages, old jQuery examples, website showcase pages, and custom-engine internals.
- Preserve the existing controlled-state boundary. Advanced pages may compose multiple public `DashboardGrid` instances but may not use raw GridStack CRUD or lifecycle methods.
- Keep all existing public props, callbacks, commands, serialized snapshot compatibility, and `getGridStack()` escape hatch backward compatible. Do not use the escape hatch in new examples.
- Do not add dependencies, change the package version, commit, push, publish, create a PR, or release as part of this work unless separately requested.
- Preserve unrelated current work, including the in-progress transfer implementation and existing dirty files. Integrate by focused edits instead of replacing those files wholesale.

## Information Architecture

Use one route registry as the source for routing, sidebar rendering, search, localized labels, and compatibility redirects.

| Primary menu | Submenu | Canonical route |
| --- | --- | --- |
| Widget | Basic | `/examples/widget/basic` |
| Widget | Add / Delete All / Reset | `/examples/widget/manage` |
| Widget | Events | `/examples/widget/events` |
| Layout | Basic | `/examples/layout/basic` |
| Layout | Lock / Unlock | `/examples/layout/lock` |
| Layout | Save / Load | `/examples/layout/persistence` |
| Layout | Auto Arrange / Fill Gaps | `/examples/layout/arrange` |
| Layout | Layout Events | `/examples/layout/events` |
| Advanced | Cell Height | `/examples/advanced/cell-height` |
| Advanced | Grid Lines | `/examples/advanced/grid-lines` |
| Advanced | Float | `/examples/advanced/float` |
| Advanced | Lazy Loading | `/examples/advanced/lazy-load` |
| Advanced | Mobile Touch | `/examples/advanced/mobile-touch` |
| Advanced | Nested Grid - Basic | `/examples/advanced/nested/basic` |
| Advanced | Nested Grid - Advanced | `/examples/advanced/nested/advanced` |
| Advanced | Nested Grid - Constraints | `/examples/advanced/nested/constraints` |
| Advanced | Responsive - Column Width | `/examples/advanced/responsive/column` |
| Advanced | Responsive - Breakpoints | `/examples/advanced/responsive/breakpoints` |
| Advanced | Responsive - Layout None | `/examples/advanced/responsive/none` |
| Advanced | RTL | `/examples/advanced/rtl` |
| Advanced | Size To Content | `/examples/advanced/size-to-content` |
| Advanced | Static Grid | `/examples/advanced/static` |
| Advanced | Title Drag Handle | `/examples/advanced/title-drag` |
| Advanced | Transform | `/examples/advanced/transform` |
| Advanced | Multiple Grids - Horizontal | `/examples/advanced/multi-grid/horizontal` |
| Advanced | Multiple Grids - Vertical | `/examples/advanced/multi-grid/vertical` |
| Advanced | Safe Public Handlers / Methods | `/examples/advanced/public-api` |

Compatibility rules:

- `/`, unknown paths, and `/examples/widget` resolve to `/examples/widget/basic`.
- `/examples/layout` resolves to `/examples/layout/basic`.
- `/examples/advanced` resolves to `/examples/advanced/cell-height`.
- `/examples/crud` resolves to `/examples/widget/manage`.
- `/examples/complete` resolves to `/examples/advanced/public-api`.
- Preserve `/examples/transfer` as a compatibility route backed by the current transfer implementation; the two new multi-grid pages may share its controlled helpers without deleting that route.
- Primary menu links target their first submenu. Parent active state is determined by route prefix, while only the exact submenu receives `aria-current="page"`.

## Shared Example Contract

### Widget model and initial fixture

- Every focused Widget and Layout example starts with 10 deterministic widgets in 12 columns.
- Use stable IDs `widget-1` through `widget-10` and store the immutable sequence number in example data rather than deriving it from current visual order.
- Render `Title {n}` at the left of the header and `Content {n}` centered in the body.
- Render only these controls at the right, in this order: resize-lock toggle, move-lock toggle, delete button.
- The toggles update `resizable` and `movable` through `dashboard.commands.updateWidget()`. Their pressed state and accessible label must describe the current lock state.
- The delete action removes only the corresponding stable ID. Remaining widgets are never renumbered.
- The next number is monotonic for the lifetime of each route. Delete All, Reset, and Save/Load do not rewind or reuse an issued number. Reset may restore initial widgets `1..10`, but the next newly created number remains greater than every number previously issued in that mounted example.
- Added widgets have no fixed count limit. Automated interaction tests use a bounded sample, and the existing 100-widget resource contract remains unchanged; no unbounded-add performance test is introduced.

### Shared public rendering extension

The current widget shell hard-codes maximize, minimize, restore, and delete actions. Add an optional, typed `renderWidgetActions(widget)` slot to `DashboardGrid`/`DashboardWidgetShell` so consumers can replace the default action set. Preserve the existing default controls and callbacks for compatibility. The Playground supplies one shared action renderer containing exactly the three approved controls.

Restrict title double-click handling to the title element, not the entire header or action area. Keep action buttons outside the drag trigger and prevent action interaction from starting a move.

## Public Event Contracts

Add these optional `DashboardGrid` callbacks using `DashboardWidgetInteractionEvent` payloads containing the stable widget ID and current layout:

- `onBeforeMove`, `onMove`, `onAfterMove`
- `onBeforeResize`, `onResize`, `onAfterResize`
- `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, `onAfterTitleDoubleClick`

Semantics:

- `before` fires once at interaction start.
- `action` fires while the interaction is active. Coalesce move/resize frames with `requestAnimationFrame` so the public callback does not force React render work for every native event.
- Flush the latest scheduled `action` payload before `after`, then emit `after` once with final committed geometry.
- Title double-click calls its three callbacks synchronously in order around the canonical action notification. It does not implicitly fit, resize, or otherwise mutate the widget.
- Existing `onWidgetDragStart`, `onWidgetDragStop`, `onWidgetResizeStart`, `onWidgetResizeStop`, `onWidgetResizeFrame`, and `onWidgetHeaderDoubleClick` remain supported. Document their relationship to the new lifecycle callbacks and avoid duplicate state commits.
- Cancel scheduled callbacks on unmount and adapter destruction.

Add a separate typed `onLayoutMutation` observer to `useDashboardGrid()` for Layout Events. It emits one semantic event after a successful state transition, with mutation kind, affected widget IDs, columns, and the resulting serializable snapshot. Required kinds are:

- `widget:add`
- `widget:update`
- `widget:remove`
- `widgets:clear`
- `layout:commit`
- `layout:reset`
- `layout:restore`
- `layout:arrange`
- `layout:fill`
- `columns:change`

No-op commands, refresh notifications, title double-click, and resize-frame notifications do not emit layout mutations. A batch clear/reset/restore produces one event rather than an event storm. StrictMode must not duplicate observer calls.

## Focused Example Behavior

### Widget / Basic

- Render the page heading and the 10-widget grid only.
- Do not render a top control bar, selection state, status text, widget count, JSON, or selected-widget affordance.
- Individual widget lock toggles and delete remain available through the common widget header.

### Widget / Add / Delete All / Reset

- Use the Basic layout plus top buttons ordered `Add`, `Reset`, `Delete All`.
- Add creates the next monotonic widget number and lets the controlled layout state choose the first valid position.
- Delete All clears the current widgets but preserves the next sequence number.
- Reset restores the exact initial 10-widget model, properties, and 12-column layout while preserving the monotonic sequence counter.
- Do not add selection UI or status output.

### Widget / Events

- Use the Basic layout and place a read-only textarea immediately above the grid.
- Append newline-delimited entries containing callback name, widget ID, title, and layout.
- Verify the exact order for move, resize, and title double-click:
  - `onBeforeMove`, `onMove`, `onAfterMove`
  - `onBeforeResize`, `onResize`, `onAfterResize`
  - `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, `onAfterTitleDoubleClick`
- Do not add selection state or event-control buttons.

### Layout / Basic

- Reuse Widget Manage behavior and its Add, Reset, and Delete All controls.
- Add the Column select at the far right of the same toolbar.
- Offer every integer from 1 through 12 and default to 12.

### Layout / Lock / Unlock

- Reuse Layout Basic.
- Place the global Lock / Unlock toggle after Delete All and before the flexible spacer that pushes Column to the far right.
- Locked state sets both `movable` and `resizable` false for the grid without overwriting each widget's own lock preferences.

### Layout / Save / Load

- Reuse Layout Basic without the global lock toggle.
- Add Save and Load buttons after Delete All.
- Save deep-clones `serializeState()` into route-local memory and updates the output textarea.
- Load remains disabled until a snapshot exists, validates the in-memory value through the current fail-closed state sanitizer, and restores widgets, widget metadata and locks, active columns, previous layouts, and `layoutsByColumn` caches.
- Render the last saved snapshot as formatted JSON in a read-only textarea below the toolbar with approximately `100px` height and vertical scrolling.
- Loading an older snapshot never lowers the example's monotonic next-number counter.

### Layout / Auto Arrange / Fill Gaps

- Reuse Layout Save / Load and add Auto Arrange and Fill Gaps controls before the far-right Column select.
- Auto Arrange uses `autoArrangeWidgets()` for deterministic position compaction in widget order.
- Fill Gaps uses `fitWidgetsToColumns()` for controlled row-width redistribution.
- Compare before/after serialized layouts in tests; do not call the raw GridStack engine to make the example appear successful.

### Layout / Layout Events

- Reuse Layout Lock / Unlock.
- Add a read-only textarea above the grid and log `onLayoutMutation` payloads.
- Cover programmatic add/update/remove/clear/reset/column changes and committed drag/resize layout updates.
- Widget-local title double-click and raw resize frames must not appear. A lock toggle appears only as the resulting `widget:update` mutation.

## Advanced Example Contract

Each advanced submenu is a separate focused page. Reuse the shared fixture and controls only when they clarify the capability; do not rebuild the current all-in-one Advanced page under every route.

### Capabilities already supported by the public model

- Cell Height: switch among numeric and CSS-unit values through `engineOptions.cellHeight`.
- Grid Lines: toggle an example-scoped CSS overlay aligned with the active column and cell-height variables; this is a visual aid, not an engine mutation.
- Float: compare `engineOptions.float` false/true with deterministic fixtures.
- Mobile Touch: use `alwaysShowResizeHandle="mobile"`, touch-safe controls, and a dedicated mobile Playwright scenario.
- Responsive - Column Width: demonstrate `responsive.columnWidth` and `columnMax` against container width.
- Responsive - Breakpoints: demonstrate explicit breakpoint mappings and the reported active column.
- Responsive - Layout None: demonstrate a breakpoint with `layout: "none"` and verify geometry is retained rather than recalculated.
- RTL: toggle `engineOptions.rtl` and verify both visual direction and interaction geometry.
- Static Grid: toggle `engineOptions.staticGrid` without destroying or re-creating controlled state.
- Title Drag Handle: set `engineOptions.dragHandle` to the title/header selector and prove body/action interaction does not start dragging.
- Transform: place the grid in a scaled/offset wrapper and verify pointer-to-cell geometry through actual drag/resize interaction.

### Small public option additions

- Add `lazyLoad?: boolean` to `DashboardGridEngineOptions` and map it to GridStack.
- Add optional per-widget `lazyLoad?: boolean`, `sizeToContent?: boolean | number`, and `resizeToContentParent?: string` fields, preserving their values in state serialization and mapping them to the adapter.
- For Lazy Loading, first add a focused compatibility test proving whether GridStack `13.0.1` delays React-owned item content. If the engine option only applies to GridStack-created children, implement a documented Comins `lazyRenderWidget` boundary backed by `IntersectionObserver`; keep widget containers registered while delaying only `renderWidget()` content. Test content mount/unmount behavior without timing-only assertions.
- Size To Content demonstrates both the grid default and per-widget override. It must use the public mapper and scheduled content resize path, not direct `resizeToContent()` calls.

### Controlled nested and multi-grid composition

Recreate the official capabilities through multiple controlled `DashboardGrid` owners rather than serializing raw GridStack DOM content:

- Nested Basic: render stable child grids inside designated parent widgets, support parent/child additions, and support controlled transfers through grid IDs and drop requests.
- Nested Advanced: demonstrate at least three levels, independent state owners, save/restore of the composed snapshot, and deterministic transfer into an existing nested target. Do not expose dynamic engine-created anonymous subgrids; create named controlled targets so React remains authoritative.
- Nested Constraints: use typed `acceptExternalWidgets(candidate)` predicates so child grids accept only matching widget categories while the parent accepts the broader set. Rejected drops roll back with no state divergence.
- Multiple Grids - Horizontal and Vertical: reuse the existing controlled transfer transaction and present different layout/scroll orientations. Preserve copy/move semantics, stable IDs, rejection handling, and the existing `/examples/transfer` compatibility surface.

Before implementing these pages, add a browser prototype test for nested drag targeting and lifecycle cleanup. Stop this advanced slice if the controlled parent/child composition cannot maintain a single owner per grid, deterministic rollback, and zero console/page errors; do not fall back to raw GridStack CRUD.

### Safe Public Handlers / Methods

Keep this as the final submenu. It explains and demonstrates:

- `DashboardGrid` interaction lifecycle callbacks.
- `useDashboardGrid()` commands and `onLayoutMutation`.
- Existing safe handle methods `refresh()`, `compact()`, and `commitLayout()`.
- New read-only handle methods for column count, row count, float state, area availability, and fit checks when needed by the page.
- `getGridStack()` as a backward-compatible escape hatch only, with an explicit warning that raw mutations bypass controlled React state. The example must not invoke it.

Every displayed method must be public, typed, and covered by a package test. Do not display private adapter or engine APIs as supported Comins methods.

## Implementation Tasks

### Task 1: Establish route registry and submenu shell

**Files:**

- Add: `example/src/playground/routes.ts`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/PlaygroundShell.tsx`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/styles.css`
- Test: `test/playwright/specs/docs-playground-routing.spec.ts`

**Steps:**

1. Add failing route tests for every primary/default/compatibility path, exact submenu counts, parent/submenu active state, search indexing, keyboard navigation, and narrow viewport overflow.
2. Centralize route metadata and lazy page resolution so navigation, search, and routing cannot drift.
3. Render all submenu links under the three approved primary menus; keep the Data Table-compatible header/sidebar/content geometry.
4. Preserve docs-shell separation and direct transfer compatibility.
5. Run the focused routing spec in Chromium.

### Task 2: Build deterministic shared example primitives

**Files:**

- Modify: `example/src/playground/fixtures.ts`
- Add: `example/src/playground/components/ExampleToolbar.tsx`
- Add: `example/src/playground/components/ExampleEventLog.tsx`
- Add: `example/src/playground/components/ExampleWidgetActions.tsx`
- Add: `example/src/playground/components/ExampleDashboard.tsx`
- Modify: `example/src/playground/components/DashboardPreview.tsx`
- Modify: `example/src/playground/types.ts`
- Modify: `example/src/styles.css`
- Test: `test/vitest/playground-state-snapshot.test.ts`

**Steps:**

1. Add tests for the 10-widget fixture, immutable sequence numbers, reset snapshot, clear/add behavior, and no number reuse.
2. Add shared toolbar ordering and far-right Column layout primitives.
3. Add the read-only textarea component with stable accessible labels.
4. Implement the shared widget action renderer and centered content.
5. Remove selection/status/count behavior from the new focused pages while leaving unrelated compatibility pages intact.

### Task 3: Add custom widget actions and public interaction lifecycle events

**Files:**

- Modify: `src/core/types.ts`
- Modify: `src/components/DashboardGrid.tsx`
- Modify: `src/components/DashboardWidget.tsx`
- Modify: `src/gridstack/adapter.ts`
- Modify or add: `src/core/interaction-scheduler.ts`
- Modify: `src/index.ts` if explicit exports are required
- Test: `test/vitest/adapter.test.ts`
- Test: `test/vitest/dashboard-grid-configuration.test.tsx`
- Test: `test/vitest/resize-scheduler.test.ts`

**Steps:**

1. Add failing tests for action-slot replacement, exact callback ordering, final layout payload, rAF coalescing, legacy callback compatibility, and unmount cancellation.
2. Add the optional action render slot without changing existing default controls.
3. Wire GridStack drag/resize start, active, and stop events to the new callbacks.
4. Scope title double-click to the title and emit its three callbacks in order.
5. Keep content-resize `onWidgetResizeFrame` separate from layout-resize `onResize`.
6. Run focused Vitest files and typecheck.

### Task 4: Implement the three Widget pages

**Files:**

- Replace focused responsibilities in: `example/src/playground/WidgetPlayground.tsx`
- Add: `example/src/playground/widget/WidgetBasicPlayground.tsx`
- Add: `example/src/playground/widget/WidgetManagePlayground.tsx`
- Add: `example/src/playground/widget/WidgetEventsPlayground.tsx`
- Test: `test/playwright/specs/playground.spec.ts` or focused widget spec

**Steps:**

1. Add failing E2E assertions for exact text, initial count, toolbar absence/presence, and control order.
2. Implement Basic without top controls or selection state.
3. Implement Add/Delete All/Reset with monotonic IDs and exact reset behavior.
4. Implement Events with read-only ordered logs for actual move, resize, and title double-click.
5. Add a representative Firefox pointer-parity scenario for lifecycle ordering.

### Task 5: Add semantic layout mutation events

**Files:**

- Modify: `src/core/types.ts`
- Modify: `src/core/use-dashboard-grid.ts`
- Modify: `src/core/layout-state.ts` only if transition metadata needs a pure helper
- Test: `test/vitest/use-dashboard-grid.test.tsx`
- Test: `test/vitest/layout-state.test.ts`

**Steps:**

1. Add failing hook tests for every mutation kind, resulting snapshot, no-op suppression, batch behavior, and StrictMode deduplication.
2. Emit the observer after successful controlled transitions without adding side effects to pure reducers.
3. Treat committed drag/resize geometry as `layout:commit` and programmatic metadata/lock changes as `widget:update`.
4. Document excluded widget-internal events.

### Task 6: Implement the five Layout pages

**Files:**

- Replace focused responsibilities in: `example/src/playground/LayoutPlayground.tsx`
- Add: `example/src/playground/layout/LayoutBasicPlayground.tsx`
- Add: `example/src/playground/layout/LayoutLockPlayground.tsx`
- Add: `example/src/playground/layout/LayoutPersistencePlayground.tsx`
- Add: `example/src/playground/layout/LayoutArrangePlayground.tsx`
- Add: `example/src/playground/layout/LayoutEventsPlayground.tsx`
- Reuse/modify: `example/src/playground/state-snapshot.ts`
- Test: `test/playwright/specs/playground.spec.ts` or focused layout spec

**Steps:**

1. Add failing tests for toolbar composition and Column options `1..12`, default `12`, and far-right placement.
2. Implement global lock without overwriting per-widget locks.
3. Implement in-memory full-state Save/Load and the 100px read-only JSON output.
4. Implement Auto Arrange and Fill Gaps through existing commands.
5. Implement semantic layout event logging and prove title double-click/resize-frame exclusion.
6. Verify save/load restores widget properties and per-column caches after column changes.

### Task 7: Implement mapped advanced options

**Files:**

- Modify: `src/core/types.ts`
- Modify: `src/gridstack/option-mapper.ts`
- Modify: `src/gridstack/adapter.ts` only for safe runtime option updates
- Add focused pages under: `example/src/playground/advanced/`
- Test: `test/vitest/option-mapper.test.ts`
- Test: focused advanced Playwright spec

**Steps:**

1. Add mapper tests before adding lazy/per-widget sizing options.
2. Implement Cell Height, Grid Lines, Float, responsive variants, RTL, Static, Title Drag, and Transform as independent pages.
3. Implement and verify Size To Content through public props.
4. Run representative browser interactions after each engine-sensitive group rather than waiting for the full menu to be complete.

### Task 8: Implement lazy, nested, and multiple-grid pages

**Files:**

- Add lazy content boundary under: `src/components/` if the compatibility test requires it
- Reuse/modify: `example/src/playground/TransferPlayground.tsx`
- Reuse/modify: `example/src/playground/components/WidgetPalette.tsx`
- Add focused pages under: `example/src/playground/advanced/`
- Test: `test/vitest/drag-in-contract.test.tsx`
- Test: `test/vitest/widget-transfer.test.ts`
- Test: `test/playwright/specs/transfer-playground.spec.ts`
- Test: focused nested/lazy/mobile Playwright specs

**Steps:**

1. Prove the GridStack 13.0.1 lazy behavior at the React-owned DOM boundary; implement the documented Comins fallback only if required.
2. Add a deterministic lazy content visibility test with an explicit scroll container.
3. Add controlled nested-grid lifecycle and rollback tests before page implementation.
4. Implement Basic, Advanced, and Constraint nested examples using named grid owners and typed transfer requests.
5. Refactor reusable transfer logic without discarding current in-progress work.
6. Implement horizontal and vertical multi-grid pages and preserve `/examples/transfer` behavior.
7. Run mobile touch only for the tagged mobile example and representative nested transfer.

### Task 9: Add safe public query methods and the final advanced page

**Files:**

- Modify: `src/gridstack/adapter.ts`
- Modify: `src/components/DashboardGrid.tsx`
- Add: `example/src/playground/advanced/PublicApiPlayground.tsx`
- Modify: `example/src/docs/content.tsx`
- Test: `test/vitest/dashboard-grid-handle.test.tsx`
- Test: focused advanced Playwright spec

**Steps:**

1. Add failing type/runtime tests for each new read-only handle method.
2. Expose only stable queries and controlled commit/compact/refresh operations.
3. Build the final page from public imports only and show concise explanations beside live results.
4. Show the raw handle as an escape-hatch warning but do not call it.

### Task 10: Consolidate documentation and verification

**Files:**

- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `example/src/docs/content.tsx`
- Modify: affected test README files
- Update: `reports/YYYY-MM-DD.md` during implementation only

**Steps:**

1. Remove stale descriptions of the three former all-in-one pages and document canonical submenu URLs.
2. Document new public callbacks, layout mutation observer, option fields, and safe handle methods.
3. Run `git diff --check`.
4. Run focused Vitest while each contract changes, then run `npm run verify` once after the full implementation stabilizes.
5. Run affected Playwright specs in Chromium, the tagged pointer scenario in Firefox, and the tagged touch scenario in Mobile Chrome.
6. Because lazy/nested work changes GridStack lifecycle, run the existing `chromium-resource` 100-widget gate unchanged. Do not increase its widget count or add an unlimited-add benchmark.
7. Do not run `npm run verify:full` unless the maintainer explicitly requests it or the work becomes an actual publication.
8. Record executed commands, results, unexecuted browser boundaries, and remaining risks in the implementation report.

## Acceptance Criteria

- The Playground shell has exactly three primary menus and all approved submenus, with the Safe Public Handlers / Methods page last.
- Every Widget and Layout page uses the exact common `Title {n}` / `Content {n}` presentation and only the three approved header controls.
- Widget Basic has 10 widgets and no top function controls, selection state, status, count, or JSON output.
- Add/Delete All/Reset maintains monotonic numbers and deterministic reset behavior.
- Widget Events displays real public callback ordering for move, resize, and title double-click.
- Layout pages match the requested toolbar deltas, including Column `1..12` at the far right and 12 as default.
- Save/Load restores the complete serializable state and displays the last saved JSON in the specified textarea.
- Layout Events reports semantic layout mutations and excludes widget-internal notifications.
- Every advanced page is independently reachable and uses public package contracts only.
- No example mutates GridStack through raw CRUD, destroy/load, or engine internals.
- Existing public contracts and the direct transfer route remain backward compatible.
- Focused tests, `npm run verify`, and required browser projects pass, or any failures/unexecuted boundaries are reported without being presented as complete.

## Known Risks

- True GridStack lazy creation assumes GridStack owns child DOM, while `DashboardGrid` currently lets React own it. The compatibility test and documented content-lazy fallback are mandatory before claiming lazy support.
- Official dynamic nested-grid creation mutates engine/DOM state directly. This plan intentionally demonstrates advanced nested behavior with named controlled grids; it will not expose anonymous raw `subGridDynamic` mutation unless a separate controlled state contract is approved.
- The current worktree already contains unrelated/in-progress changes. Implementation must inspect the live diff before every overlapping edit and must not overwrite or clean those changes.
- Automated WebKit/Safari coverage is not part of the configured project matrix. Safari remains an explicitly unverified consumer boundary unless separately requested.
