import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { expect, test, type Page } from "@playwright/test";

const artifactDir = join(process.cwd(), "reports/artifacts/visual-typography");

async function expectBaseTypography(page: Page) {
  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
}

async function expectNoRootHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(() => {
    const rootOverflow =
      document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const bodyOverflow = document.body.scrollWidth - window.innerWidth;

    return Math.max(rootOverflow, bodyOverflow);
  });

  expect(overflowX).toBeLessThanOrEqual(2);
}

test("captures gridstack example visual typography screenshot", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "comins-grid-layout" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();
  await expectBaseTypography(page);
  await expectNoRootHorizontalOverflow(page);

  await mkdir(artifactDir, { recursive: true });
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: join(artifactDir, `gridstack-${testInfo.project.name}.png`),
  });
});
