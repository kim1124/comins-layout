import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { performTouchGesture } from "../touch-gesture";

async function waitForGrid(widget: Locator) {
  await expect.poll(() => widget.evaluate((element) => {
    const grid = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & { gridstack?: unknown }) | null;
    return Boolean(grid?.gridstack);
  })).toBe(true);
}

async function dragWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForGrid(widget);
  await widget.scrollIntoViewIfNeeded();
  const title = widget.locator(".comins-grid-layout-widget__title");
  const box = await title.boundingBox();
  if (!box) throw new Error("Widget title geometry is unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function resizeWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForGrid(widget);
  await widget.scrollIntoViewIfNeeded();
  await widget.hover();
  const handle = widget.locator(".ui-resizable-se");
  const box = await handle.boundingBox();
  if (!box) throw new Error("Resize handle geometry is unavailable");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 12 });
  await page.mouse.up();
}

function widget(page: Page, number: number) {
  return page.getByTestId(`dashboard-widget-widget-${number}`);
}

const supportedExampleRoutes = [
  "/examples/widget/basic",
  "/examples/widget/manage",
  "/examples/widget/events",
  "/examples/layout/basic",
  "/examples/layout/lock",
  "/examples/layout/persistence",
  "/examples/layout/arrange",
  "/examples/layout/events",
  "/examples/advanced/cell-height",
  "/examples/advanced/grid-lines",
  "/examples/advanced/float",
  "/examples/advanced/lazy-load",
  "/examples/advanced/mobile-touch",
  "/examples/advanced/nested/basic",
  "/examples/advanced/nested/advanced",
  "/examples/advanced/nested/constraints",
  "/examples/advanced/responsive/column",
  "/examples/advanced/responsive/breakpoints",
  "/examples/advanced/responsive/none",
  "/examples/advanced/rtl",
  "/examples/advanced/size-to-content",
  "/examples/advanced/static",
  "/examples/advanced/title-drag",
  "/examples/advanced/transform",
  "/examples/advanced/multi-grid/horizontal",
  "/examples/advanced/multi-grid/vertical",
  "/examples/advanced/public-api",
] as const;

test.describe("Playground localization", () => {
  test("updates example controls and content when switching to English", async ({ page }) => {
    await page.goto("/examples/widget/manage");
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

    await expect(page.getByRole("heading", { name: "Add / Clear All / Reset" })).toBeVisible();
    const widgetToolbar = page.getByRole("region", { name: "Example controls" });
    await expect(widgetToolbar.getByRole("button", { name: "Add" })).toBeVisible();
    await expect(widgetToolbar.getByRole("button", { name: "Reset" })).toBeVisible();
    await expect(widgetToolbar.getByRole("button", { name: "Clear all" })).toBeVisible();
    await expect(widget(page, 1).getByRole("button", { name: "Title 1 Lock resizing" })).toBeVisible();

    await page.goto("/examples/layout/persistence");
    await expect(page.getByRole("heading", { name: "Save / Load Layout" })).toBeVisible();
    const layoutToolbar = page.getByRole("region", { name: "Example controls" });
    await expect(layoutToolbar.getByRole("button", { name: "Save layout" })).toBeVisible();
    await expect(layoutToolbar.getByRole("combobox", { name: "Columns" })).toBeVisible();

    await page.goto("/examples/advanced/public-api");
    await expect(page.getByRole("heading", { name: "Safe Public Handlers / Methods" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Query state" })).toBeVisible();
    await expect(page.getByText(/raw CRUD bypasses React controlled state/)).toBeVisible();

    await page.goto("/examples/advanced/multi-grid/horizontal");
    await expect(page.getByRole("heading", { name: "Multiple Grids - Horizontal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Widget Palette" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Move mode" })).toBeVisible();
    await expect(page.locator('[data-palette-id="palette-kpi"]').getByRole("button", { name: "Add to Grid A" })).toBeVisible();
  });

  test("renders every menu example without Korean copy in English mode", async ({ page }) => {
    await page.goto("/examples/widget/basic");
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

    for (const route of supportedExampleRoutes) {
      await page.goto(route);
      const content = page.locator(".playground-route-content");
      await expect(content.locator(".playground-workspace"), route).toBeVisible();
      expect(await content.innerText(), route).not.toMatch(/[가-힣]/);
      await expect(page.locator("html"), route).toHaveAttribute("lang", "en");
    }
  });
});

test.describe("Playground toggle state", () => {
  test("shows the shared mint active style on every example route that exposes a toggle", async ({ page }) => {
    for (const route of supportedExampleRoutes) {
      await page.goto(route);
      const toggles = page.locator('.playground-route-content button[aria-pressed]');
      if (await toggles.count() === 0) {
        continue;
      }

      let activeToggle = page.locator('.playground-route-content button[aria-pressed="true"]').first();
      if (await activeToggle.count() === 0) {
        activeToggle = toggles.first();
        await activeToggle.click();
        await expect(activeToggle, route).toHaveAttribute("aria-pressed", "true");
      }

      await expect(activeToggle, route).toHaveCSS("background-color", "rgb(223, 248, 238)");
      await expect(activeToggle, route).toHaveCSS("border-color", "rgb(16, 185, 129)");
      await expect(activeToggle, route).toHaveCSS("color", "rgb(4, 120, 87)");
    }
  });
});

test.describe("Widget Playground", () => {
  test("renders Basic with exactly ten numbered widgets and no top controls", async ({ page }) => {
    await page.goto("/examples/widget/basic");

    await expect(page.locator(".grid-stack-item")).toHaveCount(10);
    await expect(widget(page, 1)).toContainText("Title 1");
    await expect(widget(page, 1)).toContainText("Content 1");
    await expect(widget(page, 10)).toContainText("Title 10");
    await expect(widget(page, 10)).toContainText("Content 10");
    await expect(page.locator(".playground-example-toolbar")).toHaveCount(0);
    await expect(page.locator(".example-widget-count, .example-status, [aria-label='현재 위젯 상태 JSON']")).toHaveCount(0);
    await expect(widget(page, 1).locator(".comins-grid-layout-widget__actions button")).toHaveCount(3);
    expect(await widget(page, 1).locator("[data-widget-action]").evaluateAll((actions) =>
      actions.map((action) => action.getAttribute("data-widget-action")),
    )).toEqual(["resize-lock", "move-lock", "remove"]);
  });

  test("shows a mint active state for widget resize and move toggles", async ({ page }) => {
    await page.goto("/examples/widget/basic");
    const first = widget(page, 1);
    const resizeToggle = first.locator('[data-widget-action="resize-lock"]');
    const moveToggle = first.locator('[data-widget-action="move-lock"]');

    for (const toggle of [resizeToggle, moveToggle]) {
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await expect(toggle).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      await expect(toggle).toHaveCSS("background-color", "rgb(223, 248, 238)");
      await expect(toggle).toHaveCSS("border-color", "rgb(16, 185, 129)");
    }
  });

  test("keeps generated numbers monotonic across delete, clear, and reset", async ({ page }) => {
    await page.goto("/examples/widget/manage");
    const toolbar = page.getByRole("region", { name: "예제 기능" });

    await toolbar.getByRole("button", { name: "추가" }).click();
    await expect(widget(page, 11)).toBeVisible();
    await widget(page, 11).getByRole("button", { name: "Title 11 삭제" }).click();
    await toolbar.getByRole("button", { name: "추가" }).click();
    await expect(widget(page, 12)).toBeVisible();

    await toolbar.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await toolbar.getByRole("button", { name: "추가" }).click();
    await expect(widget(page, 13)).toBeVisible();

    await toolbar.getByRole("button", { name: "초기화" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(10);
    await expect(widget(page, 1)).toBeVisible();
    await toolbar.getByRole("button", { name: "추가" }).click();
    await expect(widget(page, 14)).toBeVisible();
  });

  test("logs real move, resize, and title double-click lifecycle callbacks", { tag: "@firefox-parity" }, async ({ page }) => {
    await page.goto("/examples/widget/events");
    const first = widget(page, 1);
    const output = page.getByRole("textbox", { name: "위젯 이벤트" });

    await first.locator(".comins-grid-layout-widget__title").dblclick();
    await expect(output).toHaveValue(/onBeforeTitleDoubleClick[\s\S]*onTitleDoubleClick[\s\S]*onAfterTitleDoubleClick/);

    await dragWidget(page, first, 180, 110);
    await expect(output).toHaveValue(/onBeforeMove[\s\S]*onMove[\s\S]*onAfterMove/);

    await resizeWidget(page, first, 100, 80);
    await expect(output).toHaveValue(/onBeforeResize[\s\S]*onResize[\s\S]*onAfterResize/);
  });
});

test.describe("Layout Playground", () => {
  test("places the 1 through 12 Column select at the far right", async ({ page }) => {
    await page.goto("/examples/layout/basic");
    const toolbar = page.getByRole("region", { name: "예제 기능" });
    const select = toolbar.getByRole("combobox", { name: "컬럼" });
    await expect(select).toHaveValue("12");
    await expect(select.locator("option")).toHaveCount(12);
    await expect(select.locator("option")).toHaveText(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);

    const [toolbarBox, selectBox] = await Promise.all([toolbar.boundingBox(), select.boundingBox()]);
    expect(toolbarBox).not.toBeNull();
    expect(selectBox).not.toBeNull();
    expect(selectBox!.x + selectBox!.width).toBeGreaterThan(toolbarBox!.x + toolbarBox!.width * 0.8);

    await select.selectOption("5");
    await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "5");
  });

  test("locks and unlocks layout interaction without overwriting widget controls", async ({ page }) => {
    await page.goto("/examples/layout/lock");
    const first = widget(page, 1);
    const before = await first.getAttribute("data-layout-x");
    await page.getByRole("button", { name: "레이아웃 잠금" }).click();
    await dragWidget(page, first, 180, 100);
    await expect(first).toHaveAttribute("data-layout-x", before ?? "0");
    await expect(first.locator(".comins-grid-layout-widget__actions button")).toHaveCount(3);
    await page.getByRole("button", { name: "레이아웃 해제" }).click();
  });

  test("saves and loads full widget properties, layout, and columns in memory", async ({ page }) => {
    await page.goto("/examples/layout/persistence");
    const toolbar = page.getByRole("region", { name: "예제 기능" });
    await widget(page, 1).getByRole("button", { name: "Title 1 이동 잠금" }).click();
    await toolbar.getByRole("combobox", { name: "컬럼" }).selectOption("6");
    await toolbar.getByRole("button", { name: "레이아웃 저장" }).click();

    const json = page.getByRole("textbox", { name: "마지막 저장 레이아웃 JSON" });
    await expect(json).toHaveValue(/"columns": 6/);
    await expect(json).toHaveValue(/"movable": false/);

    await widget(page, 1).getByRole("button", { name: "Title 1 삭제" }).click();
    await toolbar.getByRole("combobox", { name: "컬럼" }).selectOption("12");
    await toolbar.getByRole("button", { name: "레이아웃 불러오기" }).click();
    await expect(widget(page, 1)).toBeVisible();
    await expect(toolbar.getByRole("combobox", { name: "컬럼" })).toHaveValue("6");
    await expect(widget(page, 1).getByRole("button", { name: "Title 1 이동 잠금 해제" })).toHaveAttribute("aria-pressed", "true");
  });

  test("runs arrange/fill and reports semantic layout events only", async ({ page }) => {
    await page.goto("/examples/layout/arrange");
    await page.getByRole("button", { name: "자동 정렬" }).click();
    await page.getByRole("button", { name: "빈 공간 채우기" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(10);

    await page.goto("/examples/layout/events");
    const output = page.getByRole("textbox", { name: "레이아웃 이벤트" });
    await page.getByRole("button", { name: "추가" }).click();
    await expect(output).toHaveValue(/widget:add/);
    await widget(page, 1).getByRole("button", { name: "Title 1 리사이즈 잠금" }).click();
    await expect(output).toHaveValue(/widget:update/);
    const beforeDoubleClick = await output.inputValue();
    await widget(page, 1).locator(".comins-grid-layout-widget__title").dblclick();
    await expect(output).toHaveValue(beforeDoubleClick);
    await widget(page, 1).getByRole("button", { name: "Title 1 삭제" }).click();
    await expect(output).toHaveValue(/widget:remove/);
  });
});

test.describe("Advanced Playground", () => {
  const routes = [
    "/examples/advanced/cell-height",
    "/examples/advanced/grid-lines",
    "/examples/advanced/float",
    "/examples/advanced/lazy-load",
    "/examples/advanced/mobile-touch",
    "/examples/advanced/nested/basic",
    "/examples/advanced/nested/advanced",
    "/examples/advanced/nested/constraints",
    "/examples/advanced/responsive/column",
    "/examples/advanced/responsive/breakpoints",
    "/examples/advanced/responsive/none",
    "/examples/advanced/rtl",
    "/examples/advanced/size-to-content",
    "/examples/advanced/static",
    "/examples/advanced/title-drag",
    "/examples/advanced/transform",
    "/examples/advanced/multi-grid/horizontal",
    "/examples/advanced/multi-grid/vertical",
    "/examples/advanced/public-api",
  ];

  test("renders every approved advanced submenu without browser errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator(".playground-workspace")).toBeVisible();
      await expect(page.locator(".grid-stack").first(), route).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("uses only safe public queries and controlled commits on the final page", async ({ page }) => {
    await page.goto("/examples/advanced/public-api");
    await page.getByRole("button", { name: "상태 조회" }).click();
    await expect(page.getByLabel("공개 메서드 실행 결과")).toContainText('"columns": 12');
    await expect(page.getByText(/raw CRUD는 React 제어 상태를 우회/)).toBeVisible();
    await page.getByRole("button", { name: "정렬 후 커밋" }).click();
    await expect(page.getByLabel("공개 메서드 실행 결과")).toContainText('"widgets"');
  });

  test("renders lazy content once when an offscreen widget enters the scroll boundary", async ({ page }) => {
    await page.goto("/examples/advanced/lazy-load");
    const lastBoundary = widget(page, 10).locator(".comins-grid-layout-widget__render-boundary");
    await expect(lastBoundary).toHaveAttribute("data-lazy-rendered", "false");
    await widget(page, 10).scrollIntoViewIfNeeded();
    await expect(lastBoundary).toHaveAttribute("data-lazy-rendered", "true");
    await expect(lastBoundary).toContainText("Content 10");
  });

  test("keeps every nested level under a named controlled grid owner", async ({ page }) => {
    await page.goto("/examples/advanced/nested/advanced");
    await expect(page.locator("[data-nested-level]")).toHaveCount(2);
    await expect(page.locator("[data-grid-id='nested-grid-1']")).toBeVisible();
    await expect(page.locator("[data-grid-id='nested-grid-2']")).toBeVisible();

    await page.goto("/examples/advanced/nested/constraints");
    await expect(page.getByText("허용: chart category")).toBeVisible();
  });

  test("applies the width-only responsive column option without adapter errors", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/examples/advanced/responsive/column");
    await expect.poll(() => page.getByTestId("dashboard-grid").getAttribute("data-columns")).not.toBe("12");
    await expect(page.locator(".grid-stack-item").first()).toBeVisible();
  });

  test("supports move and resize handles on the Mobile Touch example", { tag: "@mobile-touch" }, async ({ page }) => {
    await page.goto("/examples/advanced/mobile-touch");
    const first = widget(page, 1);
    await waitForGrid(first);
    const before = {
      w: await first.getAttribute("data-layout-w"),
      h: await first.getAttribute("data-layout-h"),
    };
    await performTouchGesture(page, first.locator(".ui-resizable-se"), { x: 56, y: 96 }, 2);
    await expect.poll(async () => ({
      w: await first.getAttribute("data-layout-w"),
      h: await first.getAttribute("data-layout-h"),
    })).not.toEqual(before);
  });
});
