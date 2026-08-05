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
  const [titleBox, targetBox] = await Promise.all([title.boundingBox(), target.boundingBox()]);
  if (!titleBox || !targetBox) {
    throw new Error("External drop geometry is unavailable");
  }

  await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 16 });
  await page.mouse.up();
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

async function readWidgetState(page: Page) {
  const output = page.getByLabel("현재 위젯 상태 JSON");
  return JSON.parse((await output.textContent()) ?? "{}") as {
    widgets?: Array<{
      id: string;
      title?: string;
      data?: { value?: string };
      locked?: boolean;
      movable?: boolean;
      resizable?: boolean;
    }>;
  };
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

function expectRowsToCoverColumns(layouts: IdentifiedWidgetLayout[], columns: number) {
  const rows = new Map<number, IdentifiedWidgetLayout[]>();
  layouts.forEach((layout) => {
    rows.set(layout.y, [...(rows.get(layout.y) ?? []), layout]);
  });

  rows.forEach((row) => {
    const sorted = [...row].sort((left, right) => left.x - right.x);
    expect(sorted.reduce((total, layout) => total + layout.w, 0)).toBe(columns);
    expect(sorted[0]?.x).toBe(0);
    expect(Math.max(...sorted.map((layout) => layout.x + layout.w))).toBe(columns);
    sorted.slice(1).forEach((layout, index) => {
      const previous = sorted[index];
      expect(previous).toBeDefined();
      expect(layout.x).toBe((previous?.x ?? 0) + (previous?.w ?? 0));
    });
  });
}

test.describe("Widget Playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/widget");
  });

  test("renders one Grid, the fixture widgets, and a valid heading relationship", async ({ page }) => {
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect(page.locator(".grid-stack")).toHaveCount(1);
    await expect(page.getByTestId("dashboard-widget-sales")).toContainText("매출");
    await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("트래픽");
    await expect(page.getByTestId("dashboard-widget-orders")).toContainText("주문");

    const header = page.locator(".playground-header");
    const heading = header.getByRole("heading", { level: 1 });
    const labelledBy = await header.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(labelledBy).not.toMatch(/\s/);
    await expect(heading).toHaveAttribute("id", labelledBy ?? "");

    const trafficSelection = page.getByRole("button", { name: "트래픽 위젯 선택" });
    await expect(trafficSelection.locator("button")).toHaveCount(0);
    await trafficSelection.click();
    await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveValue("traffic");
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
    await addDialog.getByLabel("새 위젯 너비").selectOption("3");
    await addDialog.getByLabel("새 위젯 높이").selectOption("3");
    await addDialog.getByRole("button", { name: "위젯 저장" }).click();

    const added = page.getByTestId("dashboard-widget-widget-4");
    await expect(added).toBeVisible();
    await expect(added).toContainText("신규 지표");
    await expect(added).toContainText("42");
    await expect(added).toHaveAttribute("data-layout-w", "3");
    await expect(added).toHaveAttribute("data-layout-h", "3");
    await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveValue("widget-4");

    await page.getByRole("button", { name: "선택 위젯 수정" }).click();
    const editDialog = page.getByRole("dialog", { name: "위젯 수정" });
    await editDialog.getByLabel("위젯명").fill("취소할 이름");
    await editDialog.getByLabel("값").fill("취소할 값");
    await editDialog.getByRole("button", { name: "취소" }).click();
    await expect(added).toContainText("신규 지표");
    await expect(added).toContainText("42");

    await page.getByRole("button", { name: "선택 위젯 수정" }).click();
    await editDialog.getByLabel("위젯명").fill("전환 지표");
    await editDialog.getByLabel("값").fill("84");
    await editDialog.getByRole("button", { name: "변경 저장" }).click();

    await expect(added).toContainText("전환 지표");
    await expect(added).toContainText("84");
    const state = await readWidgetState(page);
    expect(state.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "widget-4", title: "전환 지표", data: expect.objectContaining({ value: "84" }) }),
      ]),
    );
  });

  test("selects the first remaining widget after delete and disables controls after clear", async ({ page }) => {
    const selection = page.getByRole("combobox", { name: "위젯 선택" });
    await selection.selectOption("orders");
    await page.getByRole("button", { name: "주문 삭제" }).click();

    await expect(page.getByTestId("dashboard-widget-orders")).toBeHidden();
    await expect(selection).toHaveValue("sales");
    await expect(page.getByRole("status", { name: "위젯 작업 상태" })).toContainText("매출 위젯을 선택했습니다.");

    await selection.selectOption("traffic");
    await page.getByRole("button", { name: "선택 위젯 삭제" }).click();
    await expect(page.getByTestId("dashboard-widget-traffic")).toBeHidden();
    await expect(selection).toHaveValue("sales");

    await page.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await expect(selection).toBeDisabled();
    await expect(page.getByRole("button", { name: "선택 위젯 수정" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "선택 위젯 삭제" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "이동 잠금" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "리사이즈 잠금" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "전체 잠금" })).toBeDisabled();
    await expect(page.getByRole("status", { name: "위젯 작업 상태" })).toContainText("선택할 위젯이 없습니다.");
  });

  test("selects the first remaining widget when a different widget is deleted from its header", async ({ page }) => {
    const selection = page.getByRole("combobox", { name: "위젯 선택" });
    await selection.selectOption("traffic");
    await page.getByRole("button", { name: "주문 삭제" }).click();

    await expect(page.getByTestId("dashboard-widget-orders")).toBeHidden();
    await expect(selection).toHaveValue("sales");
    await expect(page.getByRole("status", { name: "위젯 작업 상태" })).toContainText("매출 위젯을 선택했습니다.");
  });

  test("prevents and then permits a real drag through the move lock", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-sales");
    const moveLock = page.getByRole("button", { name: "이동 잠금" });
    const resizeLock = page.getByRole("button", { name: "리사이즈 잠금" });

    await moveLock.click();
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
    await expect(moveLock).toHaveAttribute("aria-pressed", "false");
    await dragWidget(page, widget, widgetBox.width, 0);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(widget);
      return layout.x !== lockedLayout.x || layout.y !== lockedLayout.y;
    }).toBe(true);
  });

  test("prevents and then permits a real resize through the resize lock", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-sales");
    const moveLock = page.getByRole("button", { name: "이동 잠금" });
    const resizeLock = page.getByRole("button", { name: "리사이즈 잠금" });

    await resizeLock.click();
    await expect(resizeLock).toHaveAttribute("aria-pressed", "true");
    await expect(moveLock).toHaveAttribute("aria-pressed", "false");
    const lockedLayout = await readWidgetLayout(widget);
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(() => readWidgetLayout(widget)).toEqual(lockedLayout);

    await resizeLock.click();
    await expect(resizeLock).toHaveAttribute("aria-pressed", "false");
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(widget);
      return layout.w !== lockedLayout.w || layout.h !== lockedLayout.h;
    }).toBe(true);
  });

  test("uses the actual full-lock state as the pressed-state and interaction precedence", async ({ page }) => {
    const widget = page.getByTestId("dashboard-widget-sales");
    const fullLock = page.getByRole("button", { name: "전체 잠금" });
    const moveLock = page.getByRole("button", { name: "이동 잠금" });
    const resizeLock = page.getByRole("button", { name: "리사이즈 잠금" });

    await fullLock.click();
    await expect(fullLock).toHaveAttribute("aria-pressed", "true");
    await expect(moveLock).toHaveAttribute("aria-pressed", "true");
    await expect(resizeLock).toHaveAttribute("aria-pressed", "true");
    let state = await readWidgetState(page);
    expect(state.widgets?.find((candidate) => candidate.id === "sales")?.locked).toBe(true);

    const lockedLayout = await readWidgetLayout(widget);
    await dragWidget(page, widget, 0, 220);
    await resizeWidget(page, widget, 140, 100);
    await expect.poll(() => readWidgetLayout(widget)).toEqual(lockedLayout);

    await fullLock.click();
    await expect(fullLock).toHaveAttribute("aria-pressed", "false");
    state = await readWidgetState(page);
    expect(state.widgets?.find((candidate) => candidate.id === "sales")?.locked).toBe(false);
  });

  test("preserves Advanced control ownership and first-widget fallback", async ({ page }) => {
    await page.goto("/examples/advanced");
    await expect(page.getByRole("button", { name: "전체 삭제" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "선택 위젯 수정" })).toHaveCount(0);

    await page.getByRole("button", { name: "매출 삭제" }).click();
    await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
    await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveValue("traffic");
  });
});

test.describe("Layout Playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/examples/layout");
  });

  test("provides add, edit, delete, and clear CRUD through one Grid", async ({ page }) => {
    await expect(page.getByTestId("dashboard-grid")).toHaveCount(1);
    await expect(page.locator(".grid-stack")).toHaveCount(1);

    await page.getByRole("button", { name: "위젯 추가" }).click();
    const addDialog = page.getByRole("dialog", { name: "위젯 추가" });
    await addDialog.getByLabel("위젯명").fill("Layout KPI");
    await addDialog.getByLabel("값").fill("120");
    await addDialog.getByLabel("새 위젯 너비").selectOption("3");
    await addDialog.getByLabel("새 위젯 높이").selectOption("2");
    await addDialog.getByRole("button", { name: "위젯 저장" }).click();

    const added = page.getByTestId("dashboard-widget-widget-5");
    await expect(added).toContainText("Layout KPI");
    await expect(added).toContainText("120");
    await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveValue("widget-5");

    await page.getByRole("button", { name: "선택 위젯 수정" }).click();
    const editDialog = page.getByRole("dialog", { name: "위젯 수정" });
    await editDialog.getByLabel("위젯명").fill("Layout KPI Edited");
    await editDialog.getByLabel("값").fill("240");
    await editDialog.getByRole("button", { name: "변경 저장" }).click();
    await expect(added).toContainText("Layout KPI Edited");
    await expect(added).toContainText("240");

    await page.getByRole("button", { name: "선택 위젯 삭제" }).click();
    await expect(added).toBeHidden();
    await expect(page.locator(".grid-stack-item")).toHaveCount(4);

    await page.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "선택 위젯 수정" })).toBeDisabled();
  });

  test("supports columns 1 through 12 and keeps active and full-state JSON boundaries independent", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    for (let columns = 1; columns <= 12; columns += 1) {
      await columnSelect.selectOption(String(columns));
      await expect(page.getByRole("status", { name: "활성 컬럼 상태" })).toHaveText(`현재 ${columns}컬럼입니다.`);
    }

    await columnSelect.selectOption("6");
    const activeEditor = page.getByLabel("활성 레이아웃 JSON");
    const fullStateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const sixColumnSnapshot = {
      columns: 6,
      widgets: [
        { id: "sales", x: 4, y: 0, w: 2, h: 2 },
        { id: "traffic", x: 0, y: 0, w: 4, h: 2 },
        { id: "orders", x: 3, y: 2, w: 3, h: 2 },
        { id: "alerts", x: 0, y: 2, w: 3, h: 2 },
      ],
    };
    await activeEditor.fill(JSON.stringify(sixColumnSnapshot));
    await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
    await expect.poll(() => readDashboardLayouts(page)).toEqual(
      expect.arrayContaining(sixColumnSnapshot.widgets.map((layout) => expect.objectContaining(layout))),
    );

    await columnSelect.selectOption("12");
    const initialTwelveLayouts = await readDashboardLayouts(page);
    await page.getByRole("button", { name: "활성 레이아웃 저장" }).click();
    const savedActiveJson = await activeEditor.inputValue();
    const savedActive = JSON.parse(savedActiveJson) as Record<string, unknown>;
    expect(Object.keys(savedActive).sort()).toEqual(["columns", "widgets"]);
    expect(savedActive).not.toHaveProperty("layoutsByColumn");

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const savedFullStateJson = await fullStateEditor.inputValue();
    const savedFullState = JSON.parse(savedFullStateJson) as {
      layoutsByColumn: Record<string, { widgets: WidgetLayout[] }>;
    };
    expect(Object.keys(savedFullState.layoutsByColumn)).toEqual(expect.arrayContaining(["6", "12"]));
    expect(savedFullState.layoutsByColumn["6"]?.widgets).toEqual(sixColumnSnapshot.widgets);
    await expect(activeEditor).toHaveValue(savedActiveJson);

    const scatteredTwelve = {
      columns: 12,
      widgets: [
        { id: "sales", x: 8, y: 0, w: 4, h: 2 },
        { id: "traffic", x: 0, y: 0, w: 8, h: 2 },
        { id: "orders", x: 6, y: 2, w: 6, h: 2 },
        { id: "alerts", x: 0, y: 2, w: 6, h: 2 },
      ],
    };
    await activeEditor.fill(JSON.stringify(scatteredTwelve));
    await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
    await expect.poll(() => readDashboardLayouts(page)).toEqual(scatteredTwelve.widgets);

    await activeEditor.fill(savedActiveJson);
    await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialTwelveLayouts);
    await columnSelect.selectOption("6");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(
      expect.arrayContaining(sixColumnSnapshot.widgets.map((layout) => expect.objectContaining(layout))),
    );

    await page.getByRole("button", { name: "전체 삭제" }).click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(0);
    await fullStateEditor.fill(savedFullStateJson);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();
    await expect(columnSelect).toHaveValue("12");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialTwelveLayouts);
    await columnSelect.selectOption("6");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(
      expect.arrayContaining(sixColumnSnapshot.widgets.map((layout) => expect.objectContaining(layout))),
    );
  });

  test("reports committed fill results and covers every row after a real delete", async ({ page }) => {
    const operationStatus = page.getByRole("status", { name: "레이아웃 작업 상태" });
    const initialLayouts = await readDashboardLayouts(page);
    expectRowsToCoverColumns(initialLayouts, 12);

    await page.getByRole("button", { name: "빈 공간 채우기" }).click();
    await expect(operationStatus).toHaveText("빈 공간이 없어 변경하지 않았습니다.");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);

    await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("sales");
    await page.getByRole("button", { name: "선택 위젯 삭제" }).click();
    await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
    const gappedLayouts = await readDashboardLayouts(page);
    expect(gappedLayouts.find((layout) => layout.id === "traffic")).toMatchObject({ x: 4, y: 0, w: 8 });

    await page.getByRole("button", { name: "빈 공간 채우기" }).click();
    await expect(operationStatus).toHaveText("행의 빈 공간을 채웠습니다.");
    const fittedLayouts = await readDashboardLayouts(page);
    expectRowsToCoverColumns(fittedLayouts, 12);
    expect(fittedLayouts.find((layout) => layout.id === "traffic")).toMatchObject({ x: 0, y: 0, w: 12 });

    await page.getByRole("button", { name: "빈 공간 채우기" }).click();
    await expect(operationStatus).toHaveText("빈 공간이 없어 변경하지 않았습니다.");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(fittedLayouts);
  });

  test("auto-arranges by package order and reports a distinct committed result", async ({ page }) => {
    const activeEditor = page.getByLabel("활성 레이아웃 JSON");
    const scattered = {
      columns: 12,
      widgets: [
        { id: "sales", x: 8, y: 0, w: 4, h: 2 },
        { id: "traffic", x: 0, y: 0, w: 8, h: 2 },
        { id: "orders", x: 6, y: 2, w: 6, h: 2 },
        { id: "alerts", x: 0, y: 2, w: 6, h: 2 },
      ],
    };
    await activeEditor.fill(JSON.stringify(scattered));
    await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
    await expect.poll(() => readDashboardLayouts(page)).toEqual(scattered.widgets);

    await page.getByRole("button", { name: "자동 정렬" }).click();
    await expect(page.getByRole("status", { name: "레이아웃 작업 상태" })).toHaveText(
      "패키지 순서로 위젯을 자동 정렬했습니다.",
    );
    await expect.poll(() => readDashboardLayouts(page)).toEqual([
      { id: "sales", x: 0, y: 0, w: 4, h: 2 },
      { id: "traffic", x: 4, y: 0, w: 8, h: 2 },
      { id: "orders", x: 0, y: 2, w: 6, h: 2 },
      { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
    ]);
  });

  test("keeps geometry and input on invalid JSON without exposing the raw value, then resets the fixture and caches", async ({ page }) => {
    const activeEditor = page.getByLabel("활성 레이아웃 JSON");
    const privateInvalidInput = '{"private-layout":"DO_NOT_ECHO"';
    const consoleMessages: string[] = [];
    page.on("console", (message) => consoleMessages.push(message.text()));
    const initialLayouts = await readDashboardLayouts(page);

    await activeEditor.fill(privateInvalidInput);
    await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
    await expect(page.getByRole("status", { name: "활성 레이아웃 저장 복원 상태" })).toHaveText(
      "JSON 형식 또는 레이아웃 값을 확인해 주세요.",
    );
    await expect(activeEditor).toHaveValue(privateInvalidInput);
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);
    expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain("DO_NOT_ECHO");
    expect(consoleMessages.join("\n")).not.toContain("DO_NOT_ECHO");

    await page.getByRole("combobox", { name: "컬럼 선택" }).selectOption("6");
    await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("sales");
    await page.getByRole("button", { name: "선택 위젯 삭제" }).click();
    await page.getByRole("button", { name: "레이아웃 초기화" }).click();
    await expect(page.getByRole("combobox", { name: "컬럼 선택" })).toHaveValue("12");
    await expect.poll(() => readDashboardLayouts(page)).toEqual(initialLayouts);

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const resetState = JSON.parse(await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue()) as {
      layoutsByColumn: Record<string, unknown>;
    };
    expect(Object.keys(resetState.layoutsByColumn)).toEqual(["12"]);
  });

  test("rejects malformed supported-column caches without changing geometry, caches, or the editor", async ({ page }) => {
    const columnSelect = page.getByRole("combobox", { name: "컬럼 선택" });
    const fullStateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
    const fullStateStatus = page.getByRole("status", { name: "전체 상태 저장 복원 상태" });
    const privateInvalidValue = "CACHE_DO_NOT_ECHO";
    const consoleMessages: string[] = [];
    page.on("console", (message) => consoleMessages.push(message.text()));

    await columnSelect.selectOption("6");
    await columnSelect.selectOption("12");
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    const savedFullStateJson = await fullStateEditor.inputValue();
    const savedFullState = JSON.parse(savedFullStateJson) as {
      layoutsByColumn: Record<string, { widgets: Array<Record<string, unknown>> }>;
    };
    const activeLayouts = await readDashboardLayouts(page);
    const malformedFullState = JSON.parse(savedFullStateJson) as typeof savedFullState;
    const malformedSixColumnLayout = malformedFullState.layoutsByColumn["6"]?.widgets[0];
    expect(malformedSixColumnLayout).toBeDefined();
    if (!malformedSixColumnLayout) {
      throw new Error("Expected a cached 6-column layout fixture");
    }
    malformedSixColumnLayout.x = privateInvalidValue;
    const malformedFullStateJson = JSON.stringify(malformedFullState, null, 2);

    await fullStateEditor.fill(malformedFullStateJson);
    await page.getByRole("button", { name: "전체 상태 복원" }).click();
    await expect(fullStateStatus).toHaveText("JSON 형식 또는 레이아웃 값을 확인해 주세요.");
    await expect(fullStateEditor).toHaveValue(malformedFullStateJson);
    await expect.poll(() => readDashboardLayouts(page)).toEqual(activeLayouts);
    expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain(privateInvalidValue);
    expect(consoleMessages.join("\n")).not.toContain(privateInvalidValue);

    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    expect(JSON.parse(await fullStateEditor.inputValue())).toEqual(savedFullState);
  });
});

test.describe("Advanced Playground", () => {
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

  test("clears the initial not-ready handle status after a successful query", async ({ page }) => {
    const handleStatus = page.getByRole("status", { name: "handle 작업 상태" });
    const queryStatus = page.getByRole("status", { name: "GridStack 읽기 전용 상태" });

    await page.getByRole("button", { name: "엔진 상태 조회" }).click();
    await expect(queryStatus).toContainText("column=12; row=");
    await expect(handleStatus).not.toContainText("GridStack이 아직 준비되지 않았습니다.");
  });

  test("uses only supported compact list commit and read-only handle queries with controlled float", async ({ page }) => {
    const queryStatus = page.getByRole("status", { name: "GridStack 읽기 전용 상태" });
    const commitStatus = page.getByRole("status", { name: "제어 레이아웃 커밋 상태" });
    const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");

    await expect(queryStatus).toContainText("column=12; row=");
    await expect(queryStatus).toContainText("float=false");

    await page.getByRole("button", { name: "compact 정렬 후 커밋" }).click();
    await expect(page.getByRole("status", { name: "handle 작업 상태" })).toHaveText(
      "compact 정렬을 커밋했습니다.",
    );
    await expect(commitStatus).toContainText("12컬럼 레이아웃을 React 상태에 커밋했습니다.");
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    let savedState = JSON.parse(await stateEditor.inputValue()) as {
      layoutsByColumn: Record<string, { widgets: IdentifiedWidgetLayout[] }>;
    };
    expect(savedState.layoutsByColumn["12"]?.widgets).toEqual(await readDashboardLayouts(page));

    await page.getByRole("button", { name: "list 정렬 후 커밋" }).click();
    await expect(page.getByRole("status", { name: "handle 작업 상태" })).toHaveText(
      "list 정렬을 커밋했습니다.",
    );
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    savedState = JSON.parse(await stateEditor.inputValue()) as typeof savedState;
    expect(savedState.layoutsByColumn["12"]?.widgets).toEqual(await readDashboardLayouts(page));

    await page.getByRole("button", { name: "Float 사용" }).click();
    await expect(page.getByRole("button", { name: "Float 사용" })).toHaveAttribute("aria-pressed", "true");
    await expect(queryStatus).toContainText("float=true");

    const beforeFloatLayout = await readWidgetLayout(page.getByTestId("dashboard-widget-sales"));
    await resizeWidget(page, page.getByTestId("dashboard-widget-sales"), 0, 110);
    await expect.poll(() => readWidgetLayout(page.getByTestId("dashboard-widget-sales"))).not.toEqual(beforeFloatLayout);
    await page.getByRole("button", { name: "전체 상태 저장" }).click();
    savedState = JSON.parse(await stateEditor.inputValue()) as typeof savedState;
    expect(savedState.layoutsByColumn["12"]?.widgets).toEqual(await readDashboardLayouts(page));
  });
});
