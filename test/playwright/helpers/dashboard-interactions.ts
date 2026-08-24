import { expect, type Locator, type Page } from "@playwright/test";

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
  return page.locator(".grid-stack-item[data-widget-id]").evaluateAll((widgets) => (
    widgets.map((widget) => ({
      id: widget.getAttribute("data-widget-id") ?? "",
      x: Number(widget.getAttribute("data-layout-x")),
      y: Number(widget.getAttribute("data-layout-y")),
      w: Number(widget.getAttribute("data-layout-w")),
      h: Number(widget.getAttribute("data-layout-h")),
    }))
  ));
}

async function waitForWidgetGridEngine(widget: Locator) {
  await expect.poll(() => widget.evaluate((element) => {
    const grid = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & {
      gridstack?: unknown;
    }) | null;
    return Boolean(grid?.gridstack);
  })).toBe(true);
}

async function waitForInteractionEnd(widget: Locator, activeClass: string) {
  await expect.poll(async () => {
    if (await widget.count() === 0) return true;
    return widget.evaluate((element, className) => !element.classList.contains(className), activeClass);
  }).toBe(true);
}

export async function dragWidget(
  page: Page,
  widget: Locator,
  deltaX: number,
  deltaY: number,
  { expectActivation = true }: { expectActivation?: boolean } = {},
) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const shouldExpectActivation = expectActivation && await widget.evaluate(
    (element) => !element.classList.contains("ui-draggable-disabled"),
  );
  const box = await widget.boundingBox();
  if (!box) throw new Error("Widget is not visible.");
  await page.mouse.move(box.x + 56, box.y + 24);
  await page.mouse.down();
  try {
    await page.mouse.move(box.x + 56 + deltaX, box.y + 24 + deltaY, { steps: 12 });
    if (shouldExpectActivation) {
      await expect(widget).toHaveClass(/ui-draggable-dragging/);
    }
  } finally {
    await page.mouse.up();
  }
  await waitForInteractionEnd(widget, "ui-draggable-dragging");
}

export async function resizeWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const shouldExpectActivation = await widget.evaluate(
    (element) => !element.classList.contains("ui-resizable-disabled"),
  );
  await widget.hover();
  const handle = widget.locator(".ui-resizable-se");
  const box = await handle.boundingBox();
  if (!box) throw new Error("Resize handle is not visible.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(box.x + deltaX, box.y + deltaY, { steps: 12 });
    if (shouldExpectActivation) {
      await expect(widget).toHaveClass(/ui-resizable-resizing/);
    }
  } finally {
    await page.mouse.up();
  }
  await waitForInteractionEnd(widget, "ui-resizable-resizing");
}

export async function dragWidgetToTarget(page: Page, widget: Locator, target: Locator) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error("Drop target is not visible.");
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) throw new Error("Widget is not visible.");
  await page.mouse.move(widgetBox.x + 56, widgetBox.y + 24);
  await page.mouse.down();
  try {
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 16 });
    await expect(widget).toHaveClass(/ui-draggable-dragging/);
  } finally {
    await page.mouse.up();
  }
}
