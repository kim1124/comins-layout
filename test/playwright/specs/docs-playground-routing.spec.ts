import { expect, test, type Page } from "@playwright/test";

import { isDesktopBrowserProject } from "../project-policy";

async function expectIntegratedPlayground(
  page: Page,
  path: "/examples/widget" | "/examples/layout" | "/examples/layout/columns" | "/examples/layout/lock" | "/examples/advanced" | "/examples/advanced/handle",
  heading: "위젯" | "레이아웃" | "컬럼 레이아웃 동적 수정" | "레이아웃 잠금 / 해제" | "고급 예제" | "공식 API Handle",
  navLabel: "위젯" | "저장·복원" | "동적 컬럼" | "잠금·해제" | "반응형·엔진 옵션" | "공식 API Handle",
) {
  await page.goto(path);

  const navigation = page.getByRole("navigation", { name: "문서 메뉴" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link", { name: navLabel })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();
  await expect(page.locator(".docs-code")).not.toHaveCount(0);
  await expect(page.locator(".docs-live .playground-workspace")).toHaveCount(1);
  await expect(page.locator(".grid-stack")).toHaveCount(1);
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

  test("navigates docs users to the current widget, layout, dynamic column, and advanced playgrounds", async ({ page }) => {
    await page.goto("/docs/getting-started");

    const navigation = page.getByRole("navigation", { name: "문서 메뉴" });
    await expect(navigation.getByRole("link", { name: "위젯" })).toHaveAttribute("href", "/examples/widget");
    await expect(navigation.getByRole("link", { name: "저장·복원" })).toHaveAttribute("href", "/examples/layout");
    await expect(navigation.getByRole("link", { name: "동적 컬럼" })).toHaveAttribute("href", "/examples/layout/columns");
    await expect(navigation.getByRole("link", { name: "잠금·해제" })).toHaveAttribute("href", "/examples/layout/lock");
    await expect(navigation.getByRole("link", { name: "반응형·엔진 옵션" })).toHaveAttribute("href", "/examples/advanced");
    await expect(navigation.getByRole("link", { name: "추가 / 삭제" })).toHaveCount(0);
    await expect(navigation.getByRole("link", { name: "종합 예제" })).toHaveCount(0);

    await navigation.getByRole("link", { name: "반응형·엔진 옵션" }).click();

    await expect(page).toHaveURL(/\/examples\/advanced$/);
    await expect(page.getByRole("navigation", { name: "문서 메뉴" }).getByRole("link", { name: "반응형·엔진 옵션" })).toHaveAttribute("aria-current", "page");
  });

  test("groups Layout and Advanced links without hiding child routes", async ({ page }) => {
    await page.goto("/examples/widget");

    const nav = page.getByRole("navigation", { name: "문서 메뉴" });
    const rootLink = nav.getByRole("link", { name: "위젯" });
    const layoutChildLink = nav.getByRole("link", { name: "저장·복원" });
    const columnChildLink = nav.getByRole("link", { name: "동적 컬럼" });
    const lockChildLink = nav.getByRole("link", { name: "잠금·해제" });
    await expect(nav.getByText("레이아웃", { exact: true })).toBeVisible();
    await expect(layoutChildLink).toHaveAttribute("href", "/examples/layout");
    await expect(columnChildLink).toHaveAttribute("href", "/examples/layout/columns");
    await expect(lockChildLink).toHaveAttribute("href", "/examples/layout/lock");
    await expect(nav.getByText("고급 예제", { exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "반응형·엔진 옵션" })).toHaveAttribute("href", "/examples/advanced");
    await expect(nav.getByRole("link", { name: "공식 API Handle" })).toHaveAttribute("href", "/examples/advanced/handle");

    const rootBox = await rootLink.boundingBox();
    const childBox = await layoutChildLink.boundingBox();
    expect(rootBox).not.toBeNull();
    expect(childBox).not.toBeNull();
    expect(childBox!.x).toBeGreaterThan(rootBox!.x);
    const columnChildBox = await columnChildLink.boundingBox();
    expect(columnChildBox).not.toBeNull();
    expect(columnChildBox!.x).toBe(childBox!.x);
    const lockChildBox = await lockChildLink.boundingBox();
    expect(lockChildBox).not.toBeNull();
    expect(lockChildBox!.x).toBe(childBox!.x);
  });

  test("marks exactly one current navigation link for every canonical docs route", async ({ page }) => {
    const routes = [
      { label: "시작하기", path: "/docs/getting-started" },
      { label: "위젯", path: "/examples/widget" },
      { label: "저장·복원", path: "/examples/layout" },
      { label: "동적 컬럼", path: "/examples/layout/columns" },
      { label: "잠금·해제", path: "/examples/layout/lock" },
      { label: "반응형·엔진 옵션", path: "/examples/advanced" },
      { label: "공식 API Handle", path: "/examples/advanced/handle" },
      { label: "API", path: "/api" },
    ] as const;

    for (const route of routes) {
      await page.goto(route.path);
      const currentLinks = page.getByRole("navigation", { name: "문서 메뉴" }).locator('a[aria-current="page"]');
      await expect(currentLinks).toHaveCount(1);
      await expect(currentLinks).toHaveText(route.label);
    }

    await page.goto("/examples/layout/columns");
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    const englishCurrentLinks = page.getByRole("navigation", { name: "Docs menu" }).locator('a[aria-current="page"]');
    await expect(englishCurrentLinks).toHaveCount(1);
    await expect(englishCurrentLinks).toHaveText("Dynamic columns");
  });

  test("renders an integrated docs shell with one live playground for every example route", async ({ page }) => {
    await expectIntegratedPlayground(page, "/examples/widget", "위젯", "위젯");
    await expectIntegratedPlayground(page, "/examples/layout", "레이아웃", "저장·복원");
    await expectIntegratedPlayground(page, "/examples/layout/columns", "컬럼 레이아웃 동적 수정", "동적 컬럼");
    await expectIntegratedPlayground(page, "/examples/layout/lock", "레이아웃 잠금 / 해제", "잠금·해제");
    await expectIntegratedPlayground(page, "/examples/advanced", "고급 예제", "반응형·엔진 옵션");
    await expectIntegratedPlayground(page, "/examples/advanced/handle", "공식 API Handle", "공식 API Handle");
  });

  test("searches and localizes the official API Handle child route", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("공식 API Handle");
    const result = page.getByRole("option", { name: /^문서 공식 API Handle/ });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/examples\/advanced\/handle$/);
    const koreanNavigation = page.getByRole("navigation", { name: "문서 메뉴" });
    await expect(koreanNavigation.getByRole("link", { name: "공식 API Handle" })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".docs-code")).toHaveCount(2);
    const koreanWarning = page.getByText(
      "raw addWidget(), removeWidget(), destroy() API를 호출하면 controlled React 상태와 컬럼 캐시가 GridStack 배치와 달라질 수 있습니다. 관리되는 변경에는 안전한 Comins method를 우선 사용하세요.",
    );
    await expect(koreanWarning).toBeVisible();
    await expect(koreanWarning).toContainText("addWidget()");
    await expect(koreanWarning).toContainText("removeWidget()");
    await expect(koreanWarning).toContainText("destroy()");

    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    const englishNavigation = page.getByRole("navigation", { name: "Docs menu" });
    await expect(englishNavigation.getByRole("link", { name: "Official API Handle" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Query Grid information" })).toBeVisible();
    const englishWarning = page.getByText(
      "Calling raw addWidget(), removeWidget(), or destroy() APIs can make controlled React state and the column cache diverge from the GridStack layout. Prefer safe Comins methods for managed mutations.",
    );
    await expect(englishWarning).toBeVisible();
    await expect(englishWarning).toContainText("addWidget()");
    await expect(englishWarning).toContainText("removeWidget()");
    await expect(englishWarning).toContainText("destroy()");
  });

  test("searches the dynamic column child route", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("동적 컬럼");
    const result = page.getByRole("option", { name: /^문서 컬럼 레이아웃 동적 수정/ });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/examples\/layout\/columns$/);
    await expect(page.getByRole("combobox", { name: "레이아웃 컬럼" })).toHaveValue("12");
  });

  test("searches the layout lock child route", async ({ page }) => {
    await page.goto("/docs/getting-started");

    await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("잠금 해제");
    const result = page.getByRole("option", { name: /^문서 레이아웃 잠금 \/ 해제/ });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL(/\/examples\/layout\/lock$/);
    await expect(page.getByRole("button", { name: "레이아웃 잠금", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  test("keeps the getting started and API pages in the docs shell", async ({ page }) => {
    for (const route of [
      { heading: "시작하기", path: "/docs/getting-started" },
      { heading: "API", path: "/api" },
    ]) {
      await page.goto(route.path);

      await expect(page.locator(".docs-shell")).toBeVisible();
      await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
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

  test("documents the full per-column persistence and controlled handle contracts", async ({ page }, testInfo) => {
    test.skip(!isDesktopBrowserProject(testInfo.project.name), "Persistence contract rendering is checked on supported desktop browsers.");

    await page.goto("/api");

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
    await page.goto("/examples/widget");

    await page.evaluate(() => {
      window.__cominsGridLayoutLastUnmount = undefined;
    });
    await page.getByRole("navigation", { name: "문서 메뉴" }).getByRole("link", { name: "저장·복원" }).click();

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
