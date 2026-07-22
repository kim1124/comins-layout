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
