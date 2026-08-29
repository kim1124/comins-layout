import { expect, test, type ConsoleMessage, type Locator, type Page } from "@playwright/test";

import { performTouchGestureToTarget } from "../touch-gesture";

type TransferOperation = {
  status: "idle" | "accepted" | "rejected";
  reason?: string;
  mode?: "copy" | "move";
  widgetId?: string;
  targetLayout?: { id: string; x: number; y: number; w: number; h: number };
};

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: Array<{ text: string; type: ReturnType<ConsoleMessage["type"]> | "pageerror" }> = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.push({ text: message.text(), type: message.type() });
    }
  });
  page.on("pageerror", (error) => diagnostics.push({ text: error.message, type: "pageerror" }));
  return diagnostics;
}

function gridPanel(page: Page, gridId: "grid-a" | "grid-b") {
  return page.locator(`[data-transfer-grid="${gridId}"]`);
}

async function waitForGridEngine(grid: Locator) {
  await expect.poll(() => grid.evaluate((element) => Boolean((element as HTMLElement & { gridstack?: unknown }).gridstack))).toBe(true);
}

async function openTransferPlayground(page: Page) {
  await page.goto("/examples/advanced/multi-grid/horizontal");
  await waitForTransferPlayground(page);
}

async function waitForTransferPlayground(page: Page) {
  await expect(page.getByRole("heading", { name: "다중 Grid - 가로" })).toBeVisible();
  await waitForGridEngine(gridPanel(page, "grid-a").locator(".grid-stack"));
  await waitForGridEngine(gridPanel(page, "grid-b").locator(".grid-stack"));
}

async function dragToTarget(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) {
    throw new Error("Transfer drag geometry is unavailable");
  }
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + Math.min(targetBox.height / 2, 32),
    { steps: 20 },
  );
  await page.mouse.up();
}

async function readOperation(page: Page): Promise<TransferOperation> {
  return JSON.parse((await page.getByLabel("전송 작업 JSON").textContent()) ?? "{}") as TransferOperation;
}

test.describe("Transfer Playground", () => {
  test("copies a palette widget into a grid and keeps the button alternative on the same controlled path", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);

    const paletteKpi = page.locator('[data-palette-id="palette-kpi"]');
    await dragToTarget(
      page,
      paletteKpi.getByTestId("palette-drag-palette-kpi"),
      gridPanel(page, "grid-b").locator(".grid-stack"),
    );

    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");
    await expect(paletteKpi).toBeVisible();
    const operation = await readOperation(page);
    expect(operation.status).toBe("accepted");
    expect(operation.mode).toBe("copy");
    expect(operation.widgetId).toMatch(/^palette-kpi-\d+$/);
    expect(operation.targetLayout).toBeDefined();
    const inserted = gridPanel(page, "grid-b").getByTestId(`dashboard-widget-${operation.widgetId}`);
    await expect(inserted).toHaveAttribute("data-layout-x", String(operation.targetLayout!.x));
    await expect(inserted).toHaveAttribute("data-layout-y", String(operation.targetLayout!.y));
    await expect(inserted).toHaveAttribute("data-layout-w", String(operation.targetLayout!.w));
    await expect(inserted).toHaveAttribute("data-layout-h", String(operation.targetLayout!.h));

    await page.locator('[data-palette-id="palette-table"]').getByRole("button", { name: "Grid A에 추가" }).click();
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("3개");
    await expect(page.locator('[data-palette-id="palette-table"]')).toBeVisible();
    expect(diagnostics).toEqual([]);
  });

  test("@firefox-parity moves a widget from Grid A to Grid B through an actual pointer drag", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);

    const source = gridPanel(page, "grid-a").getByTestId("dashboard-widget-a-sales");
    await dragToTarget(
      page,
      source.locator(".comins-grid-layout-widget__title"),
      gridPanel(page, "grid-b").locator(".grid-stack"),
    );

    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("1개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-a").getByTestId("dashboard-widget-a-sales")).toHaveCount(0);
    await expect(gridPanel(page, "grid-b").getByTestId("dashboard-widget-a-sales")).toBeVisible();
    await expect(page.getByLabel("전송 작업 상태")).toHaveAttribute("data-transfer-result", "accepted");
    expect((await readOperation(page)).mode).toBe("move");
    expect(diagnostics).toEqual([]);
  });

  test("copies between grids and rejects a duplicate ID without mutating either grid", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);
    await page.getByRole("button", { name: "이동 모드" }).click();
    await expect(page.getByRole("button", { name: "복사 모드" })).toBeVisible();

    const source = gridPanel(page, "grid-a").getByTestId("dashboard-widget-a-chart");
    await dragToTarget(
      page,
      source.locator(".comins-grid-layout-widget__title"),
      gridPanel(page, "grid-b").locator(".grid-stack"),
    );

    await expect(gridPanel(page, "grid-a").getByTestId("dashboard-widget-a-chart")).toBeVisible();
    await expect(gridPanel(page, "grid-b").getByTestId("dashboard-widget-a-chart")).toBeVisible();
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");

    await gridPanel(page, "grid-a")
      .getByTestId("dashboard-widget-a-chart")
      .getByRole("button", { name: "Grid B로 복사" })
      .click();
    await expect(page.getByLabel("전송 작업 상태")).toHaveAttribute("data-reason", "duplicate-id");
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");
    expect(diagnostics).toEqual([]);
  });

  test("rejects a restricted palette candidate and disposes route-owned drag sources on navigation", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);

    await dragToTarget(
      page,
      page.getByTestId("palette-drag-palette-restricted"),
      gridPanel(page, "grid-a").locator(".grid-stack"),
    );
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("1개");

    await page.getByRole("navigation", { name: "예제 메뉴" }).getByRole("link", { name: "레이아웃", exact: true }).click();
    await expect(page).toHaveURL(/\/examples\/layout\/basic$/);
    await openTransferPlayground(page);
    await page.locator('[data-palette-id="palette-kpi"]').getByRole("button", { name: "Grid A에 추가" }).click();
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("3개");
    expect(diagnostics).toEqual([]);
  });

  test("@mobile-touch supports touch drag-in and the button alternative", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);

    await performTouchGestureToTarget(
      page,
      page.getByTestId("palette-drag-palette-kpi"),
      gridPanel(page, "grid-a").locator(".grid-stack"),
      16,
    );
    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("3개");

    await page.locator('[data-palette-id="palette-chart"]').getByRole("button", { name: "Grid B에 추가" }).click();
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");
    expect(diagnostics).toEqual([]);
  });
});
