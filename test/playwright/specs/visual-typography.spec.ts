import { expect, test, type Page } from "@playwright/test";

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

test("keeps gridstack routes within the typography and overflow contract", async ({ page }) => {
  for (const route of [
    { heading: "위젯", name: "widget", path: "/examples/widget" },
    { heading: "레이아웃", name: "layout", path: "/examples/layout" },
    { heading: "고급 예제", name: "advanced", path: "/examples/advanced" },
    { heading: "시작하기", name: "getting-started", path: "/docs/getting-started" },
    { heading: "API", name: "api", path: "/api" },
  ]) {
    await page.goto(route.path);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    await expectBaseTypography(page);
    await expectNoRootHorizontalOverflow(page);
  }
});
