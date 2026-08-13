import { expect, test, type Locator } from "@playwright/test";

async function widgetGeometry(widget: Locator) {
  return widget.evaluate((node) =>
    ["x", "y", "w", "h"].map((key) => node.getAttribute(`data-layout-${key}`)),
  );
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/examples/widget");
});

test("uses indexed fixtures and edit refresh delete actions without maximize controls", async ({ page }) => {
  await expect(page.locator(".grid-stack-item")).toHaveCount(3);
  const widget = page.getByTestId("dashboard-widget-widget-1");

  await expect(widget).toContainText("위젯 1");
  await expect(widget.getByRole("button", { name: "위젯 1 수정" })).toBeVisible();
  await expect(widget.getByRole("button", { name: "위젯 1 새로고침" })).toBeVisible();
  await expect(widget.getByRole("button", { name: "위젯 1 삭제" })).toBeVisible();
  await expect(widget.getByRole("button", { name: /최대화|최소화|복원/ })).toHaveCount(0);
  await expect(page.locator('[data-example-mode="widget"] .example-status')).toHaveCount(0);
  await expect(page.locator('[data-example-mode="widget"] .example-state-output')).toHaveCount(0);
});

test("refreshes only content through a loader while preserving widget state", async ({ page }) => {
  const widget = page.getByTestId("dashboard-widget-widget-1");
  const body = widget.locator(".dashboard-widget-body");
  await body.click();
  await page.getByRole("button", { name: "이동 잠금" }).click();

  const geometry = await widgetGeometry(widget);
  const background = await body.evaluate((node) => getComputedStyle(node).backgroundColor);
  const before = await body.locator("strong").textContent();

  await widget.getByRole("button", { name: "위젯 1 새로고침" }).click();
  await expect(widget.getByRole("status", { name: "위젯 1 콘텐츠 새로고침 중" })).toBeVisible();
  await expect(widget.getByRole("status", { name: "위젯 1 콘텐츠 새로고침 중" })).toHaveCount(0, { timeout: 1_000 });
  await expect(body.locator("strong")).not.toHaveText(before ?? "");

  expect(await widgetGeometry(widget)).toEqual(geometry);
  expect(await body.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(background);
  await expect(page.getByRole("button", { name: "이동 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
});

test("cancels an in-flight refresh before deleting the same widget", async ({ page }) => {
  const widget = page.getByTestId("dashboard-widget-widget-2");
  await widget.getByRole("button", { name: "위젯 2 새로고침" }).click();
  await expect(widget.getByRole("status", { name: "위젯 2 콘텐츠 새로고침 중" })).toBeVisible();
  await widget.getByRole("button", { name: "위젯 2 삭제" }).click();

  await expect(page.getByTestId("dashboard-widget-widget-2")).toHaveCount(0);
  await page.waitForTimeout(600);
  await expect(page.getByTestId("dashboard-widget-widget-2")).toHaveCount(0);
  await expect(page.getByText("위젯 2", { exact: true })).toHaveCount(0);
});

test("edits the addressed widget including color and geometry and restores exact opener focus", async ({ page }) => {
  const widget = page.getByTestId("dashboard-widget-widget-2");
  const opener = widget.getByRole("button", { name: "위젯 2 수정" });
  const openerHandle = await opener.elementHandle();
  expect(openerHandle).not.toBeNull();
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 위젯");
  await dialog.getByLabel("값").fill("사용자 콘텐츠");
  await dialog.getByRole("radio", { name: "라벤더" }).check();
  await dialog.getByRole("combobox", { name: "너비" }).selectOption("3");
  await dialog.getByRole("combobox", { name: "높이" }).selectOption("3");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await expect(widget).toContainText("사용자 위젯");
  await expect(widget).toContainText("사용자 콘텐츠");
  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
  await expect(widget.locator(".dashboard-widget-body")).toHaveCSS("background-color", "rgb(237, 233, 254)");
  expect(await openerHandle!.evaluate((node) => document.activeElement === node)).toBe(true);
});

test("keeps user edit literals while changing the dialog locale", async ({ page }) => {
  const widget = page.getByTestId("dashboard-widget-widget-3");
  await widget.getByRole("button", { name: "위젯 3 수정" }).click();
  let dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 초안");
  await dialog.getByLabel("값").fill("사용자 값");

  await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();
  dialog = page.getByRole("dialog", { name: "Edit widget" });
  await expect(dialog.getByLabel("Widget name")).toHaveValue("사용자 초안");
  await expect(dialog.getByLabel("Value")).toHaveValue("사용자 값");
  await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "KO" }).click();
  dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await expect(dialog.getByLabel("위젯명")).toHaveValue("사용자 초안");
  await expect(dialog.getByLabel("값")).toHaveValue("사용자 값");
});

test("changes lock labels and keeps toolbar groups inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload();
  await page.getByTestId("dashboard-widget-widget-1").locator(".dashboard-widget-body").click();

  const moveLock = page.getByRole("button", { name: "이동 잠금" });
  await moveLock.click();
  await expect(page.getByRole("button", { name: "이동 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "리사이즈 잠금" }).click();
  await expect(page.getByRole("button", { name: "리사이즈 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "전체 잠금" }).click();
  await expect(page.getByRole("button", { name: "전체 잠금 해제" })).toHaveAttribute("aria-pressed", "true");

  const overflow = await page.locator(".example-toolbar-groups").evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.locator(".example-toolbar-group")).toHaveCount(3);
  await expect(page.getByText("위젯 3개", { exact: true })).toBeVisible();
});
