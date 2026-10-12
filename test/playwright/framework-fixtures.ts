import { expect, type Page } from "@playwright/test";
export async function openDashboardFixture(page: Page, framework: "react" | "vue") {
  await page.goto(framework === "react" ? "/__test__/layout" : "/vue.html?example=__test__/parity");
  await expect.poll(() => page.locator('[data-testid="dashboard-grid"]').first().evaluate(el => Boolean((el as HTMLElement & { gridstack?: unknown }).gridstack))).toBe(true);
}
