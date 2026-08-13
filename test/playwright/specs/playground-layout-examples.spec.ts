import { expect, test } from "@playwright/test";

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
  const scattered = await readDashboardGeometry(page);
  expect(scattered).not.toEqual(beforeArrange);

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
