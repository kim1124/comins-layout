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

test.describe("gridstack docs playground routing", () => {
  test("loads the getting started docs example as the single basic entry", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/docs/getting-started");

    await expect(page.getByRole("banner")).toContainText("comins-grid-layout");
    await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
    await expect(page.getByRole("main").getByRole("heading", { name: "시작하기" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "문서 메뉴" }).getByRole("link", { name: "기본" })).toHaveCount(0);
    await expect(page.locator(".docs-code__pre").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "라이브 예제" })).toHaveCount(0);
    await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
    await expect(page.locator(".grid-stack-item")).toHaveCount(12);

    const moveToggle = page.getByRole("button", { name: "이동 가능" });
    await expect(moveToggle).toHaveAttribute("aria-pressed", "true");
    await expect(moveToggle).toHaveAttribute("data-active", "true");
    await moveToggle.click();
    await expect(page.getByRole("button", { name: "이동 불가" })).toHaveAttribute("data-active", "false");
    expect(diagnostics).toEqual([]);
  });

  test("redirects the legacy basic route to getting started", async ({ page }) => {
    await page.goto("/examples/basic");

    await expect(page).toHaveURL(/\/docs\/getting-started$/);
    await expect(page.getByRole("main").getByRole("heading", { name: "시작하기" })).toBeVisible();
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

  test("does not render example metrics chips on live example pages", async ({ page }) => {
    for (const path of ["/docs/getting-started", "/examples/crud", "/examples/layout", "/examples/widget", "/examples/complete"]) {
      await page.goto(path);

      await expect(page.locator(".example-metrics")).toHaveCount(0);
    }
  });

  test("adds a widget through the add and delete dialog controls", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/examples/crud");

    await expect(page.getByRole("main")).toContainText("추가 / 삭제");
    await expect(page.getByText("위젯 3개")).toBeVisible();
    await expect(page.getByLabel("crud widget actions").getByRole("button", { name: "위젯 추가" })).toBeVisible();
    await expect(page.getByLabel("crud widget actions").getByRole("button", { name: "위젯 삭제" })).toBeVisible();
    await expect(page.getByRole("button", { name: "위젯 수정" })).toHaveCount(0);
    await expect(page.getByLabel("crud widget edit form")).toHaveCount(0);
    await expect(page.getByLabel("수정 대상")).toHaveCount(0);
    await page.getByRole("button", { name: "위젯 추가" }).click();

    const dialog = page.getByRole("dialog", { name: "위젯 추가" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("새 위젯 너비").selectOption("4");
    await dialog.getByLabel("새 위젯 높이").selectOption("3");
    await dialog.getByRole("button", { name: "위젯 저장" }).click();

    await expect(page.getByText("위젯 4개")).toBeVisible();
    await expect(page.getByTestId("dashboard-widget-widget-4")).toHaveAttribute("data-layout-w", "4");
    await expect(page.getByTestId("dashboard-widget-widget-4")).toHaveAttribute("data-layout-h", "3");
    expect(diagnostics).toEqual([]);
  });

  test("exposes layout save restore, column select, and global lock examples", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/examples/layout");

    await expect(page.getByRole("main")).toContainText("레이아웃");
    await page.getByRole("button", { name: "레이아웃 저장" }).first().click();
    await expect(page.getByText("저장 완료").first()).toBeVisible();

    const columnSelect = page.getByLabel("컬럼 선택").first();
    await expect(columnSelect.locator("option")).toHaveCount(12);
    await columnSelect.selectOption("4");
    await expect(page.getByTestId("dashboard-grid").first()).toHaveAttribute("data-columns", "4");

    await page.getByRole("button", { name: "레이아웃 해제" }).click();
    await expect(page.getByRole("button", { name: "레이아웃 잠금" })).toHaveAttribute("data-active", "true");
    await expect(page.locator(".example-status")).toHaveCount(0);
    expect(diagnostics).toEqual([]);
  });

  test("locks movement and resizing on an individual widget", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/examples/widget");

    await expect(page.getByRole("main")).toContainText("위젯");
    await page.getByLabel("위젯 선택").selectOption("sales");
    await page.getByRole("button", { name: "이동 잠금" }).click();
    await page.getByRole("button", { name: "리사이즈 잠금" }).click();

    const widgetActions = page.getByLabel("widget interaction actions");
    await expect(widgetActions.getByRole("button", { name: "이동 잠금" })).toHaveAttribute("data-active", "true");
    await expect(widgetActions.getByRole("button", { name: "리사이즈 잠금" })).toHaveAttribute("data-active", "true");
    await expect(page.locator(".example-status")).toHaveCount(0);
    await expect(page.locator(".dashboard-widget-badges")).toHaveCount(0);
    expect(diagnostics).toEqual([]);
  });

  test("shows the complete smoke example and feature-based API docs", async ({ page }) => {
    await page.goto("/examples/complete");

    await expect(page.locator(".docs-article__header")).toHaveCount(0);
    await expect(page.locator(".docs-example-case__header")).toHaveCount(0);
    await expect(page.locator(".docs-code__pre")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "라이브 예제" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "레이아웃 저장" })).toBeVisible();
    await expect(page.getByRole("button", { name: "위젯 추가" })).toBeVisible();

    await page.getByRole("link", { name: "API" }).click();
    await expect(page).toHaveURL(/\/api$/);
    await expect(page.getByRole("heading", { name: "1. Dashboard 렌더링" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("DashboardWidget");
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

  test("unmounts the previous live route when docs pages change", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await page.evaluate(() => {
      window.__cominsGridLayoutLastUnmount = undefined;
    });
    await page.getByRole("link", { name: "레이아웃" }).click();

    await expect(page).toHaveURL(/\/examples\/layout$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const lastUnmount = window.__cominsGridLayoutLastUnmount;
          return typeof lastUnmount === "string" ? lastUnmount : lastUnmount?.routePath;
        }),
      )
      .toBe("/docs/getting-started");
  });
});
