import { expect, test } from "@playwright/test";
test("framework-free probe owns engine lifetime but leaves caller DOM intact", async ({ page }) => {
  const modules: string[] = [];
  page.on("request", request => modules.push(request.url()));
  await page.goto("/browser-probe.html");
  await expect(page.locator('[data-test="active"]')).toHaveText("1");
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(page.locator('[data-test="active"]')).toHaveText("0");
  await expect(page.locator(".grid-stack-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.locator('[data-test="active"]')).toHaveText("1");
  await page.getByRole("button", { name: "Six columns", exact: true }).click();
  await expect(page.locator('[data-test="columns"]')).toHaveText("6");
  expect(modules.filter(url => /\/deps\/(react|react-dom|vue)[_.]/.test(url))).toEqual([]);
});
