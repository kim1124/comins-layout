# GridStack Handle And Mobile Touch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backward-compatible `DashboardGridHandle` escape hatch, deterministic layout-commit deduplication, an English consumer fixture, and focused mobile touch drag/resize coverage for the `0.1.4` release line.

**Architecture:** Keep serializable Comins state and CRUD commands as the primary React contract. Forward a ref from `DashboardGrid` to the existing package-owned adapter, expose the borrowed GridStack instance only through that handle, and use one English example fixture with guaranteed empty cells for both advanced-API and touch verification. Current touch diagnostics proved GridStack resize and drag initiation work; no speculative touch adapter patch is included.

**Tech Stack:** React 18/19, TypeScript 6, GridStack 12.6, Vite 8, Vitest 4, Playwright 1.61, Chromium DevTools Protocol.

## Global Constraints

- Adopt Comins Contract v1.2 and keep direct GridStack initialization, listeners, synchronization, and destruction inside `src/gridstack`.
- Preserve all existing props, command signatures, widget IDs, CSS exports, peer dependency ranges, and SSR client-boundary behavior.
- Export `DashboardGridHandle` with exactly `getGridStack(): GridStack | null`, `refresh(): void`, and `commitLayout(): DashboardLayoutSnapshot | null`.
- `getGridStack()` returns a borrowed live instance; consumers do not own `destroy()` or listener cleanup.
- Suppress duplicate React-facing layout callbacks when GridStack already emitted the same geometry.
- Use existing dependencies only. Do not add a component-test DOM environment or another touch library.
- Test touch against a fixture with intentional free cells; do not infer drag failure from a fully occupied compacting layout.
- Do not implement keyboard move or resize.
- Do not change package version, README, workflows, provider settings, npm metadata, or remote state in this plan.
- Never print or retain personal identities, detector matches, fingerprints, local account paths, or raw scanner output.

---

## File Map

- Modify `src/gridstack/adapter.ts`: return snapshots from commits and suppress duplicate geometry notifications.
- Modify `src/components/DashboardGrid.tsx`: forward the public handle to the live adapter.
- Modify `test/vitest/adapter.test.ts`: verify exact snapshot equality semantics used by commit deduplication.
- Create `test/vitest/dashboard-grid-handle.test.tsx`: compile and exercise the public generic ref type without a DOM test dependency.
- Create `example/src/readme-demo.tsx`: English consumer-only fixture and value-free browser bridge for advanced API verification.
- Modify `example/src/main.tsx`: route `/readme-demo` to the standalone fixture without changing existing documentation routes.
- Modify `example/src/styles.css`: scope the standalone demo layout under `.readme-demo`.
- Create `test/playwright/touch-gesture.ts`: one Chromium CDP touch gesture helper shared by focused tests and later GIF capture work.
- Modify `test/playwright/specs/dashboard-grid.spec.ts`: verify handle lifecycle, deduplicated commit, touch drag, touch resize, and touch after a runtime column change.
- Modify `reports/2026-07-22.md`: append executed behavior/API evidence and residual boundaries.

---

### Task 1: Add Deterministic Adapter Commit Semantics

**Files:**

- Modify: `test/vitest/adapter.test.ts`
- Modify: `src/gridstack/adapter.ts`

**Interfaces:**

- Consumes: `DashboardLayoutSnapshot`, existing `readDashboardLayoutSnapshot()`, existing adapter callbacks.
- Produces: `sameDashboardLayoutSnapshot(left, right): boolean` and `DashboardGridAdapter.commit(): DashboardLayoutSnapshot`.

- [ ] **Step 1: Write the failing snapshot-equality tests**

Append these imports and cases to `test/vitest/adapter.test.ts`:

```ts
import { findWidgetElementById, sameDashboardLayoutSnapshot } from "../../src/gridstack/adapter";

describe("sameDashboardLayoutSnapshot", () => {
  const baseline = {
    columns: 6 as const,
    widgets: [
      { id: "sales", x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 4 },
      { id: "orders", x: 4, y: 0, w: 2, h: 2 },
    ],
  };

  it("accepts independently allocated and reordered snapshots with identical geometry", () => {
    expect(sameDashboardLayoutSnapshot(baseline, structuredClone(baseline))).toBe(true);
    expect(sameDashboardLayoutSnapshot(baseline, { ...baseline, widgets: [...baseline.widgets].reverse() })).toBe(true);
  });

  it("rejects column, geometry, and constraint changes", () => {
    expect(sameDashboardLayoutSnapshot(baseline, { ...baseline, columns: 8 })).toBe(false);
    expect(
      sameDashboardLayoutSnapshot(baseline, {
        ...baseline,
        widgets: [{ ...baseline.widgets[0]!, x: 1 }, baseline.widgets[1]!],
      }),
    ).toBe(false);
    expect(
      sameDashboardLayoutSnapshot(baseline, {
        ...baseline,
        widgets: [{ ...baseline.widgets[0]!, maxW: 5 }, baseline.widgets[1]!],
      }),
    ).toBe(false);
  });
});
```

Replace the existing single-function import instead of leaving two imports from the same module.

- [ ] **Step 2: Run the focused test and verify the red state**

Run:

```bash
npx vitest run test/vitest/adapter.test.ts
```

Expected: FAIL because `sameDashboardLayoutSnapshot` is not exported.

- [ ] **Step 3: Add equality and commit support to the adapter**

Extend `DashboardGridAdapter` in `src/gridstack/adapter.ts`:

```ts
export type DashboardGridAdapter<TData = unknown> = {
  grid: GridStack;
  sync: (options: DashboardGridAdapterOptions<TData>) => void;
  refresh: () => void;
  compact: () => void;
  commit: () => DashboardLayoutSnapshot;
  destroy: () => void;
};
```

Add this helper immediately before `createDashboardGridAdapter()`:

```ts
const layoutFields = ["id", "x", "y", "w", "h", "minW", "minH", "maxW", "maxH"] as const;

export function sameDashboardLayoutSnapshot(
  left: DashboardLayoutSnapshot | undefined,
  right: DashboardLayoutSnapshot | undefined,
) {
  if (!left || !right || left.columns !== right.columns || left.widgets.length !== right.widgets.length) {
    return false;
  }

  const rightById = new Map(right.widgets.map((widget) => [widget.id, widget]));
  return left.widgets.every((widget) => {
    const candidate = rightById.get(widget.id);
    return Boolean(candidate && layoutFields.every((field) => widget[field] === candidate[field]));
  });
}
```

Inside `createDashboardGridAdapter()`, replace the existing `commitLayout` closure with:

```ts
let lastCommittedLayout: DashboardLayoutSnapshot | undefined;

const commitLayout = () => {
  const snapshot = readDashboardLayoutSnapshot(grid, currentOptions.columns ?? 12);
  if (sameDashboardLayoutSnapshot(lastCommittedLayout, snapshot)) {
    return snapshot;
  }

  lastCommittedLayout = snapshot;
  snapshot.widgets.forEach((layout) => currentOptions.onWidgetLayoutChange?.(layout.id, layout));
  currentOptions.onLayoutCommit?.(snapshot);
  return snapshot;
};
```

Add `commit: commitLayout` to the adapter object. Keep `compact()` calling `commitLayout()` so an engine method that already emitted `change` is deduplicated by the same path.

- [ ] **Step 4: Run focused and baseline tests**

Run:

```bash
npx vitest run test/vitest/adapter.test.ts
npm run typecheck
```

Expected: the adapter test passes and TypeScript reports no errors.

- [ ] **Step 5: Commit the adapter contract**

```bash
git add src/gridstack/adapter.ts test/vitest/adapter.test.ts
git diff --cached --check
git commit -m "feat: add deterministic grid layout commits"
```

---

### Task 2: Expose `DashboardGridHandle` Without Breaking Generic Props

**Files:**

- Create: `test/vitest/dashboard-grid-handle.test.tsx`
- Modify: `src/components/DashboardGrid.tsx`

**Interfaces:**

- Consumes: `DashboardGridAdapter.commit()` from Task 1.
- Produces: public `DashboardGridHandle` and a generic ref-forwarding `DashboardGrid` component.

- [ ] **Step 1: Write the failing public type fixture**

Create `test/vitest/dashboard-grid-handle.test.tsx`:

```tsx
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  DashboardGrid,
  type DashboardGridHandle,
  type DashboardWidget,
} from "../../src";

type MetricData = { value: number };

const widgets: DashboardWidget<MetricData>[] = [
  {
    id: "metric",
    title: "Metric",
    layout: { id: "metric", x: 0, y: 0, w: 2, h: 2 },
    data: { value: 42 },
  },
];

describe("DashboardGridHandle", () => {
  it("preserves generic widget inference while accepting a public ref", () => {
    const ref = createRef<DashboardGridHandle>();
    const element = (
      <DashboardGrid<MetricData>
        ref={ref}
        widgets={widgets}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );

    expect(element.type).toBe(DashboardGrid);
    expect(ref.current).toBeNull();
  });
});
```

- [ ] **Step 2: Run the typecheck and verify the red state**

Run:

```bash
npm run typecheck
```

Expected: FAIL because `DashboardGridHandle` and the `ref` prop are not public.

- [ ] **Step 3: Convert `DashboardGrid` to a generic ref-forwarding component**

Change the React imports in `src/components/DashboardGrid.tsx` to include `forwardRef` and `useImperativeHandle`, and add these type imports:

```ts
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ForwardedRef, ReactElement, ReactNode, RefAttributes } from "react";
import type { GridStack } from "gridstack";
```

Add the handle next to `DashboardGridProps`:

```ts
export interface DashboardGridHandle {
  getGridStack(): GridStack | null;
  refresh(): void;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

Rename the current function implementation to `DashboardGridInner`, accept the forwarded ref, and use the current prop destructuring unchanged:

```ts
function DashboardGridInner<TData = unknown>(
  props: DashboardGridProps<TData>,
  ref: ForwardedRef<DashboardGridHandle>,
): ReactElement {
  const {
    widgets,
    columns = 12,
    editable = true,
    movable = true,
    resizable = true,
    className,
    refreshKey,
    showControls = true,
    actionLabels,
    renderWidget,
    onLayoutCommit,
    onWidgetLayoutChange,
    onWidgetResizeFrame,
    onMaximizeWidget,
    onMinimizeWidget,
    onRestoreWidget,
    onRemoveWidget,
    onWidgetHeaderDoubleClick,
  } = props;
}
```

Move the current implementation lines beginning with the first component ref declaration and ending with the JSX return into `DashboardGridInner` immediately after that destructuring. Do not change their order or behavior in this step other than the adapter-ref cleanup and imperative-handle insertion specified below.

Immediately after `adapterRef` is created, expose the stable handle:

```ts
useImperativeHandle(
  ref,
  () => ({
    getGridStack: () => adapterRef.current?.grid ?? null,
    refresh: () => adapterRef.current?.refresh(),
    commitLayout: () => adapterRef.current?.commit() ?? null,
  }),
  [],
);
```

In the mount cleanup, clear the matching adapter ref before destruction:

```ts
if (adapterRef.current === adapter) {
  adapterRef.current = undefined;
}
adapter?.destroy();
```

Remove the later unconditional `adapterRef.current = undefined`, then create and name the forwarded component before applying the generic public assertion:

```ts
const ForwardedDashboardGrid = forwardRef(DashboardGridInner);
ForwardedDashboardGrid.displayName = "DashboardGrid";

export const DashboardGrid = ForwardedDashboardGrid as <TData = unknown>(
  props: DashboardGridProps<TData> & RefAttributes<DashboardGridHandle>,
) => ReactElement | null;
```

- [ ] **Step 4: Run type and unit verification**

Run:

```bash
npm run typecheck
npx vitest run test/vitest/dashboard-grid-handle.test.tsx test/vitest/adapter.test.ts
npm run build
```

Expected: all commands pass and `dist/components/DashboardGrid.d.ts` contains `DashboardGridHandle` plus `RefAttributes<DashboardGridHandle>`.

- [ ] **Step 5: Commit the public handle**

```bash
git add src/components/DashboardGrid.tsx test/vitest/dashboard-grid-handle.test.tsx
git diff --cached --check
git commit -m "feat: expose the GridStack instance through a grid handle"
```

---

### Task 3: Add The Standalone English Consumer Fixture

**Files:**

- Create: `example/src/readme-demo.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**

- Consumes: `DashboardGridHandle` from Task 2 and existing `useDashboardGrid()` commands.
- Produces: `/readme-demo`, deterministic `overview` and `orders` widgets, and `window.__cominsReadmeDemo` for value-free browser assertions.

- [ ] **Step 1: Add a failing route and advanced-handle browser test**

Append this desktop-only test to `test/playwright/specs/dashboard-grid.spec.ts`:

```ts
test("exposes a live GridStack handle and deduplicates explicit layout commits", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Advanced handle lifecycle is covered once on desktop Chromium.");

  await page.goto("/readme-demo");
  await expect(page.getByRole("heading", { name: "Interactive dashboards for React" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);
  await page.evaluate(() => window.__cominsReadmeDemo?.refresh());
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);

  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());
  const snapshot = await page.evaluate(() => window.__cominsReadmeDemo?.moveWithGridStack("overview", 2, 0));

  expect(snapshot?.widgets.find((widget) => widget.id === "overview")?.x).toBe(2);
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("data-layout-x", "2");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);

  await page.evaluate(() => {
    window.__retainedCominsGridHandle = window.__cominsReadmeDemo?.getHandle();
    history.pushState({}, "", "/api");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "1. Dashboard 렌더링" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__retainedCominsGridHandle?.getGridStack()?.getColumn() ?? null))
    .toBeNull();
});
```

Extend the existing `Window` declaration in `example/src/main.tsx` temporarily or add it in the new fixture exactly as shown in Step 3 so TypeScript recognizes both bridge properties.

- [ ] **Step 2: Run the focused browser test and verify the red state**

Run:

```bash
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "live GridStack handle"
```

Expected: FAIL because `/readme-demo` and the browser bridge do not exist.

- [ ] **Step 3: Create the complete consumer fixture**

Create `example/src/readme-demo.tsx` with this implementation:

```tsx
import { useEffect, useRef } from "react";
import {
  DashboardGrid,
  useDashboardGrid,
  type DashboardGridHandle,
  type DashboardLayoutSnapshot,
  type DashboardWidget,
} from "../../src";

type DemoData = { label: string; value: string };

type ReadmeDemoBridge = {
  getColumn: () => number | null;
  getCommitCount: () => number;
  getHandle: () => DashboardGridHandle | null;
  resetCommitCount: () => void;
  refresh: () => void;
  moveWithGridStack: (id: string, x: number, y: number) => DashboardLayoutSnapshot | null;
};

declare global {
  interface Window {
    __cominsReadmeDemo?: ReadmeDemoBridge;
    __retainedCominsGridHandle?: DashboardGridHandle | null;
  }
}

const initialWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "overview",
    title: "Overview",
    layout: { id: "overview", x: 0, y: 0, w: 2, h: 2 },
    data: { label: "Monthly revenue", value: "$128K" },
  },
  {
    id: "orders",
    title: "Orders",
    layout: { id: "orders", x: 4, y: 0, w: 2, h: 2 },
    data: { label: "Completed orders", value: "1,284" },
  },
];

export function ReadmeDemoPage() {
  const dashboard = useDashboardGrid<DemoData>({ initialColumns: 6, initialWidgets });
  const gridRef = useRef<DashboardGridHandle>(null);
  const commitCountRef = useRef(0);

  useEffect(() => {
    const bridge: ReadmeDemoBridge = {
      getColumn: () => gridRef.current?.getGridStack()?.getColumn() ?? null,
      getCommitCount: () => commitCountRef.current,
      getHandle: () => gridRef.current,
      resetCommitCount: () => {
        commitCountRef.current = 0;
      },
      refresh: () => gridRef.current?.refresh(),
      moveWithGridStack: (id, x, y) => {
        const grid = gridRef.current?.getGridStack();
        const item = grid?.getGridItems().find((candidate) => candidate.getAttribute("gs-id") === id);
        if (!grid || !item) {
          return null;
        }
        grid.update(item, { x, y });
        return gridRef.current?.commitLayout() ?? null;
      },
    };
    window.__cominsReadmeDemo = bridge;
    return () => {
      if (window.__cominsReadmeDemo === bridge) {
        delete window.__cominsReadmeDemo;
      }
    };
  }, []);

  const addWidget = () => {
    if (dashboard.widgets.some((widget) => widget.id === "new-widget")) {
      return;
    }
    dashboard.commands.addWidget({
      id: "new-widget",
      title: "New widget",
      layout: { id: "new-widget", x: 0, y: 2, w: 2, h: 2 },
      data: { label: "Conversion rate", value: "8.4%" },
    });
  };

  return (
    <main className="readme-demo">
      <header className="readme-demo__hero">
        <div>
          <p>comins-grid-layout</p>
          <h1>Interactive dashboards for React</h1>
        </div>
        <div className="readme-demo__toolbar">
          <label>
            Columns
            <select
              aria-label="Columns"
              value={dashboard.columns}
              onChange={(event) => dashboard.commands.setColumns(Number(event.target.value))}
            >
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </label>
          <button type="button" onClick={addWidget}>Add widget</button>
        </div>
      </header>

      <p className="readme-demo__count">{dashboard.widgets.length} widgets</p>
      <DashboardGrid
        ref={gridRef}
        columns={dashboard.columns}
        refreshKey={dashboard.refreshVersion}
        widgets={dashboard.widgets}
        actionLabels={{ maximize: "Maximize", minimize: "Minimize", restore: "Restore", remove: "Remove" }}
        onLayoutCommit={() => {
          commitCountRef.current += 1;
        }}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
        renderWidget={(widget) => (
          <div className="readme-demo__metric">
            <span>{widget.data?.label}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
    </main>
  );
}
```

- [ ] **Step 4: Route the standalone fixture**

Import `ReadmeDemoPage` in `example/src/main.tsx`:

```ts
import { ReadmeDemoPage } from "./readme-demo";
```

Add this component immediately before the root render:

```tsx
function ExampleApp() {
  const location = useLocation();
  return location.pathname === "/readme-demo" ? <ReadmeDemoPage /> : <DocsShell />;
}
```

Replace `<DocsShell />` inside `<BrowserRouter>` with `<ExampleApp />`. Existing routes and redirects remain unchanged.

- [ ] **Step 5: Add scoped fixture styling**

Append to `example/src/styles.css`:

```css
.readme-demo {
  background: #f4faf8;
  box-sizing: border-box;
  color: #172026;
  margin: 0 auto;
  min-height: 100vh;
  padding: 24px;
  width: min(960px, 100%);
}

.readme-demo__hero,
.readme-demo__toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.readme-demo__hero p,
.readme-demo__count {
  color: #537064;
  margin: 0 0 6px;
}

.readme-demo__hero h1 {
  font-size: 24px;
  margin: 0;
}

.readme-demo__toolbar label {
  align-items: center;
  display: flex;
  gap: 6px;
}

.readme-demo__toolbar button,
.readme-demo__toolbar select {
  border: 1px solid #abd8c9;
  border-radius: 6px;
  font: inherit;
  min-height: 34px;
  padding: 0 12px;
}

.readme-demo__toolbar button {
  background: #08795f;
  color: #fff;
  cursor: pointer;
}

.readme-demo__count {
  margin-top: 18px;
}

.readme-demo__metric {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  padding: 16px;
}

.readme-demo__metric strong {
  font-size: 24px;
}

@media (max-width: 640px) {
  .readme-demo {
    padding: 12px;
  }

  .readme-demo__hero {
    align-items: stretch;
    flex-direction: column;
  }
}
```

- [ ] **Step 6: Run the focused route and handle test**

Run:

```bash
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "live GridStack handle"
npm run typecheck
```

Expected: the route renders, raw `grid.update()` moves `overview` to column 2, `commitLayout()` does not duplicate the callback, the retained handle returns `null` after SPA unmount, and typecheck passes.

- [ ] **Step 7: Commit the consumer fixture**

```bash
git add example/src/readme-demo.tsx example/src/main.tsx example/src/styles.css test/playwright/specs/dashboard-grid.spec.ts
git diff --cached --check
git commit -m "test: add an English GridStack consumer fixture"
```

---

### Task 4: Prove Mobile Touch Drag, Resize, And Column-Change Behavior

**Files:**

- Create: `test/playwright/touch-gesture.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**

- Consumes: `/readme-demo` from Task 3 and Playwright `Page`/`Locator`.
- Produces: `performTouchGesture(page, target, delta, steps)` and focused mobile touch acceptance tests.

- [ ] **Step 1: Create the CDP touch helper**

Create `test/playwright/touch-gesture.ts`:

```ts
import type { Locator, Page } from "@playwright/test";

export async function performTouchGesture(
  page: Page,
  target: Locator,
  delta: { x: number; y: number },
  steps = 12,
) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) {
    throw new Error("Touch target bounding box is unavailable");
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ id: 1, x: startX, y: startY, radiusX: 8, radiusY: 8, force: 1 }],
    });

    for (let step = 1; step <= steps; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          id: 1,
          x: startX + (delta.x * step) / steps,
          y: startY + (delta.y * step) / steps,
          radiusX: 8,
          radiusY: 8,
          force: 1,
        }],
      });
      await page.waitForTimeout(16);
    }

    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await session.detach();
  }
}
```

- [ ] **Step 2: Add the mobile touch tests**

Import the helper in `test/playwright/specs/dashboard-grid.spec.ts` and append:

```ts
import { performTouchGesture } from "../touch-gesture";

test("moves a widget with touch after a runtime column change", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch interaction is verified in the mobile project only.");

  await page.goto("/readme-demo");
  await page.getByLabel("Columns").selectOption("8");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "8");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

  const widget = page.getByTestId("dashboard-widget-overview");
  const title = widget.locator(".comins-grid-layout-widget__title");
  await performTouchGesture(page, title, { x: 96, y: 0 });

  await expect(widget).toHaveAttribute("data-layout-x", "2");
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect(widget).toHaveAttribute("data-layout-x", "2");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
});

test("resizes a widget with touch and commits the controlled layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch interaction is verified in the mobile project only.");

  await page.goto("/readme-demo");
  const widget = page.getByTestId("dashboard-widget-overview");
  const handle = widget.locator(".ui-resizable-se");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

  await performTouchGesture(page, handle, { x: 72, y: 104 }, 1);

  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
});
```

The one-step resize is intentional: it is a valid real touch gesture and avoids CDP losing the moving resize-handle target while the handle itself changes position. The drag test remains a 12-frame gesture.

- [ ] **Step 3: Run the focused mobile tests**

Run:

```bash
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=mobile-chrome --grep "with touch"
```

Expected: 2 tests pass. The drag ends at `x=2`, resize ends at `w=3,h=3`, and both controlled layout changes survive the React rerender.

If either test fails, stop and use `superpowers:systematic-debugging`; do not add `touch-action`, pointer listeners, timeouts, or adapter fallbacks without a reproduced product root cause. The planning diagnostic already proved the fully occupied complete fixture was unsuitable for position assertions.

- [ ] **Step 4: Run desktop interaction regression coverage**

Run:

```bash
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "drag|resize|boundary|GridStack handle"
```

Expected: all selected desktop interaction and handle tests pass.

- [ ] **Step 5: Commit mobile touch coverage**

```bash
git add test/playwright/touch-gesture.ts test/playwright/specs/dashboard-grid.spec.ts
git diff --cached --check
git commit -m "test: verify mobile touch drag and resize"
```

---

### Task 5: Run The Full Runtime Gate And Record Evidence

**Files:**

- Modify: `reports/2026-07-22.md`

**Interfaces:**

- Consumes: Tasks 1-4.
- Produces: a verified runtime/API checkpoint for the README and release plans.

- [ ] **Step 1: Run focused source verification**

```bash
npm run test:security
npm run typecheck
npx vitest run test/vitest/adapter.test.ts test/vitest/dashboard-grid-handle.test.tsx
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "GridStack handle"
npx playwright test test/playwright/specs/dashboard-grid.spec.ts --project=mobile-chrome --grep "with touch"
```

Expected: all commands pass with no value-bearing security output.

- [ ] **Step 2: Run the full package gate**

```bash
npm run verify:full
npm run test:consumer
```

Expected: security tests, TypeScript, Vitest, production build, desktop Chromium, mobile Chromium, isolated 100-widget resource verification, and the React 18 consumer smoke test all pass. Existing intentional mobile skips remain only for desktop-input contracts superseded by the two focused touch tests.

- [ ] **Step 3: Inspect the generated declarations**

```bash
rg -n "DashboardGridHandle|getGridStack|commitLayout|RefAttributes" dist/components/DashboardGrid.d.ts
```

Expected: all four public type markers are present, and `getGridStack` references the GridStack type rather than `any`.

- [ ] **Step 4: Append the report checkpoint**

Append a timestamped `0.1.4 GridStack Handle And Touch Verification` section to `reports/2026-07-22.md` containing:

```markdown
## 0.1.4 GridStack Handle And Touch Verification — HH:MM KST

### Summary

- Added the backward-compatible DashboardGridHandle advanced API while retaining Comins state/CRUD as the primary contract.
- Deduplicated identical layout commits from raw GridStack change events and explicit commitLayout calls.
- Added an English consumer fixture with deterministic free cells.
- Verified mobile Chromium touch drag, resize, controlled rerender persistence, and post-column-change interaction.

### Verification

- npm run test:security: PASS
- npm run typecheck: PASS
- focused Vitest adapter/handle tests: PASS
- focused desktop handle Playwright: PASS
- focused mobile touch Playwright: PASS
- npm run verify:full: PASS
- npm run test:consumer: PASS

### Residual Boundaries

- Keyboard widget move/resize remains unsupported by product decision.
- Firefox and Safari remain outside the verified browser matrix.
- README, GIF, workflow, version, release, and provider operations are handled by the dependent plans.
```

Replace `HH:MM` with the actual KST execution time and record actual pass/fail results only.

- [ ] **Step 5: Verify hygiene and commit the checkpoint**

```bash
npm run check:security
git diff --check
git status --short
git add reports/2026-07-22.md
git diff --cached --check
git commit -m "docs: record GridStack handle and touch verification"
```

Expected: only the report is staged for the final task commit; no Playwright artifacts, temporary probe scripts, archives, or scanner output remain outside ignored artifact directories.

## Completion Gate

- [ ] `DashboardGridHandle` is public, generic widget inference remains intact, and existing consumers need no code change.
- [ ] `getGridStack()` returns only a live borrowed instance and returns `null` after unmount.
- [ ] `commitLayout()` returns a snapshot and does not duplicate a GridStack `change` callback.
- [ ] The standalone English fixture has guaranteed free cells and uses public package exports.
- [ ] Mobile touch drag, resize, rerender persistence, and runtime-column behavior pass.
- [ ] Desktop interaction, 100-widget resource, build, security, and consumer gates pass.
- [ ] The report records actual evidence and the worktree contains no temporary touch probes or generated archives.
