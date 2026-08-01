import type { Locator, Page } from "@playwright/test";

type Point = {
  x: number;
  y: number;
};

async function dispatchTouchGesture(
  page: Page,
  start: Point,
  delta: Point,
  steps: number,
) {
  const session = await page.context().newCDPSession(page);

  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ id: 1, x: start.x, y: start.y, radiusX: 8, radiusY: 8, force: 1 }],
    });

    for (let step = 1; step <= steps; step += 1) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{
          id: 1,
          x: start.x + (delta.x * step) / steps,
          y: start.y + (delta.y * step) / steps,
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

  await dispatchTouchGesture(page, {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }, delta, steps);
}

export async function performTouchGestureToTarget(
  page: Page,
  source: Locator,
  target: Locator,
  steps = 12,
) {
  await source.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([
    source.boundingBox(),
    target.boundingBox(),
  ]);
  if (!sourceBox || !targetBox) {
    throw new Error("Touch source or target bounding box is unavailable");
  }

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };

  await dispatchTouchGesture(page, start, {
    x: targetBox.x + targetBox.width / 2 - start.x,
    y: targetBox.y + targetBox.height / 2 - start.y,
  }, steps);
}
