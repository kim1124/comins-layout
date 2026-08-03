import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
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

  test("preserves one clear owner and first-widget fallback for the shared Advanced controls", async ({ page }) => {
    await page.goto("/examples/advanced");
    await expect(page.getByRole("button", { name: "전체 삭제" })).toHaveCount(1);

    await page.getByRole("button", { name: "매출 삭제" }).click();
    await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
    await expect(page.getByRole("combobox", { name: "위젯 선택" })).toHaveValue("traffic");
    await expect(page.getByRole("button", { name: "선택 위젯 수정" })).toBeEnabled();
  });
});
