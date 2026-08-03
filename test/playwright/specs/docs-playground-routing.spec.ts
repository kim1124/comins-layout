import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

import { isDesktopBrowserProject } from "../project-policy";

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: Array<{ text: string; type: ReturnType<ConsoleMessage["type"]> | "pageerror" }> = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.push({ text: message.text(), type: message.type() });
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.push({ text: error.message, type: "pageerror" });
  });

  return diagnostics;
}

async function expectPlaygroundShell(
  page: Page,
  path: "/examples/widget" | "/examples/layout" | "/examples/advanced",
  heading: "위젯" | "레이아웃" | "고급 예제",
) {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto(path);

  const navigation = page.getByRole("navigation", { name: "예제 메뉴" });
  const links = navigation.getByRole("link");
  await expect(navigation).toBeVisible();
  await expect(links).toHaveCount(3);
  await expect(links).toHaveText(["위젯", "레이아웃", "고급 예제"]);
  await expect(navigation.getByRole("link", { name: heading })).toHaveAttribute("aria-current", "page");

  await expect(page.locator(".docs-sidebar")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toHaveCount(0);
  await expect(page.locator(".playground-controls")).toBeVisible();
  await expect(page.locator(".grid-stack")).toHaveCount(1);

  const [mainBox, headerBox, controlsBox, gridBox] = await Promise.all([
    page.locator(".playground-main").boundingBox(),
    page.locator(".playground-header").boundingBox(),
    page.locator(".playground-controls").boundingBox(),
    page.locator(".playground-grid-region .grid-stack").boundingBox(),
  ]);

  expect(mainBox, "playground main geometry").not.toBeNull();
  expect(headerBox, "playground header geometry").not.toBeNull();
  expect(controlsBox, "playground controls geometry").not.toBeNull();
  expect(gridBox, "playground grid geometry").not.toBeNull();

  expect(gridBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
  expect(gridBox!.y).toBeGreaterThan(controlsBox!.y + controlsBox!.height);
  expect(Math.abs(gridBox!.width - mainBox!.width)).toBeLessThanOrEqual(2);
  expect(diagnostics).toEqual([]);
}

test.describe("gridstack docs playground routing", () => {
  test("normalizes legacy and unknown routes to their canonical shells", async ({ page }) => {
    const routes = [
      { from: "/", heading: "위젯", to: "/examples/widget" },
      { from: "/examples/crud", heading: "위젯", to: "/examples/widget" },
      { from: "/examples/complete", heading: "고급 예제", to: "/examples/advanced" },
      { from: "/examples/basic", heading: "시작하기", to: "/docs/getting-started" },
      { from: "/unknown-route", heading: "위젯", to: "/examples/widget" },
    ] as const;

    for (const route of routes) {
      await page.goto(route.from);

      await expect(page).toHaveURL(new RegExp(`${route.to.replaceAll("/", "\\/")}$`));
      await expect(page.getByRole("main").getByRole("heading", { name: route.heading }).first()).toBeVisible();
    }
  });

  test("normalizes a legacy example link during client-side navigation", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await page.getByRole("navigation", { name: "문서 메뉴" }).getByRole("link", { name: "종합 예제" }).click();

    await expect(page).toHaveURL(/\/examples\/advanced$/);
    await expect(page.getByRole("navigation", { name: "예제 메뉴" }).getByRole("link", { name: "고급 예제" })).toHaveAttribute("aria-current", "page");
  });

  test("renders a dedicated full-width shell for every example route", async ({ page }) => {
    await expectPlaygroundShell(page, "/examples/widget", "위젯");
    await expectPlaygroundShell(page, "/examples/layout", "레이아웃");
    await expectPlaygroundShell(page, "/examples/advanced", "고급 예제");
  });

  test("keeps the getting started and API pages in the docs shell", async ({ page }) => {
    for (const route of [
      { heading: "시작하기", path: "/docs/getting-started" },
      { heading: "API", path: "/api" },
    ]) {
      await page.goto(route.path);

      await expect(page.locator(".docs-shell")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
      await expect(page.locator(".playground-shell")).toHaveCount(0);
      await expect(page.getByRole("main").getByRole("heading", { name: route.heading }).first()).toBeVisible();
    }
  });

  test("uses a global search input instead of top navigation chips", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await expect(page.getByLabel("playground status")).toHaveCount(0);

    const search = page.getByRole("searchbox", { name: "전체 문서 검색" });
    await expect(search).toBeVisible();
    await search.fill("serializeState");

    const results = page.getByRole("listbox", { name: "전체 문서 검색 결과" });
    await expect(results).toBeVisible();
    await expect(results.getByRole("option", { name: /serializeState/ })).toBeVisible();

    await results.getByRole("option", { name: /serializeState/ }).click();
    await expect(page).toHaveURL(/\/api#api-layout-save-restore$/);
    await expect(page.locator("#api-layout-save-restore")).toBeVisible();
  });

  test("documents the gridstack API by feature with props methods and examples", async ({ page }) => {
    await page.goto("/api");

    await expect(page.getByRole("heading", { name: "1. Dashboard 렌더링" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "2. Widget 추가 / 삭제" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "3. Layout 저장 / 복원" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "4. Column / 정렬" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "5. 이동 / 리사이즈 / 잠금" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "6. Maximize / Minimize / Restore" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "7. Resize frame / Adapter utility" })).toBeVisible();
    await expect(page.locator(".docs-reference-list__group")).toHaveCount(7);
    await expect(page.locator(".docs-reference-list__separator")).toHaveCount(0);

    await expect(page.getByRole("heading", { name: "컴포넌트" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Hook" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "타입" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "유틸리티" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "사용 예제" })).toHaveCount(0);

    await expect(page.locator("#api-dashboard-rendering").getByRole("heading", { name: "Props" })).toBeVisible();
    await expect(page.locator("#api-widget-crud").getByRole("heading", { name: "Methods" })).toBeVisible();
    await expect(page.locator("#api-layout-save-restore").getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.locator("#api-layout-save-restore").locator("dt").filter({ hasText: "serializeState" })).toBeVisible();
    const layoutEvents = page.locator("#api-layout-save-restore").getByLabel("Layout 저장 / 복원 Events");
    await expect(layoutEvents.locator("dt").filter({ hasText: "onLayoutCommit" })).toBeVisible();
    await expect(layoutEvents.getByText("페이로드: DashboardLayoutSnapshot")).toBeVisible();
    await expect(page.locator("#api-column-arrange").locator("dt").filter({ hasText: "setColumns" })).toBeVisible();
    await expect(page.locator("#api-interaction-lock").locator("dt").filter({ hasText: "editable / movable / resizable" })).toBeVisible();
    await expect(page.locator("#api-resize-adapter").locator("dt").filter({ hasText: "createDashboardResizeScheduler" })).toBeVisible();
    await expect(page.locator("#api-resize-adapter").getByLabel("Resize frame / Adapter utility Events").locator("dt").filter({ hasText: "onWidgetResizeFrame" })).toBeVisible();
    await expect(page.locator("#api-widget-crud").getByText("파라미터:")).toBeVisible();
    await expect(page.locator("#api-widget-crud").getByText("리턴값:")).toBeVisible();
    await expect(page.locator(".docs-reference-list__sample").locator(".docs-code__pre")).toHaveCount(14);

    const firstGroup = page.locator(".docs-reference-list__group").first();
    await expect(firstGroup).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(firstGroup).toHaveCSS("border-radius", "8px");
    await expect(firstGroup).toHaveCSS("border-top-color", "rgb(215, 238, 230)");
    await expect(firstGroup.locator(".docs-reference-list__item dt").first()).toHaveCSS("color", "rgb(8, 121, 95)");

    const propsSection = page.locator("#api-dashboard-rendering").getByLabel("Dashboard 렌더링 Props");
    await expect(propsSection).toHaveCSS("padding-left", "14px");
    await expect(propsSection).toHaveCSS("border-left-color", "rgb(215, 238, 230)");
    await expect(page.locator("#api-dashboard-rendering").locator(".docs-reference-list__sample").first()).toHaveCSS("padding-left", "10px");
  });

  test("documents the previousLayouts persistence contract", async ({ page }, testInfo) => {
    test.skip(!isDesktopBrowserProject(testInfo.project.name), "Persistence contract rendering is checked on supported desktop browsers.");

    await page.goto("/api");

    const layoutApi = page.locator("#api-layout-save-restore");
    await expect(layoutApi).toContainText("serializeState()은 widgets, columns, previousLayouts를 저장합니다.");
    await expect(layoutApi).toContainText("serializeLayout()은 columns와 widget geometry만 저장합니다.");
  });

  test("unmounts the previous example route before mounting the next owner", async ({ page }) => {
    await page.goto("/examples/widget");

    await page.evaluate(() => {
      window.__cominsGridLayoutLastUnmount = undefined;
    });
    await page.getByRole("navigation", { name: "예제 메뉴" }).getByRole("link", { name: "레이아웃" }).click();

    await expect(page).toHaveURL(/\/examples\/layout$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const lastUnmount = window.__cominsGridLayoutLastUnmount;
          return typeof lastUnmount === "string" ? lastUnmount : lastUnmount?.routePath;
        }),
      )
      .toBe("/examples/widget");
  });
});
