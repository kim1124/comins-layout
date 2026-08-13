import { expect, test } from "@playwright/test";

test("renders the gridstack example dashboard", async ({ page }) => {
  await page.goto("/examples/widget");

  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
  await expect(page.locator(".docs-live").getByRole("heading", { name: "위젯" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-widget-1")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-widget-2")).toBeVisible();
});

test("renders Korean labels by default", async ({ page }) => {
  await page.goto("/examples/widget");

  await expect(page.getByText("위젯 예제")).toBeVisible();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");
  await expect(page.locator(".example-metrics")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "위젯 추가" })).toBeVisible();
  await expect(page.getByRole("button", { name: "위젯 1 수정" })).toBeVisible();
  await expect(page.getByRole("button", { name: "위젯 1 새로고침" })).toBeVisible();
  await expect(page.getByRole("button", { name: "위젯 1 삭제" })).toBeVisible();
  await expect(page.getByRole("button", { name: /최대화|최소화|복원/ })).toHaveCount(0);
});
