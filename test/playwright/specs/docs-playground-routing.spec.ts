import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

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
  path: string,
  heading: "위젯" | "레이아웃" | "고급 예제" | null,
  expectedGridCount = 1,
) {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto(path);

  const navigation = page.getByRole("navigation", { name: "예제 메뉴" });
  const links = navigation.locator(".playground-sidebar__menu > a");
  await expect(navigation).toBeVisible();
  await expect(links).toHaveCount(3);
  await expect(links).toHaveText(["위젯", "레이아웃", "고급 예제"]);
  if (heading) {
    await expect(navigation.getByRole("link", { name: heading, exact: true })).toHaveAttribute("aria-current", "page");
  } else {
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(0);
  }

  await expect(page.getByRole("banner").getByText("comins-grid-layout")).toBeVisible();
  await expect(page.getByTestId("playground-locale-toggle")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "문서 및 예제 검색" })).toBeVisible();
  await expect(page.locator(".docs-sidebar")).toBeVisible();
  await expect(page.locator(".playground-sidebar__submenu")).toHaveCount(3);
  await expect(page.locator(".playground-sidebar__submenu-link")).toHaveCount(27);
  await expect(page.locator(".playground-nav")).toHaveCount(0);
  await expect(page.locator(".grid-stack")).toHaveCount(expectedGridCount);

  const [mainBox, sidebarBox, headerBox, gridBox] = await Promise.all([
    page.locator(".playground-main").boundingBox(),
    page.locator(".docs-sidebar").boundingBox(),
    page.locator(".playground-header").boundingBox(),
    page.locator(".playground-grid-region .grid-stack").first().boundingBox(),
  ]);

  expect(mainBox, "playground main geometry").not.toBeNull();
  expect(sidebarBox, "playground sidebar geometry").not.toBeNull();
  expect(headerBox, "playground header geometry").not.toBeNull();
  expect(gridBox, "playground grid geometry").not.toBeNull();

  expect(gridBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
  expect(mainBox!.x).toBeGreaterThanOrEqual(sidebarBox!.x + sidebarBox!.width - 1);
  expect(gridBox!.x).toBeGreaterThanOrEqual(mainBox!.x);
  expect(gridBox!.x + gridBox!.width).toBeLessThanOrEqual(mainBox!.x + mainBox!.width);
  expect(diagnostics).toEqual([]);
}

test.describe("gridstack docs playground routing", () => {
  test("normalizes legacy and unknown routes to their canonical shells", async ({ page }) => {
    const routes = [
      { from: "/", heading: "Basic", to: "/examples/widget/basic" },
      { from: "/examples/crud", heading: "추가 / 전체 삭제 / 초기화", to: "/examples/widget/manage" },
      { from: "/examples/complete", heading: "안전한 공개 핸들러 / 메서드", to: "/examples/advanced/public-api" },
      { from: "/examples/basic", heading: "시작하기", to: "/docs/getting-started" },
      { from: "/unknown-route", heading: "Basic", to: "/examples/widget/basic" },
    ] as const;

    for (const route of routes) {
      await page.goto(route.from);

      await expect(page).toHaveURL(new RegExp(`${route.to.replaceAll("/", "\\/")}$`));
      await expect(page.getByRole("main").getByRole("heading", { name: route.heading }).first()).toBeVisible();
    }
  });

  test("navigates docs users to the current widget, layout, and advanced playgrounds", async ({ page }) => {
    await page.goto("/docs/getting-started");

    const navigation = page.getByRole("navigation", { name: "문서 메뉴" });
    await expect(navigation.getByRole("link", { name: "위젯" })).toHaveAttribute("href", "/examples/widget/basic");
    await expect(navigation.getByRole("link", { name: "레이아웃" })).toHaveAttribute("href", "/examples/layout/basic");
    await expect(navigation.getByRole("link", { name: "고급 예제" })).toHaveAttribute("href", "/examples/advanced/cell-height");
    await expect(navigation.getByRole("link", { name: "추가 / 삭제" })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: "종합 예제" })).toHaveCount(0);

    await navigation.getByRole("link", { name: "고급 예제" }).click();

    await expect(page).toHaveURL(/\/examples\/advanced\/cell-height$/);
    await expect(page.getByRole("navigation", { name: "예제 메뉴" }).getByRole("link", { name: "고급 예제" })).toHaveAttribute("aria-current", "page");
  });

  test("renders the Data Table-compatible shell for every example route", async ({ page }) => {
    await expectPlaygroundShell(page, "/examples/widget/basic", "위젯");
    await expectPlaygroundShell(page, "/examples/layout/basic", "레이아웃");
    await expectPlaygroundShell(page, "/examples/transfer", null, 2);
    await expectPlaygroundShell(page, "/examples/advanced/cell-height", "고급 예제");
  });

  test("searches primary and submenu routes", async ({ page }) => {
    await page.goto("/examples/widget/basic");

    const search = page.getByRole("searchbox", { name: "문서 및 예제 검색" });
    await search.fill("레이아웃 저장");

    const results = page.getByRole("listbox", { name: "Playground 검색 결과" });
    await expect(results.getByRole("option", { name: /레이아웃 저장/ })).toBeVisible();
    await results.getByRole("option", { name: /레이아웃 저장/ }).click();

    await expect(page).toHaveURL(/\/examples\/layout\/persistence$/);
    await expect(page.getByRole("navigation", { name: "예제 메뉴" }).locator(".playground-sidebar__menu > a")).toHaveText([
      "위젯",
      "레이아웃",
      "고급 예제",
    ]);
  });

  test("keeps the Data Table-compatible shell inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/examples/widget/basic");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.locator(".docs-sidebar")).toBeVisible();
    await expect(page.getByRole("main").getByRole("heading", { name: "Basic" })).toBeVisible();
    expect(
      await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      })),
    ).toEqual({ documentWidth: 390, viewportWidth: 390 });
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
    await expect(page.locator(".docs-reference-list__sample").locator(".docs-code__pre")).toHaveCount(15);

    const layoutApi = page.locator("#api-layout-save-restore");
    await expect(layoutApi).toContainText("DashboardColumnLayoutSnapshot");
    await expect(layoutApi).toContainText("DashboardLayoutsByColumn");
    await expect(layoutApi).toContainText("layoutsByColumn");
    await expect(layoutApi).toContainText("serializeState()은 widgets, columns, previousLayouts, layoutsByColumn을 저장합니다.");
    await expect(layoutApi).toContainText("serializeLayout()은 활성 columns와 widget geometry만 저장합니다.");
    await expect(layoutApi).toContainText("legacy snapshot은 layoutsByColumn 없이 복원할 수 있습니다.");
    await expect(layoutApi).toContainText("active top-level widgets와 previousLayouts가 active cache보다 authoritative입니다.");
    await expect(layoutApi).toContainText("12 -> 6 -> 12");
    await expect(page.getByText("getGridStack()은 escape hatch입니다.")).toBeVisible();
    await expect(page.getByText("controlled example에서는 raw GridStack add/remove/destroy를 호출하지 않습니다.")).toBeVisible();
  });

  test("unmounts the previous example route before mounting the next owner", async ({ page }) => {
    await page.goto("/examples/widget/basic");

    await page.evaluate(() => {
      window.__cominsGridLayoutLastUnmount = undefined;
    });
    await page.getByRole("navigation", { name: "예제 메뉴" }).getByRole("link", { name: "레이아웃", exact: true }).click();

    await expect(page).toHaveURL(/\/examples\/layout\/basic$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const lastUnmount = window.__cominsGridLayoutLastUnmount;
          return typeof lastUnmount === "string" ? lastUnmount : lastUnmount?.routePath;
        }),
      )
      .toBe("/examples/widget/basic");
  });
});
