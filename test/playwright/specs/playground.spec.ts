import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type IdentifiedWidgetLayout = WidgetLayout & {
  id: string;
};

async function waitForWidgetGridEngine(widget: Locator) {
  await expect
    .poll(() =>
      widget.evaluate((element) => {
        const grid = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & { gridstack?: unknown }) | null;
        return Boolean(grid?.gridstack);
      }),
    )
    .toBe(true);
}

async function readWidgetLayout(widget: Locator): Promise<WidgetLayout> {
  return widget.evaluate((element) => ({
    x: Number(element.getAttribute("data-layout-x")),
    y: Number(element.getAttribute("data-layout-y")),
    w: Number(element.getAttribute("data-layout-w")),
    h: Number(element.getAttribute("data-layout-h")),
  }));
}

async function dragWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const box = await widget.boundingBox();
  if (!box) {
    throw new Error("Widget bounding box is not available");
  }

  await page.mouse.move(box.x + 56, box.y + 24);
  await page.mouse.down();
  await page.mouse.move(box.x + 56 + deltaX, box.y + 24 + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function dragWidgetToTarget(page: Page, widget: Locator, target: Locator) {
  await waitForWidgetGridEngine(widget);
  const title = widget.locator(".comins-grid-layout-widget__title");
  await title.dragTo(target);
}

async function resizeWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) {
    throw new Error("Widget bounding box is not available");
  }

  await widget.hover({ position: { x: widgetBox.width - 4, y: widgetBox.height - 4 } });
  const handle = widget.locator(".ui-resizable-se");
  const handleBox = (await handle.count()) > 0 ? await handle.boundingBox() : null;
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function readDashboardLayouts(page: Page): Promise<IdentifiedWidgetLayout[]> {
  return page.locator(".grid-stack-item").evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.getAttribute("gs-id") ?? element.getAttribute("data-testid")?.replace("dashboard-widget-", "") ?? "",
      x: Number(element.getAttribute("data-layout-x")),
      y: Number(element.getAttribute("data-layout-y")),
      w: Number(element.getAttribute("data-layout-w")),
      h: Number(element.getAttribute("data-layout-h")),
    })),
  );
}

test.describe("Widget Playground", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name !== "mobile-chrome") {
      await page.setViewportSize({ width: 1280, height: 1400 });
    }

    await page.goto("/examples/widget");
  });

  test("renders one Grid, the fixture widgets, and a valid heading relationship", async ({ page }) => {
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect(page.locator(".grid-stack")).toHaveCount(1);
    await expect(page.getByText("위젯을 추가·수정·삭제하고 개별 이동 및 크기 조절 잠금을 확인합니다.")).toBeVisible();
    await expect(page.getByTestId("dashboard-widget-widget-1")).toContainText("위젯 1");
    await expect(page.getByTestId("dashboard-widget-widget-2")).toContainText("위젯 2");
    await expect(page.getByTestId("dashboard-widget-widget-3")).toContainText("위젯 3");

    const header = page.locator(".playground-header");
    const heading = header.getByRole("heading", { level: 1 });
    const labelledBy = await header.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(labelledBy).not.toMatch(/\s/);
    await expect(heading).toHaveAttribute("id", labelledBy ?? "");

    const secondWidgetBody = page.getByRole("button", { name: "위젯 2 위젯 선택" });
    await expect(secondWidgetBody.locator("button")).toHaveCount(0);
    await secondWidgetBody.click();
    await expect(secondWidgetBody).toHaveAttribute("data-selected", "true");
  });

  test("adds and edits the selected widget while preserving dialog validation and cancel semantics", async ({ page }) => {
    await page.getByRole("button", { name: "위젯 추가" }).click();
    const addDialog = page.getByRole("dialog", { name: "위젯 추가" });

    await addDialog.getByLabel("위젯명").fill("");
    await addDialog.getByLabel("값").fill("");
    await addDialog.getByRole("button", { name: "위젯 저장" }).click();
    await expect(addDialog.getByText("위젯명을 입력해 주세요.")).toBeVisible();
    await expect(addDialog.getByText("값을 입력해 주세요.")).toBeVisible();
    await expect(page.locator(".grid-stack-item")).toHaveCount(3);

    await addDialog.getByLabel("위젯명").fill("신규 지표");
    await addDialog.getByLabel("값").fill("42");
    await addDialog.getByLabel("너비").selectOption("3");
    await addDialog.getByLabel("높이").selectOption("3");
    await addDialog.getByRole("button", { name: "위젯 저장" }).click();

    const added = page.getByTestId("dashboard-widget-widget-4");
    await expect(added).toBeVisible();
    await expect(added).toContainText("신규 지표");
    await expect(added).toContainText("42");
    await expect(added).toHaveAttribute("data-layout-w", "3");
    await expect(added).toHaveAttribute("data-layout-h", "3");
    await expect(added.locator(".dashboard-widget-body")).toHaveAttribute("data-selected", "true");

    await added.getByRole("button", { name: "신규 지표 수정" }).click();
    const editDialog = page.getByRole("dialog", { name: "위젯 수정" });
    await editDialog.getByLabel("위젯명").fill("취소할 이름");
    await editDialog.getByLabel("값").fill("취소할 값");
    await editDialog.getByRole("button", { name: "취소" }).click();
    await expect(added).toContainText("신규 지표");
    await expect(added).toContainText("42");

    await added.getByRole("button", { name: "신규 지표 수정" }).click();
    await editDialog.getByLabel("위젯명").fill("전환 지표");
    await editDialog.getByLabel("값").fill("84");
    await editDialog.getByRole("button", { name: "변경 저장" }).click();

    await expect(added).toContainText("전환 지표");
    await expect(added).toContainText("84");
  });

  test("selects the first remaining widget after delete and disables controls after clear", async ({ page }) => {
    const secondWidget = page.getByTestId("dashboard-widget-widget-2");
    await secondWidget.locator(".dashboard-widget-body").click();
    await page.getByRole("button", { name: "선택 위젯 삭제" }).click();
    await expect(secondWidget).toBeHidden();
    await expect(page.getByTestId("dashboard-widget-widget-1").locator(".dashboard-widget-body")).toHaveAttribute("data-selected", "true");

    await page.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "선택 위젯 삭제" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "이동 잠금" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "리사이즈 잠금" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "전체 잠금" })).toBeDisabled();
    await expect(page.getByText("위젯 0개", { exact: true })).toBeVisible();
  });

  test("keeps the selected widget when a different widget is deleted from its header", async ({ page }) => {
    const selectedBody = page.getByTestId("dashboard-widget-widget-2").locator(".dashboard-widget-body");
    await selectedBody.click();
    await page.getByTestId("dashboard-widget-widget-3").getByRole("button", { name: "위젯 3 삭제" }).click();

    await expect(page.getByTestId("dashboard-widget-widget-3")).toBeHidden();
    await expect(selectedBody).toHaveAttribute("data-selected", "true");
  });

  test("prevents and then permits a real drag through the move lock", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-widget-1");
    const interactionActions = page.locator(".example-interaction-actions");
    const moveLock = interactionActions.getByRole("button").nth(0);
    const resizeLock = interactionActions.getByRole("button").nth(1);

    await moveLock.click();
    await expect(moveLock).toHaveAccessibleName("이동 잠금 해제");
    await expect(moveLock).toHaveAttribute("aria-pressed", "true");
    await expect(resizeLock).toHaveAttribute("aria-pressed", "false");
    const lockedLayout = await readWidgetLayout(widget);
    const widgetBox = await widget.boundingBox();
    if (!widgetBox) {
      throw new Error("Widget bounding box is not available");
    }
    await dragWidget(page, widget, widgetBox.width, 0);
    await expect.poll(() => readWidgetLayout(widget)).toEqual(lockedLayout);

    await moveLock.click();
    await expect(moveLock).toHaveAccessibleName("이동 잠금");
    await expect(moveLock).toHaveAttribute("aria-pressed", "false");
    await dragWidget(page, widget, widgetBox.width, 0);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(widget);
      return layout.x !== lockedLayout.x || layout.y !== lockedLayout.y;
    }).toBe(true);
  });

  test("prevents and then permits a real resize through the resize lock", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-widget-1");
    const interactionActions = page.locator(".example-interaction-actions");
    const moveLock = interactionActions.getByRole("button").nth(0);
    const resizeLock = interactionActions.getByRole("button").nth(1);

    await resizeLock.click();
    await expect(resizeLock).toHaveAccessibleName("리사이즈 잠금 해제");
    await expect(resizeLock).toHaveAttribute("aria-pressed", "true");
    await expect(moveLock).toHaveAttribute("aria-pressed", "false");
    const lockedLayout = await readWidgetLayout(widget);
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(() => readWidgetLayout(widget)).toEqual(lockedLayout);

    await resizeLock.click();
    await expect(resizeLock).toHaveAccessibleName("리사이즈 잠금");
    await expect(resizeLock).toHaveAttribute("aria-pressed", "false");
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(widget);
      return layout.w !== lockedLayout.w || layout.h !== lockedLayout.h;
    }).toBe(true);
  });

  test("uses the actual full-lock state as the pressed-state and interaction precedence", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-widget-1");
    const interactionActions = page.locator(".example-interaction-actions");
    const moveLock = interactionActions.getByRole("button").nth(0);
    const resizeLock = interactionActions.getByRole("button").nth(1);
    const fullLock = interactionActions.getByRole("button").nth(2);

    await fullLock.click();
    await expect(fullLock).toHaveAccessibleName("전체 잠금 해제");
    await expect(fullLock).toHaveAttribute("aria-pressed", "true");
    await expect(moveLock).toHaveAttribute("aria-pressed", "true");
    await expect(resizeLock).toHaveAttribute("aria-pressed", "true");
    const lockedLayout = await readWidgetLayout(widget);
    await dragWidget(page, widget, 0, 220);
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(() => readWidgetLayout(widget)).toEqual(lockedLayout);

    await fullLock.click();
    await expect(fullLock).toHaveAccessibleName("전체 잠금");
    await expect(fullLock).toHaveAttribute("aria-pressed", "false");
  });

});

// Task 9 Handle contracts now run on /examples/advanced/handle in playground-advanced-examples.spec.ts.
// Keep the state, invalid-state, fail-closed, and external-drop contracts visible here until Tasks 10 and 12 move them.
test.describe.skip("Advanced child-route migration contracts (Tasks 10 and 12)", () => {
  const diagnosticsByTest = new Map<string, string[]>();

  test.beforeEach(async ({ page }, testInfo) => {
    const diagnostics: string[] = [];
    diagnosticsByTest.set(testInfo.testId, diagnostics);
    page.on("console", (message) => {
      if (message.type() === "error") {
        diagnostics.push(`[console] ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      diagnostics.push(`[pageerror] ${error.message}`);
    });
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/examples/advanced");
  });

  test.afterEach(async ({}, testInfo) => {
    expect(diagnosticsByTest.get(testInfo.testId), "Advanced Playground browser diagnostics").toEqual([]);
    diagnosticsByTest.delete(testInfo.testId);
  });

  test("deletes only through the configured 300x300 typed external target callback", async ({ page }) => {
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect(page.locator(".grid-stack")).toHaveCount(1);
    await expect(page.getByText("드래그한 위젯을 여기에 놓으세요.")).toBeVisible();

    const target = page.locator("[data-dashboard-drop-target='trash']");
    await expect(target).toBeVisible();
    const targetBox = await target.boundingBox();
    expect(targetBox?.width).toBe(300);
    expect(targetBox?.height).toBe(300);

    const widget = page.getByTestId("dashboard-widget-sales");
    await dragWidgetToTarget(page, widget, target);

    await expect(widget).toBeHidden();
    await expect(page.getByRole("status", { name: "외부 드롭 처리 상태" })).toContainText(
      "target=trash; widget=sales; columns=12; layout=",
    );
    await expect(page.getByRole("button", { name: /GridStack (addWidget|removeWidget|destroy)/i })).toHaveCount(0);
  });

  test("keeps the widget and target status unchanged when a drag ends outside the target", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-sales");
    const initialStatus = "위젯을 삭제 영역으로 드래그해 보세요.";
    await expect(page.getByRole("status", { name: "외부 드롭 처리 상태" })).toHaveText(initialStatus);

    await dragWidget(page, widget, 160, 0);

    await expect(widget).toBeVisible();
    await expect(page.getByRole("status", { name: "외부 드롭 처리 상태" })).toHaveText(initialStatus);
  });

  test("round-trips independent 6 and 12 column geometry through the visible state cache", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    const activeColumns = page.getByRole("status", { name: "활성 컬럼 상태" });
    const cacheKeys = page.getByRole("status", { name: "사용 가능한 컬럼 캐시" });
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");

    await expect(columnSelect).toHaveValue("12");
    await expect(activeColumns).toHaveText("현재 12컬럼입니다.");
    const initialTwelve = await readDashboardLayouts(page);
    await resizeWidget(page, page.getByTestId("dashboard-widget-orders"), 0, 110);
    await expect.poll(() => readDashboardLayouts(page)).not.toEqual(initialTwelve);
    const modifiedTwelve = await readDashboardLayouts(page);

    await columnSelect.selectOption("6");
    await expect(activeColumns).toHaveText("현재 6컬럼입니다.");
    const initialSix = await readDashboardLayouts(page);
    await resizeWidget(page, page.getByTestId("dashboard-widget-sales"), 0, 110);
    await expect.poll(() => readDashboardLayouts(page)).not.toEqual(initialSix);
    const modifiedSix = await readDashboardLayouts(page);

    await columnSelect.selectOption("12");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(modifiedTwelve);
    await columnSelect.selectOption("6");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(modifiedSix);
    await expect(cacheKeys).toHaveText("사용 가능한 캐시 컬럼: 6, 12");

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const savedStateJson = await stateEditor.inputValue();
    const savedState = JSON.parse(savedStateJson) as {
      layoutsByColumn: Record<string, { widgets: IdentifiedWidgetLayout[] }>;
    };
    expect(Object.keys(savedState.layoutsByColumn).sort()).toEqual(["12", "6"]);
    expect(savedState.layoutsByColumn["6"]?.widgets).toEqual(modifiedSix);
    expect(savedState.layoutsByColumn["12"]?.widgets).toEqual(modifiedTwelve);

    await page.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await stateEditor.fill(savedStateJson);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();
    await expect.poll(() => readDashboardLayouts(page)).toEqual(modifiedSix);
    await columnSelect.selectOption("12");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(modifiedTwelve);
  });

  test("ignores prototype-like presentation metadata while restoring valid Advanced state", async ({ page }) => {
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const stateStatus = page.getByRole("status", { name: "전체 상태 저장 복원 상태" });
    const initialLayouts = await readDashboardLayouts(page);
    const rawFixtureTitle = "RAW_FIXTURE_TITLE";
    const rawFixtureDescription = "RAW_FIXTURE_DESCRIPTION";
    const rawGeneratedTitle = "RAW_GENERATED_TITLE";
    const rawGeneratedDescription = "RAW_GENERATED_DESCRIPTION";

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const restoredState = JSON.parse(await stateEditor.inputValue()) as {
      widgets: Array<{ data?: Record<string, unknown>; id: string; title?: string }>;
    };
    const fixtureWidget = restoredState.widgets.find((widget) => widget.id === "sales");
    const generatedWidget = restoredState.widgets.find((widget) => widget.id === "traffic");
    expect(fixtureWidget).toBeDefined();
    expect(generatedWidget).toBeDefined();
    if (!fixtureWidget || !generatedWidget) {
      throw new Error("Expected Advanced fixture widgets");
    }

    fixtureWidget.title = rawFixtureTitle;
    fixtureWidget.data = {
      ...fixtureWidget.data,
      description: rawFixtureDescription,
      fixtureCopyKey: "__proto__",
    };
    const generatedData = { ...generatedWidget.data };
    delete generatedData.fixtureCopyKey;
    generatedWidget.title = rawGeneratedTitle;
    generatedWidget.data = {
      ...generatedData,
      description: rawGeneratedDescription,
      generatedDescriptionKey: "__proto__",
    };
    const restoredStateJson = JSON.stringify(restoredState);

    await stateEditor.fill(restoredStateJson);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();

    await expect(stateStatus).toHaveText("전체 상태와 컬럼 캐시를 복원했습니다.");
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect(page.getByTestId("dashboard-widget-sales")).toContainText(rawFixtureTitle);
    await expect(page.getByTestId("dashboard-widget-sales")).toContainText(rawFixtureDescription);
    await expect(page.getByTestId("dashboard-widget-traffic")).toContainText(rawGeneratedTitle);
    await expect(page.getByTestId("dashboard-widget-traffic")).toContainText(rawGeneratedDescription);
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);
    expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain("RAW_");
  });

  test("routes responsive viewport columns through the same reducer cache keys as manual selection", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    const activeColumns = page.getByRole("status", { name: "활성 컬럼 상태" });
    const cacheKeys = page.getByRole("status", { name: "사용 가능한 컬럼 캐시" });
    const responsiveToggle = page.getByRole("button", { name: "반응형 컬럼 사용" });

    await columnSelect.selectOption("6");
    await columnSelect.selectOption("12");
    await expect(cacheKeys).toHaveText("사용 가능한 캐시 컬럼: 6, 12");

    await responsiveToggle.click();
    await expect(responsiveToggle).toHaveAttribute("aria-pressed", "true");
    await page.setViewportSize({ width: 800, height: 1000 });
    await expect(activeColumns).toHaveText("현재 6컬럼입니다.");
    await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");
    await expect(cacheKeys).toHaveText("사용 가능한 캐시 컬럼: 6, 12");

    await page.setViewportSize({ width: 1280, height: 1000 });
    await expect(activeColumns).toHaveText("현재 12컬럼입니다.");
    await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
    await expect(cacheKeys).toHaveText("사용 가능한 캐시 컬럼: 6, 12");
  });

  test("rejects malformed full-state JSON without crashing or changing reducer geometry", async ({ page }) => {
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const initialLayouts = await readDashboardLayouts(page);
    const malformedState = '{"columns":12}';

    await stateEditor.fill(malformedState);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();

    await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText(
      "JSON 형식 또는 상태 값을 확인해 주세요.",
    );
    await expect(stateEditor).toHaveValue(malformedState);
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);
  });

  test("rejects every invalid optional widget metadata type without changing state or exposing raw input", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const stateStatus = page.getByRole("status", { name: "전체 상태 저장 복원 상태" });
    const metadataCases = [
      { key: "title", value: ["INVALID_TITLE"] },
      { key: "locked", value: "INVALID_LOCKED" },
      { key: "movable", value: "INVALID_MOVABLE" },
      { key: "resizable", value: "INVALID_RESIZABLE" },
      { key: "minimized", value: "INVALID_MINIMIZED" },
      { key: "maximized", value: "INVALID_MAXIMIZED" },
    ] as const;

    await columnSelect.selectOption("6");
    await columnSelect.selectOption("12");
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const savedStateJson = await stateEditor.inputValue();
    const savedState = JSON.parse(savedStateJson) as {
      widgets: Array<{ layout: Record<string, unknown> } & Record<string, unknown>>;
    };
    const initialLayouts = await readDashboardLayouts(page);

    for (const metadataCase of metadataCases) {
      const malformedState = JSON.parse(savedStateJson) as typeof savedState;
      const firstWidget = malformedState.widgets[0];
      expect(firstWidget).toBeDefined();
      if (!firstWidget) {
        throw new Error("Expected an Advanced fixture widget");
      }
      firstWidget.layout.x = 4;
      firstWidget[metadataCase.key] = metadataCase.value;
      const malformedStateJson = JSON.stringify(malformedState);

      await stateEditor.fill(malformedStateJson);
      await page.getByRole("button", { name: "전체 상태 복원" }).click();
      await expect(stateStatus).toHaveText("JSON 형식 또는 상태 값을 확인해 주세요.");
      await expect(stateEditor).toHaveValue(malformedStateJson);
      await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);
      expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain(String(metadataCase.value));
      expect(diagnosticsByTest.get(test.info().testId)?.join("\n")).not.toContain(String(metadataCase.value));
    }

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    expect(await stateEditor.inputValue()).toBe(savedStateJson);
  });

  for (const renderedDataKey of ["description", "value"] as const) {
    test(`rejects object ${renderedDataKey} data without changing geometry, caches, or editor state`, async ({ page }) => {
      const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
      const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
      const stateStatus = page.getByRole("status", { name: "전체 상태 저장 복원 상태" });
      const cacheStatus = page.getByRole("status", { name: "사용 가능한 컬럼 캐시" });
      const privateInvalidValue = `INVALID_${renderedDataKey.toUpperCase()}_DO_NOT_ECHO`;

      await columnSelect.selectOption("6");
      await columnSelect.selectOption("12");
      await page.getByRole("button", { name: "전체 상태 저장" }).click();
      const savedStateJson = await stateEditor.inputValue();
      const malformedState = JSON.parse(savedStateJson) as {
        widgets: Array<{ data?: Record<string, unknown>; layout: { x: number } }>;
      };
      const firstWidget = malformedState.widgets[0];
      expect(firstWidget?.data).toBeDefined();
      if (!firstWidget?.data) {
        throw new Error("Expected an Advanced fixture widget with render data");
      }
      const initialLayouts = await readDashboardLayouts(page);
      const initialCacheStatus = await cacheStatus.textContent();
      firstWidget.layout.x = firstWidget.layout.x === 0 ? 1 : 0;
      firstWidget.data[renderedDataKey] = { privateInvalidValue };
      const malformedStateJson = JSON.stringify(malformedState);

      await stateEditor.fill(malformedStateJson);
      await page.getByRole("button", { name: "전체 상태 복원" }).click();

      await expect(stateStatus).toHaveText("JSON 형식 또는 상태 값을 확인해 주세요.");
      await expect(stateEditor).toHaveValue(malformedStateJson);
      await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
      await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);
      await expect(cacheStatus).toHaveText(initialCacheStatus ?? "");
      expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain(privateInvalidValue);
      expect(diagnosticsByTest.get(test.info().testId)?.join("\n")).not.toContain(privateInvalidValue);

      await page.getByRole("button", { name: "전체 상태 저장" }).click();
      expect(await stateEditor.inputValue()).toBe(savedStateJson);
    });
  }

  test("ignores unsupported cache keys while restoring valid top-level state and supported caches", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const stateStatus = page.getByRole("status", { name: "전체 상태 저장 복원 상태" });

    await columnSelect.selectOption("6");
    await columnSelect.selectOption("12");
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const stateWithUnsupportedCache = JSON.parse(await stateEditor.inputValue()) as {
      widgets: Array<{ id: string; layout: { x: number } }>;
      layoutsByColumn: Record<string, unknown>;
    };
    const firstWidget = stateWithUnsupportedCache.widgets[0];
    expect(firstWidget).toBeDefined();
    if (!firstWidget) {
      throw new Error("Expected an Advanced fixture widget");
    }
    firstWidget.layout.x = 4;
    stateWithUnsupportedCache.layoutsByColumn["99"] = null;

    await stateEditor.fill(JSON.stringify(stateWithUnsupportedCache));
    await page.getByRole("button", { name: "전체 상태 복원" }).click();
    await expect(stateStatus).toHaveText("전체 상태와 컬럼 캐시를 복원했습니다.");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: firstWidget.id, x: 4 })]),
    );

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const restoredState = JSON.parse(await stateEditor.inputValue()) as { layoutsByColumn: Record<string, unknown> };
    expect(restoredState.layoutsByColumn).not.toHaveProperty("99");
    expect(Object.keys(restoredState.layoutsByColumn).sort()).toEqual(["12", "6"]);
  });

});
