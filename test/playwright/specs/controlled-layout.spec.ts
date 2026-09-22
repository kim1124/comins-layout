import { expect, test, type Locator, type Page } from "@playwright/test";
import type { GridItemHTMLElement } from "gridstack";

async function readGeometry(page: Page) {
  return page.locator(".comins-grid-layout > .grid-stack-item").evaluateAll((items) => items.map((item) => {
    const node = (item as GridItemHTMLElement).gridstackNode;
    return {
      id: item.getAttribute("data-widget-id"),
      state: ["x", "y", "w", "h"].map((key) => Number(item.getAttribute(`data-layout-${key}`))),
      engine: node ? [node.x ?? 0, node.y ?? 0, node.w ?? 1, node.h ?? 1] : [],
    };
  }).sort((a, b) => a.id!.localeCompare(b.id!)));
}

async function expectSynchronized(page: Page) {
  await expect.poll(async () => (await readGeometry(page)).filter(({ state, engine }) =>
    JSON.stringify(state) !== JSON.stringify(engine))).toEqual([]);
}

async function removeGaps(page: Page) {
  for (const id of [2, 5]) await page.getByRole("button", { name: `Title ${id} 삭제`, exact: true }).click();
}

async function resize(page: Page, widget: Locator, dy: number) {
  await widget.scrollIntoViewIfNeeded();
  await widget.hover();
  const box = await widget.locator(".ui-resizable-se").boundingBox();
  if (!box) throw new Error("Missing resize handle");
  expect(box.y + box.height / 2 + dy, "resize target must stay inside the browser viewport").toBeLessThan(page.viewportSize()!.height);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + dy, { steps: 12 });
  await page.mouse.up();
}

test("persists the compacted engine layout after controlled removal", async ({ page }) => {
  await page.goto("/examples/layout/persistence");
  await removeGaps(page);
  await expectSynchronized(page);
  await page.getByRole("button", { name: "레이아웃 저장", exact: true }).click();
  const saved = JSON.parse(await page.getByRole("textbox", { name: "마지막 저장 레이아웃 JSON" }).inputValue());
  for (const item of await readGeometry(page)) {
    const layout = saved.widgets.find((w: { id: string }) => w.id === item.id).layout;
    expect([layout.x, layout.y, layout.w, layout.h]).toEqual(item.engine);
  }
});

test("applies arrange atomically while retaining widget DOM and content", { tag: "@firefox-parity" }, async ({ page }) => {
  await page.goto("/examples/layout/arrange");
  await removeGaps(page);
  await page.evaluate(() => {
    const item = document.querySelector('[data-widget-id="widget-1"]')!;
    const input = document.createElement("input");
    input.value = "retained content";
    input.dataset.retainedContent = "true";
    item.querySelector(".comins-grid-layout-widget__body")!.append(input);
    (window as Window & { retainedItem?: Element }).retainedItem = item;
  });
  await page.getByRole("button", { name: "자동 정렬", exact: true }).click();
  await expectSynchronized(page);
  const items = await readGeometry(page);
  [1, 3, 4, 6, 7, 8, 9, 10].forEach((id, index) => {
    expect(items.find((item) => item.id === `widget-${id}`)?.engine).toEqual([(index % 4) * 3, Math.floor(index / 4) * 2, 3, 2]);
  });
  expect(await page.evaluate(() => document.querySelector('[data-widget-id="widget-1"]') ===
    (window as Window & { retainedItem?: Element }).retainedItem)).toBe(true);
  await expect(page.locator("[data-retained-content]")).toHaveValue("retained content");
});

test("commits Float compaction and retains it when Float returns", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto("/examples/advanced/float");
  const widget = page.getByTestId("dashboard-widget-widget-9");
  await widget.scrollIntoViewIfNeeded();
  const box = await widget.locator(".comins-grid-layout-widget__title").boundingBox();
  if (!box) throw new Error("Missing title");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 288, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => Number(await widget.getAttribute("data-layout-y"))).toBeGreaterThan(4);
  await page.getByRole("button", { name: "Float 켜짐", exact: true }).click();
  await expectSynchronized(page);
  await expect(widget).toHaveAttribute("data-layout-y", "4");
  await page.getByRole("button", { name: "Float 꺼짐", exact: true }).click();
  await expectSynchronized(page);
  await expect(widget).toHaveAttribute("data-layout-y", "4");
});

test("defers controlled synchronization until the consumer closes its batch", async ({ page }) => {
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn())).toBe(6);
  await page.evaluate(() => {
    window.__cominsReadmeDemo!.getHandle()!.getGridStack()!.batchUpdate();
    window.__cominsReadmeDemo!.setOverviewPosition(2, 0);
  });
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("data-layout-x", "2");
  // Allow React effects and multiple synchronization frames to run inside the open batch.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__cominsReadmeDemo!.getHandle()!.getGridStack()!.engine.batchMode)).toBe(true);
  await page.evaluate(() => window.__cominsReadmeDemo!.getHandle()!.getGridStack()!.batchUpdate(false));
  await expectSynchronized(page);
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("gs-x", "2");
});

test("fits content height on enable and on content growth and shrink", { tag: "@firefox-parity" }, async ({ page }) => {
  // Leave room below the content demo for the full two-row resize gesture.
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto("/examples/advanced/size-to-content");
  await page.getByRole("button", { name: "Size To Content 켜짐", exact: true }).click();
  const widget = page.getByTestId("dashboard-widget-activity");
  await resize(page, widget, 192);
  await expect(widget).toHaveAttribute("data-layout-h", "4");
  await page.getByRole("button", { name: "Size To Content 꺼짐", exact: true }).click();
  await expect(widget).toHaveAttribute("data-layout-h", "2");
  await expectSynchronized(page);

  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn())).toBe(6);
  await page.evaluate(() => window.__cominsReadmeDemo!.setSizeToContent(true));
  const overview = page.getByTestId("dashboard-widget-overview");
  await expect(overview).toHaveClass(/size-to-content/);
  for (const height of [360, 90]) {
    await overview.locator(".comins-grid-layout-widget__body").evaluate((body, h) => {
      (body as HTMLElement).style.minHeight = `${h}px`;
    }, height);
    await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
    await expect.poll(async () => Number(await overview.getAttribute("data-layout-h"))).toBe(height === 360 ? 5 : 2);
    await expectSynchronized(page);
  }
  await page.evaluate(() => window.__cominsReadmeDemo!.resetCommitCount());
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__cominsReadmeDemo!.getCommitCount())).toBe(0);
});

test("keeps mobile titles and actions visible and changes handle visibility", { tag: "@mobile-touch" }, async ({ page }) => {
  await page.goto("/examples/advanced/mobile-touch");
  const widget = page.getByTestId("dashboard-widget-widget-1");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "3");
  await expect.poll(() => widget.locator(".comins-grid-layout-widget__title").evaluate((title) =>
    title.clientWidth > 0 && title.scrollWidth <= title.clientWidth)).toBe(true);
  const shell = (await widget.locator(".comins-grid-layout-widget").boundingBox())!;
  const remove = widget.getByRole("button", { name: "Title 1 삭제", exact: true });
  const box = (await remove.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(shell.x + shell.width);
  await page.getByRole("button", { name: "리사이즈 핸들 항상 표시", exact: true }).tap();
  await expect.poll(() => widget.evaluate((item) => (item as GridItemHTMLElement).gridstackNode?.grid?.opts.alwaysShowResizeHandle)).toBe(false);
  await page.getByRole("button", { name: "리사이즈 핸들 자동 표시", exact: true }).tap();
  await expect.poll(() => widget.evaluate((item) => (item as GridItemHTMLElement).gridstackNode?.grid?.opts.alwaysShowResizeHandle)).toBe(true);
  await remove.tap();
  await expect(widget).toBeHidden();
});

test("acknowledges a controlled packing correction once without a refresh loop", async ({ page }) => {
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn())).toBe(6);
  await page.evaluate(() => {
    window.__cominsReadmeDemo!.resetCommitCount();
    window.__cominsReadmeDemo!.setOverviewPosition(0, 5);
  });
  await expectSynchronized(page);
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("data-layout-y", "0");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo!.getCommitCount())).toBe(1);
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__cominsReadmeDemo!.getCommitCount())).toBe(1);
});

test("defers refresh commits until an active drag finishes", async ({ page }) => {
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn())).toBe(6);
  const overview = page.getByTestId("dashboard-widget-overview");
  const box = (await overview.locator(".comins-grid-layout-widget__title").boundingBox())!;
  await page.evaluate(() => window.__cominsReadmeDemo!.resetCommitCount());
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 180, box.y + box.height / 2, { steps: 12 });
  await expect(overview).toHaveClass(/ui-draggable-dragging/);
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await page.evaluate(() => window.__cominsReadmeDemo!.getCommitCount())).toBe(0);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo!.getCommitCount())).toBe(1);
  await expectSynchronized(page);
});

test("honors per-widget content sizing, height limits, and explicit widget actions", async ({ page }) => {
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn())).toBe(6);
  const overview = page.getByTestId("dashboard-widget-overview");
  await page.evaluate(() => window.__cominsReadmeDemo!.updateOverview({ sizeToContent: true }));
  await expect(overview).toHaveClass(/size-to-content/);
  await overview.locator(".comins-grid-layout-widget__body").evaluate((body) => {
    (body as HTMLElement).style.minHeight = "360px";
  });
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await expect(overview).toHaveAttribute("data-layout-h", "5");
  await page.evaluate(() => window.__cominsReadmeDemo!.updateOverview({
    layout: { id: "overview", x: 0, y: 0, w: 2, h: 5, minH: 2, maxH: 3 },
  }));
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await expect(overview).toHaveAttribute("data-layout-h", "3");
  await overview.locator(".comins-grid-layout-widget__body").evaluate((body) => {
    (body as HTMLElement).style.minHeight = "0";
  });
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await expect(overview).toHaveAttribute("data-layout-h", "2");
  await page.evaluate(() => window.__cominsReadmeDemo!.updateOverview({
    sizeToContent: false, layout: { id: "overview", x: 0, y: 0, w: 2, h: 4 },
  }));
  await page.evaluate(() => window.__cominsReadmeDemo!.setSizeToContent(true));
  await expect(overview).not.toHaveClass(/size-to-content/);
  await page.evaluate(() => window.__cominsReadmeDemo!.refresh());
  await expect(overview).toHaveAttribute("data-layout-h", "4");
  await expectSynchronized(page);
  await page.evaluate(() => window.__cominsReadmeDemo!.updateOverview({ sizeToContent: true }));
  await page.getByRole("button", { name: "Overview Minimize", exact: true }).click();
  await expect(overview).toHaveAttribute("data-layout-h", "1");
  await page.getByRole("button", { name: "Overview Restore", exact: true }).click();
  await expect(overview).toHaveAttribute("data-layout-h", "2");
  await page.getByRole("button", { name: "Overview Maximize", exact: true }).click();
  await expect(overview).toHaveAttribute("data-layout-w", "6");
  await expect(overview).toHaveAttribute("data-layout-h", "3");
  await expectSynchronized(page);
});

test("uses container breakpoints and restores bounded none layouts", async ({ page }) => {
  await page.setViewportSize({ width: 910, height: 900 });
  await page.goto("/examples/advanced/responsive/breakpoints");
  const grid = page.getByTestId("dashboard-grid");
  await page.getByLabel("컬럼 결정 방식").selectOption("breakpoints");
  await expect(page.getByText(/컨테이너 너비 640px/)).toBeVisible();
  expect((await grid.boundingBox())!.width).toBeLessThan(640);
  await expect(grid).toHaveAttribute("data-columns", "2");
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect(grid).toHaveAttribute("data-columns", "6");
  await expectSynchronized(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/examples/advanced/responsive/none");
  await page.getByLabel("컬럼 결정 방식").selectOption("breakpoints");
  await page.getByLabel("배치 정책").selectOption("none");
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expectSynchronized(page);
  const wide = await readGeometry(page);
  await page.setViewportSize({ width: 600, height: 900 });
  expect((await grid.boundingBox())!.width).toBeLessThanOrEqual(640);
  await expect(grid).toHaveAttribute("data-columns", "2");
  await expectSynchronized(page);
  for (const { engine: [x, , w] } of await readGeometry(page)) expect(x! + w!).toBeLessThanOrEqual(2);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect.poll(() => readGeometry(page)).toEqual(wide);
});
