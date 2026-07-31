# External Drop Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed, non-destructive `DashboardGrid` event that detects when a widget is released over a configured ordinary HTML element.

**Architecture:** Keep public data types and structural validation in the framework-light core, put DOM point normalization and target resolution in a small GridStack-adjacent helper, and integrate only the public GridStack drag lifecycle in the existing adapter. React `widgets` remains authoritative: the callback reports the drop and the consumer chooses whether to call `removeWidget`.

**Tech Stack:** React 18/19, TypeScript 6, GridStack 13 public events, Vitest 4, Playwright 1.61, Vite 8.

## Global Constraints

- Target `comins-grid-layout@0.2.0` as an additive public feature; do not remove or rename an existing public API.
- Keep React widget state authoritative and never remove GridStack DOM or mutate widget state inside the external-drop detector.
- Use `onWidgetExternalDrop`; do not dispatch a DOM `CustomEvent`.
- Resolve ordinary HTML targets at drop time in the grid element's owner document.
- Match only when the final mouse, pointer, or touch release point is inside a configured target or its descendant.
- When targets overlap, the first matching `externalDropTargets` entry wins.
- Keep cross-document, iframe, shadow-root, rectangle-overlap, drag-hover, and inter-grid transfer behavior outside this plan.
- Do not expose GridStack `removable` or `removableOptions`.
- Add no dependency, copied third-party source, generated asset, or package-bundle inclusion.
- Do not implement per-column responsive persistence or Firefox/WebKit projects in this plan; those remain separate `0.2.0` work streams.
- Preserve widget IDs, existing interaction callback order, and the `1..12` active-column contract.

---

## File Map

- `src/core/types.ts`: public target and external-drop event types.
- `src/core/configuration.ts`: DOM-free target ID and selector string validation.
- `src/gridstack/external-drop-target.ts`: CSS selector validation, client-point normalization, rendered-target eligibility, and hit resolution.
- `src/gridstack/adapter.ts`: imperative drag-point capture and exactly-once callback ordering.
- `src/components/DashboardGrid.tsx`: public props, browser selector validation, and adapter option wiring.
- `test/vitest/configuration.test.ts`: structural configuration contracts.
- `test/vitest/dashboard-grid-configuration.test.tsx`: public render error contract.
- `test/vitest/external-drop-target.test.ts`: DOM helper contracts without adding a DOM test dependency.
- `test/vitest/dashboard-grid-handle.test.tsx`: public generic prop type coverage.
- `example/src/readme-demo.tsx`: consumer-owned `300 x 300` deletion target and test bridge.
- `example/src/styles.css`: example-only target layout.
- `test/playwright/specs/dashboard-grid.spec.ts`: desktop, dynamic-target, locked-widget, unmatched-drop, and mobile-touch behavior.
- `README.md`, `docs/03-component-api-draft.md`, `docs/05-open-questions.md`: public API and support-boundary documentation.
- `test/vitest/readme.test.ts`: documentation contract.
- `reports/2026-07-31.md`: implementation evidence and remaining boundaries.

---

### Task 1: Define The Public Contract And Structural Validation

**Files:**
- Modify: `src/core/types.ts:1-105`
- Modify: `src/core/configuration.ts:1-119`
- Modify: `test/vitest/configuration.test.ts:1-50`
- Modify: `test/vitest/dashboard-grid-configuration.test.tsx:1-31`

**Interfaces:**
- Consumes: existing `DashboardWidgetId`, `DashboardColumnCount`, `DashboardWidgetLayout`, and `DashboardGridConfigurationError`.
- Produces: `DashboardExternalDropTarget`, `DashboardWidgetExternalDropEvent`, and `DashboardGridConfiguration.externalDropTargets`.

- [ ] **Step 1: Write failing structural configuration tests**

Add the valid contract to `test/vitest/configuration.test.ts`:

```ts
it("accepts ordinary external drop target definitions", () => {
  expect(() => validateDashboardGridConfiguration({
    externalDropTargets: [
      { id: "trash", selector: "#widget-trash" },
      { id: "archive", selector: "[data-dashboard-drop-target='archive']" },
    ],
  })).not.toThrow();
});
```

Extend the invalid-configuration table with exact target cases:

```ts
{ externalDropTargets: [{ id: "", selector: "#trash" }] },
{ externalDropTargets: [{ id: "trash", selector: " " }] },
{
  externalDropTargets: [
    { id: "trash", selector: "#trash-a" },
    { id: "trash", selector: "#trash-b" },
  ],
},
```

Add a render-level assertion to
`test/vitest/dashboard-grid-configuration.test.tsx`:

```tsx
expect(() => renderToStaticMarkup(
  <DashboardGrid
    widgets={[]}
    externalDropTargets={[
      { id: "trash", selector: "#trash-a" },
      { id: "trash", selector: "#trash-b" },
    ]}
    renderWidget={() => null}
  />,
)).toThrow(DashboardGridConfigurationError);
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npx vitest run test/vitest/configuration.test.ts test/vitest/dashboard-grid-configuration.test.tsx
```

Expected: FAIL because `externalDropTargets` is not part of the public
configuration and duplicate or empty target definitions are not rejected.

- [ ] **Step 3: Add the public types**

Add to `src/core/types.ts` after `DashboardResponsiveOptions`:

```ts
export type DashboardExternalDropTarget = {
  id: string;
  selector: string;
};
```

Add after `DashboardWidgetInteractionEvent`:

```ts
export type DashboardWidgetExternalDropEvent = {
  widgetId: DashboardWidgetId;
  targetId: string;
  columns: DashboardColumnCount;
  layout: DashboardWidgetLayout;
};
```

These types are exported automatically through the existing
`export * from "./core/types"` package entry.

- [ ] **Step 4: Implement DOM-free structural validation**

Import `DashboardExternalDropTarget` in `src/core/configuration.ts`, add the
configuration field, and validate trimmed IDs, trimmed selectors, and unique
IDs:

```ts
export type DashboardGridConfiguration = {
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
};
```

At the start of `validateDashboardGridConfiguration`:

```ts
const targetIds = new Set<string>();
for (const target of configuration.externalDropTargets ?? []) {
  const id = target.id.trim();
  const selector = target.selector.trim();
  if (!id || !selector || targetIds.has(id)) {
    fail();
  }
  targetIds.add(id);
}
```

Keep CSS grammar validation out of this core file because `src/core` must not
depend on browser DOM objects.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
npx vitest run test/vitest/configuration.test.ts test/vitest/dashboard-grid-configuration.test.tsx
npm run lint
```

Expected: both commands PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/core/types.ts src/core/configuration.ts \
  test/vitest/configuration.test.ts \
  test/vitest/dashboard-grid-configuration.test.tsx
git commit -m "feat: define external drop target contract"
```

---

### Task 2: Add DOM Point And Target Resolution Helpers

**Files:**
- Create: `src/gridstack/external-drop-target.ts`
- Create: `test/vitest/external-drop-target.test.ts`

**Interfaces:**
- Consumes: `DashboardExternalDropTarget` and `DashboardGridConfigurationError` from Task 1.
- Produces: `DashboardClientPoint`, `readDashboardClientPoint`, `validateDashboardExternalDropTargetSelectors`, and `resolveDashboardExternalDropTarget`.

- [ ] **Step 1: Write failing point-normalization tests**

Create `test/vitest/external-drop-target.test.ts` with mouse/pointer-shaped,
touch-shaped, and unusable event cases:

```ts
import { describe, expect, it, vi } from "vitest";
import { DashboardGridConfigurationError } from "../../src";
import {
  readDashboardClientPoint,
  resolveDashboardExternalDropTarget,
  validateDashboardExternalDropTargetSelectors,
} from "../../src/gridstack/external-drop-target";

describe("readDashboardClientPoint", () => {
  it("reads finite client coordinates", () => {
    expect(readDashboardClientPoint({
      clientX: 120,
      clientY: 240,
    } as unknown as Event)).toEqual({ clientX: 120, clientY: 240 });
  });

  it("uses the final changed touch", () => {
    expect(readDashboardClientPoint({
      changedTouches: [
        { clientX: 10, clientY: 20 },
        { clientX: 30, clientY: 40 },
      ],
    } as unknown as Event)).toEqual({ clientX: 30, clientY: 40 });
  });

  it("rejects missing and non-finite coordinates", () => {
    expect(readDashboardClientPoint(new Event("dragstop"))).toBeUndefined();
    expect(readDashboardClientPoint({
      clientX: Number.NaN,
      clientY: 40,
    } as unknown as Event)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Write failing selector and hit-resolution tests**

Add a small fake-document harness to the same test file:

```ts
function createRenderedTargetHarness() {
  const child = {} as Element;
  const target = {
    isConnected: true,
    contains: (node: Node) => node === child,
    getClientRects: () => [{ width: 300, height: 300 }],
  } as unknown as HTMLElement;
  const grid = {
    contains: () => false,
  } as unknown as HTMLElement;
  const document = {
    defaultView: {
      getComputedStyle: () => ({
        display: "block",
        visibility: "visible",
      }),
    },
    elementsFromPoint: () => [child],
    querySelectorAll: () => [target],
  } as unknown as Document;
  return { child, document, grid, target };
}
```

Add exact assertions:

```ts
describe("external drop target resolution", () => {
  it("resolves a descendant of a rendered plain element", () => {
    const { document, grid } = createRenderedTargetHarness();
    expect(resolveDashboardExternalDropTarget(
      document,
      grid,
      [{ id: "trash", selector: "#trash" }],
      { clientX: 150, clientY: 150 },
    )).toEqual({ id: "trash", selector: "#trash" });
  });

  it("fails closed for invalid selector syntax", () => {
    const document = {
      querySelectorAll: vi.fn(() => {
        throw new DOMException("invalid", "SyntaxError");
      }),
    } as unknown as Document;
    expect(() => validateDashboardExternalDropTargetSelectors(
      document,
      [{ id: "trash", selector: "[" }],
    )).toThrow(DashboardGridConfigurationError);
  });
});
```

Add cases that verify the first configured target wins, multiple elements for
one selector are accepted, and disconnected, `display: none`,
`visibility: hidden`, zero-rectangle, in-grid, and unmatched elements are
ignored.

- [ ] **Step 3: Run the focused test and confirm RED**

Run:

```bash
npx vitest run test/vitest/external-drop-target.test.ts
```

Expected: FAIL because `src/gridstack/external-drop-target.ts` does not exist.

- [ ] **Step 4: Implement point normalization**

Create `src/gridstack/external-drop-target.ts`:

```ts
import { DashboardGridConfigurationError } from "../core/configuration";
import type { DashboardExternalDropTarget } from "../core/types";

export type DashboardClientPoint = {
  clientX: number;
  clientY: number;
};

type PointLike = {
  clientX?: unknown;
  clientY?: unknown;
};

type PointEventLike = PointLike & {
  changedTouches?: ArrayLike<PointLike>;
};

function toClientPoint(value: PointLike | undefined): DashboardClientPoint | undefined {
  if (
    typeof value?.clientX !== "number"
    || typeof value.clientY !== "number"
    || !Number.isFinite(value.clientX)
    || !Number.isFinite(value.clientY)
  ) {
    return undefined;
  }
  return { clientX: value.clientX, clientY: value.clientY };
}

export function readDashboardClientPoint(event: Event): DashboardClientPoint | undefined {
  const candidate = event as Event & PointEventLike;
  const touches = candidate.changedTouches;
  if (touches?.length) {
    return toClientPoint(touches[touches.length - 1]);
  }
  return toClientPoint(candidate);
}
```

- [ ] **Step 5: Implement selector validation and target resolution**

Continue the same file:

```ts
export function validateDashboardExternalDropTargetSelectors(
  document: Document,
  targets: ReadonlyArray<DashboardExternalDropTarget> | undefined,
): void {
  try {
    for (const target of targets ?? []) {
      document.querySelectorAll(target.selector);
    }
  } catch {
    throw new DashboardGridConfigurationError();
  }
}

function isRenderedTarget(document: Document, element: HTMLElement): boolean {
  if (!element.isConnected || element.getClientRects().length === 0) {
    return false;
  }
  const style = document.defaultView?.getComputedStyle(element);
  return style?.display !== "none" && style?.visibility !== "hidden";
}

export function resolveDashboardExternalDropTarget(
  document: Document,
  gridElement: HTMLElement,
  targets: ReadonlyArray<DashboardExternalDropTarget> | undefined,
  point: DashboardClientPoint | undefined,
): DashboardExternalDropTarget | undefined {
  if (!point) {
    return undefined;
  }
  const hitElements = document.elementsFromPoint(point.clientX, point.clientY);
  for (const target of targets ?? []) {
    let matches: NodeListOf<HTMLElement>;
    try {
      matches = document.querySelectorAll<HTMLElement>(target.selector);
    } catch {
      throw new DashboardGridConfigurationError();
    }
    for (const element of matches) {
      if (
        gridElement.contains(element)
        || !isRenderedTarget(document, element)
      ) {
        continue;
      }
      if (hitElements.some((hit) => hit === element || element.contains(hit))) {
        return target;
      }
    }
  }
  return undefined;
}
```

- [ ] **Step 6: Run focused tests and the package unit suite**

Run:

```bash
npx vitest run test/vitest/external-drop-target.test.ts
npm run test:run
```

Expected: the focused test and all Vitest files PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/gridstack/external-drop-target.ts \
  test/vitest/external-drop-target.test.ts
git commit -m "feat: resolve external widget drop targets"
```

---

### Task 3: Integrate The Typed Event With DashboardGrid And The Adapter

**Files:**
- Modify: `src/components/DashboardGrid.tsx:1-263`
- Modify: `src/gridstack/adapter.ts:1-643`
- Modify: `test/vitest/dashboard-grid-handle.test.tsx:1-34`
- Modify: `example/src/readme-demo.tsx:1-212`
- Modify: `example/src/styles.css:1-100`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**
- Consumes: all Task 1 types and Task 2 helper functions.
- Produces: `DashboardGridProps.externalDropTargets`, `DashboardGridProps.onWidgetExternalDrop`, adapter point capture, exactly-once external-drop emission, and the consumer deletion example.

- [ ] **Step 1: Write a failing public generic-prop type test**

Add to `test/vitest/dashboard-grid-handle.test.tsx`:

```tsx
it("accepts typed external drop targets without losing widget data inference", () => {
  const element = (
    <DashboardGrid<MetricData>
      widgets={widgets}
      externalDropTargets={[{ id: "trash", selector: "#trash" }]}
      onWidgetExternalDrop={(event) => {
        const widgetId: string = event.widgetId;
        const columns: number = event.columns;
        expect(widgetId).toBe("metric");
        expect(columns).toBeGreaterThan(0);
      }}
      renderWidget={(widget) => <span>{widget.data?.value}</span>}
    />
  );
  expect(element.type).toBe(DashboardGrid);
});
```

- [ ] **Step 2: Write failing desktop interaction tests**

Add a desktop Chromium test to
`test/playwright/specs/dashboard-grid.spec.ts`:

```ts
test("emits one external drop event and removes controlled state through the consumer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "External drop is covered once on desktop Chromium.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());

  const widget = page.getByTestId("dashboard-widget-overview");
  const title = widget.locator(".comins-grid-layout-widget__title");
  const target = page.getByTestId("external-drop-trash-child");
  const [titleBox, targetBox] = await Promise.all([
    title.boundingBox(),
    target.boundingBox(),
  ]);
  if (!titleBox || !targetBox) {
    throw new Error("External drop geometry is unavailable");
  }

  await page.mouse.move(
    titleBox.x + titleBox.width / 2,
    titleBox.y + titleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 16 },
  );
  await page.mouse.up();

  await expect(widget).toBeHidden();
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents()),
  ).toContain("external-drop:trash:overview");
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds()),
  ).not.toContain("overview");
  expect(await page.evaluate(
    () => window.__cominsReadmeDemo
      ?.getInteractionEvents()
      .filter((event) => event.startsWith("external-drop:")),
  )).toEqual(["external-drop:trash:overview"]);
});
```

Add separate tests that:

- drop outside the target and assert no `external-drop:` entry and the widget remains;
- hide and remount the target after grid initialization, then drop successfully;
- set the overview widget to `movable: false` and assert no external event;
- set the overview widget to `locked: true` and assert no external event;
- resize the overview widget and assert no external event;
- inspect the event list and assert `layout-commit`, when present, precedes
  `external-drop:trash:overview`, which precedes `drag-stop:overview`.

- [ ] **Step 3: Write a failing mobile touch test**

Use the existing `performTouchGesture` helper:

```ts
test("drops a widget on a plain div with mobile touch", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch external drop is covered in mobile Chrome.");
  await page.setViewportSize({ width: 412, height: 1400 });
  await page.goto("/readme-demo");

  const widget = page.getByTestId("dashboard-widget-overview");
  const title = widget.locator(".comins-grid-layout-widget__title");
  const target = page.getByTestId("external-drop-trash-child");
  const [titleBox, targetBox] = await Promise.all([
    title.boundingBox(),
    target.boundingBox(),
  ]);
  if (!titleBox || !targetBox) {
    throw new Error("Touch external drop geometry is unavailable");
  }

  await performTouchGesture(page, title, {
    x: targetBox.x + targetBox.width / 2 - (titleBox.x + titleBox.width / 2),
    y: targetBox.y + targetBox.height / 2 - (titleBox.y + titleBox.height / 2),
  }, 12);

  await expect(widget).toBeHidden();
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents()),
  ).toContain("external-drop:trash:overview");
});
```

- [ ] **Step 4: Run the typecheck and focused E2E tests and confirm RED**

Run:

```bash
npm run lint
npx playwright test --project=chromium --project=mobile-chrome \
  --grep "external drop|plain div"
```

Expected: typecheck rejects the new props and the browser tests fail because
the example target and event integration do not exist.

- [ ] **Step 5: Wire public props and browser selector validation**

In `src/components/DashboardGrid.tsx`, import the new types and selector
validator, then extend `DashboardGridProps`:

```ts
externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
```

Destructure both props. Pass `externalDropTargets` into
`validateDashboardGridConfiguration`. Validate CSS grammar only when a browser
document exists:

```ts
if (typeof document !== "undefined") {
  validateDashboardExternalDropTargetSelectors(document, externalDropTargets);
}
```

Add both values to `adapterOptions` and its dependency list so callback updates
and dynamic configuration synchronize without reinitializing GridStack.

- [ ] **Step 6: Extend adapter options and point capture**

In `src/gridstack/adapter.ts`, import the external target types and Task 2
helpers. Extend `DashboardGridAdapterOptions`:

```ts
externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
```

Use `DashboardClientPoint` for `lastPointer`. Replace the mouse-only capture
function with:

```ts
const captureInteractionPoint = (event: Event) => {
  if (!isInteracting) {
    return;
  }
  lastPointer = readDashboardClientPoint(event) ?? lastPointer;
};
```

Keep the document mouse guard, but call `captureInteractionPoint`. Subscribe to
the public high-frequency engine event only for imperative point capture:

```ts
grid.on("drag", (event) => captureInteractionPoint(event));
```

Change `scheduleInteractionFallback` to accept `event?: Event`, keep
`handleInteractionRelease` typed as `MouseEvent | PointerEvent`, and call
`captureInteractionPoint(event)` from `startInteraction` without the current
mouse-only `instanceof` branch. This preserves the existing mouse fallback
while allowing pointer and touch-shaped GridStack lifecycle events to provide
the final point.

Do not dispatch React state or consumer callbacks from the `drag` handler.

- [ ] **Step 7: Resolve and emit the external drop in existing callback order**

Add:

```ts
let pendingExternalDropTarget: DashboardExternalDropTarget | undefined;
```

Update the stop handler to accept the original event and item:

```ts
const stopInteraction = (event?: Event, item?: GridItemHTMLElement) => {
  if (event) {
    captureInteractionPoint(event);
  }
  if (item) {
    activeInteractionItem = item;
  }
  pendingExternalDropTarget = activeInteractionKind === "drag"
    ? resolveDashboardExternalDropTarget(
        element.ownerDocument,
        element,
        currentOptions.externalDropTargets,
        lastPointer,
      )
    : undefined;
  pendingCommit = true;
  detachInteractionGuards();
  cancelFrame(forceEndFrame);
  cancelFrame(finishInteractionFrame);
  forceEndFrame = undefined;
  finishInteractionFrame = window.requestAnimationFrame(flushInteraction);
};
```

In `flushInteraction`, retain the pending target and stopped interaction before
clearing adapter state:

```ts
const stoppedInteraction = readInteractionEvent(activeInteractionItem);
const externalTarget = pendingExternalDropTarget;
pendingExternalDropTarget = undefined;
```

After the existing commit, derive the final layout from the committed snapshot
or the captured interaction:

```ts
const stoppedLayout =
  snapshot?.widgets.find((layout) => layout.id === stoppedInteraction?.id)
  ?? stoppedInteraction?.layout;

if (stoppedKind === "drag" && stoppedLayout) {
  if (externalTarget) {
    currentOptions.onWidgetExternalDrop?.({
      widgetId: stoppedLayout.id,
      targetId: externalTarget.id,
      columns: snapshot?.columns ?? clampDashboardColumnCount(grid.getColumn()),
      layout: stoppedLayout,
    });
  }
  currentOptions.onWidgetDragStop?.({
    id: stoppedLayout.id,
    layout: stoppedLayout,
  });
}
```

Leave resize-stop behavior unchanged. Register:

```ts
grid.on("dragstop", (event, item) => stopInteraction(event, item));
grid.on("resizestop", (event, item) => stopInteraction(event, item));
```

Clear `pendingExternalDropTarget` and `lastPointer` on new interaction and
adapter destruction.

- [ ] **Step 8: Add the consumer-owned example target**

In `example/src/readme-demo.tsx`:

- add `setOverviewLocked`, `setOverviewMovable`, and `setTrashVisible` to
  `ReadmeDemoBridge`;
- add `trashVisible` state, defaulting to `true`;
- implement the widget setters through
  `dashboard.commands.updateWidget("overview", { locked })` and
  `dashboard.commands.updateWidget("overview", { movable })`;
- define one module-level target array:

```ts
const externalDropTargets = [
  { id: "trash", selector: "#readme-widget-trash" },
] as const;
```

- pass the targets and callback:

```tsx
externalDropTargets={externalDropTargets}
onWidgetExternalDrop={(event) => {
  interactionEventsRef.current.push(
    `external-drop:${event.targetId}:${event.widgetId}`,
  );
  if (event.targetId === "trash") {
    dashboard.commands.removeWidget(event.widgetId);
  }
}}
```

- render the conditional ordinary element after `DashboardGrid`:

```tsx
{trashVisible ? (
  <div
    id="readme-widget-trash"
    className="readme-demo__trash"
    data-testid="external-drop-trash"
  >
    <span data-testid="external-drop-trash-child">Drop widget here to delete</span>
  </div>
) : null}
```

Add example-only CSS:

```css
.readme-demo__trash {
  align-items: center;
  background: #fff1f2;
  border: 2px dashed #e11d48;
  border-radius: 12px;
  color: #9f1239;
  display: flex;
  height: 300px;
  justify-content: center;
  margin-top: 24px;
  text-align: center;
  width: 300px;
}
```

- [ ] **Step 9: Run focused unit, type, and browser tests**

Run:

```bash
npx vitest run \
  test/vitest/configuration.test.ts \
  test/vitest/dashboard-grid-configuration.test.tsx \
  test/vitest/dashboard-grid-handle.test.tsx \
  test/vitest/external-drop-target.test.ts
npm run lint
npx playwright test --project=chromium --project=mobile-chrome \
  --grep "external drop|plain div"
```

Expected: all focused checks PASS, external events occur exactly once, and the
consumer removes both React and GridStack widget state.

- [ ] **Step 10: Commit Task 3**

```bash
git add src/components/DashboardGrid.tsx src/gridstack/adapter.ts \
  test/vitest/dashboard-grid-handle.test.tsx \
  example/src/readme-demo.tsx example/src/styles.css \
  test/playwright/specs/dashboard-grid.spec.ts
git commit -m "feat: emit external widget drop events"
```

---

### Task 4: Document The Additive API And Support Boundary

**Files:**
- Modify: `README.md:12-230`
- Modify: `docs/03-component-api-draft.md:1-117`
- Modify: `docs/05-open-questions.md:3-20`
- Modify: `test/vitest/readme.test.ts:1-60`

**Interfaces:**
- Consumes: the exact Task 1 public names and Task 3 behavior.
- Produces: consumer instructions that distinguish package callbacks from GridStack native removal and DOM events.

- [ ] **Step 1: Write a failing README contract test**

Extend `test/vitest/readme.test.ts` so the public guide must contain:

```ts
for (const token of [
  "externalDropTargets",
  "onWidgetExternalDrop",
  "DashboardWidgetExternalDropEvent",
  "removeWidget",
  "same-document",
]) {
  expect(readme).toContain(token);
}
```

Add an assertion that the guide still excludes raw GridStack removal:

```ts
expect(readme).toContain("GridStack `removable` remains outside the controlled Comins engine options");
```

- [ ] **Step 2: Run the focused documentation test and confirm RED**

Run:

```bash
npx vitest run test/vitest/readme.test.ts
```

Expected: FAIL because the new prop, event type, example, and native-removal
boundary are not documented.

- [ ] **Step 3: Update README features, props, and usage**

Add a feature bullet for typed drops on consumer-owned HTML. Add these prop rows:

```md
| `externalDropTargets` | `ReadonlyArray<DashboardExternalDropTarget>` | — | Maps target IDs to same-document CSS selectors |
| `onWidgetExternalDrop` | `(event: DashboardWidgetExternalDropEvent) => void` | — | Reports a final pointer or touch release inside a configured target |
```

Add an "External drop targets" section using the exact `300 x 300` deletion
example from the design. State:

- the package emits a non-destructive callback;
- the consumer calls `removeWidget`;
- targets may mount after the grid because selectors resolve at drop time;
- the first configured target wins when targets overlap;
- same-document light DOM is supported;
- GridStack `removable` remains outside the controlled Comins engine options.

- [ ] **Step 4: Update API and support-boundary docs**

In `docs/03-component-api-draft.md`, add the two props and the exact event type.
In `docs/05-open-questions.md`, record the external callback as an implemented
`0.2.0` product decision while keeping raw GridStack removal unsupported.

Do not change the separate statements about per-column persistence,
Firefox/Safari support, or keyboard layout manipulation.

- [ ] **Step 5: Run documentation tests and typecheck**

Run:

```bash
npx vitest run test/vitest/readme.test.ts
npm run lint
```

Expected: both commands PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add README.md docs/03-component-api-draft.md \
  docs/05-open-questions.md test/vitest/readme.test.ts
git commit -m "docs: document external widget drop targets"
```

---

### Task 5: Run Full Gates, Record Evidence, And Review The Diff

**Files:**
- Modify: `reports/2026-07-31.md`

**Interfaces:**
- Consumes: Tasks 1 through 4 and the repository verification commands.
- Produces: fresh package, browser, resource, consumer, and diff evidence for implementation review.

- [ ] **Step 1: Run the complete package baseline**

Run:

```bash
npm run verify
```

Expected:

- security tests PASS;
- third-party notice gate PASS;
- TypeScript typecheck PASS;
- all Vitest files PASS;
- Vite and declaration build PASS.

- [ ] **Step 2: Ensure the required Chromium binary is installed**

Run:

```bash
npx playwright install chromium
```

Expected: the Playwright 1.61 Chromium binary is present for the desktop,
mobile, and resource projects. This does not add a repository dependency.

- [ ] **Step 3: Run the full browser and resource gate**

Run:

```bash
npm run verify:full
```

Expected:

- Chromium and mobile Chrome interaction suites PASS;
- the plain-div desktop and touch drop tests PASS;
- browser console and page error diagnostics remain empty;
- the isolated 100-widget repeated drag loop exercises the new imperative point
  capture and no-target resolution path while DOM, listener, document, heap
  peak, and steady-state counters stay within their existing limits.

- [ ] **Step 4: Run the built-package consumer smoke**

Run:

```bash
npm run test:consumer
```

Expected: the packed package and stylesheet exports import successfully after
an isolated React 18 consumer installation. Public type generation is covered
by the preceding `npm run verify` build and declaration-output gate.

- [ ] **Step 5: Review public API and dependency boundaries**

Run:

```bash
git diff 1ff7b50..HEAD -- src package.json package-lock.json \
  README.md docs/03-component-api-draft.md docs/05-open-questions.md
npm ls --depth=0
```

Confirm:

- only the two additive props and two additive public types were introduced;
- no raw `GridStack` type leaks through the external-drop event;
- no dependency or lockfile entry changed;
- no direct GridStack `removable` option was enabled;
- no per-column persistence or Firefox/WebKit project was included.

- [ ] **Step 6: Record implementation evidence**

Append a new implementation section to `reports/2026-07-31.md` containing:

- implementation summary;
- exact changed files;
- license impact `N/A`;
- focused RED and GREEN commands;
- `npm run verify`, `npm run verify:full`, and `npm run test:consumer` results;
- external-drop callback ordering and React-state deletion evidence;
- omitted Firefox/WebKit and P1 work as separate approved work streams;
- no push, PR, tag, Release, or publish action.

- [ ] **Step 7: Run final hygiene checks**

Run:

```bash
node --test test/security/sensitive-data-gates.node.mjs
git diff --check
git status --short --branch
```

Expected:

- focused security guidance tests PASS;
- `git diff --check` reports no findings;
- only the intended report update remains uncommitted.

- [ ] **Step 8: Commit Task 5**

```bash
git add reports/2026-07-31.md
git commit -m "docs: record external drop target verification"
```

- [ ] **Step 9: Verify the final branch state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -7
```

Expected: the worktree is clean on `codex/0.2.0-external-drop-target`, with the
design commit, the implementation-plan commit, and the five implementation
commits. Do not push or open a pull request without explicit approval.

---

## Completion Criteria

- A consumer can configure an ordinary same-document `div` as a drop target.
- Mouse, pointer, and mobile touch release resolve the same target contract.
- The callback fires once and reports widget ID, target ID, active columns, and
  final geometry.
- The callback remains non-destructive; consumer `removeWidget` owns deletion.
- Unmatched, hidden, disconnected, in-grid, invalid, locked, and non-movable
  cases follow the documented behavior.
- Existing layout commit and interaction-stop ordering is preserved.
- No GridStack native removal, new dependency, P1 persistence, Firefox/WebKit
  configuration, DOM event, or release action is included.
- Focused tests, `npm run verify`, `npm run verify:full`,
  `npm run test:consumer`, sensitive-data checks, and diff hygiene pass with
  fresh evidence.
