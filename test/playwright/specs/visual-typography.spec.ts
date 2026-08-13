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

async function expectDocsTopNavigationGeometry(page: Page) {
  const [headerBox, bodyBox, brandBox, searchBox, localeBox] = await Promise.all([
    page.locator(".docs-topnav").boundingBox(),
    page.locator(".docs-shell__body").boundingBox(),
    page.locator(".docs-topnav__brand").boundingBox(),
    page.locator(".global-docs-search").boundingBox(),
    page.getByTestId("playground-locale-toggle").boundingBox(),
  ]);

  expect(headerBox, "docs top navigation geometry").not.toBeNull();
  expect(bodyBox, "docs shell body geometry").not.toBeNull();
  expect(brandBox, "docs brand geometry").not.toBeNull();
  expect(searchBox, "docs search geometry").not.toBeNull();
  expect(localeBox, "docs locale control geometry").not.toBeNull();

  const header = headerBox!;
  const body = bodyBox!;
  const children = [brandBox!, searchBox!, localeBox!];
  const tolerance = 1;

  for (const child of children) {
    expect(child.x).toBeGreaterThanOrEqual(header.x - tolerance);
    expect(child.y).toBeGreaterThanOrEqual(header.y - tolerance);
    expect(child.x + child.width).toBeLessThanOrEqual(header.x + header.width + tolerance);
    expect(child.y + child.height).toBeLessThanOrEqual(header.y + header.height + tolerance);
  }

  expect(header.y + header.height).toBeLessThanOrEqual(body.y + tolerance);
}

test("captures gridstack example visual typography screenshot", async ({
  page,
}, testInfo) => {
  await mkdir(artifactDir, { recursive: true });

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
    await expectDocsTopNavigationGeometry(page);

    await page.screenshot({
      animations: "disabled",
      fullPage: true,
      path: join(artifactDir, `gridstack-${route.name}-${testInfo.project.name}.png`),
    });
  }
});

test("keeps every Widget header action inside its card at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/examples/widget");
  await page.waitForLoadState("networkidle");

  const widgets = page.locator(".grid-stack-item .comins-grid-layout-widget");
  await expect(widgets).toHaveCount(3);

  const tolerance = 1;

  for (let index = 0; index < (await widgets.count()); index += 1) {
    const widget = widgets.nth(index);
    const header = widget.locator(".comins-grid-layout-widget__header");
    const actions = widget.locator(".comins-grid-layout-widget__actions");
    const buttons = actions.locator("button");
    const [widgetBox, headerBox, actionsBox] = await Promise.all([
      widget.boundingBox(),
      header.boundingBox(),
      actions.boundingBox(),
    ]);

    expect(widgetBox, `widget ${index + 1} card geometry`).not.toBeNull();
    expect(headerBox, `widget ${index + 1} header geometry`).not.toBeNull();
    expect(actionsBox, `widget ${index + 1} action geometry`).not.toBeNull();
    await expect(buttons).toHaveCount(3);

    const card = widgetBox!;
    const headerGeometry = headerBox!;
    const actionGeometry = actionsBox!;

    expect(actionGeometry.x).toBeGreaterThanOrEqual(headerGeometry.x - tolerance);
    expect(actionGeometry.y).toBeGreaterThanOrEqual(headerGeometry.y - tolerance);
    expect(actionGeometry.x + actionGeometry.width).toBeLessThanOrEqual(
      headerGeometry.x + headerGeometry.width + tolerance,
    );
    expect(actionGeometry.y + actionGeometry.height).toBeLessThanOrEqual(
      headerGeometry.y + headerGeometry.height + tolerance,
    );
    expect(actionGeometry.x).toBeGreaterThanOrEqual(card.x - tolerance);
    expect(actionGeometry.y).toBeGreaterThanOrEqual(card.y - tolerance);
    expect(actionGeometry.x + actionGeometry.width).toBeLessThanOrEqual(card.x + card.width + tolerance);
    expect(actionGeometry.y + actionGeometry.height).toBeLessThanOrEqual(card.y + card.height + tolerance);

    for (let buttonIndex = 0; buttonIndex < (await buttons.count()); buttonIndex += 1) {
      const buttonBox = await buttons.nth(buttonIndex).boundingBox();
      expect(buttonBox, `widget ${index + 1} action ${buttonIndex + 1} geometry`).not.toBeNull();

      const button = buttonBox!;
      expect(button.x).toBeGreaterThanOrEqual(actionGeometry.x - tolerance);
      expect(button.y).toBeGreaterThanOrEqual(actionGeometry.y - tolerance);
      expect(button.x + button.width).toBeLessThanOrEqual(actionGeometry.x + actionGeometry.width + tolerance);
      expect(button.y + button.height).toBeLessThanOrEqual(actionGeometry.y + actionGeometry.height + tolerance);
      expect(button.x).toBeGreaterThanOrEqual(card.x - tolerance);
      expect(button.y).toBeGreaterThanOrEqual(card.y - tolerance);
      expect(button.x + button.width).toBeLessThanOrEqual(card.x + card.width + tolerance);
      expect(button.y + button.height).toBeLessThanOrEqual(card.y + card.height + tolerance);
    }
  }
});
