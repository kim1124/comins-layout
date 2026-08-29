import { expect, test, type ConsoleMessage, type Locator, type Page } from "@playwright/test";

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

async function waitForGridEngine(grid: Locator) {
  await expect.poll(() => grid.evaluate((element) => Boolean(
    (element as HTMLElement & { gridstack?: unknown }).gridstack,
  ))).toBe(true);
}

async function dragToTarget(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) throw new Error("README demo drag geometry is unavailable");
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + Math.min(targetBox.height / 2, 40),
    { steps: 20 },
  );
  await page.mouse.up();
}

test("README Transfer scene copies a palette widget and moves a controlled grid widget", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/readme-demo?feature=transfer");
  await expect(page.getByRole("heading", { name: "Palette and Grid Transfer" })).toBeVisible();
  const sourceGrid = page.getByTestId("readme-transfer-source");
  const targetGrid = page.getByTestId("readme-transfer-target");
  await waitForGridEngine(sourceGrid.locator(".grid-stack"));
  await waitForGridEngine(targetGrid.locator(".grid-stack"));

  await dragToTarget(page, page.getByTestId("readme-palette-metric"), targetGrid.locator(".grid-stack"));
  await expect(targetGrid.getByTestId("dashboard-widget-palette-metric-1")).toBeVisible();
  await dragToTarget(
    page,
    sourceGrid.getByTestId("dashboard-widget-source-sales").locator(".comins-grid-layout-widget__title"),
    targetGrid.locator(".grid-stack"),
  );
  await expect(sourceGrid.getByTestId("dashboard-widget-source-sales")).toHaveCount(0);
  await expect(targetGrid.getByTestId("dashboard-widget-source-sales")).toBeVisible();
  await expect(page.getByRole("status", { name: "Transfer status" })).toContainText("move accepted");
  expect(diagnostics).toEqual([]);
});

test("README External Drop scene delegates deletion to controlled consumer state", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/readme-demo?feature=external-drop");
  await expect(page.getByRole("heading", { name: "External HTML Drop Target" })).toBeVisible();
  const widget = page.getByTestId("dashboard-widget-drop-alerts");
  await dragToTarget(page, widget.locator(".comins-grid-layout-widget__title"), page.getByTestId("readme-drop-trash"));
  await expect(widget).toHaveCount(0);
  await expect(page.getByRole("status", { name: "External drop status" })).toHaveText("Removed drop-alerts from controlled state");
  expect(diagnostics).toEqual([]);
});

test("README Persistence scene restores independent 12 and 6 column layouts", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/readme-demo?feature=responsive-persistence");
  await expect(page.getByRole("heading", { name: "Responsive Columns and Persistence" })).toBeVisible();
  const widget = page.getByTestId("dashboard-widget-persist-sales");
  await expect(widget).toHaveAttribute("data-layout-x", "6");
  await page.getByRole("button", { name: "Use 6 columns" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");
  await expect(widget).toHaveAttribute("data-layout-x", "0");
  await page.getByRole("button", { name: "Move in 6 columns" }).click();
  await expect(widget).toHaveAttribute("data-layout-x", "2");
  await page.getByRole("button", { name: "Use 12 columns" }).click();
  await expect(widget).toHaveAttribute("data-layout-x", "6");
  await page.getByRole("button", { name: "Use 6 columns" }).click();
  await expect(widget).toHaveAttribute("data-layout-x", "2");
  expect(diagnostics).toEqual([]);
});

test("README Lazy Rendering scene mounts content once after scroll intersection", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/readme-demo?feature=lazy-rendering");
  await expect(page.getByRole("heading", { name: "React Content Lazy Rendering" })).toBeVisible();
  await expect(page.getByTestId("readme-lazy-eager-content")).toBeVisible();
  await expect(page.getByTestId("readme-lazy-deferred-content")).toHaveCount(0);
  await page.getByTestId("readme-lazy-scroll").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(page.getByTestId("readme-lazy-deferred-content")).toBeVisible();
  await page.getByTestId("readme-lazy-scroll").evaluate((element) => {
    element.scrollTop = 0;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect(page.getByTestId("readme-lazy-deferred-content")).toBeVisible();
  await expect(page.getByRole("status", { name: "Lazy render status" })).toHaveText("Deferred content mounted once");
  expect(diagnostics).toEqual([]);
});
