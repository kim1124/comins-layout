import type { Locator, Page } from "@playwright/test";

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
  await widget.hover();
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
