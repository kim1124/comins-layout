import { expect, test, type Locator, type Page } from "@playwright/test";
import { openDashboardFixture } from "../framework-fixtures";
import { performTouchGesture } from "../touch-gesture";
import { verifyDashboardResourceStability } from "../resource-probe";

test("Vue 100-widget resource stability @resource-stability", async ({ page }, testInfo) => {
  await verifyDashboardResourceStability(page, testInfo, "vue");
});

const mainGrid = (page: Page) => page.locator('[data-testid="dashboard-grid"]').first();
const mainWidget = (page: Page) => mainGrid(page).locator('[data-widget-id="a"]');
async function drag(page: Page, from: Locator, to: Locator) {
  await from.scrollIntoViewIfNeeded();
  const a = await from.boundingBox(), b = await to.boundingBox();
  if (!a || !b) throw new Error("missing drag geometry");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(60, b.height / 2), { steps: 20 });
  await page.mouse.up();
  // The adapter commits/rolls back at dragstop's next frame. Observe that
  // boundary before starting another drag or reading a controlled snapshot.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function gesture(page: Page, target: Locator, x: number, y: number) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("missing gesture geometry");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + x, box.y + box.height / 2 + y, { steps: 12 });
  await page.mouse.up();
}

for (const framework of ["react", "vue"] as const) {
  test(`${framework} restores column-specific layouts through all 12 columns @firefox-parity`, async ({ page }) => {
    await openDashboardFixture(page, framework);
    const grid = mainGrid(page), initial = await grid.locator(":scope > .grid-stack-item").count();
    for (let column = 1; column <= 12; column++) {
      await page.getByRole("combobox", { name: "컬럼 선택", exact: true }).selectOption(String(column));
      await expect(grid).toHaveAttribute("data-columns", String(column));
      await expect(grid.locator(":scope > .grid-stack-item")).toHaveCount(initial);
    }
  });
}

test.describe("Vue feature parity", () => {
  test.beforeEach(async ({ page }) => openDashboardFixture(page, "vue"));
  test("CRUD, actions, arrange, fill and state save/restore", async ({ page }) => {
    const grid = mainGrid(page), widget = mainWidget(page);
    await page.getByRole("button", { name: "Add widget", exact: true }).click();
    await expect(grid.locator(":scope > .grid-stack-item")).toHaveCount(3);
    await page.getByRole("button", { name: "Update data", exact: true }).click();
    await expect(widget.locator('[data-test="value"]')).toHaveText("200");
    await page.getByRole("button", { name: "API size 4×3", exact: true }).click();
    await expect(widget).toHaveAttribute("data-layout-w", "4");
    await widget.getByRole("button", { name: "Alpha 복원", exact: true }).click();
    await page.getByRole("button", { name: "API size 3×1", exact: true }).click();
    await expect(widget).toHaveAttribute("data-layout-h", "1");
    await widget.getByRole("button", { name: "Alpha 복원", exact: true }).click();
    await page.getByRole("button", { name: "Arrange", exact: true }).click();
    await page.getByRole("button", { name: "Fill", exact: true }).click();
    await page.getByRole("button", { name: "Save state", exact: true }).click();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(grid.locator(":scope > .grid-stack-item")).toHaveCount(0);
    await page.getByRole("button", { name: "전체 상태 복원", exact: true }).click();
    await expect(grid.locator(":scope > .grid-stack-item")).toHaveCount(3);
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(grid.locator(":scope > .grid-stack-item")).toHaveCount(2);
    await widget.getByRole("button", { name: "Alpha 삭제", exact: true }).click();
    await expect(widget).toHaveCount(0);
  });
  test("mouse drag/resize emit ordered lifecycle events @firefox-parity", async ({ page }) => {
    const widget = mainWidget(page);
    await gesture(page, widget.locator(".comins-grid-layout-widget__title"), 150, 60);
    await expect(page.locator('[data-test="events"]')).toContainText("beforeMove,move");
    await expect(page.locator('[data-test="events"]')).toContainText("layoutCommit,afterMove");
    await widget.hover();
    await gesture(page, widget.locator(".ui-resizable-se"), 80, 60);
    await expect(page.locator('[data-test="events"]')).toContainText("beforeResize,resize");
    await expect(page.locator('[data-test="events"]')).toContainText("layoutCommit,afterResize");
  });
  test("interaction locks and responsive strategies preserve controlled geometry", async ({ page }) => {
    const widget = mainWidget(page);
    for (const lock of ["Static", "Editable", "Movable", "Widget lock"]) {
      await page.getByRole("button", { name: lock, exact: true }).click();
      const before = await widget.getAttribute("gs-x");
      await gesture(page, widget.locator(".comins-grid-layout-widget__title"), 150, 0);
      await expect(widget).toHaveAttribute("gs-x", before!);
      await page.getByRole("button", { name: lock, exact: true }).click();
    }
    for (const mode of ["columnWidth", "breakpoints", "none"]) {
      await page.getByLabel("Responsive mode", { exact: true }).selectOption(mode);
      await page.getByRole("button", { name: "Narrow", exact: true }).click();
      await expect(mainGrid(page)).toHaveAttribute("data-columns", /^[1-6]$/);
      await page.getByRole("button", { name: "Wide", exact: true }).click();
    }
  });
  test("intrinsic sizing and nested grids remain independent", async ({ page }) => {
    await page.getByRole("button", { name: "Content sizing", exact: true }).click();
    const widget = mainWidget(page);
    const before = await widget.boundingBox();
    await page.getByRole("button", { name: "Grow content", exact: true }).click();
    await expect.poll(async () => (await widget.boundingBox())!.height).toBeGreaterThan(before!.height);
    await page.getByRole("button", { name: "Shrink content", exact: true }).click();
    await page.getByRole("button", { name: "Nested", exact: true }).click();
    await expect(widget.locator('[data-testid="dashboard-grid"]')).toHaveCount(1);
    await widget.locator('[data-widget-id="child"]').getByRole("button", { name: "Child 삭제" }).click();
    await expect(widget.locator('[data-widget-id="child"]')).toHaveCount(0);
    await expect(widget).toHaveCount(1);
  });
  test("copy uses latest data, rejects duplicates, and supports move/palette/trash @firefox-parity", async ({ page }) => {
    await page.getByRole("button", { name: "Transfer", exact: true }).click();
    const target = page.locator('[data-grid-id="target"]');
    await page.getByRole("button", { name: "Update data", exact: true }).click();
    await drag(page, mainWidget(page).locator(".comins-grid-layout-widget__title"), target);
    await expect(target.locator('[data-widget-id="a"] [data-test="value"]')).toHaveText("200");
    await expect(mainWidget(page)).toHaveCount(1);
    const before = await page.locator('[data-test="snapshots"]').textContent();
    await drag(page, mainWidget(page).locator(".comins-grid-layout-widget__title"), target);
    await expect(page.locator('[data-test="snapshots"]')).toHaveText(before!);
    await page.getByRole("button", { name: "Clear target", exact: true }).click();
    await page.getByLabel("Transfer mode").selectOption("move");
    await drag(page, mainWidget(page).locator(".comins-grid-layout-widget__title"), target);
    await expect(mainWidget(page)).toHaveCount(0);
    await drag(page, page.getByRole("button", { name: "Palette", exact: true }), target);
    await expect(target.locator('[data-widget-id="palette-1"]')).toHaveCount(1);
    await drag(page, target.locator('[data-widget-id="a"] .comins-grid-layout-widget__title'), page.locator("#parity-trash"));
    await expect(target.locator('[data-widget-id="a"]')).toHaveCount(0);
  });
  test("native touch controls and gestures @mobile-touch", async ({ page }) => {
    await page.getByRole("combobox", { name: "컬럼 선택", exact: true }).selectOption("4");
    const widget = mainWidget(page);
    await page.getByRole("button", { name: "API size 3×1", exact: true }).tap();
    await expect(widget).toHaveAttribute("data-layout-h", "1");
    await widget.getByRole("button", { name: "Alpha 복원", exact: true }).tap();
    await performTouchGesture(page, widget.locator(".comins-grid-layout-widget__title"), { x: 20, y: 120 });
    await expect(page.locator('[data-test="events"]')).toContainText("afterMove");
    await performTouchGesture(page, widget.locator(".ui-resizable-se"), { x: 30, y: 70 });
    await expect(page.locator('[data-test="events"]')).toContainText("afterResize");
  });
});
