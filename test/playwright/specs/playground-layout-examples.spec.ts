import { expect, test, type Locator } from "@playwright/test";

import {
  dragWidget,
  readDashboardGeometry,
  readWidgetGeometry,
  resizeWidget,
  type WidgetGeometry,
} from "../helpers/dashboard-interactions";

const initialGeometry: WidgetGeometry[] = [
  { h: 2, id: "sales", w: 3, x: 0, y: 0 },
  { h: 2, id: "traffic", w: 5, x: 3, y: 0 },
  { h: 3, id: "orders", w: 4, x: 8, y: 0 },
  { h: 2, id: "alerts", w: 6, x: 0, y: 3 },
  { h: 3, id: "inventory", w: 3, x: 6, y: 3 },
  { h: 2, id: "conversion", w: 3, x: 9, y: 3 },
];

function expectValidGeometry(geometry: WidgetGeometry[]) {
  for (const widget of geometry) {
    expect(widget.x).toBeGreaterThanOrEqual(0);
    expect(widget.y).toBeGreaterThanOrEqual(0);
    expect(widget.w).toBeGreaterThan(0);
    expect(widget.h).toBeGreaterThan(0);
    expect(widget.x + widget.w).toBeLessThanOrEqual(12);
  }
}

async function readGridInteractionState(widget: Locator) {
  return widget.evaluate((element) => {
    const gridElement = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & {
      gridstack?: { opts?: { disableDrag?: boolean; disableResize?: boolean } };
    }) | null;
    const gridItem = element as HTMLElement & {
      gridstackNode?: { noMove?: boolean; noResize?: boolean };
    };
    const grid = gridElement?.gridstack;
    const node = gridItem.gridstackNode;
    const serializeBoolean = (value: boolean | undefined) => (
      typeof value === "boolean"
        ? { kind: "boolean" as const, value }
        : { kind: "undefined" as const }
    );

    return {
      disableDrag: serializeBoolean(grid?.opts?.disableDrag),
      disableResize: serializeBoolean(grid?.opts?.disableResize),
      engineReady: Boolean(grid),
      noMove: serializeBoolean(node?.noMove),
      noResize: serializeBoolean(node?.noResize),
      widgetNodeReady: Boolean(node),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/examples/layout");
});

test("shows only the requested grouped toolbar", async ({ page }) => {
  for (const name of ["위젯 추가", "전체 삭제", "레이아웃 저장", "레이아웃 복원", "자동 정렬", "공간 채우기", "초기화"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "레이아웃 복원", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "컬럼 선택" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveCount(0);
  await expect(page.locator('[role="status"]')).toHaveCount(0);
  await expect(page.locator(".grid-stack-item")).toHaveCount(6);

  const groups = page.locator(".playground-layout-toolbar .example-toolbar-group");
  await expect(groups).toHaveCount(4);
  expect(await groups.nth(0).getByRole("button").allTextContents()).toEqual(["위젯 추가", "전체 삭제"]);
  expect(await groups.nth(1).getByRole("button").allTextContents()).toEqual(["레이아웃 저장", "레이아웃 복원"]);
  expect(await groups.nth(2).getByRole("button").allTextContents()).toEqual(["자동 정렬", "공간 채우기"]);
  expect(await groups.nth(3).getByRole("button").allTextContents()).toEqual(["초기화"]);
});

test("restores the exact saved geometry after drag and resize", async ({ page }) => {
  await page.getByRole("button", { name: "레이아웃 저장", exact: true }).click();
  const before = await readDashboardGeometry(page);

  const firstWidget = page.getByTestId("dashboard-widget-sales");
  const beforeDrag = await readWidgetGeometry(firstWidget);
  await dragWidget(page, firstWidget, 180, 120);
  await expect.poll(async () => {
    const afterDrag = await readWidgetGeometry(firstWidget);
    return afterDrag.x !== beforeDrag.x || afterDrag.y !== beforeDrag.y;
  }).toBe(true);

  const secondWidget = page.getByTestId("dashboard-widget-traffic");
  const beforeResize = await readWidgetGeometry(secondWidget);
  await resizeWidget(page, secondWidget, 120, 80);
  await expect.poll(async () => {
    const afterResize = await readWidgetGeometry(secondWidget);
    return afterResize.w !== beforeResize.w || afterResize.h !== beforeResize.h;
  }).toBe(true);

  await expect.poll(() => readDashboardGeometry(page)).not.toEqual(before);

  await page.getByRole("button", { name: "레이아웃 복원", exact: true }).click();
  await expect.poll(() => readDashboardGeometry(page)).toEqual(before);
});

test("arrange and fill each produce changed valid geometry", async ({ page }) => {
  const beforeArrange = await readDashboardGeometry(page);
  await dragWidget(page, page.getByTestId("dashboard-widget-alerts"), 180, 200);
  await expect.poll(() => readDashboardGeometry(page)).not.toEqual(beforeArrange);
  const scattered = await readDashboardGeometry(page);

  await page.getByRole("button", { name: "자동 정렬", exact: true }).click();
  await expect.poll(() => readDashboardGeometry(page)).not.toEqual(scattered);
  expectValidGeometry(await readDashboardGeometry(page));

  await page.getByTestId("dashboard-widget-sales").getByRole("button", { name: "매출 삭제" }).click();
  const gapped = await readDashboardGeometry(page);
  await page.getByRole("button", { name: "공간 채우기", exact: true }).click();
  await expect.poll(() => readDashboardGeometry(page)).not.toEqual(gapped);
  expectValidGeometry(await readDashboardGeometry(page));
});

test("reset restores six initial widgets and clears the saved snapshot", async ({ page }) => {
  await page.getByRole("button", { name: "레이아웃 저장", exact: true }).click();
  await page.getByTestId("dashboard-widget-sales").getByRole("button", { name: "매출 삭제" }).click();
  await page.getByRole("button", { name: "위젯 추가", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").fill("임시 위젯");
  await dialog.getByLabel("값").fill("7");
  await dialog.getByRole("button", { name: "위젯 저장" }).click();

  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect.poll(() => readDashboardGeometry(page)).toEqual(initialGeometry);
  await expect(page.getByRole("button", { name: "레이아웃 복원", exact: true })).toBeDisabled();
  await expect(page.getByTestId("dashboard-widget-widget-7")).toHaveCount(0);
});

test("locale changes do not discard the saved snapshot", async ({ page }) => {
  await page.getByRole("button", { name: "레이아웃 저장", exact: true }).click();
  const saved = await readDashboardGeometry(page);
  await dragWidget(page, page.getByTestId("dashboard-widget-sales"), 180, 120);
  await expect.poll(() => readDashboardGeometry(page)).not.toEqual(saved);

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(page.getByRole("button", { name: "Restore layout", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Restore layout", exact: true }).click();
  await expect.poll(() => readDashboardGeometry(page)).toEqual(saved);
});

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

test("uses one action-labelled lock toggle", async ({ page }) => {
  await page.goto("/examples/layout/lock");

  const controls = page.getByRole("region", { name: "레이아웃 잠금 컨트롤" });
  const lock = controls.getByRole("button", { name: "레이아웃 잠금", exact: true });
  await expect(controls.getByRole("button")).toHaveCount(1);
  await expect(lock).toHaveAttribute("aria-pressed", "false");
  await expect(lock).toHaveAttribute("data-active", "false");

  await lock.click();

  const unlock = controls.getByRole("button", { name: "레이아웃 잠금 해제", exact: true });
  await expect(controls.getByRole("button")).toHaveCount(1);
  await expect(unlock).toHaveAttribute("aria-pressed", "true");
  await expect(unlock).toHaveAttribute("data-active", "true");
  await expect(unlock).toHaveCSS("background-color", "rgb(16, 185, 129)");
  await expect(page.getByText(/상태:|잠금 상태/)).toHaveCount(0);

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(
    page.getByRole("region", { name: "Layout lock controls" }).getByRole("button", { name: "Unlock layout", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("blocks move and delete until unlocked", async ({ page }) => {
  await page.goto("/examples/layout/lock");

  const movableWidget = page.getByTestId("dashboard-widget-sales");
  await page.getByRole("button", { name: "레이아웃 잠금", exact: true }).click();
  await expect.poll(() => readGridInteractionState(movableWidget)).toMatchObject({
    disableDrag: { kind: "boolean", value: true },
    engineReady: true,
    noMove: { kind: "boolean", value: true },
    widgetNodeReady: true,
  });
  await expect(movableWidget.locator(".grid-stack-item-content")).toHaveCSS("cursor", "default");

  const beforeMove = await readWidgetGeometry(movableWidget);
  await dragWidget(page, movableWidget, 180, 120);
  await expect.poll(() => readWidgetGeometry(movableWidget)).toEqual(beforeMove);

  const deleteButton = movableWidget.getByRole("button", { name: "위젯 1 삭제", exact: true });
  await expect(deleteButton).toBeDisabled();

  await page.getByRole("button", { name: "레이아웃 잠금 해제", exact: true }).click();
  await expect.poll(() => readGridInteractionState(movableWidget)).toMatchObject({
    disableDrag: { kind: "undefined" },
    engineReady: true,
    noMove: { kind: "undefined" },
    widgetNodeReady: true,
  });

  await dragWidget(page, movableWidget, 180, 120);
  await expect.poll(async () => {
    const afterMove = await readWidgetGeometry(movableWidget);
    return afterMove.x !== beforeMove.x || afterMove.y !== beforeMove.y;
  }).toBe(true);

  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await expect(movableWidget).toHaveCount(0);
});

test("blocks resize until unlocked", async ({ page }) => {
  await page.goto("/examples/layout/lock");

  const resizableWidget = page.getByTestId("dashboard-widget-traffic");
  await page.getByRole("button", { name: "레이아웃 잠금", exact: true }).click();
  await expect.poll(() => readGridInteractionState(resizableWidget)).toMatchObject({
    disableResize: { kind: "boolean", value: true },
    engineReady: true,
    noResize: { kind: "boolean", value: true },
    widgetNodeReady: true,
  });

  const beforeResize = await readWidgetGeometry(resizableWidget);
  await expect(resizableWidget.locator(".ui-resizable-se")).toBeHidden();
  const resizeBox = await resizableWidget.boundingBox();
  expect(resizeBox).not.toBeNull();
  await page.mouse.move(resizeBox!.x + resizeBox!.width - 2, resizeBox!.y + resizeBox!.height - 2);
  await page.mouse.down();
  await page.mouse.move(resizeBox!.x + resizeBox!.width + 120, resizeBox!.y + resizeBox!.height + 80, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => readWidgetGeometry(resizableWidget)).toEqual(beforeResize);

  await page.getByRole("button", { name: "레이아웃 잠금 해제", exact: true }).click();
  await expect.poll(() => readGridInteractionState(resizableWidget)).toMatchObject({
    disableResize: { kind: "undefined" },
    engineReady: true,
    noResize: { kind: "undefined" },
    widgetNodeReady: true,
  });
  await resizableWidget.hover();
  await expect(resizableWidget.locator(".ui-resizable-se")).toBeVisible();

  await resizeWidget(page, resizableWidget, 120, 80);
  await expect.poll(async () => {
    const afterResize = await readWidgetGeometry(resizableWidget);
    return afterResize.w !== beforeResize.w || afterResize.h !== beforeResize.h;
  }).toBe(true);
});
