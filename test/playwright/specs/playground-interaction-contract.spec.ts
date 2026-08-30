import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type WidgetGeometry = {
  h: string | null;
  w: string | null;
  x: string | null;
  y: string | null;
};

const bodyInteractionRoutes = [
  "/examples/widget/basic",
  "/examples/widget/manage",
  "/examples/widget/events",
  "/examples/layout/basic",
  "/examples/layout/lock",
  "/examples/layout/persistence",
  "/examples/layout/arrange",
  "/examples/layout/events",
  "/examples/advanced/cell-height",
  "/examples/advanced/grid-lines",
  "/examples/advanced/float",
  "/examples/advanced/lazy-load",
  "/examples/advanced/mobile-touch",
  "/examples/advanced/responsive/column",
  "/examples/advanced/responsive/breakpoints",
  "/examples/advanced/responsive/none",
  "/examples/advanced/rtl",
  "/examples/advanced/size-to-content",
  "/examples/advanced/transform",
  "/examples/advanced/multi-grid/horizontal",
  "/examples/advanced/public-api",
] as const;

async function waitForGrid(widget: Locator) {
  await expect.poll(() => widget.evaluate((element) => {
    const grid = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & { gridstack?: unknown }) | null;
    return Boolean(grid?.gridstack);
  })).toBe(true);
}

async function waitForWidgetPosition(widget: Locator) {
  await expect.poll(() => widget.evaluate((element) => {
    const item = element as HTMLElement & {
      gridstackNode?: { x?: number; w?: number; grid?: { getColumn?: () => number } };
    };
    const grid = item.parentElement;
    const column = item.gridstackNode?.grid?.getColumn?.();
    if (!grid || !column || item.gridstackNode?.x === undefined || item.gridstackNode.w === undefined) {
      return false;
    }
    const gridRect = grid.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const isRtl = grid.classList.contains("grid-stack-rtl");
    const expectedColumn = isRtl
      ? column - item.gridstackNode.x - item.gridstackNode.w
      : item.gridstackNode.x;
    const expectedLeft = gridRect.left + gridRect.width * expectedColumn / column;
    return Math.abs(itemRect.left - expectedLeft) < 2;
  })).toBe(true);
}

function firstWidget(page: Page) {
  return page.locator(".grid-stack").first().locator(":scope > .grid-stack-item").first();
}

function secondWidget(page: Page) {
  return page.locator(".grid-stack").first().locator(":scope > .grid-stack-item").nth(1);
}

function bodyDragSource(widget: Locator) {
  return widget.locator(
    ".playground-numbered-widget-content, .transfer-widget-body > span",
  ).first();
}

async function readGeometry(widget: Locator): Promise<WidgetGeometry> {
  return widget.evaluate((element) => ({
    h: element.getAttribute("data-layout-h"),
    w: element.getAttribute("data-layout-w"),
    x: element.getAttribute("data-layout-x"),
    y: element.getAttribute("data-layout-y"),
  }));
}

async function dragFrom(page: Page, source: Locator, deltaX = 0, deltaY = 220) {
  const box = await source.boundingBox();
  if (!box) throw new Error("Drag source geometry is unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function dragTo(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) throw new Error("Drag geometry is unavailable");
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function resizeWidget(
  page: Page,
  widget: Locator,
  resizeDelta = { x: 120, y: 80 },
) {
  await widget.hover();
  const handle = widget.locator(":scope > .ui-resizable-se");
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  if (!box) throw new Error("Resize handle geometry is unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + resizeDelta.x,
    box.y + box.height / 2 + resizeDelta.y,
    { steps: 12 },
  );
  await page.mouse.up();
}

async function expectMoveAndResize(
  page: Page,
  widget: Locator,
  dragSource: Locator,
  moveDelta?: { x: number; y: number },
) {
  await expectResize(page, widget);
  await expectMove(page, widget, dragSource, moveDelta);
}

async function expectMove(
  page: Page,
  widget: Locator,
  dragSource: Locator,
  moveDelta?: { x: number; y: number },
  moveTarget?: Locator,
) {
  await waitForGrid(widget);
  await widget.scrollIntoViewIfNeeded();
  const beforeMove = await readGeometry(widget);
  if (moveTarget) {
    await dragTo(page, dragSource, moveTarget);
  } else {
    await dragFrom(page, dragSource, moveDelta?.x, moveDelta?.y);
  }
  await expect.poll(() => readGeometry(widget)).not.toEqual(beforeMove);
}

async function expectResize(page: Page, widget: Locator) {
  await waitForGrid(widget);
  await widget.scrollIntoViewIfNeeded();
  const beforeResize = await readGeometry(widget);
  await resizeWidget(page, widget);
  await expect.poll(async () => {
    const after = await readGeometry(widget);
    return after.w !== beforeResize.w || after.h !== beforeResize.h;
  }).toBe(true);
}

for (const route of bodyInteractionRoutes) {
  test(`allows body move and resize on ${route}`, async ({ page }) => {
    await page.goto(route);
    const widget = firstWidget(page);
    await expectMove(
      page,
      widget,
      bodyDragSource(widget),
      undefined,
      secondWidget(page),
    );

    await page.goto(route);
    await expectResize(page, firstWidget(page));
  });
}

test("keeps Static Grid locked until editing is enabled", async ({ page }) => {
  await page.goto("/examples/advanced/static");
  const widget = firstWidget(page);
  await waitForGrid(widget);
  const locked = await readGeometry(widget);
  await dragFrom(page, widget.locator(".comins-grid-layout-widget__body"));
  await expect.poll(() => readGeometry(widget)).toEqual(locked);

  await page.getByRole("button", { name: "Static Grid" }).click();
  await expectMoveAndResize(page, widget, bodyDragSource(widget));
});

test("keeps the title-only drag contract isolated to its named example", async ({ page }) => {
  await page.goto("/examples/advanced/title-drag");
  const widget = firstWidget(page);
  await waitForGrid(widget);
  const beforeBodyDrag = await readGeometry(widget);
  await dragFrom(page, widget.locator(".comins-grid-layout-widget__body"));
  await expect.poll(() => readGeometry(widget)).toEqual(beforeBodyDrag);

  const title = widget.locator(".comins-grid-layout-widget__title");
  const header = widget.locator(".comins-grid-layout-widget__header");
  const [titleBox, headerBox] = await Promise.all([title.boundingBox(), header.boundingBox()]);
  if (!titleBox || !headerBox) throw new Error("Title drag handle geometry is unavailable");
  expect(titleBox.width).toBeGreaterThan(headerBox.width * 0.45);
  await expect(title).toHaveCSS("cursor", "grab");
  await expect(title).toHaveCSS("touch-action", "none");
  await expect(title).toHaveCSS("user-select", "none");

  await expectMoveAndResize(page, widget, title);
});

for (const route of ["/examples/advanced/nested/basic"] as const) {
  test(`allows title move and resize without crossing nested grid ownership on ${route}`, async ({ page }) => {
    await page.goto(route);
    const widget = page.locator(".grid-stack").last().locator(":scope > .grid-stack-item").nth(1);
    await waitForGrid(widget);
    await widget.scrollIntoViewIfNeeded();
    await waitForWidgetPosition(widget);
    const gridBox = await widget.locator("xpath=..").boundingBox();
    if (!gridBox) throw new Error("Nested grid geometry is unavailable");

    const beforeMove = await readGeometry(widget);
    const title = widget.locator(".comins-grid-layout-widget__title").first();
    const [titleBox, headerBox] = await Promise.all([
      title.boundingBox(),
      widget.locator(".comins-grid-layout-widget__header").first().boundingBox(),
    ]);
    if (!titleBox || !headerBox) throw new Error("Nested title drag handle geometry is unavailable");
    expect(titleBox.width).toBeGreaterThan(headerBox.width * 0.65);
    await expect(title).toHaveCSS("cursor", "grab");
    await expect(title).toHaveCSS("touch-action", "none");
    await expect(title).toHaveCSS("user-select", "none");
    await dragFrom(
      page,
      title,
      -gridBox.width / 4,
      0,
    );
    await expect.poll(() => readGeometry(widget)).not.toEqual(beforeMove);

    const beforeResize = await readGeometry(widget);
    await resizeWidget(page, widget, { x: gridBox.width / 4, y: 58 });
    await expect.poll(async () => {
      const after = await readGeometry(widget);
      return after.w !== beforeResize.w || after.h !== beforeResize.h;
    }).toBe(true);
  });
}
