# Playground Example Expansion and GridStack Handle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 문서형 Playground를 유지하면서 Widget, Layout, Advanced 예제를 목적별 단일-Grid route로 확장하고, 사용자 정의 Widget header action과 공식 GridStack instance Handle을 하위 호환 방식으로 제공한다.

**Architecture:** `DashboardGrid`에는 두 개의 작은 public extension만 추가한다. 예제 layer는 공통 fixture·palette·snapshot sanitizer를 공유하되 각 route가 독립 `useDashboardGrid` runtime을 소유하며, `DocsShell`이 route와 locale lifecycle을 한 곳에서 관리한다. 모든 제품 동작은 focused RED/GREEN으로 구현하고, 마지막 통합 task에서 기존 회귀 selector를 정리한 뒤 전체 gate를 한 번 실행한다.

**Tech Stack:** React 19, TypeScript 6, GridStack 13, React Router 8, Vite 8, Vitest 4, Playwright 1.61, CSS

## Global Constraints

- 각 예제 route에는 live Grid를 정확히 하나만 렌더한다.
- 기존 `/examples/layout`, `/examples/advanced` canonical URL과 legacy redirect를 유지한다.
- runtime column은 `1`부터 `12`까지만 허용한다.
- Layout 예제는 12컬럼과 서로 다른 크기의 Widget 6개로 시작한다.
- locale 변경은 route, Grid mount, Widget state, dialog draft와 column cache를 초기화하지 않는다.
- toggle은 별도 성공 상태 문구 없이 변경되는 action label, 활성 배경색과 `aria-pressed`로 상태를 전달한다.
- 기존 maximize/minimize/restore command와 기본 header action을 제거하지 않는다.
- `DashboardGridHandle.grid`는 공식 GridStack escape hatch이며 raw add/remove/destroy의 controlled-state 동기화를 보장하지 않는다.
- 새 dependency, package version 변경, publish, tag, Release, push와 PR은 포함하지 않는다.
- 실제 Safari 검증을 Playwright WebKit 검증으로 표현하지 않는다.
- `npm run verify:full`은 모든 의미 있는 code/test 변경 후 Task 13에서 정확히 한 번 실행한다.

---

## File Structure

### Public package

- `src/gridstack/adapter.ts`: `DashboardGridHandle.grid` live getter contract.
- `src/components/DashboardGrid.tsx`: `renderWidgetActions` public prop와 Handle getter 연결.
- `src/components/DashboardWidget.tsx`: custom action 또는 기존 기본 action을 선택하는 shell.
- `README.md`, `docs/03-component-api-draft.md`: safe Comins method와 raw GridStack boundary.

### Shared example layer

- `example/src/playground/palette.ts`: deterministic pastel key, color token과 index resolver.
- `example/src/playground/types.ts`: normalized `ExampleWidgetData`, `WidgetDraft`, runtime types.
- `example/src/playground/fixtures.ts`: indexed Widget fixture와 Layout 6개 fixture.
- `example/src/playground/state-snapshot.ts`: layout/full-state fail-closed sanitizer와 legacy data normalization.
- `example/src/playground/components/WidgetFormDialog.tsx`: add/edit form, size와 palette selection.
- `example/src/playground/components/DashboardPreview.tsx`: shared Grid props와 consumer action/content slot 전달.
- `example/src/playground/copy.ts`: shared, Widget, Layout, Advanced의 완전한 한·영 copy.
- `example/src/styles.css`: top controls, nested navigation, toolbar groups, palette, loader와 responsive containment.

### Route-owned examples

- `example/src/playground/WidgetPlayground.tsx`: Widget CRUD, selection, lock와 custom refresh.
- `example/src/playground/use-widget-refresh.ts`: Widget별 timeout registry와 cleanup.
- `example/src/playground/LayoutPlayground.tsx`: in-memory layout save/restore, arrange/fill/reset.
- `example/src/playground/LayoutColumnsPlayground.tsx`: 1~12 manual column example.
- `example/src/playground/LayoutLockPlayground.tsx`: one-toggle full layout lock example.
- `example/src/playground/AdvancedPlayground.tsx`: responsive and supported engine options.
- `example/src/playground/AdvancedHandlePlayground.tsx`: safe Handle and official `grid` calls.
- `example/src/playground/AdvancedStatePlayground.tsx`: layout, full state and column cache comparison.
- `example/src/playground/AdvancedEventsPlayground.tsx`: bounded interaction event log.
- `example/src/playground/AdvancedExternalDropPlayground.tsx`: controlled external-drop example and event log.
- `example/src/playground/event-log.ts`: serializable event entries and bounded append helper.

### Documentation and routing

- `example/src/docs/types.ts`: expanded live IDs and nested navigation section type.
- `example/src/docs/content.tsx`: localized metadata, samples, search terms and API docs.
- `example/src/docs/DocsShell.tsx`: locale-before-search controls, nested navigation and live component map.
- `example/src/main.tsx`: canonical paths and compatibility routing.

### Tests and reporting

- `test/vitest/dashboard-grid-actions.test.tsx`: default/custom/hidden header action contract.
- `test/vitest/dashboard-grid-handle.test.tsx`: public `grid` type contract.
- `test/vitest/playground-widget-data.test.ts`: palette, fixture and event-log determinism.
- `test/vitest/playground-state-snapshot.test.ts`: legacy normalization and fail-closed data validation.
- `test/playwright/helpers/dashboard-interactions.ts`: stable drag, resize and geometry readers for new focused specs.
- `test/playwright/specs/docs-playground-routing.spec.ts`: route, nested menu, one-Grid and top-control order.
- `test/playwright/specs/playground-widget.spec.ts`: Widget action, loader, edit, color and lock behavior.
- `test/playwright/specs/playground-layout-examples.spec.ts`: save/restore, column cycle and lock behavior.
- `test/playwright/specs/playground-advanced-examples.spec.ts`: engine, Handle, state, events and external drop.
- `test/playwright/specs/playground-localization.spec.ts`, `test/playwright/specs/playground.spec.ts`, `test/playwright/specs/dashboard-grid.spec.ts`: obsolete combined-page assumptions migrated to new routes.
- `reports/2026-08-14.md`: RED/GREEN, full gate, visual evidence and residual risk.

---

### Task 1: Add the backward-compatible public action slot and GridStack instance Handle

**Files:**
- Modify: `src/gridstack/adapter.ts`
- Modify: `src/components/DashboardGrid.tsx`
- Modify: `src/components/DashboardWidget.tsx`
- Modify: `test/vitest/dashboard-grid-handle.test.tsx`
- Create: `test/vitest/dashboard-grid-actions.test.tsx`

**Interfaces:**
- Produces: `DashboardGridHandle.grid: GridStack | null` as a live read-only property.
- Produces: `DashboardGridProps<TData>.renderWidgetActions?: (widget: DashboardWidget<TData>) => ReactNode`.
- Produces: `DashboardWidgetShellProps<TData>.actions?: ReactNode`, where `undefined` selects defaults and `null` suppresses the action container.

- [ ] **Step 1: Write the failing Handle type test**

```tsx
it("exposes the current GridStack instance through a readonly property", () => {
  const ref = createRef<DashboardGridHandle>();
  const element = <DashboardGrid ref={ref} widgets={widgets} renderWidget={() => null} />;

  expect(element.type).toBe(DashboardGrid);
  expectTypeOf<DashboardGridHandle["grid"]>().toEqualTypeOf<GridStack | null>();
});
```

- [ ] **Step 2: Write the failing custom-action render tests**

```tsx
it("replaces default controls with consumer actions", () => {
  const markup = renderToStaticMarkup(
    <DashboardGrid
      widgets={widgets}
      renderWidget={() => <span>content</span>}
      renderWidgetActions={(widget) => <button>Refresh {widget.id}</button>}
    />,
  );

  expect(markup).toContain("Refresh metric");
  expect(markup).not.toContain("metric 최대화");
});

it("lets showControls=false suppress custom actions", () => {
  const markup = renderToStaticMarkup(
    <DashboardGrid
      showControls={false}
      widgets={widgets}
      renderWidget={() => null}
      renderWidgetActions={() => <button>Custom</button>}
    />,
  );

  expect(markup).not.toContain("Custom");
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
npm run test:run -- test/vitest/dashboard-grid-handle.test.tsx test/vitest/dashboard-grid-actions.test.tsx
```

Expected: TypeScript reports missing `grid` and `renderWidgetActions`, or the custom action assertion fails because default actions are still rendered.

- [ ] **Step 4: Implement the live Handle getter**

```ts
export interface DashboardGridHandle {
  readonly grid: GridStack | null;
  getGridStack(): GridStack | null;
  refresh(): void;
  compact(layout?: CompactOptions, doSort?: boolean): DashboardLayoutSnapshot | null;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

```tsx
useImperativeHandle(ref, () => ({
  get grid() {
    return adapterRef.current?.grid ?? null;
  },
  getGridStack: () => adapterRef.current?.grid ?? null,
  refresh: () => adapterRef.current?.refresh(),
  compact: (layout, doSort) => adapterRef.current?.compact(layout, doSort) ?? null,
  commitLayout: () => adapterRef.current?.commit() ?? null,
}), []);
```

- [ ] **Step 5: Implement the custom action precedence**

```ts
export type DashboardGridProps<TData = unknown> = DashboardInteractionOptions & {
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  renderWidgetActions?: (widget: DashboardWidgetModel<TData>) => ReactNode;
};
```

`DashboardWidgetShell` must use the following exact decision:

```tsx
const actionContent = actions === undefined ? defaultActions : actions;

{showControls && actionContent !== null ? (
  <div className="comins-grid-layout-widget__actions" onDoubleClick={(event) => event.stopPropagation()}>
    {actionContent}
  </div>
) : null}
```

`DashboardGrid` passes `renderWidgetActions ? renderWidgetActions(widget) : undefined`; all existing callbacks remain connected for the default branch.

- [ ] **Step 6: Verify the public extension**

Run:

```bash
npm run test:run -- test/vitest/dashboard-grid-handle.test.tsx test/vitest/dashboard-grid-actions.test.tsx
npm run lint
npm run build
```

Expected: all focused tests, typecheck and package build PASS.

- [ ] **Step 7: Commit**

```bash
git add src/gridstack/adapter.ts src/components/DashboardGrid.tsx src/components/DashboardWidget.tsx test/vitest/dashboard-grid-handle.test.tsx test/vitest/dashboard-grid-actions.test.tsx
git commit -m "feat: expose custom widget actions and grid handle"
```

---

### Task 2: Create deterministic Widget presentation data, palette and safe snapshot normalization

**Files:**
- Create: `example/src/playground/palette.ts`
- Create: `example/src/playground/components/WidgetFormDialog.tsx`
- Modify: `example/src/playground/types.ts`
- Modify: `example/src/playground/fixtures.ts`
- Modify: `example/src/playground/state-snapshot.ts`
- Modify: `example/src/playground/components/WidgetCrudControls.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Create: `test/vitest/playground-widget-data.test.ts`
- Modify: `test/vitest/playground-state-snapshot.test.ts`

**Interfaces:**
- Produces: `PASTEL_COLORS`, `PastelColorKey`, `pastelKeyForIndex(index)` and `pastelColor(key)`.
- Produces: `WidgetDraft { title, value, width, height, colorKey }`.
- Produces: `sanitizeDashboardLayoutSnapshot(value)` and normalized `sanitizeExampleDashboardStateSnapshot(value)`.
- Consumes: existing `DashboardWidget`, `DashboardLayoutSnapshot` and dialog accessibility contract.

- [ ] **Step 1: Write palette and fixture RED tests**

```ts
it("assigns stable pastel colors by widget index", () => {
  expect(pastelKeyForIndex(0)).toBe("mint");
  expect(pastelKeyForIndex(PASTEL_COLORS.length)).toBe("mint");
  expect(createLayoutPlaygroundFixture().map((widget) => widget.data?.colorKey))
    .toEqual(["mint", "sky", "lemon", "peach", "lavender", "rose"]);
});

it("creates six varied 12-column widgets without shared references", () => {
  const first = createLayoutPlaygroundFixture();
  const second = createLayoutPlaygroundFixture();
  expect(first.map(({ layout }) => [layout.w, layout.h]))
    .toEqual([[3, 2], [5, 2], [4, 3], [6, 2], [3, 3], [3, 2]]);
  expect(first).not.toBe(second);
  expect(first[0]?.data).not.toBe(second[0]?.data);
});
```

- [ ] **Step 2: Write snapshot normalization RED tests**

```ts
it("normalizes legacy example data without color or revision", () => {
  const snapshot = createValidSnapshot();
  const result = sanitizeExampleDashboardStateSnapshot(snapshot);
  expect(result?.widgets[0]?.data).toMatchObject({ colorKey: "mint", contentRevision: 0 });
});

it.each([
  ["colorKey", "private-color"],
  ["contentRevision", -1],
  ["contentRevision", 1.5],
])("rejects invalid %s before restore", (key, invalid) => {
  const snapshot = createValidSnapshot();
  (snapshot.widgets[0]!.data as Record<string, unknown>)[key] = invalid;
  expect(sanitizeExampleDashboardStateSnapshot(snapshot)).toBeUndefined();
});
```

- [ ] **Step 3: Run the unit tests and verify RED**

Run:

```bash
npm run test:run -- test/vitest/playground-widget-data.test.ts test/vitest/playground-state-snapshot.test.ts
```

Expected: imports for palette helpers and normalized fields fail because they do not exist.

- [ ] **Step 4: Implement the palette and data contracts**

```ts
export const PASTEL_COLORS = [
  { key: "mint", background: "#dcfce7", foreground: "#14532d" },
  { key: "sky", background: "#e0f2fe", foreground: "#0c4a6e" },
  { key: "lemon", background: "#fef9c3", foreground: "#713f12" },
  { key: "peach", background: "#ffedd5", foreground: "#7c2d12" },
  { key: "lavender", background: "#ede9fe", foreground: "#4c1d95" },
  { key: "rose", background: "#ffe4e6", foreground: "#881337" },
] as const;

export type PastelColorKey = (typeof PASTEL_COLORS)[number]["key"];

export function pastelKeyForIndex(index: number): PastelColorKey {
  return PASTEL_COLORS[index % PASTEL_COLORS.length]!.key;
}
```

`ExampleWidgetData` retains safe `description` and locale metadata, and adds required `colorKey`, `contentRevision` plus optional positive `fixtureIndex`.

- [ ] **Step 5: Implement fail-closed normalization**

`sanitizeDashboardLayoutSnapshot` validates supported columns, unique IDs, matching layout IDs, finite coordinates and positive sizes. Example data normalization must clone input and apply:

```ts
const normalizedData: ExampleWidgetData = {
  ...data,
  colorKey: data.colorKey ?? pastelKeyForIndex(index),
  contentRevision: data.contentRevision ?? 0,
};
```

Reject a present unknown color key, negative/non-integer revision, non-positive/non-integer `fixtureIndex`, or non-string render field. Do not mutate the parsed JSON object.

- [ ] **Step 6: Extract the reusable add/edit form**

```ts
export type WidgetDraft = {
  title: string;
  value: string;
  width: number;
  height: number;
  colorKey: PastelColorKey;
};
```

`WidgetFormDialog` owns title/value validation, width `1..12`, height `1..4`, a keyboard-selectable palette fieldset, locale copy and the existing focus contract. Add and edit modes both render size controls. `WidgetCrudControls` delegates its dialogs to this component and preserves current callers until their route-specific refactors.

- [ ] **Step 7: Verify shared model and form compilation**

Run:

```bash
npm run test:run -- test/vitest/playground-widget-data.test.ts test/vitest/playground-state-snapshot.test.ts
npm run lint
```

Expected: unit tests and typecheck PASS.

- [ ] **Step 8: Commit**

```bash
git add example/src/playground/palette.ts example/src/playground/components/WidgetFormDialog.tsx example/src/playground/types.ts example/src/playground/fixtures.ts example/src/playground/state-snapshot.ts example/src/playground/components/WidgetCrudControls.tsx example/src/playground/copy.ts example/src/styles.css test/vitest/playground-widget-data.test.ts test/vitest/playground-state-snapshot.test.ts
git commit -m "feat: add deterministic playground widget data"
```

---

### Task 3: Add nested navigation and place locale immediately before search

**Files:**
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`

**Interfaces:**
- Produces: `DocsNavSection { label?: string; pages: DocsPage[] }` and `DocsNavGroup.sections`.
- Produces: optional localized/resolved `navParent` on docs pages.
- Preserves: same `createDocsContent(locale)` source for Sidebar, article and search.

- [ ] **Step 1: Write the navigation and geometry RED tests**

```ts
test("groups Layout and Advanced links without hiding child routes", async ({ page }) => {
  await page.goto("/examples/widget");
  const nav = page.getByRole("navigation", { name: "문서 메뉴" });
  await expect(nav.getByText("레이아웃", { exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "저장·복원" })).toHaveAttribute("href", "/examples/layout");
  await expect(nav.getByText("고급 예제", { exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "반응형·엔진 옵션" })).toHaveAttribute("href", "/examples/advanced");
});

test("places the locale toggle immediately left of search", async ({ page }) => {
  await page.goto("/docs/getting-started");
  await expect(page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }))
    .toHaveAttribute("aria-pressed", "true");
  const locale = await page.getByTestId("playground-locale-toggle").boundingBox();
  const search = await page.getByRole("searchbox", { name: "전체 문서 검색" }).boundingBox();
  expect(locale).not.toBeNull();
  expect(search).not.toBeNull();
  expect(locale!.x + locale!.width).toBeLessThanOrEqual(search!.x);
});
```

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "groups Layout|immediately left"
```

Expected: nested labels are absent and the current search appears before locale.

- [ ] **Step 3: Implement nested nav data**

```ts
export type DocsNavSection = {
  label?: string;
  pages: DocsPage[];
};

export type DocsNavGroup = {
  category: string;
  sections: DocsNavSection[];
};
```

Add localized `navParent` to Layout and Advanced page metadata. `createDocsNavGroups` groups first by category and then by `navParent`, keeping source order. Sidebar renders an optional non-link subheading followed by its links; child links retain `aria-current="page"`.

- [ ] **Step 4: Implement the top control group**

```tsx
<div className="docs-topnav__controls">
  <div aria-label={text(playgroundMessages.localeToggle)} data-testid="playground-locale-toggle" role="group">
    <LocaleToggle />
  </div>
  <GlobalDocsSearch pages={pages} />
</div>
```

`LocaleToggle` renders `한` and `EN` in that order; the current locale button has
`aria-pressed="true"`. Update existing `KO` selectors to `한` without changing the stored
locale values `ko` and `en`.

Use `grid-template-columns: minmax(0, 1fr) minmax(0, 460px)` on the top nav and `display:grid; grid-template-columns:auto minmax(0,1fr)` on the control group. At mobile widths the group may occupy a new row but locale remains left of search.

- [ ] **Step 5: Verify routing, search and locale preservation**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium
npm run lint
```

Expected: both specs PASS and locale changes continue to preserve route/live state.

- [ ] **Step 6: Commit**

```bash
git add example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/styles.css test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-localization.spec.ts
git commit -m "feat: expand playground navigation controls"
```

---

### Task 4: Rebuild the Widget example around custom actions and content refresh

**Files:**
- Create: `example/src/playground/use-widget-refresh.ts`
- Modify: `example/src/playground/WidgetPlayground.tsx`
- Modify: `example/src/playground/components/DashboardPreview.tsx`
- Modify: `example/src/playground/fixtures.ts`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Create: `test/playwright/specs/playground-widget.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`

**Interfaces:**
- Consumes: `WidgetFormDialog`, `WidgetDraft`, palette helpers and `renderWidgetActions`.
- Produces: `useWidgetRefresh(onComplete, delayMs)` with `refresh(id)`, `cancel(id)` and `isRefreshing(id)`.
- Preserves: layout geometry, lock and color during content refresh.

- [ ] **Step 1: Write Widget behavior RED tests**

```ts
test("uses edit refresh delete actions without maximize controls", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  await expect(widget.getByRole("button", { name: "위젯 1 수정" })).toBeVisible();
  await expect(widget.getByRole("button", { name: "위젯 1 새로고침" })).toBeVisible();
  await expect(widget.getByRole("button", { name: "위젯 1 삭제" })).toBeVisible();
  await expect(widget.getByRole("button", { name: /최대화|최소화|복원/ })).toHaveCount(0);
});

test("refreshes only content through a loader", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  const geometry = await widget.evaluate((node) => ["x", "y", "w", "h"].map((key) => node.getAttribute(`data-layout-${key}`)));
  const background = await widget.locator(".dashboard-widget-body").evaluate((node) => getComputedStyle(node).backgroundColor);
  const before = await widget.locator(".dashboard-widget-body strong").textContent();
  await widget.getByRole("button", { name: "위젯 1 새로고침" }).click();
  await expect(widget.getByRole("status", { name: "위젯 1 콘텐츠 새로고침 중" })).toBeVisible();
  await expect(widget.locator(".dashboard-widget-body strong")).not.toHaveText(before ?? "");
  expect(await widget.evaluate((node) => ["x", "y", "w", "h"].map((key) => node.getAttribute(`data-layout-${key}`)))).toEqual(geometry);
  expect(await widget.locator(".dashboard-widget-body").evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(background);
});
```

```ts
test("edits the addressed widget including color and geometry", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-2");
  await widget.getByRole("button", { name: "위젯 2 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 위젯");
  await dialog.getByLabel("값").fill("사용자 콘텐츠");
  await dialog.getByRole("radio", { name: "라벤더" }).check();
  await dialog.getByRole("combobox", { name: "너비" }).selectOption("3");
  await dialog.getByRole("combobox", { name: "높이" }).selectOption("3");
  await dialog.getByRole("button", { name: "변경 저장" }).click();
  await expect(widget).toContainText("사용자 위젯");
  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
});

test("changes lock labels and keeps toolbar groups inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/examples/widget");
  await page.getByTestId("dashboard-widget-widget-1").locator(".dashboard-widget-body").click();
  const lock = page.getByRole("button", { name: "이동 잠금" });
  await lock.click();
  await expect(page.getByRole("button", { name: "이동 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
  const overflow = await page.locator(".example-toolbar-groups").evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

Add the refresh cancellation case by starting refresh, deleting the same Widget, waiting 600ms, and asserting that the deleted ID is still absent. Run the same edit draft through KO→EN→KO and assert literal user values remain unchanged.

- [ ] **Step 2: Run Widget Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-widget.spec.ts --project=chromium
```

Expected: indexed IDs, custom buttons and Loader are absent.

- [ ] **Step 3: Implement timer ownership**

```ts
export function useWidgetRefresh(onComplete: (id: string) => void, delayMs = 500) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const completeRef = useRef(onComplete);
  const [refreshingIds, setRefreshingIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const cancel = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setRefreshingIds((current) => new Set([...current].filter((candidate) => candidate !== id)));
  }, []);

  const refresh = useCallback((id: string) => {
    cancel(id);
    setRefreshingIds((current) => new Set(current).add(id));
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id);
      setRefreshingIds((current) => new Set([...current].filter((candidate) => candidate !== id)));
      completeRef.current(id);
    }, delayMs));
  }, [cancel, delayMs]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  return { cancel, isRefreshing: (id: string) => refreshingIds.has(id), refresh };
}
```

- [ ] **Step 4: Implement indexed Widget UI**

- Start with `widget-1`, `widget-2`, `widget-3` and deterministic colors.
- Toolbar groups are add/delete-selected/clear, move/resize/full lock, and Widget count.
- Clicking body selects the Widget; selected body has `data-selected="true"`.
- Each lock button label changes between lock/unlock actions and retains `aria-pressed`.
- Header `수정`, `새로고침`, `삭제` buttons call route-owned commands.
- Edit opener element is stored before opening so Dialog restores focus to the exact Widget button.
- Refresh increments only `data.contentRevision`; deleting first calls `cancel(id)`.
- Loader replaces body content during the 500ms window and has localized `role="status"`.
- Palette background and foreground are applied to body from `colorKey`.
- Remove the normal operation status and state JSON disclosure.

- [ ] **Step 5: Update affected localization and legacy tests**

Replace selectors based on `sales`, `traffic`, Widget Select and maximize buttons with indexed Widget IDs and direct header actions. Delete assertions for removed visible success status/JSON only when the same state is now verified through DOM behavior.

- [ ] **Step 6: Verify Widget behavior and locale**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-widget.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium
npm run verify
```

Expected: focused Chromium and package baseline PASS.

- [ ] **Step 7: Commit**

```bash
git add example/src/playground/use-widget-refresh.ts example/src/playground/WidgetPlayground.tsx example/src/playground/components/DashboardPreview.tsx example/src/playground/fixtures.ts example/src/playground/copy.ts example/src/styles.css test/playwright/specs/playground-widget.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts
git commit -m "feat: rebuild widget playground actions"
```

---

### Task 5: Simplify Layout save and restore around an in-memory snapshot

**Files:**
- Modify: `example/src/playground/LayoutPlayground.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Create: `test/playwright/helpers/dashboard-interactions.ts`
- Create: `test/playwright/specs/playground-layout-examples.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`

**Interfaces:**
- Consumes: shared six-Widget fixture and `WidgetFormDialog`.
- Produces: `/examples/layout` as layout-only save/restore route.
- Produces: shared test helpers `readWidgetGeometry`, `dragWidget`, `resizeWidget`.

- [ ] **Step 1: Write layout save/restore RED tests**

```ts
test("shows only the requested grouped toolbar", async ({ page }) => {
  await page.goto("/examples/layout");
  for (const name of ["위젯 추가", "전체 삭제", "레이아웃 저장", "레이아웃 복원", "자동 정렬", "공간 채우기", "초기화"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "컬럼 선택" })).toHaveCount(0);
  await expect(page.locator(".grid-stack-item")).toHaveCount(6);
});

test("restores the exact saved geometry after drag and resize", async ({ page }) => {
  await page.goto("/examples/layout");
  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const before = await readDashboardGeometry(page);
  await dragWidget(page, page.getByTestId("dashboard-widget-widget-1"), 180, 120);
  await resizeWidget(page, page.getByTestId("dashboard-widget-widget-2"), 120, 80);
  expect(await readDashboardGeometry(page)).not.toEqual(before);
  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect.poll(() => readDashboardGeometry(page)).toEqual(before);
});
```

Add a test that arrange and fill each produce a changed valid geometry, reset restores all six initial Widgets, and locale change does not discard the saved snapshot.

- [ ] **Step 2: Run the focused spec and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-layout-examples.spec.ts --project=chromium --grep "requested grouped toolbar|exact saved geometry"
```

Expected: current JSON editors, column Select and extra controls violate the assertions.

- [ ] **Step 3: Implement the route-owned snapshot flow**

Create the interaction helper with this exact geometry shape and pointer behavior:

```ts
export type WidgetGeometry = { id: string; x: number; y: number; w: number; h: number };

export async function readWidgetGeometry(widget: Locator): Promise<WidgetGeometry> {
  return widget.evaluate((node) => ({
    id: node.getAttribute("data-widget-id")!,
    x: Number(node.getAttribute("data-layout-x")),
    y: Number(node.getAttribute("data-layout-y")),
    w: Number(node.getAttribute("data-layout-w")),
    h: Number(node.getAttribute("data-layout-h")),
  }));
}

export async function readDashboardGeometry(page: Page): Promise<WidgetGeometry[]> {
  const widgets = page.locator(".grid-stack-item");
  return Promise.all(Array.from({ length: await widgets.count() }, (_, index) => readWidgetGeometry(widgets.nth(index))));
}

export async function dragWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  const box = await widget.boundingBox();
  if (!box) throw new Error("Widget is not visible.");
  await page.mouse.move(box.x + 56, box.y + 24);
  await page.mouse.down();
  await page.mouse.move(box.x + 56 + deltaX, box.y + 24 + deltaY, { steps: 12 });
  await page.mouse.up();
}

export async function resizeWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  const handle = widget.locator(".ui-resizable-se");
  const box = await handle.boundingBox();
  if (!box) throw new Error("Resize handle is not visible.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + deltaX, box.y + deltaY, { steps: 12 });
  await page.mouse.up();
}

export async function dragWidgetToTarget(page: Page, widget: Locator, target: Locator) {
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error("Drop target is not visible.");
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) throw new Error("Widget is not visible.");
  await page.mouse.move(widgetBox.x + 56, widgetBox.y + 24);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 16 });
  await page.mouse.up();
}
```

Then implement the route-owned snapshot:

```ts
const [savedLayout, setSavedLayout] = useState<DashboardLayoutSnapshot | null>(null);

const saveLayout = () => setSavedLayout(dashboard.commands.serializeLayout());
const restoreLayout = () => {
  if (savedLayout) dashboard.commands.applyLayoutSnapshot(savedLayout);
};
const reset = () => {
  dashboard.commands.resetLayout();
  setSavedLayout(null);
};
```

Render one toolbar with four semantic groups and no JSON/column/status panels. Restore is disabled while `savedLayout === null`. Add uses `WidgetFormDialog`; clear removes all; header custom action contains only delete. Arrange and fill call existing commands. Reset restores initial six-Widget fixture through the hook's initial snapshot.

- [ ] **Step 4: Migrate impacted legacy assertions**

Remove old `/examples/layout` full-state/JSON assertions from localization and combined Playground cases. Preserve their state-validation coverage for Task 10 by moving those expectations rather than deleting the behavior contract.

- [ ] **Step 5: Verify the simplified Layout route**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-layout-examples.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "Layout|layout|저장|복원|arrange|fill"
npm run lint
```

Expected: focused cases PASS.

- [ ] **Step 6: Commit**

```bash
git add example/src/playground/LayoutPlayground.tsx example/src/playground/copy.ts example/src/styles.css test/playwright/helpers/dashboard-interactions.ts test/playwright/specs/playground-layout-examples.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts
git commit -m "feat: simplify layout save restore example"
```

---

### Task 6: Add the independent dynamic column route

**Files:**
- Create: `example/src/playground/LayoutColumnsPlayground.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-layout-examples.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`

**Interfaces:**
- Produces: `PlaygroundExampleId = "advanced" | "layout" | "layout-columns" | "widget"` at this task boundary.
- Produces: canonical `/examples/layout/columns`.
- Consumes: common 12-column six-Widget fixture.

- [ ] **Step 1: Write route and column-cycle RED tests**

```ts
test("renders one Grid on the dynamic column child route", async ({ page }) => {
  await page.goto("/examples/layout/columns");
  await expect(page.getByRole("combobox", { name: "레이아웃 컬럼" })).toHaveValue("12");
  await expect(page.locator(".grid-stack")).toHaveCount(1);
  await expect(page.locator(".grid-stack-item")).toHaveCount(6);
});

test("keeps six widgets in bounds through 12 to 6 to 3 to 12", async ({ page }) => {
  await page.goto("/examples/layout/columns");
  const original = await readDashboardGeometry(page);
  for (const columns of ["6", "3", "12"]) {
    await page.getByRole("combobox", { name: "레이아웃 컬럼" }).selectOption(columns);
    await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", columns);
    const layouts = await readDashboardGeometry(page);
    expect(layouts).toHaveLength(6);
    expect(layouts.every(({ x, w }) => x + w <= Number(columns))).toBe(true);
  }
  expect(await readDashboardGeometry(page)).toEqual(original);
});
```

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-layout-examples.spec.ts --project=chromium --grep "dynamic column|12 to 6"
```

Expected: unknown route redirects to Widget and the Select is absent.

- [ ] **Step 3: Implement the page and routing**

`LayoutColumnsPlayground` owns only the manual column state and Grid:

```tsx
const dashboard = useDashboardGrid<ExampleWidgetData>({
  initialColumns: 12,
  initialWidgets: createLayoutPlaygroundFixture(),
});

<Select
  id="layout-columns"
  label={text(layoutColumnsCopy.select)}
  options={DASHBOARD_COLUMN_COUNTS.map((column) => ({ label: String(column), value: String(column) }))}
  value={String(dashboard.columns)}
  onChange={(value) => dashboard.commands.setColumns(Number(value))}
/>
<DashboardPreview dashboard={dashboard} showControls={false} />
```

Add the live ID switch, localized page metadata under `navParent: 레이아웃/Layout`, canonical path and search terms.

- [ ] **Step 4: Verify route, search, locale and geometry**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-layout-examples.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "column|컬럼|route|search"
npm run lint
```

Expected: focused cases PASS and exactly one Grid remains mounted.

- [ ] **Step 5: Commit**

```bash
git add example/src/playground/LayoutColumnsPlayground.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-layout-examples.spec.ts test/playwright/specs/playground-localization.spec.ts
git commit -m "feat: add dynamic column playground route"
```

---

### Task 7: Add the independent layout lock route

**Files:**
- Create: `example/src/playground/LayoutLockPlayground.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-layout-examples.spec.ts`

**Interfaces:**
- Produces: `PlaygroundExampleId = "advanced" | "layout" | "layout-columns" | "layout-lock" | "widget"` and `/examples/layout/lock`.
- Consumes: custom Widget delete action and shared interaction helpers.

- [ ] **Step 1: Write toggle and interaction RED tests**

```ts
test("uses one action-labelled lock toggle", async ({ page }) => {
  await page.goto("/examples/layout/lock");
  const lock = page.getByRole("button", { name: "레이아웃 잠금" });
  await expect(lock).toHaveAttribute("aria-pressed", "false");
  await lock.click();
  await expect(page.getByRole("button", { name: "레이아웃 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/상태:|잠금 상태/)).toHaveCount(0);
});

test("blocks move resize and delete until unlocked", async ({ page }) => {
  await page.goto("/examples/layout/lock");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  await page.getByRole("button", { name: "레이아웃 잠금" }).click();
  const before = await readWidgetGeometry(widget);
  await dragWidget(page, widget, 160, 100);
  await resizeWidget(page, widget, 120, 80);
  expect(await readWidgetGeometry(widget)).toEqual(before);
  await expect(widget.getByRole("button", { name: "위젯 1 삭제" })).toBeDisabled();
  await page.getByRole("button", { name: "레이아웃 잠금 해제" }).click();
  await widget.getByRole("button", { name: "위젯 1 삭제" }).click();
  await expect(widget).toHaveCount(0);
});
```

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-layout-examples.spec.ts --project=chromium --grep "lock toggle|blocks move"
```

Expected: route and one-toggle contract are absent.

- [ ] **Step 3: Implement one-state locking**

```tsx
const [locked, setLocked] = useState(false);

<button {...toggleStateProps(locked)} onClick={() => setLocked((value) => !value)}>
  {text(locked ? copy.unlockLayout : copy.lockLayout)}
</button>

<DashboardGrid
  editable={!locked}
  movable={!locked}
  resizable={!locked}
  renderWidgetActions={(widget) => (
    <button disabled={locked} onClick={() => dashboard.commands.removeWidget(widget.id)}>
      {text(copy.deleteWidget)}
    </button>
  )}
/>
```

Add route metadata and live mapping. CSS active state must use the shared toggle selector; locked Grid must not expose resize handles or a move cursor.

- [ ] **Step 4: Verify lock behavior**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-layout-examples.spec.ts --project=chromium
npm run lint
```

Expected: route, toggle, blocked interactions and re-enabled deletion PASS.

- [ ] **Step 5: Commit**

```bash
git add example/src/playground/LayoutLockPlayground.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts example/src/styles.css test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-layout-examples.spec.ts
git commit -m "feat: add layout lock playground route"
```

---

### Task 8: Refocus the canonical Advanced route on responsive and engine options

**Files:**
- Modify: `example/src/playground/AdvancedPlayground.tsx`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Create: `test/playwright/specs/playground-advanced-examples.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`

**Interfaces:**
- Produces: `/examples/advanced` as responsive/engine-options-only page.
- Consumes: supported `DashboardGridEngineOptions` and `DashboardResponsiveOptions`.

- [ ] **Step 1: Write engine control RED tests**

```ts
test("explains and changes supported engine options", async ({ page }) => {
  await page.goto("/examples/advanced");
  await expect(page.getByText("화면 너비에 따라 컬럼이 자동으로 변경됩니다.")).toBeVisible();
  await page.getByRole("button", { name: "Float 사용" }).click();
  await expect(page.getByRole("button", { name: "Float 해제" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "정적 모드 사용" }).click();
  await expect(page.locator(".grid-stack")).toHaveClass(/grid-stack-static/);
  const before = await page.locator(".grid-stack-item").first().boundingBox();
  await page.getByRole("combobox", { name: "셀 높이" }).selectOption("80");
  await expect.poll(async () => (await page.locator(".grid-stack-item").first().boundingBox())?.height)
    .not.toBe(before?.height);
});
```

```ts
await page.getByRole("combobox", { name: "여백" }).selectOption("12");
await page.getByRole("button", { name: "애니메이션 사용" }).click();
await expect(page.getByRole("button", { name: "애니메이션 해제" })).toHaveAttribute("aria-pressed", "true");
await page.getByRole("button", { name: "RTL 사용" }).click();
await expect(page.locator(".grid-stack")).toHaveClass(/grid-stack-rtl/);
await page.getByRole("button", { name: "콘텐츠 높이 사용" }).click();
await page.getByRole("combobox", { name: "행 제한" }).selectOption("two-eight");
await page.getByRole("button", { name: "반응형 컬럼 사용" }).click();
await page.setViewportSize({ width: 600, height: 900 });
await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", "6");
await expect(page.getByRole("button", { name: /compact|commit|Grid 정보/ })).toHaveCount(0);
await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
await expect(page.locator("[data-dashboard-drop-target]")).toHaveCount(0);
```

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "supported engine options"
```

Expected: current combined Advanced page lacks most controls and retains unrelated sections.

- [ ] **Step 3: Implement valid option groups**

Use exact control domains:

```ts
const cellHeights = [60, 80, 100] as const;
const margins = [4, 8, 12] as const;
const rowLimits = [
  { key: "none", minRow: 0, maxRow: 0 },
  { key: "two-eight", minRow: 2, maxRow: 8 },
  { key: "four-twelve", minRow: 4, maxRow: 12 },
] as const;
```

Build `engineOptions` from float, animate, staticGrid, rtl, sizeToContent, cellHeight, margin and selected valid row preset. Responsive toggle applies the existing breakpoint config. Every boolean label changes to its inverse action; no duplicate status sentence is rendered. Keep one Grid and explanatory copy beside each group.

- [ ] **Step 4: Migrate old Advanced combined-page tests**

Keep responsive/float assertions on `/examples/advanced`. Move Handle, state and external-drop expectations into Tasks 9–12. Delete only selectors for UI that the approved design intentionally removes.

- [ ] **Step 5: Verify the engine page**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium --grep "engine|responsive|Advanced|고급"
npm run lint
```

Expected: focused engine and locale cases PASS.

- [ ] **Step 6: Commit**

```bash
git add example/src/playground/AdvancedPlayground.tsx example/src/docs/content.tsx example/src/playground/copy.ts example/src/styles.css test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts
git commit -m "feat: focus advanced engine options example"
```

---

### Task 9: Add the official API Handle route

**Files:**
- Create: `example/src/playground/AdvancedHandlePlayground.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-advanced-examples.spec.ts`

**Interfaces:**
- Produces: `PlaygroundExampleId = "advanced" | "advanced-handle" | "layout" | "layout-columns" | "layout-lock" | "widget"` and `/examples/advanced/handle`.
- Consumes: `DashboardGridHandle.grid`, `refresh`, `compact`, `commitLayout`.

- [ ] **Step 1: Write safe/raw Handle RED tests**

```ts
test("runs safe Comins methods and official read APIs", async ({ page }) => {
  await page.goto("/examples/advanced/handle");
  await page.getByRole("button", { name: "Grid 정보 조회" }).click();
  await expect(page.getByRole("status", { name: "GridStack 조회 결과" })).toHaveText(/^column=12; row=\d+$/);
  await page.getByRole("button", { name: "compact 후 commit" }).click();
  await expect(page.getByRole("status", { name: "Handle 실행 결과" })).toContainText("commit");
});

test("changes cell height through layoutRef.current.grid", async ({ page }) => {
  await page.goto("/examples/advanced/handle");
  const before = await page.locator(".grid-stack-item").first().boundingBox();
  await page.getByRole("button", { name: "공식 API로 셀 높이 80 적용" }).click();
  const after = await page.locator(".grid-stack-item").first().boundingBox();
  expect(after?.height).not.toBe(before?.height);
});
```

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "Handle|layoutRef"
```

Expected: route redirects and Handle controls are absent.

- [ ] **Step 3: Implement the Handle page**

Use `const layoutRef = useRef<DashboardGridHandle>(null)` and the following handlers:

```ts
const queryGrid = () => {
  const grid = layoutRef.current?.grid;
  setQueryResult(grid ? `column=${grid.getColumn()}; row=${grid.getRow()}` : "not-ready");
};

const compactAndCommit = () => {
  const handle = layoutRef.current;
  if (!handle?.grid) return setHandleResult("not-ready");
  handle.compact("compact", true);
  const snapshot = handle.commitLayout();
  if (snapshot) dashboard.commands.applyLayoutSnapshot(snapshot);
  setHandleResult(snapshot ? "committed" : "not-ready");
};

const applyOfficialCellHeight = () => {
  const grid = layoutRef.current?.grid;
  if (!grid) return setHandleResult("not-ready");
  grid.cellHeight(80);
  setHandleResult("cell-height-80");
};
```

When unavailable, localize the semantic result key and leave Grid state unchanged. Do not expose raw add/remove/destroy buttons.

The article must show two code blocks and an explicit warning:

```tsx
layoutRef.current?.compact();
layoutRef.current?.commitLayout();

layoutRef.current?.grid?.getColumn();
layoutRef.current?.grid?.cellHeight(80);
```

- [ ] **Step 4: Verify route and runtime Handle**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "Handle|handle|Grid 정보"
npm run verify
```

Expected: public unit/build baseline and browser Handle cases PASS.

- [ ] **Step 5: Commit**

```bash
git add example/src/playground/AdvancedHandlePlayground.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-advanced-examples.spec.ts
git commit -m "feat: add official gridstack handle example"
```

---

### Task 10: Add full state and column-cache comparison route

**Files:**
- Create: `example/src/playground/AdvancedStatePlayground.tsx`
- Modify: `example/src/playground/components/LayoutJson.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/playground-advanced-examples.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`

**Interfaces:**
- Produces: `PlaygroundExampleId = "advanced" | "advanced-handle" | "advanced-state" | "layout" | "layout-columns" | "layout-lock" | "widget"` and `/examples/advanced/state`.
- Consumes: `sanitizeDashboardLayoutSnapshot`, `sanitizeExampleDashboardStateSnapshot`.
- Preserves: invalid JSON editor text and existing dashboard state.

- [ ] **Step 1: Write state-difference and fail-closed RED tests**

```ts
test("distinguishes layout snapshot from full state and column cache", async ({ page }) => {
  await page.goto("/examples/advanced/state");
  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const layout = JSON.parse(await page.getByLabel("레이아웃 JSON").inputValue());
  const state = JSON.parse(await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue());
  expect(layout).toEqual(expect.objectContaining({ columns: 12, widgets: expect.any(Array) }));
  expect(layout).not.toHaveProperty("layoutsByColumn");
  expect(state).toHaveProperty("layoutsByColumn.12");
  expect(state.widgets[0]).toHaveProperty("data.colorKey");
});

test("keeps editor and geometry when nested state is invalid", async ({ page }) => {
  await page.goto("/examples/advanced/state");
  const before = await readDashboardGeometry(page);
  const invalid = '{"columns":12,"widgets":[{"data":{"colorKey":{}}}]}';
  await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").fill(invalid);
  await page.getByRole("button", { name: "전체 상태 복원" }).click();
  await expect(page.getByLabel("전체 상태 및 컬럼 캐시 JSON")).toHaveValue(invalid);
  expect(await readDashboardGeometry(page)).toEqual(before);
});
```

Add 12→6→12 assertions that `layoutsByColumn` contains independent `6` and `12` entries and restores the original 12-column geometry.

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "layout snapshot|nested state"
```

Expected: route and comparison editors are absent.

- [ ] **Step 3: Implement the two persistence flows**

- Layout save serializes `serializeLayout`; restore parses through `sanitizeDashboardLayoutSnapshot` then calls `applyLayoutSnapshot`.
- Full-state save serializes `serializeState`; restore parses through `sanitizeExampleDashboardStateSnapshot` then calls `restoreLayout`.
- Column Select calls `setColumns` and allows 12→6→12 cache demonstration.
- Both JSON panels use `<details>` collapsed initially; opening one does not remount Grid.
- Errors use semantic enum state, never echo raw input into status or console.
- Descriptive table explains geometry-only, full state and per-column cache.

Use these exact restoration handlers:

```ts
const restoreLayoutSnapshot = () => {
  try {
    const snapshot = sanitizeDashboardLayoutSnapshot(JSON.parse(layoutJson));
    if (!snapshot) return setLayoutStatus("invalid");
    dashboard.commands.applyLayoutSnapshot(snapshot);
    setLayoutStatus("restored");
  } catch {
    setLayoutStatus("invalid");
  }
};

const restoreFullState = () => {
  try {
    const snapshot = sanitizeExampleDashboardStateSnapshot(JSON.parse(fullStateJson));
    if (!snapshot) return setFullStateStatus("invalid");
    dashboard.commands.restoreLayout(snapshot);
    setFullStateStatus("restored");
  } catch {
    setFullStateStatus("invalid");
  }
};
```

- [ ] **Step 4: Move and update prior persistence tests**

Move old Layout/Advanced combined persistence cases to `/examples/advanced/state`. Keep the existing invalid geometry, unsupported column, prototype-like key, active-cache authority and locale-preservation assertions.

- [ ] **Step 5: Verify state and localization contracts**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts --project=chromium --grep "state|cache|JSON|상태|캐시"
npm run test:run -- test/vitest/playground-state-snapshot.test.ts
npm run lint
```

Expected: browser state tests, sanitizer unit tests and typecheck PASS.

- [ ] **Step 6: Commit**

```bash
git add example/src/playground/AdvancedStatePlayground.tsx example/src/playground/components/LayoutJson.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts example/src/styles.css test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts
git commit -m "feat: add state and column cache example"
```

---

### Task 11: Add the bounded event example

**Files:**
- Create: `example/src/playground/event-log.ts`
- Create: `example/src/playground/AdvancedEventsPlayground.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Modify: `test/vitest/playground-widget-data.test.ts`
- Modify: `test/playwright/specs/playground-advanced-examples.spec.ts`

**Interfaces:**
- Produces: `PlaygroundEventEntry` and `appendBoundedEvent(entries, entry, limit = 10)`.
- Produces: `PlaygroundExampleId = "advanced" | "advanced-events" | "advanced-handle" | "advanced-state" | "layout" | "layout-columns" | "layout-lock" | "widget"` and `/examples/advanced/events`.
- Consumes: public column, layout, drag and resize callbacks.

- [ ] **Step 1: Write bounded-log RED test**

```ts
it("keeps the newest ten serializable events", () => {
  const events = Array.from({ length: 12 }, (_, index) => ({ name: "columns" as const, columns: index + 1 }));
  const result = events.reduce((log, event) => appendBoundedEvent(log, event, 10), [] as PlaygroundEventEntry[]);
  expect(result).toHaveLength(10);
  expect(result[0]).toEqual({ name: "columns", columns: 3 });
  expect(result[9]).toEqual({ name: "columns", columns: 12 });
});
```

- [ ] **Step 2: Write event page RED test**

```ts
test("logs columns, drag, resize frame and commit events", async ({ page }) => {
  await page.goto("/examples/advanced/events");
  await page.getByRole("combobox", { name: "레이아웃 컬럼" }).selectOption("6");
  await expect(page.getByRole("log")).toContainText("onColumnsChange");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  await dragWidget(page, widget, 160, 100);
  await expect(page.getByRole("log")).toContainText("onWidgetDragStart");
  await expect(page.getByRole("log")).toContainText("onWidgetDragStop");
  await expect(page.getByRole("log")).toContainText("onLayoutCommit");
  await resizeWidget(page, widget, 120, 80);
  await expect(page.getByRole("log")).toContainText("onWidgetResizeFrame");
});
```

- [ ] **Step 3: Run RED tests**

Run:

```bash
npm run test:run -- test/vitest/playground-widget-data.test.ts
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "logs columns"
```

Expected: event helper and route are absent.

- [ ] **Step 4: Implement event normalization and page**

Use a discriminated union containing only finite serializable values for `columns`, `id`, `x`, `y`, `w`, `h`, `width`, `height`. Append immutably and retain the newest ten. The page connects:

```tsx
onColumnsChange={(columns) => {
  dashboard.commands.setColumns(columns);
  record({ name: "onColumnsChange", columns });
}}
onLayoutCommit={(snapshot) => {
  dashboard.commands.applyLayoutSnapshot(snapshot);
  record({ name: "onLayoutCommit", columns: snapshot.columns });
}}
onWidgetDragStart={(event) => recordInteraction("onWidgetDragStart", event)}
onWidgetDragStop={(event) => recordInteraction("onWidgetDragStop", event)}
onWidgetResizeStart={(event) => recordInteraction("onWidgetResizeStart", event)}
onWidgetResizeStop={(event) => recordInteraction("onWidgetResizeStop", event)}
onWidgetResizeFrame={(event) => record({ name: "onWidgetResizeFrame", ...event })}
```

Render an `aria-live="polite" role="log"` list with newest event last. Do not include external-drop here.

- [ ] **Step 5: Verify event route**

Run:

```bash
npm run test:run -- test/vitest/playground-widget-data.test.ts
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "event|이벤트|logs columns"
npm run lint
```

Expected: bounded unit and interaction browser cases PASS.

- [ ] **Step 6: Commit**

```bash
git add example/src/playground/event-log.ts example/src/playground/AdvancedEventsPlayground.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts example/src/styles.css test/vitest/playground-widget-data.test.ts test/playwright/specs/playground-advanced-examples.spec.ts
git commit -m "feat: add dashboard event playground"
```

---

### Task 12: Move external drop into its independent route

**Files:**
- Create: `example/src/playground/AdvancedExternalDropPlayground.tsx`
- Modify: `example/src/docs/types.ts`
- Modify: `example/src/docs/content.tsx`
- Modify: `example/src/docs/DocsShell.tsx`
- Modify: `example/src/main.tsx`
- Modify: `example/src/playground/copy.ts`
- Modify: `example/src/styles.css`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-advanced-examples.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`

**Interfaces:**
- Produces: final `PlaygroundExampleId = "advanced" | "advanced-events" | "advanced-external-drop" | "advanced-handle" | "advanced-state" | "layout" | "layout-columns" | "layout-lock" | "widget"` and `/examples/advanced/external-drop`.
- Consumes: `DashboardExternalDropTarget`, `DashboardWidgetExternalDropEvent` and controlled removal command.

- [ ] **Step 1: Write external-drop route RED test**

```ts
test("records external drop and updates controlled state", async ({ page }) => {
  await page.goto("/examples/advanced/external-drop");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  const target = page.locator("[data-dashboard-drop-target='trash']");
  await dragWidgetToTarget(page, widget, target);
  await expect(widget).toHaveCount(0);
  await expect(page.getByRole("log")).toContainText("target=trash");
  await expect(page.getByRole("log")).toContainText("widget=widget-1");
});
```

Add localized explanation assertions for selector scope, consumer state ownership, duplicate ID and invalid selector behavior.

- [ ] **Step 2: Run Chromium and verify RED**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts --project=chromium --grep "external drop"
```

Expected: route redirects and target/log are absent.

- [ ] **Step 3: Implement the controlled external-drop page**

Move the existing trash target and use this controlled handler:

```ts
const handleWidgetExternalDrop = (event: DashboardWidgetExternalDropEvent) => {
  if (event.targetId !== "trash") return;
  setEvents((current) => appendBoundedEvent(current, {
    name: "onWidgetExternalDrop",
    targetId: event.targetId,
    widgetId: event.widgetId,
    columns: event.columns,
    ...event.layout,
  }));
  dashboard.commands.removeWidget(event.widgetId);
};
```

Keep the 300×300 target within the article on mobile and one Grid on the route.

- [ ] **Step 4: Migrate external-drop tests to the canonical child route**

Update old `/examples/advanced` assumptions in all three existing specs. Preserve pointer/touch payload, descendant target, outside target, invalid selector, duplicate ID and controlled deletion coverage. Package-level consumer fixtures remain unchanged; only docs Playground URLs/selectors move.

- [ ] **Step 5: Verify external drop and regression scope**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts --project=chromium --grep "external|drop|외부"
npm run lint
```

Expected: focused external-drop behavior PASS without no-op tests.

- [ ] **Step 6: Commit**

```bash
git add example/src/playground/AdvancedExternalDropPlayground.tsx example/src/docs/types.ts example/src/docs/content.tsx example/src/docs/DocsShell.tsx example/src/main.tsx example/src/playground/copy.ts example/src/styles.css test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts
git commit -m "feat: add external drop playground route"
```

---

### Task 13: Close documentation, cross-engine regression and final evidence

**Files:**
- Modify: `README.md`
- Modify: `docs/03-component-api-draft.md`
- Modify: `example/src/docs/content.tsx`
- Modify: `test/vitest/readme.test.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/playground-localization.spec.ts`
- Modify: `test/playwright/specs/playground.spec.ts`
- Modify: `test/playwright/specs/dashboard-grid.spec.ts`
- Create: `reports/2026-08-14.md`

**Interfaces:**
- Documents: `renderWidgetActions`, `DashboardGridHandle.grid`, default fallback and raw mutation warning.
- Verifies: every canonical route, locale, responsive toolbar and affected public/browser contract.

- [ ] **Step 1: Write documentation RED assertions**

```ts
it("documents custom header actions and the live grid property", () => {
  for (const name of ["renderWidgetActions", "grid", "getGridStack"]) {
    expect(readme).toContain(`\`${name}\``);
  }
  expect(readme).toContain("raw GridStack add/remove/destroy");
  expect(readme).toContain("controlled React state can diverge");
});
```

- [ ] **Step 2: Run README test and verify RED**

Run:

```bash
npm run test:run -- test/vitest/readme.test.ts
```

Expected: `renderWidgetActions`, `grid` property and divergence text are missing.

- [ ] **Step 3: Update public documentation**

Document this exact usage and boundary in README, API draft and localized API page:

```tsx
<DashboardGrid
  ref={layoutRef}
  renderWidgetActions={(widget) => <WidgetActions widget={widget} />}
  renderWidget={(widget) => <WidgetContent widget={widget} />}
/>

layoutRef.current?.compact();
layoutRef.current?.grid?.getColumn();
```

State that `renderWidgetActions` overrides defaults, `showControls={false}` hides all actions, `getGridStack()` remains compatible, and raw add/remove/destroy can diverge from controlled React state.

- [ ] **Step 4: Run every focused suite once before the full gate**

Run:

```bash
npm run test:run -- test/vitest/dashboard-grid-handle.test.tsx test/vitest/dashboard-grid-actions.test.tsx test/vitest/playground-widget-data.test.ts test/vitest/playground-state-snapshot.test.ts test/vitest/readme.test.ts
COMINS_GRID_LAYOUT_PORT=6031 npm run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-widget.spec.ts test/playwright/specs/playground-layout-examples.spec.ts test/playwright/specs/playground-advanced-examples.spec.ts test/playwright/specs/playground-localization.spec.ts --project=chromium --project=mobile-chrome
```

Expected: focused unit, desktop Chromium and mobile Chrome suites PASS. If a case fails, classify product/test/environment, make the smallest correction and rerun only the failed focused command.

- [ ] **Step 5: Inspect desktop and mobile Chrome in both locales**

Start the existing local Playground and verify these 18 route/locale combinations without changing persistent browser security settings:

```text
/examples/widget
/examples/layout
/examples/layout/columns
/examples/layout/lock
/examples/advanced
/examples/advanced/handle
/examples/advanced/state
/examples/advanced/events
/examples/advanced/external-drop
```

At 1280×900 and 360×800 confirm one Grid, no root horizontal overflow, top locale left of search, grouped toolbar containment, readable pastel contrast, visible drop target and collapsed state editors. Record exact observations in `reports/2026-08-14.md`.

- [ ] **Step 6: Run the final full gate exactly once**

Run:

```bash
COMINS_GRID_LAYOUT_PORT=6031 npm run verify:full
```

Expected: security 25 tests, license, typecheck, all Vitest, build and all configured Playwright projects PASS with only intentional project-policy skips. Record actual counts rather than copying historical counts.

If the single full run fails, do not launch a second full run. Fix the classified cause, run `npm run verify` for package changes and the exact failed Playwright project/spec for browser changes, then document the initial full result plus targeted closure.

- [ ] **Step 7: Write the implementation report**

`reports/2026-08-14.md` must contain:

```markdown
# 2026-08-14 Playground example expansion

## Summary
## Changed files
## TDD RED evidence
## Focused GREEN evidence
## Final full gate
## Desktop and mobile visual review
## Residual risks
```

Residual risks must explicitly distinguish Playwright WebKit from real Safari and state whether push, PR and publish were performed.

- [ ] **Step 8: Self-review the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- src example test README.md docs/03-component-api-draft.md reports/2026-08-14.md
```

Confirm no generated Playwright artifacts, screenshots, local URLs, secrets, unrelated formatting or package changes are tracked.

- [ ] **Step 9: Commit final documentation and evidence**

```bash
git add README.md docs/03-component-api-draft.md example/src/docs/content.tsx test/vitest/readme.test.ts test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/playground-localization.spec.ts test/playwright/specs/playground.spec.ts test/playwright/specs/dashboard-grid.spec.ts reports/2026-08-14.md
git commit -m "docs: close playground example verification"
```

- [ ] **Step 10: Confirm the local handoff state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -15
```

Expected: tracked worktree clean, local branch ahead of `origin/main`, and no push, PR, tag or publish performed.
