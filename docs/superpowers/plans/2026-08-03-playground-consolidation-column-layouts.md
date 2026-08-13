# Playground Consolidation And Column Layout Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the Playground into three full-width, single-grid workspaces and add backward-compatible, serializable per-column layout persistence to the public package state.

**Architecture:** Keep React reducer state as the source of truth and store a normalized layout snapshot for every known column count beside the existing active `widgets` and `previousLayouts`. Route documentation and examples through separate shells, then compose each Playground page from package public APIs only. GridStack remains isolated behind `DashboardGrid`; the advanced page may query the existing public handle but must not mutate GridStack through raw CRUD or lifecycle calls.

**Tech Stack:** React 19 development runtime with React 18–19 peer support, TypeScript 6, Vite 8, Vitest 4, Playwright 1.61, GridStack 13.0.1.

## Global Constraints

- Preserve every existing public command, prop, callback, type member, and `serializeLayout()` meaning.
- The only public contract expansion is `layoutsByColumn` plus the two named column-layout snapshot types.
- Keep `DashboardGrid` controlled by React state; do not call GridStack `addWidget()`, `removeWidget()`, `destroy()`, or internal layout-cache methods.
- Keep runtime columns clamped to `1`–`12` and ignore invalid serialized column keys.
- Keep each example route to one `useDashboardGrid()` owner and one rendered `.grid-stack` instance.
- Do not add dependencies, change package version, publish, push, create a pull request, or change provider settings in this implementation.
- Use deterministic fixtures and ID-based assertions. Do not use timing-only assertions for drag, resize, column restoration, or fill behavior.
- Commit after every completed task and run the task's focused checks before its commit.
- Run `npm run verify:full` once after the complete code and test contract is stable.

---

## Task 1: Add And Normalize The Public Column Layout State Contract

**Files:**

- Modify: `src/core/types.ts:66-94`
- Modify: `src/core/layout-state.ts:1-32`
- Modify: `src/core/layout-state.ts:339-359`
- Test: `test/vitest/layout-state.test.ts`

- [ ] **Step 1: Add failing migration and serialization tests**

Add tests under a new `describe("column layout snapshots", ...)` block that assert:

1. `createDashboardLayoutState()` given a legacy state snapshot without `layoutsByColumn` creates one entry at the active column.
2. A snapshot containing keys `6` and `12` round-trips through `serializeDashboardState()` without sharing layout object references.
3. The top-level active `widgets` and `previousLayouts` override a conflicting active cache entry.
4. Column keys `0`, `13`, and `"desktop"`, unknown widget IDs, mismatched layout IDs, and invalid restore entries are discarded.
5. `serializeDashboardLayout()` still returns only `{ columns, widgets: DashboardWidgetLayout[] }`.

Use a two-widget fixture whose 12-column and 6-column geometry are observably different:

```ts
const layoutsByColumn = {
  12: {
    widgets: [
      { id: "sales", x: 0, y: 0, w: 8, h: 2 },
      { id: "traffic", x: 8, y: 0, w: 4, h: 2 },
    ],
    previousLayouts: {},
  },
  6: {
    widgets: [
      { id: "sales", x: 0, y: 0, w: 3, h: 2 },
      { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
    ],
    previousLayouts: {},
  },
};
```

- [ ] **Step 2: Run the focused test and confirm the contract is missing**

Run:

```bash
npm run test:run -- test/vitest/layout-state.test.ts
```

Expected: the new assertions fail because `DashboardLayoutState` and serialized state do not contain `layoutsByColumn`.

- [ ] **Step 3: Add the public types**

In `src/core/types.ts`, add these exact exported types and members:

```ts
export type DashboardColumnLayoutSnapshot = {
  widgets: DashboardWidgetLayout[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};

export type DashboardLayoutsByColumn = Partial<
  Record<DashboardColumnCount, DashboardColumnLayoutSnapshot>
>;

export type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn: DashboardLayoutsByColumn;
};

export type DashboardStateSnapshotInput<TData = unknown> = {
  columns: number;
  widgets: DashboardWidget<TData>[];
  previousLayouts?: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn?: DashboardLayoutsByColumn;
};
```

Add `layoutsByColumn: DashboardLayoutsByColumn` to `DashboardLayoutState<TData>`. Keep wildcard exports in `src/index.ts`; no extra export statement is required.

- [ ] **Step 4: Implement fail-closed cache normalization**

In `src/core/layout-state.ts`, import `DASHBOARD_COLUMN_COUNTS`, `DashboardColumnCount`, `DashboardColumnLayoutSnapshot`, and `DashboardLayoutsByColumn`. Add private helpers with these responsibilities:

```ts
function createColumnLayoutSnapshot<TData>(
  widgets: DashboardWidget<TData>[],
  previousLayouts: DashboardLayoutState<TData>["previousLayouts"],
  columns: DashboardColumnCount,
): DashboardColumnLayoutSnapshot;

function normalizeLayoutsByColumn<TData>(
  snapshot: DashboardLayoutStateInput<TData>,
  widgets: DashboardWidget<TData>[],
  activePreviousLayouts: DashboardLayoutState<TData>["previousLayouts"],
  activeColumns: DashboardColumnCount,
): DashboardLayoutsByColumn;

function withActiveColumnSnapshot<TData>(
  state: DashboardLayoutState<TData>,
): DashboardLayoutState<TData>;
```

Normalization rules:

- Iterate `DASHBOARD_COLUMN_COUNTS`, never arbitrary object keys.
- Keep layouts only for IDs in the top-level widget set and require `layout.id === widget.id`.
- Normalize `x/y/w/h/min/max` against that cache entry's column count.
- Keep restore entries only when the key, layout ID, and existing widget ID all match.
- Rebuild the active cache entry from authoritative top-level `widgets` and `previousLayouts` after reading optional input caches.
- Clone every stored layout so callers cannot mutate reducer state through a serialized object.

Update `createDashboardLayoutState()` to initialize the normalized cache and update `serializeDashboardState()` to include deep-cloned `layoutsByColumn` entries. Do not add `layoutsByColumn` to `serializeDashboardLayout()`.

- [ ] **Step 5: Re-run the focused test**

Run:

```bash
npm run test:run -- test/vitest/layout-state.test.ts
```

Expected: all layout-state tests pass.

- [ ] **Step 6: Type-check the new public contract**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits with code 0 and current snapshot consumers compile because `layoutsByColumn` is optional on input.

- [ ] **Step 7: Commit the state-contract foundation**

```bash
git add src/core/types.ts src/core/layout-state.ts test/vitest/layout-state.test.ts
git commit -m "feat: add column layout state snapshots"
```

---

## Task 2: Make Every Layout Mutation Column-Cache Aware

**Files:**

- Modify: `src/core/layout-state.ts:34-337`
- Test: `test/vitest/layout-state.test.ts`

- [ ] **Step 1: Add failing column-transition tests**

Add unit tests that cover these exact transitions:

- Change the 12-column `sales` geometry, call `setDashboardColumns(state, 6)`, change its 6-column geometry, then call `setDashboardColumns(state, 12)` and expect the prior 12-column geometry.
- Return to 6 columns and expect the independent 6-column geometry.
- Call `setDashboardColumns(state, state.columns)` and expect `toBe(state)`.
- Transition to an uncached column and expect normalized, deterministic geometry plus a newly created target entry.
- Apply a layout snapshot whose `columns` differs from the active state and expect the source cache to be saved before the target snapshot becomes authoritative.

- [ ] **Step 2: Add failing mutation-propagation tests**

Add assertions for:

- `updateDashboardWidgetLayout()`, `applyDashboardLayoutSnapshot()`, maximize, minimize, restore, auto-arrange, `fitDashboardWidgetsToColumns()`, and `fitDashboardWidgetToColumns()` updating the active cache entry.
- A title/data/lock-only `updateDashboardWidget()` preserving geometry in every cache.
- `updateDashboardWidget()` with `patch.layout` updating only the active cache geometry.
- `addDashboardWidget()` placing the new ID in active and every existing cached column at deterministic first-available positions.
- Re-adding an existing ID replacing its content without creating duplicate layouts in caches.
- `removeDashboardWidget()` deleting the ID from every cached `widgets` array and `previousLayouts` map.
- `clearDashboardWidgets()` leaving each known column cache present but empty.

- [ ] **Step 3: Add failing column-specific restore tests**

Exercise this sequence:

1. Maximize `sales` in 12 columns.
2. Switch to 6 columns and minimize `sales` from its 6-column geometry.
3. Restore in 6 columns and assert the 6-column geometry.
4. Switch to 12 columns, restore, and assert the original 12-column geometry.

This test must inspect both active `previousLayouts` and each `layoutsByColumn[column].previousLayouts` entry.

- [ ] **Step 4: Run the focused tests and confirm transition failures**

Run:

```bash
npm run test:run -- test/vitest/layout-state.test.ts
```

Expected: new transition and propagation tests fail while the Task 1 migration tests remain green.

- [ ] **Step 5: Centralize active-cache synchronization**

Use `withActiveColumnSnapshot()` at the return boundary of every operation that changes active geometry or restore state. Keep no-op identity behavior before cloning state:

- Unknown widget ID returns the original state for maximize, minimize, and restore.
- Same-column transition returns the original state.
- A layout snapshot that produces no geometry or column change may return the original state only if current callback semantics are preserved.

For non-layout `updateDashboardWidget()` patches, update widget metadata without rewriting cached geometry. If `patch.layout` exists, normalize the active layout and synchronize only the active cache.

- [ ] **Step 6: Implement atomic source-save and target-restore**

Change `setDashboardColumns()` to:

1. Clamp the requested count.
2. Return `state` for the same count.
3. Snapshot the current active column.
4. Restore matching cached layouts and restore maps for the target column.
5. For an ID absent from the target cache, normalize its current geometry to target columns and place it with the same collision test used by `addDashboardWidget()`.
6. Preserve widget metadata from the current top-level widget objects.
7. Synchronize the restored target as the new active cache entry.

Refactor placement into a geometry-based helper that accepts `DashboardWidgetLayout[]` and `DashboardColumnCount`, so adding a widget to inactive caches does not require fabricating a `DashboardLayoutState<TData>`.

- [ ] **Step 7: Propagate CRUD across known caches**

Implement the approved propagation rules:

- Add the ID to all existing cache entries with normalized deterministic first-available layout.
- Remove the ID and restore entry from all cache entries.
- Clear every cache entry's layout and restore arrays while retaining its column key.
- Never create all 12 cache entries eagerly; update only entries that already exist plus the active entry.

- [ ] **Step 8: Re-run unit and type checks**

Run:

```bash
npm run test:run -- test/vitest/layout-state.test.ts
npm run typecheck
```

Expected: both commands pass.

- [ ] **Step 9: Commit cache-aware reducer behavior**

```bash
git add src/core/layout-state.ts test/vitest/layout-state.test.ts
git commit -m "feat: restore layouts by column"
```

---

## Task 3: Lock The Hook Serialization Boundary

**Files:**

- Modify: `src/core/use-dashboard-grid.ts:30-164`
- Create: `test/vitest/use-dashboard-grid.test.tsx`

- [ ] **Step 1: Add a server-rendered initial-state contract test**

Create a probe component that calls `useDashboardGrid()` and renders
`JSON.stringify(dashboard.commands.serializeState())` into an `output` element. Render it with
`renderToStaticMarkup()` and assert:

- The default hook state serializes a 12-column cache entry.
- Explicit `initialColumns: 6` and `initialWidgets` serialize a matching 6-column cache entry.
- The returned state, `widgets`, and `columns` agree with serialized active state.
- The input widget fixture is not mutated during initialization or serialization.

This unit test intentionally covers only render-time behavior. Dispatching `restoreLayout()`,
`resetLayout()`, `setColumns()`, and `applyLayoutSnapshot()` is verified through the real browser
workspaces in Tasks 6 and 7 rather than by mocking React hooks.

- [ ] **Step 2: Run the focused hook test**

Run:

```bash
npm run test:run -- test/vitest/use-dashboard-grid.test.tsx
```

Expected: the test passes if Tasks 1 and 2 correctly thread the normalized state through the hook;
otherwise it fails at the public serialization boundary before Playground work begins.

- [ ] **Step 3: Align reducer actions only if the boundary test exposes a gap**

Keep `DashboardGridCommands<TData>` method names and parameters unchanged. Update reducer action handling only where needed so:

- `reset` and `restoreLayout` construct the entire normalized state from the supplied full or legacy input.
- `apply-layout-snapshot` delegates to the cache-aware helper from Task 2.
- `refresh` increments `refreshVersion` without rewriting cache objects.
- The memoized initial snapshot remains immutable and produces the same initial cache on every no-argument reset.

- [ ] **Step 4: Re-run state and hook-focused tests**

Run:

```bash
npm run test:run -- test/vitest/layout-state.test.ts test/vitest/use-dashboard-grid.test.tsx
npm run typecheck
```

Expected: all selected tests and typecheck pass.

- [ ] **Step 5: Commit the hook contract**

```bash
git add src/core/use-dashboard-grid.ts test/vitest/use-dashboard-grid.test.tsx
git commit -m "test: lock column snapshot hook behavior"
```

---

## Task 4: Split Documentation And Playground Routing Into Separate Shells

**Files:**

- Create: `example/src/docs/types.ts`
- Create: `example/src/docs/content.tsx`
- Create: `example/src/docs/DocsShell.tsx`
- Create: `example/src/playground/types.ts`
- Create: `example/src/playground/fixtures.ts`
- Create: `example/src/playground/PlaygroundShell.tsx`
- Create: `example/src/playground/components/DashboardPreview.tsx`
- Create: `example/src/playground/components/LayoutJson.tsx`
- Create: `example/src/playground/components/WidgetCrudControls.tsx`
- Create: `example/src/playground/WidgetPlayground.tsx`
- Create: `example/src/playground/LayoutPlayground.tsx`
- Create: `example/src/playground/AdvancedPlayground.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`

- [ ] **Step 1: Replace legacy-route assertions with failing shell assertions**

Update `docs-playground-routing.spec.ts` to verify:

- `/` resolves to `/examples/widget`.
- `/examples/crud` resolves to `/examples/widget`.
- `/examples/complete` resolves to `/examples/advanced`.
- `/examples/basic` resolves to `/docs/getting-started`.
- An unknown route resolves to `/examples/widget`.
- Example navigation contains exactly `위젯`, `레이아웃`, and `고급 예제` links.
- Each example route has one `.grid-stack`, no docs sidebar, and a visible top control region before the grid.
- `/docs/getting-started` and `/api` still render the docs shell and sidebar.

Assert layout order with element bounding boxes: the Grid top coordinate must be greater than the page header and controls bottom coordinates. Assert full-width behavior by comparing the Grid container width to the example main content width with a maximum 2px rounding difference.

- [ ] **Step 2: Run the focused Chromium routing test and confirm failure**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/docs-playground-routing.spec.ts --project=chromium
```

Expected: tests fail because legacy pages and the shared docs shell still render.

- [ ] **Step 3: Extract docs-only types and content without behavior changes**

Move these symbols out of `example/src/main.tsx`:

- `DocsCodeLanguage`, `DocsCodeSample`, `DocsExampleCase`, `DocsPage`, API entry types, `ApiFeatureSection`, and `DocsSearchItem` to `docs/types.ts`.
- Code samples, `apiFeatures`, `docsPages`, navigation grouping, search indexing, and search matching to `docs/content.tsx`.
- `ApiReference`, `DocsShell`, `DocsTopNav`, `GlobalDocsSearch`, `DocsSidebar`, `DocsArticle`, and `CodeExample` to `docs/DocsShell.tsx`.

Export only the route-level docs component and the content/search values it consumes. Preserve existing accessible labels, docs text, syntax highlighting, and search behavior.

- [ ] **Step 4: Create deterministic Playground fixtures and shared types**

In `playground/types.ts`, define and export `ExampleWidgetData` and `DashboardRuntime` from the package hook result.

In `playground/fixtures.ts`, export independent fixture factories so resets never reuse mutated object references. The layout fixture must start with these full rows at 12 columns:

```ts
[
  createWidget("sales", "Sales", 0, 0, 4, 2),
  createWidget("traffic", "Traffic", 4, 0, 8, 2),
  createWidget("orders", "Orders", 0, 2, 6, 2),
  createWidget("alerts", "Alerts", 6, 2, 6, 2),
]
```

Keep widget, layout, and advanced fixtures separate so actions on one route cannot leak into another route lifecycle.

- [ ] **Step 5: Create the dedicated Playground shell**

Implement `PlaygroundShell` with:

- A compact navigation landmark containing the three example links.
- A route outlet or explicit child slot.
- No docs sidebar or article wrapper.
- A route lifecycle key so changing example routes unmounts the previous state owner.
- Accessible current-page state on the active navigation link.

Add semantic wrapper classes to `styles.css`: `.playground-shell`, `.playground-nav`, `.playground-main`, `.playground-header`, `.playground-controls`, `.playground-workspace`, and `.playground-grid-region`. Use CSS grid/flex wrapping for controls and a single full-width row for the Grid. At narrow viewport widths, stack controls and external-drop content vertically with no horizontal overflow.

- [ ] **Step 6: Move shared controls without adding feature behavior**

Move the current reusable `DashboardPreview`, `LayoutJson`, dialog/select helpers, CRUD form state, and toolbar presentation into the planned component files. Keep shared components controlled through props; do not create a second dashboard hook inside them.

Create route components that initially render their fixture, heading, control container, and one `DashboardGrid`. Advanced controls may be inert only during this routing task; give them no false success status and do not commit unimplemented buttons.

- [ ] **Step 7: Replace top-level route composition**

Reduce `example/src/main.tsx` to root creation and explicit route selection:

- Docs/API paths render `DocsShell`.
- The three example paths render `PlaygroundShell` with the corresponding page.
- Compatibility paths update browser history with `replaceState` and render their target.
- Unknown paths replace to `/examples/widget`.

Keep `RouteLifecycleBoundary` behavior or move it into the shells so the previous Grid is destroyed before the next route mounts.

- [ ] **Step 8: Run routing, type, and build checks**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/docs-playground-routing.spec.ts --project=chromium
npm run typecheck
npm run build
```

Expected: the routing test, typecheck, and Vite/package build pass.

- [ ] **Step 9: Commit the shell split**

```bash
git add example/src test/playwright/specs/docs-playground-routing.spec.ts
git commit -m "refactor: split docs and playground shells"
```

---

## Task 5: Complete The Widget Playground In One Grid

**Files:**

- Modify: `example/src/playground/WidgetPlayground.tsx`
- Modify: `example/src/playground/components/WidgetCrudControls.tsx`
- Modify: `example/src/playground/components/DashboardPreview.tsx`
- Modify: `example/src/styles.css`
- Create: `test/playwright/specs/playground.spec.ts`

- [ ] **Step 1: Add failing Widget Playground browser tests**

In `playground.spec.ts`, create a `Widget Playground` describe block that verifies:

- The route renders one Grid and the fixture widgets.
- Add dialog fields `title`, `value`, `width`, and `height` create a visible widget and select it.
- Edit dialog changes the selected widget title/value and serialized state output.
- Delete selects the first remaining widget; clear disables selection and interaction controls.
- Move lock prevents an actual drag from changing `x/y`, while unlocking permits a geometry commit.
- Resize lock prevents an actual resize-handle drag from changing `w/h`, while unlocking permits a geometry commit.
- Full lock blocks both interactions and its pressed state matches `locked`.

Use `DashboardGrid` test IDs/ARIA names already exposed by the example where possible. For geometry, read `data-layout-x`, `data-layout-y`, `data-layout-w`, and `data-layout-h` before and after interaction; do not infer success from status text alone.

- [ ] **Step 2: Run the Widget Playground tests and confirm failure**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Widget Playground"
```

Expected: tests fail on missing CRUD editing and consolidated interaction controls.

- [ ] **Step 3: Implement controlled CRUD and selection**

In `WidgetPlayground`:

- Own one `useDashboardGrid<ExampleWidgetData>()` instance.
- Own `selectedWidgetId`, add/edit dialog state, and one polite status region.
- Generate deterministic IDs with the page-local sequence used by the current CRUD example.
- Call only `dashboard.commands.addWidget`, `updateWidget`, `removeWidget`, and `clearWidgets`.
- After delete, select `dashboard.widgets[0]?.id`; after clear, set selection to `undefined`.
- Keep title and value validation local to the dialog and leave state unchanged on cancel.

- [ ] **Step 4: Implement interaction controls against widget state**

Map controls to public widget properties:

- Move lock toggles `movable` while preserving `resizable`.
- Resize lock toggles `resizable` while preserving `movable`.
- Full lock toggles `locked` and reflects the actual package precedence.
- Disable controls when no selected widget exists.

Pass the current widgets, columns, commands, layout commit callback, and selection callback into the single `DashboardPreview` instance. Ensure selection clicks do not create nested buttons inside the widget header controls.

- [ ] **Step 5: Run the Widget Playground regression slice**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Widget Playground"
npm run typecheck
```

Expected: Widget Playground tests and typecheck pass.

- [ ] **Step 6: Commit the Widget Playground**

```bash
git add example/src/playground example/src/styles.css test/playwright/specs/playground.spec.ts
git commit -m "feat: consolidate widget playground controls"
```

---

## Task 6: Complete The Layout Playground And Explain Fill Semantics

**Files:**

- Modify: `example/src/playground/LayoutPlayground.tsx`
- Modify: `example/src/playground/components/LayoutJson.tsx`
- Modify: `example/src/playground/components/WidgetCrudControls.tsx`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/playground.spec.ts`

- [ ] **Step 1: Add failing Layout Playground browser tests**

Add a `Layout Playground` describe block that verifies:

- One Grid provides add/edit/delete/clear CRUD.
- Column selector accepts every value from 1 through 12 and updates the active column status.
- Active layout JSON save/restore affects only the active layout contract.
- Full state JSON save/restore displays and restores `layoutsByColumn`.
- Initial `fitWidgetsToColumns()` is a geometry no-op and status is `빈 공간이 없어 변경하지 않았습니다.`.
- Deleting `sales` creates a row gap; fill changes the remaining row geometry to cover all 12 columns; a second fill is a no-op.
- `autoArrangeWidgets()` changes a deliberately scattered fixture according to package order and reports a separate auto-arrange status.
- Invalid JSON preserves current geometry and displays an error without echoing the submitted JSON.
- Reset returns to the deterministic full-row fixture and the 12-column cache.

For fill assertions, sum row widths and inspect `x + w` coverage for widgets with the same `data-layout-y`; do not compare only a screenshot.

- [ ] **Step 2: Run the Layout Playground tests and confirm failure**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Layout Playground"
```

Expected: the new save/restore, full-state, fill-flow, and consolidated CRUD assertions fail.

- [ ] **Step 3: Implement one state owner and grouped controls**

Use a single `useDashboardGrid()` instance and group controls in this order:

1. Widget CRUD and selection.
2. Columns `1`–`12`.
3. Active layout save/restore JSON.
4. Full state and column caches save/restore JSON.
5. Auto arrange, fill gaps, and reset.

Keep two distinct JSON buffers so restoring the active layout never silently replaces inactive column caches. Serialize into stable two-space-indented JSON for inspection.

- [ ] **Step 4: Implement snapshot-based operation status**

Before auto-arrange or fill, capture `JSON.stringify(dashboard.commands.serializeLayout())`; execute the command; observe the next committed active snapshot through state/effect comparison; then report whether geometry changed.

Use these exact fill outcomes:

- No change: `빈 공간이 없어 변경하지 않았습니다.`
- Changed: `행의 빈 공간을 채웠습니다.`

Describe directly in the page that auto-arrange performs package-order vertical placement while fill only redistributes horizontal gaps within the same `y` row.

- [ ] **Step 5: Implement safe JSON restore handling**

- Parse inside the user action handler.
- Call `applyLayoutSnapshot()` for active layout JSON.
- Call `restoreLayout()` for full state JSON.
- On parse/normalization failure, retain the previous dashboard and editor buffer, show a generic localized error, and do not copy raw input into the status region, console, or exception text.

- [ ] **Step 6: Run the Layout Playground regression slice**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Layout Playground"
npm run test:run -- test/vitest/layout-state.test.ts
npm run typecheck
```

Expected: browser, unit, and type checks pass.

- [ ] **Step 7: Commit the Layout Playground**

```bash
git add example/src/playground example/src/styles.css test/playwright/specs/playground.spec.ts
git commit -m "feat: add consolidated layout playground"
```

---

## Task 7: Add The Supported Advanced GridStack Examples

**Files:**

- Modify: `example/src/playground/AdvancedPlayground.tsx`
- Modify: `example/src/playground/fixtures.ts`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/playground.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

- [ ] **Step 1: Add failing Advanced Playground browser tests**

Add an `Advanced Playground` describe block that verifies:

- The 300x300 delete target uses the configured external target and deletes only after a target drop callback.
- A drag ending outside the target does not delete and does not emit a target success status.
- A modified 12-column geometry survives `12 -> 6 -> 12`, and the independently modified 6-column geometry survives the next return to 6.
- Serialized state visibly contains cache keys `"6"` and `"12"`, and restoring that JSON reproduces both.
- Responsive toggle and viewport resizing update the active column status through `onColumnsChange` and reuse the same cache keys as manual selection.
- Compact and list controls call the existing public handle, then controlled layout commit updates React state.
- Float toggle changes `getFloat()` output while controlled layout callbacks remain active.
- Read-only status displays `getColumn()`, `getRow()`, and `getFloat()` after Grid initialization.
- No raw GridStack add, remove, or destroy control is rendered.

- [ ] **Step 2: Run the Advanced Playground tests and confirm failure**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Advanced Playground"
```

Expected: cache, responsive, compact/list, float, and query assertions fail until the advanced controls are wired.

- [ ] **Step 3: Implement typed external drop with consumer-owned deletion**

Configure:

```ts
const externalDropTargets = [{ id: "trash", selector: "[data-dashboard-drop-target='trash']" }];
```

Render the target above the Grid with a fixed desktop size of 300x300 and responsive max width. In `onWidgetExternalDrop`, call `removeWidget(event.widgetId)` only when `event.targetId === "trash"`, and render the typed event result in the status region. Keep the Grid interaction callback as the sole source of target-drop truth.

- [ ] **Step 4: Implement column persistence and responsive controls**

- Provide manual 6/12 column controls for the observable round-trip.
- Show `serializeState().layoutsByColumn` in an inspect/restore editor.
- Toggle a fixed public `responsive` configuration whose breakpoints resolve to supported column counts.
- Wire `onColumnsChange={dashboard.commands.setColumns}` so GridStack breakpoint changes enter the same reducer transition as manual column changes.
- Display active columns and available cache keys after every manual or responsive transition.
- Do not maintain a page-local geometry cache; all geometry must come from `useDashboardGrid()` state.

- [ ] **Step 5: Implement safe public-handle demonstrations**

Hold a `DashboardGridHandle | null` ref and expose only:

- `compact("compact", true)` followed by `commitLayout()`.
- `compact("list", true)` followed by `commitLayout()`.
- Read-only `getGridStack().getColumn()`, `getRow()`, and `getFloat()` results.

If the ref is unavailable, show `GridStack이 아직 준비되지 않았습니다.`. Do not call raw engine CRUD or `destroy()`.

For float, update the controlled `engineOptions.float` value and refresh the displayed `getFloat()` result after reconfiguration. Verify that layout commits still flow through `onLayoutCommit={dashboard.commands.applyLayoutSnapshot}`.

- [ ] **Step 6: Extend existing external-drop regression coverage**

Update the existing external-drop section in `dashboard-grid.spec.ts` to use `/examples/advanced` instead of `/examples/complete`, preserving desktop, mobile, boundary, and callback assertions. Do not duplicate the full resource-stability suite in `playground.spec.ts`.

- [ ] **Step 7: Run the Advanced Playground and affected adapter slice**

Run:

```bash
npx playwright test --config=playwright.config.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "Advanced Playground"
npx playwright test --config=playwright.config.ts test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "external drop|compact|responsive"
npm run typecheck
```

Expected: all selected tests and typecheck pass.

- [ ] **Step 8: Commit the Advanced Playground**

```bash
git add example/src/playground example/src/styles.css test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts
git commit -m "feat: add advanced gridstack playground"
```

---

## Task 8: Update Documentation And Migrate Existing Browser Entry Points

**Files:**

- Modify: `README.md`
- Modify: `docs/03-component-api-draft.md`
- Modify: `docs/05-open-questions.md`
- Modify: `example/src/docs/content.tsx`
- Modify: `test/vitest/readme.test.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/example.spec.ts`
- Modify: `test/playwright/specs/visual-typography.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`

- [ ] **Step 1: Add failing documentation contract assertions**

Extend `readme.test.ts` and docs routing assertions to require:

- `DashboardColumnLayoutSnapshot`, `DashboardLayoutsByColumn`, and `layoutsByColumn` in the state persistence reference.
- A legacy restore example where `layoutsByColumn` is absent.
- Explicit distinction between `serializeLayout()` active-only output and `serializeState()` full cache output.
- The three current Playground links and no links that present `/examples/crud` or `/examples/complete` as current pages.
- Advanced documentation that identifies `getGridStack()` as an escape hatch and keeps raw GridStack mutations outside the controlled example contract.

- [ ] **Step 2: Run docs-focused tests and confirm failure**

Run:

```bash
npm run test:run -- test/vitest/readme.test.ts
npx playwright test --config=playwright.config.ts test/playwright/specs/docs-playground-routing.spec.ts --project=chromium
```

Expected: new column-cache and route-copy assertions fail before documentation is updated.

- [ ] **Step 3: Update public API documentation**

Document in README, API draft, and live API docs:

- The exact new types and optional legacy input member.
- Active top-level state authority when active cache input conflicts.
- Cache behavior for column transitions, CRUD, layout-only mutations, and maximize/minimize restore.
- A `12 -> 6 -> 12` save/restore example using `commands.serializeState()` and `commands.restoreLayout()`.
- `serializeLayout()` as active-only and unchanged.
- Supported `DashboardGridHandle` methods and the controlled-state warning for `getGridStack()`.

Remove the resolved per-column persistence question from `docs/05-open-questions.md` and replace it with a dated decision summary only if that file's existing structure keeps resolved decisions there; otherwise delete the resolved entry.

- [ ] **Step 4: Update docs example navigation and search data**

Replace legacy example labels and snippets in `docs/content.tsx` with links to Widget, Layout, and Advanced. Keep `/examples/basic`, `/examples/crud`, and `/examples/complete` only in compatibility redirect tests, not in the current navigation or search result set.

- [ ] **Step 5: Migrate all browser tests to explicit routes**

Replace root-route assumptions according to intent:

- Generic drag/resize/lock/widget lifecycle scenarios use `/examples/widget`.
- Column, state persistence, arrange, fill, and 100-widget harness scenarios use `/examples/layout` unless their existing test-only query fixture requires `/examples/advanced`.
- External drop, responsive, compact/list, float, and handle-query scenarios use `/examples/advanced`.
- Typography checks visit all three example routes plus docs/API routes.

Keep one redirect assertion for `/`; do not let feature tests depend on the redirect. Preserve all existing browser project annotations and skip conditions.

- [ ] **Step 6: Run docs and complete Chromium Playground coverage**

Run:

```bash
npm run test:run -- test/vitest/readme.test.ts
npx playwright test --config=playwright.config.ts test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground.spec.ts test/playwright/specs/example.spec.ts test/playwright/specs/visual-typography.spec.ts --project=chromium
```

Expected: all selected tests pass with no console errors or unhandled rejections.

- [ ] **Step 7: Commit docs and route migrations**

```bash
git add README.md docs example/src/docs test/vitest/readme.test.ts test/playwright/specs
git commit -m "docs: document column layout persistence"
```

---

## Task 9: Run Full Regression Gates And Record The Managed Report

**Files:**

- Create or modify: `reports/2026-08-03.md`
- Modify only if a reproducible regression is found: files already listed in Tasks 1–8

- [ ] **Step 1: Review the complete diff for scope and generated noise**

Run:

```bash
git status --short
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
```

Expected: only approved runtime state, Playground, docs, tests, and the managed report scope appears; whitespace check exits with code 0.

- [ ] **Step 2: Run the package baseline**

Run:

```bash
npm run verify
```

Expected: security tests, license checks, typecheck, all Vitest tests, and build pass.

- [ ] **Step 3: Run the consumer and package artifact contracts**

Run:

```bash
npm run test:consumer
npm run verify:package-artifact
```

Expected: a clean consumer can import the built public API and the packed artifact passes identity, file, license, privacy, and forbidden-content gates.

`verify:package-artifact` creates `comins-grid-layout-0.1.6.tgz` in the repository root. Confirm
that exact generated file is untracked, then remove only that file before continuing so the
verification artifact is not included in the branch.

- [ ] **Step 4: Run the full browser-visible gate once**

Run:

```bash
npm run verify:full
```

Expected: baseline checks and all configured Playwright projects pass, including Chromium, Firefox, Playwright WebKit, mobile/touch coverage, lifecycle checks, external drop, and the 100-widget repeated-column resource-stability test.

If the 100-widget test fails, inspect its resource counters, trace, and repeated-run behavior before changing thresholds. Classify the failure as product behavior, test contract, or execution environment and fix only a reproducible cause. Re-run the smallest failing project first, then run `npm run verify:full` one final time after a meaningful code or contract correction.

- [ ] **Step 5: Manually inspect the three workspaces at desktop and mobile widths**

Run the local Playground:

```bash
npm run dev
```

Inspect `/examples/widget`, `/examples/layout`, and `/examples/advanced` at a desktop viewport and a Galaxy-class narrow viewport. Confirm:

- Controls remain above a readable full-width Grid.
- No horizontal page overflow occurs.
- The 300x300 target scales within the mobile viewport.
- Dialogs, selects, lock buttons, and status regions remain operable.
- Route changes unmount the previous Grid without console errors.

Stop the dev process after inspection.

- [ ] **Step 6: Write the managed work report**

Record in `reports/2026-08-03.md`:

- Work date and approved design document.
- Summary of the public cache contract and three-page Playground.
- Changed files grouped by runtime, example, docs, and tests.
- Every command actually run and its result.
- Browser projects completed and any skipped scenario with its reason.
- Residual risks, including the distinction between Playwright WebKit evidence and branded Safari certification.
- Confirmation that package version, npm publication, remote push, PR, tag, and Release were not performed.

- [ ] **Step 7: Validate and commit the report**

Run:

```bash
git diff --check
git status --short
```

Then commit:

```bash
git add reports/2026-08-03.md
git commit -m "docs: record playground verification"
```

- [ ] **Step 8: Report the local branch outcome and stop at the remote boundary**

Report:

- Final branch name and HEAD SHA.
- Focused and full verification totals.
- Any unavailable or skipped gate.
- Residual risks.
- Exact local report and implementation-plan links.

Do not push, open a pull request, merge, version, tag, or publish until MS님 separately approves that remote stage.

---

## Final Acceptance Checklist

- [ ] The examples navigation contains exactly Widget, Layout, and Advanced.
- [ ] Every example route renders one full-width Grid below its explanation and controls.
- [ ] Widget and Layout both expose complete widget CRUD.
- [ ] Move, resize, and full locks match actual interactions.
- [ ] Initial full-row fill is a no-op, a real row gap is filled, and the second fill is a no-op.
- [ ] `12 -> 6 -> 12` and responsive transitions restore independent geometry.
- [ ] Legacy state input restores without `layoutsByColumn`.
- [ ] Full state serialization round-trips all valid column caches and restore maps.
- [ ] External drop deletes only through the typed configured target callback.
- [ ] Compact/list, float, and read-only engine queries use supported public surfaces.
- [ ] Existing CRUD, drag, resize, maximize/minimize/restore, lifecycle, touch, and resource-stability behavior passes.
- [ ] README, API docs, live docs, and type tests describe the implemented contract consistently.
- [ ] No dependency, package version, release, or remote state changed.
