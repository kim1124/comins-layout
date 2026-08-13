import { expect, test } from "@playwright/test";

import { dragWidget, readWidgetGeometry, resizeWidget } from "../helpers/dashboard-interactions";

test.describe("Advanced engine options", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.goto("/examples/advanced");
  });

  test("explains and changes supported engine options", async ({ page }) => {
    const grid = page.locator(".grid-stack");
    const firstWidget = page.locator(".grid-stack-item").first();

    await expect(grid).toHaveCount(1);
    await expect(page.getByText("화면 너비에 따라 컬럼이 자동으로 변경됩니다.")).toBeVisible();
    await expect(page.getByText("GridStack의 배치, 렌더링과 상호작용 옵션을 변경합니다.")).toBeVisible();

    const floatToggle = page.getByRole("button", { name: "Float 사용" });
    await expect(floatToggle).toHaveAttribute("aria-pressed", "false");
    await floatToggle.click();
    await expect(page.getByRole("button", { name: "Float 해제" })).toHaveAttribute("aria-pressed", "true");

    const staticToggle = page.getByRole("button", { name: "정적 모드 사용" });
    await staticToggle.click();
    await expect(page.getByRole("button", { name: "정적 모드 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-static/);
    const staticGeometry = await readWidgetGeometry(firstWidget);
    await dragWidget(page, firstWidget, 160, 120);
    await expect.poll(() => readWidgetGeometry(firstWidget)).toEqual(staticGeometry);
    await page.getByRole("button", { name: "정적 모드 해제" }).click();

    const initialWidgetBox = await firstWidget.boundingBox();
    expect(initialWidgetBox).not.toBeNull();
    await page.getByRole("combobox", { name: "셀 높이" }).selectOption("80");
    await expect.poll(async () => (await firstWidget.boundingBox())?.height).not.toBe(initialWidgetBox?.height);

    const initialInset = await firstWidget.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(".grid-stack-item-content");
      if (!content) throw new Error("Expected widget content");
      return content.getBoundingClientRect().left - element.getBoundingClientRect().left;
    });
    await page.getByRole("combobox", { name: "여백" }).selectOption("12");
    await expect.poll(() => firstWidget.evaluate((element) => {
      const content = element.querySelector<HTMLElement>(".grid-stack-item-content");
      if (!content) throw new Error("Expected widget content");
      return content.getBoundingClientRect().left - element.getBoundingClientRect().left;
    })).toBeGreaterThan(initialInset);

    await page.getByRole("button", { name: "애니메이션 사용" }).click();
    await expect(page.getByRole("button", { name: "애니메이션 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-animate/);

    await page.getByRole("button", { name: "RTL 사용" }).click();
    await expect(page.getByRole("button", { name: "RTL 해제" })).toHaveAttribute("aria-pressed", "true");
    await expect(grid).toHaveClass(/grid-stack-rtl/);

    await page.getByRole("button", { name: "콘텐츠 높이 사용" }).click();
    await expect(page.getByRole("button", { name: "콘텐츠 높이 해제" })).toHaveAttribute("aria-pressed", "true");

    const rowLimit = page.getByRole("combobox", { name: "행 제한" });
    await expect(rowLimit.locator("option")).toHaveText(["제한 없음", "2–8행", "4–12행"]);
    await rowLimit.selectOption("two-eight");
    const readAppliedRowLimits = () => grid.evaluate((element) => {
      const gridStack = (element as HTMLElement & {
        gridstack?: { opts: { maxRow?: number; minRow?: number } };
      }).gridstack;
      return { maxRow: gridStack?.opts.maxRow ?? 0, minRow: gridStack?.opts.minRow ?? 0 };
    });
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 8, minRow: 2 });
    await resizeWidget(page, firstWidget, 0, 1000);
    await expect.poll(async () => {
      const { h, y } = await readWidgetGeometry(firstWidget);
      return y + h;
    }).toBeLessThanOrEqual(8);
    await rowLimit.selectOption("four-twelve");
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 12, minRow: 4 });
    await rowLimit.selectOption("none");
    await expect.poll(readAppliedRowLimits).toEqual({ maxRow: 0, minRow: 0 });

    await page.getByRole("button", { name: "반응형 컬럼 사용" }).click();
    await expect(page.getByRole("button", { name: "반응형 컬럼 해제" })).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 600, height: 900 });
    await expect(grid).toHaveAttribute("data-columns", "6");

    await expect(page.getByRole("button", { name: /compact|commit|Grid 정보/ })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
    await expect(page.locator("[data-dashboard-drop-target]")).toHaveCount(0);
  });

  test("exposes only the approved select domains without duplicate state text", async ({ page }) => {
    await expect(page.getByRole("combobox", { name: "셀 높이" }).locator("option")).toHaveText(["60", "80", "100"]);
    await expect(page.getByRole("combobox", { name: "여백" }).locator("option")).toHaveText(["4", "8", "12"]);
    await expect(page.getByRole("combobox", { name: "행 제한" })).toHaveValue("none");
    await expect(page.getByText(/상태:|사용 상태|활성 상태/)).toHaveCount(0);
  });

  test("associates every engine control with distinct localized effect guidance", async ({ page }) => {
    const koreanControls = [
      { name: "Float 사용", phrase: "빈 행", role: "button" },
      { name: "애니메이션 사용", phrase: "이동과 재배치", role: "button" },
      { name: "정적 모드 사용", phrase: "이동과 크기 조절", role: "button" },
      { name: "RTL 사용", phrase: "오른쪽", role: "button" },
      { name: "콘텐츠 높이 사용", phrase: "고유 높이", role: "button" },
      { name: "셀 높이", phrase: "한 행의 높이", role: "combobox" },
      { name: "여백", phrase: "위젯 사이", role: "combobox" },
      { name: "행 제한", phrase: "최소·최대", role: "combobox" },
    ] as const;
    const englishControls = [
      { name: "Enable float", phrase: "empty rows", role: "button" },
      { name: "Enable animation", phrase: "movement and rearrangement", role: "button" },
      { name: "Enable static mode", phrase: "moving and resizing", role: "button" },
      { name: "Enable RTL", phrase: "right edge", role: "button" },
      { name: "Enable content height", phrase: "intrinsic height", role: "button" },
      { name: "Cell height", phrase: "height of one row", role: "combobox" },
      { name: "Margin", phrase: "between widgets", role: "combobox" },
      { name: "Row limit", phrase: "minimum and maximum", role: "combobox" },
    ] as const;

    const expectDescriptions = async (controls: ReadonlyArray<{ name: string; phrase: string; role: "button" | "combobox" }>) => {
      const descriptionIds = new Set<string>();
      for (const control of controls) {
        const locator = page.getByRole(control.role, { name: control.name });
        const descriptionId = await locator.getAttribute("aria-describedby");
        expect(descriptionId, `${control.name} description id`).toBeTruthy();
        descriptionIds.add(descriptionId ?? "");
        await expect(page.locator(`#${descriptionId}`)).toContainText(control.phrase);
      }
      expect(descriptionIds.size).toBe(controls.length);
    };

    await expectDescriptions(koreanControls);
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    await expectDescriptions(englishControls);
  });

  test("changes real vertical placement when Float is enabled", async ({ page }) => {
    const alerts = page.getByTestId("dashboard-widget-alerts");
    const packedY = Number(await alerts.getAttribute("gs-y"));

    await page.getByRole("button", { name: "Float 사용" }).click();
    await alerts.scrollIntoViewIfNeeded();
    await dragWidget(page, alerts, 0, 260);
    await expect.poll(async () => Number(await alerts.getAttribute("gs-y"))).toBeGreaterThan(packedY);
    const floatingY = Number(await alerts.getAttribute("gs-y"));
    await page.evaluate(() => new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    }));
    await expect(alerts).toHaveAttribute("gs-y", String(floatingY));

    await page.getByRole("button", { name: "Float 해제" }).click();
    await expect.poll(async () => Number(await alerts.getAttribute("gs-y"))).toBe(packedY);
  });

  test("resizes a tall widget to its intrinsic content height", async ({ page }) => {
    const target = page.getByTestId("dashboard-widget-alerts");
    const before = await target.boundingBox();
    expect(before).not.toBeNull();

    await page.getByRole("button", { name: "콘텐츠 높이 사용" }).click();

    await expect.poll(async () => (await target.boundingBox())?.height).toBeGreaterThan((before?.height ?? 0) + 40);
  });
});

test.describe("Official API Handle", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
  });

  test("runs safe Comins methods and official read APIs", async ({ page }) => {
    await page.goto("/examples/advanced/handle");
    await expect.poll(() => page.evaluate(() => window.__cominsGridLayoutHandleExample?.getHandle()?.grid?.getColumn() ?? null)).toBe(12);
    await expect.poll(() => page.evaluate(() => window.__cominsGridLayoutHandleExample?.getHandle()?.grid?.opts.float ?? null)).toBe(true);

    const queryStatus = page.getByRole("status", { name: "GridStack 조회 결과" });
    const handleStatus = page.getByRole("status", { name: "Handle 실행 결과" });
    await expect(queryStatus).toHaveText("Grid 정보를 조회하세요.");
    await expect(queryStatus).not.toContainText("GridStack이 아직 준비되지 않았습니다.");
    await page.getByRole("button", { name: "Grid 정보 조회" }).click();
    await expect(queryStatus).toHaveText(/^column=12; row=\d+$/);
    await expect(handleStatus).not.toContainText("GridStack이 아직 준비되지 않았습니다.");

    const target = page.getByTestId("dashboard-widget-alerts");
    const beforeY = Number(await target.getAttribute("gs-y"));
    await page.getByRole("button", { name: "compact 후 commit" }).click();
    await expect(handleStatus).toHaveText("committed");
    await expect.poll(async () => Number(await target.getAttribute("data-layout-y"))).toBeLessThan(beforeY);
    await expect(target).toHaveAttribute("gs-y", await target.getAttribute("data-layout-y") ?? "");

    await page.getByRole("button", { name: "레이아웃 갱신" }).click();
    await expect(page.getByRole("status", { name: "Handle 실행 결과" })).toHaveText("refreshed");
  });

  test("changes cell height through layoutRef.current.grid", async ({ page }) => {
    await page.goto("/examples/advanced/handle");
    await expect.poll(() => page.evaluate(() => window.__cominsGridLayoutHandleExample?.getHandle()?.grid?.getColumn() ?? null)).toBe(12);

    const firstWidget = page.locator(".grid-stack-item").first();
    const before = await firstWidget.boundingBox();
    expect(before).not.toBeNull();
    await page.getByRole("button", { name: "공식 API로 셀 높이 80 적용" }).click();
    await expect.poll(async () => (await firstWidget.boundingBox())?.height).not.toBe(before?.height);
    await expect(page.getByRole("status", { name: "Handle 실행 결과" })).toHaveText("cell-height-80");
  });

  test("keeps list compact supported through the safe Handle and controlled React state", async ({ page }) => {
    await page.goto("/examples/advanced/handle");
    await expect.poll(() => page.evaluate(() => window.__cominsGridLayoutHandleExample?.getHandle()?.grid?.getColumn() ?? null)).toBe(12);

    const result = await page.evaluate(() => {
      const handle = window.__cominsGridLayoutHandleExample?.getHandle();
      return {
        float: handle?.grid?.opts.float ?? null,
        snapshot: handle?.compact("list", true) ?? null,
      };
    });
    expect(result.float).toBe(true);
    const alertsLayout = result.snapshot?.widgets.find((widget) => widget.id === "alerts");
    expect(alertsLayout).toBeDefined();
    if (!alertsLayout) {
      throw new Error("Expected alerts layout in list compact snapshot");
    }

    const alerts = page.getByTestId("dashboard-widget-alerts");
    await expect(alerts).toHaveAttribute("data-layout-x", String(alertsLayout.x));
    await expect(alerts).toHaveAttribute("data-layout-y", String(alertsLayout.y));
    await expect(alerts).toHaveAttribute("data-layout-w", String(alertsLayout.w));
    await expect(alerts).toHaveAttribute("data-layout-h", String(alertsLayout.h));
    await expect(page.getByRole("button", { name: /list/i })).toHaveCount(0);
  });

  test("keeps controlled state unchanged when GridStack is not ready", async ({ page }) => {
    await page.route("**/src/gridstack/adapter.ts*", (route) => route.abort());
    await page.goto("/examples/advanced/handle");

    const target = page.getByTestId("dashboard-widget-alerts");
    const before = await target.evaluate((element) => ({
      h: element.getAttribute("data-layout-h"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    }));
    await page.getByRole("button", { name: "Grid 정보 조회" }).click();
    await expect(page.getByRole("status", { name: "GridStack 조회 결과" })).toHaveText("GridStack이 아직 준비되지 않았습니다.");
    await page.getByRole("button", { name: "compact 후 commit" }).click();
    await expect(page.getByRole("status", { name: "Handle 실행 결과" })).toHaveText("GridStack이 아직 준비되지 않았습니다.");
    await page.getByRole("button", { name: "공식 API로 셀 높이 80 적용" }).click();
    await expect(target).toHaveAttribute("data-layout-h", before.h ?? "");
    await expect(target).toHaveAttribute("data-layout-w", before.w ?? "");
    await expect(target).toHaveAttribute("data-layout-x", before.x ?? "");
    await expect(target).toHaveAttribute("data-layout-y", before.y ?? "");
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    await expect(page.getByRole("status", { name: "GridStack query result" })).toHaveText("GridStack is not ready yet.");
    await expect(page.getByRole("status", { name: "Handle execution result" })).toHaveText("GridStack is not ready yet.");
  });

  test("clears the live GridStack instance after the Handle route unmounts", async ({ page }) => {
    await page.goto("/examples/advanced/handle");
    await expect.poll(() => page.evaluate(() => window.__cominsGridLayoutHandleExample?.getHandle()?.grid?.getColumn() ?? null)).toBe(12);

    await page.evaluate(() => {
      window.__retainedCominsGridLayoutHandle = window.__cominsGridLayoutHandleExample?.getHandle() ?? null;
      history.pushState({}, "", "/examples/advanced");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page.getByRole("heading", { name: "고급 예제" }).first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__retainedCominsGridLayoutHandle?.grid?.getColumn() ?? null)).toBeNull();
  });

  test("does not expose raw mutation or destroy controls", async ({ page }) => {
    await page.goto("/examples/advanced/handle");

    await expect(page.getByRole("button", { name: /raw.*(?:add|remove|destroy)|(?:add|remove|destroy).*raw/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /위젯 추가|전체 삭제|삭제/ })).toHaveCount(0);
  });
});

test.describe("Advanced state and column cache", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/examples/advanced/state");
  });

  test("distinguishes layout snapshot from full state and column cache", async ({ page }) => {
    await page.getByText("레이아웃 JSON 편집기").click();
    await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
    await page.getByRole("button", { name: "레이아웃 저장" }).click();
    await page.getByRole("button", { name: "전체 상태 저장" }).click();

    const layoutEditor = page.getByRole("textbox", { name: "레이아웃 JSON", exact: true });
    const layout = JSON.parse(await layoutEditor.inputValue());
    const state = JSON.parse(await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue());

    expect(layout).toEqual(expect.objectContaining({ columns: 12, widgets: expect.any(Array) }));
    expect(layout).not.toHaveProperty("layoutsByColumn");
    expect(state).toHaveProperty("layoutsByColumn.12");
    expect(state.widgets[0]).toHaveProperty("data.colorKey");

    const target = layout.widgets.find((widget: { id: string }) => widget.id === "sales");
    expect(target).toBeDefined();
    target.y = 8;
    await layoutEditor.fill(JSON.stringify(layout));
    await page.getByRole("button", { name: "레이아웃 복원" }).click();
    await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-y", "8");
  });

  test("keeps editor and geometry when nested state is invalid", async ({ page }) => {
    await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const editor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const savedState = await editor.inputValue();
    const before = await page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("gs-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })));
    const invalidCases = [
      (state: { widgets: Array<{ data?: { colorKey?: unknown } }> }) => {
        if (!state.widgets[0]?.data) throw new Error("Expected widget data");
        state.widgets[0].data.colorKey = { privateValue: "INVALID_COLOR_KEY" };
      },
      (state: { widgets: Array<{ layout?: { w?: number } }> }) => {
        if (!state.widgets[0]?.layout) throw new Error("Expected widget layout");
        state.widgets[0].layout.w = 0;
      },
    ];

    for (const invalidate of invalidCases) {
      const state = JSON.parse(savedState);
      invalidate(state);
      const invalid = JSON.stringify(state);
      await editor.fill(invalid);
      await page.getByRole("button", { name: "전체 상태 복원" }).click();

      await expect(editor).toHaveValue(invalid);
      await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText(
        "JSON 형식 또는 상태 값을 확인해 주세요.",
      );
      await expect.poll(() => page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
        h: element.getAttribute("data-layout-h"),
        id: element.getAttribute("gs-id"),
        w: element.getAttribute("data-layout-w"),
        x: element.getAttribute("data-layout-x"),
        y: element.getAttribute("data-layout-y"),
      })))).toEqual(before);
      expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain("INVALID_COLOR_KEY");
    }
  });

  test("keeps the Grid mounted while JSON details are toggled", async ({ page }) => {
    await page.getByTestId("dashboard-grid").evaluate((element) => {
      element.setAttribute("data-mount-probe", "state-details");
    });

    await page.getByText("레이아웃 JSON 편집기").click();
    await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
    await page.getByText("레이아웃 JSON 편집기").click();

    await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-mount-probe", "state-details");
  });

  test("rejects invalid layout geometry and unsupported active columns", async ({ page }) => {
    await page.getByText("레이아웃 JSON 편집기").click();
    await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
    const before = await page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("gs-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })));
    const invalidLayout = '{"columns":12,"widgets":[{"id":"sales","x":0,"y":0,"w":0,"h":2}]}';
    const invalidState = '{"columns":99,"widgets":[]}';

    const layoutEditor = page.getByRole("textbox", { name: "레이아웃 JSON", exact: true });
    await layoutEditor.fill(invalidLayout);
    await page.getByRole("button", { name: "레이아웃 복원" }).click();
    await expect(layoutEditor).toHaveValue(invalidLayout);
    await expect(page.getByRole("status", { name: "활성 레이아웃 저장 복원 상태" })).toHaveText(
      "JSON 형식 또는 레이아웃 값을 확인해 주세요.",
    );

    await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").fill(invalidState);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();
    await expect(page.getByLabel("전체 상태 및 컬럼 캐시 JSON")).toHaveValue(invalidState);
    await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText(
      "JSON 형식 또는 상태 값을 확인해 주세요.",
    );
    await expect.poll(() => page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("gs-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })))).toEqual(before);
  });

  test("rejects a malformed supported cache atomically", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    await columnSelect.selectOption("6");
    await columnSelect.selectOption("12");
    await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const editor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const savedStateJson = await editor.inputValue();
    const malformed = JSON.parse(savedStateJson) as {
      layoutsByColumn: Record<string, { widgets: Array<{ x: number }> }>;
    };
    const cachedWidget = malformed.layoutsByColumn["6"]?.widgets[0];
    expect(cachedWidget).toBeDefined();
    if (!cachedWidget) throw new Error("Expected a 6-column cached widget");
    cachedWidget.x = -1;
    const malformedJson = JSON.stringify(malformed);
    const before = await page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("gs-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })));

    await editor.fill(malformedJson);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();

    await expect(editor).toHaveValue(malformedJson);
    await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText(
      "JSON 형식 또는 상태 값을 확인해 주세요.",
    );
    await expect.poll(() => page.locator(".grid-stack-item").evaluateAll((elements) => elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("gs-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })))).toEqual(before);
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    await expect(editor).toHaveValue(savedStateJson);
  });
});

test.describe("Dashboard events", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.goto("/examples/advanced/events");
  });

  test("logs columns, drag, resize frame and commit events", async ({ page }) => {
    await expect(page).toHaveURL(/\/examples\/advanced\/events$/);
    const navigation = page.getByRole("navigation", { name: "문서 메뉴" });
    await expect(navigation.getByRole("link", { name: "이벤트" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();
    await expect(page.locator(".grid-stack")).toHaveCount(1);
    await expect(page.locator("[data-dashboard-drop-target]")).toHaveCount(0);

    const log = page.getByRole("log");
    await expect(log).toHaveAttribute("aria-live", "polite");
    const entries = log.locator("[data-event-name]");

    const widget = page.getByTestId("dashboard-widget-sales");
    const beforeDrag = await readWidgetGeometry(widget);
    await dragWidget(page, widget, 180, 120);
    await expect.poll(() => readWidgetGeometry(widget)).not.toEqual(beforeDrag);
    await expect(entries.filter({ hasText: "onWidgetDragStart" })).not.toHaveCount(0);
    await expect(entries.filter({ hasText: "onWidgetDragStop" })).not.toHaveCount(0);
    await expect(entries.filter({ hasText: "onLayoutCommit" })).not.toHaveCount(0);

    const resizableWidget = page.getByTestId("dashboard-widget-traffic");
    const beforeResize = await readWidgetGeometry(resizableWidget);
    await resizeWidget(page, resizableWidget, 120, 80);
    await expect.poll(async () => {
      const afterResize = await readWidgetGeometry(resizableWidget);
      return afterResize.w !== beforeResize.w || afterResize.h !== beforeResize.h;
    }).toBe(true);
    await expect(entries.filter({ hasText: "onWidgetResizeStart" })).not.toHaveCount(0);
    await expect(entries.filter({ hasText: "onWidgetResizeStop" })).not.toHaveCount(0);
    const frameEntry = entries.filter({ hasText: "onWidgetResizeFrame" }).last();
    await expect(frameEntry).toContainText(/width=\d+/);
    await expect(frameEntry).toContainText(/height=\d+/);
    await expect(frameEntry).not.toContainText("x=");

    const names = await entries.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-event-name")));
    expect(names.lastIndexOf("onWidgetDragStart")).toBeLessThan(names.lastIndexOf("onWidgetDragStop"));
    expect(names.lastIndexOf("onWidgetResizeStart")).toBeLessThan(names.lastIndexOf("onWidgetResizeStop"));
    expect(names.at(-1)).toBe("onWidgetResizeStop");

    await page.getByRole("combobox", { name: "레이아웃 컬럼" }).selectOption("6");
    await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", "6");
    await expect(entries.filter({ hasText: "onColumnsChange" })).toContainText("columns=6");

    for (let index = 0; index < 12; index += 1) {
      await page.getByRole("combobox", { name: "레이아웃 컬럼" }).selectOption(index % 2 === 0 ? "5" : "6");
    }
    await expect(entries).toHaveCount(10);
    await expect(entries.last()).toContainText("onColumnsChange columns=6");
  });

  test("localizes the bounded event explanation without exposing external drop", async ({ page }) => {
    await expect(page.getByText("최근 10개의 공개 callback 이벤트를 발생 순서대로 표시합니다.")).toBeVisible();
    await expect(page.getByRole("log")).toContainText("아직 기록된 이벤트가 없습니다.");
    await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("callback 이벤트");
    const eventResult = page.getByRole("option", { name: /^문서 이벤트/ });
    await expect(eventResult).toBeVisible();
    await eventResult.click();
    await expect(page).toHaveURL(/\/examples\/advanced\/events$/);
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
    await expect(page.getByText("Shows the ten most recent public callback events in occurrence order.")).toBeVisible();
    await expect(page.getByRole("log")).toContainText("No events recorded yet.");
    await expect(page.getByText(/external drop/i)).toHaveCount(0);
  });
});
