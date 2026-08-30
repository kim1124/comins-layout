import { expect, test, type ConsoleMessage, type Locator, type Page } from "@playwright/test";

import { performTouchGestureToTarget } from "../touch-gesture";

type TransferOperation = {
  status: "idle" | "accepted" | "rejected" | "cleared";
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
  await expect(page.getByRole("heading", { name: "다중 Grid 전송" })).toBeVisible();
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

async function dragToGridPosition(
  page: Page,
  source: Locator,
  target: Locator,
  position: { columns: number; x: number; y: number; w: number },
) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) {
    throw new Error("Transfer drag geometry is unavailable");
  }
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + ((position.x + position.w / 2) / position.columns) * targetBox.width,
    targetBox.y + position.y * 84 + Math.min(sourceBox.height / 2, 32),
    { steps: 20 },
  );
  await page.mouse.up();
}

async function readOperation(page: Page): Promise<TransferOperation> {
  const operation = await page.getByRole("status", { name: "전송 작업 상태" }).getAttribute("data-operation");
  return JSON.parse(operation ?? "{}") as TransferOperation;
}

test.describe("Transfer Playground", () => {
  test("switches horizontal and vertical presentation without duplicating routes", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);
    const playground = page.locator(".transfer-playground");
    const controls = page.getByLabel("전송 예제 컨트롤");
    const status = page.getByRole("status", { name: "전송 작업 상태" });
    await expect(controls).toHaveCSS("display", "flex");
    await expect(controls).toHaveCSS("flex-wrap", "nowrap");
    await expect(controls.locator(".example-control-group")).toHaveCount(0);
    await expect(controls.getByRole("heading")).toHaveCount(0);
    await expect(page.getByLabel("전송 작업 JSON")).toHaveCount(0);

    const controlCenters = await Promise.all([
      page.getByRole("button", { name: "가로 배치" }).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
      page.getByRole("button", { name: "이동 모드" }).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
      status.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
    ]);
    expect(Math.max(...controlCenters) - Math.min(...controlCenters)).toBeLessThan(2);

    await expect(playground).toHaveAttribute("data-transfer-orientation", "horizontal");
    await expect(page.getByRole("button", { name: "가로 배치" })).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "세로 배치" }).click();
    await expect(playground).toHaveAttribute("data-transfer-orientation", "vertical");
    await expect(page.getByRole("button", { name: "세로 배치" })).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(controls).toHaveCSS("flex-wrap", "nowrap");
    expect(await controls.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    const narrowControlCenters = await Promise.all([
      page.getByRole("button", { name: "가로 배치" }).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
      page.getByRole("button", { name: "이동 모드" }).evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
      status.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.top + box.height / 2;
      }),
    ]);
    expect(Math.max(...narrowControlCenters) - Math.min(...narrowControlCenters)).toBeLessThan(2);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    expect(diagnostics).toEqual([]);
  });

  test("clears every widget in Grid A and Grid B with one compact control", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await openTransferPlayground(page);

    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("1개");

    await page.getByRole("button", { name: "Grid A/B 위젯 전체 삭제" }).click();

    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("0개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("0개");
    await expect(page.getByRole("status", { name: "전송 작업 상태" })).toHaveAttribute("data-transfer-result", "cleared");
    await expect(page.getByRole("status", { name: "전송 작업 상태" })).toContainText("삭제 완료");
    expect(diagnostics).toEqual([]);
  });

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
    await dragToGridPosition(
      page,
      source.locator(".comins-grid-layout-widget__title"),
      gridPanel(page, "grid-b").locator(".grid-stack"),
      { columns: 12, x: 4, y: 0, w: 2 },
    );

    await expect(gridPanel(page, "grid-a").getByLabel("Grid A 위젯 수")).toHaveText("1개");
    await expect(gridPanel(page, "grid-b").getByLabel("Grid B 위젯 수")).toHaveText("2개");
    await expect(gridPanel(page, "grid-a").getByTestId("dashboard-widget-a-sales")).toHaveCount(0);
    const transferred = gridPanel(page, "grid-b").getByTestId("dashboard-widget-a-sales");
    await expect(transferred).toBeVisible();
    await expect(transferred).toHaveAttribute("data-layout-x", "4");
    await expect(transferred).toHaveAttribute("data-layout-y", "0");
    await expect(page.getByLabel("전송 작업 상태")).toHaveAttribute("data-transfer-result", "accepted");
    expect(await readOperation(page)).toMatchObject({ mode: "move", targetLayout: { x: 4, y: 0 } });
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
