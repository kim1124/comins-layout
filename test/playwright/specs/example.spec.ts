import { expect, test } from "@playwright/test";

test("renders the gridstack example dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
  await expect(page.getByRole("heading", { name: "comins-grid-layout" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toBeVisible();
});

test("renders Korean labels by default", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("개발 예제")).toBeVisible();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");
  await expect(page.locator(".example-metrics")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "위젯 추가" })).toBeVisible();
  await expect(page.getByRole("button", { name: "매출 최대화" })).toBeVisible();
});
