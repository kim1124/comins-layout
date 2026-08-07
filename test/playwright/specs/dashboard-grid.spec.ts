import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import {
  growsMonotonicallyBeyondTolerance,
  selectSteadyStateWindow,
  shouldCollectMoreSteadyStateSamples,
  staysWithinFinalHeapGrowth,
  staysWithinHeapPeak,
  type HeapCounter,
} from "../resource-stability";
import { isDesktopBrowserProject } from "../project-policy";
import { performTouchGesture, performTouchGestureToTarget } from "../touch-gesture";

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type IdentifiedWidgetLayout = WidgetLayout & {
  id: string;
};

type ResourceCounters = HeapCounter & {
  nodes: number;
  listeners: number;
  documents: number;
};

const HEAP_PEAK_TOLERANCE = 0.12;
const HEAP_FINAL_GROWTH_TOLERANCE = 0.02;
const STEADY_STATE_WINDOW_SIZE = 3;

const COLUMN_STEADY_STATE_SAMPLING = {
  minimumSamples: 8,
  maximumSamples: 11,
  windowSize: STEADY_STATE_WINDOW_SIZE,
  finalGrowthTolerance: HEAP_FINAL_GROWTH_TOLERANCE,
};

const INTERACTION_STEADY_STATE_SAMPLING = {
  minimumSamples: 3,
  maximumSamples: 6,
  windowSize: STEADY_STATE_WINDOW_SIZE,
  finalGrowthTolerance: HEAP_FINAL_GROWTH_TOLERANCE,
};

function createStressSnapshot() {
  return {
    columns: 12,
    previousLayouts: {},
    widgets: Array.from({ length: 100 }, (_, index) => {
      const id = `stress-${index}`;

      return {
        id,
        title: `Stress ${index}`,
        layout: { id, x: (index % 6) * 2, y: Math.floor(index / 6) * 2, w: 2, h: 2 },
        data: { description: `stress widget ${index}`, value: String(index) },
      };
    }),
  };
}

async function waitForPageToSettle(page: Page, idleMs = 100) {
  await page.evaluate(async (delay) => {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
  }, idleMs);
}

async function readResourceCounters(page: Page): Promise<ResourceCounters> {
  await waitForPageToSettle(page);

  const session = await page.context().newCDPSession(page);

  try {
    await session.send("Performance.enable");
    await session.send("HeapProfiler.enable");
    await session.send("HeapProfiler.collectGarbage");
    await waitForPageToSettle(page, 250);
    await session.send("HeapProfiler.collectGarbage");

    const [performance, dom] = await Promise.all([
      session.send("Performance.getMetrics"),
      session.send("Memory.getDOMCounters"),
    ]);
    const heap = performance.metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value;
    if (heap === undefined) {
      throw new Error("Chrome DevTools Protocol did not report JSHeapUsedSize");
    }

    return { heap, nodes: dom.nodes, listeners: dom.jsEventListeners, documents: dom.documents };
  } finally {
    await session.detach();
  }
}

async function runColumnCycle(columnSelect: Locator, grid: Locator) {
  for (let columns = 1; columns <= 12; columns += 1) {
    await columnSelect.selectOption(String(columns));
    await expect(grid).toHaveAttribute("data-columns", String(columns));
  }
}

async function waitForInteractionToSettle(widget: Locator) {
  await expect.poll(async () => (await readWidgetInteractionState(widget)).isDragging).toBe(false);
  await expect.poll(async () => (await readWidgetInteractionState(widget)).isResizing).toBe(false);
}

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      diagnostics.push(`[${message.type()}] ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.push(`[pageerror] ${error.message}`);
  });

  return diagnostics;
}

async function readWidgetLayout(widget: Locator): Promise<WidgetLayout> {
  return widget.evaluate((element) => ({
    x: Number(element.getAttribute("data-layout-x")),
    y: Number(element.getAttribute("data-layout-y")),
    w: Number(element.getAttribute("data-layout-w")),
    h: Number(element.getAttribute("data-layout-h")),
  }));
}

async function readDashboardLayouts(page: Page): Promise<IdentifiedWidgetLayout[]> {
  return page.locator(".grid-stack-item").evaluateAll((elements) =>
    elements.flatMap((element) => {
      const id = element.getAttribute("gs-id") ?? element.getAttribute("data-widget-id");
      return id
        ? [{
            id,
            x: Number(element.getAttribute("data-layout-x")),
            y: Number(element.getAttribute("data-layout-y")),
            w: Number(element.getAttribute("data-layout-w")),
            h: Number(element.getAttribute("data-layout-h")),
          }]
        : [];
    }),
  );
}

async function readGridEngineColumn(grid: Locator): Promise<number> {
  return grid.evaluate((element) => {
    const gridstack = (element as HTMLElement & { gridstack?: { opts?: { column?: number } } }).gridstack;
    return Number(gridstack?.opts?.column ?? 0);
  });
}

async function waitForWidgetGridEngine(widget: Locator) {
  await expect.poll(() => widget.evaluate((element) => {
    const grid = element.closest<HTMLElement>(".grid-stack") as (HTMLElement & { gridstack?: unknown }) | null;
    return Boolean(grid?.gridstack);
  })).toBe(true);
}

async function readWidgetInteractionState(widget: Locator) {
  return widget.evaluate((element) => ({
    isResizing: element.classList.contains("ui-resizable-resizing"),
    isDragging:
      element.classList.contains("ui-draggable-dragging") ||
      [...document.querySelectorAll<HTMLElement>(".grid-stack-item.ui-draggable-dragging")].some(
        (item) =>
          item.getAttribute("data-widget-id") === element.getAttribute("data-widget-id") ||
          item.getAttribute("gs-id") === element.getAttribute("gs-id"),
      ),
    hasInlinePosition: (element as HTMLElement).style.position === "absolute",
  }));
}

async function simulateBrowserBoundaryExit(page: Page, clientX: number, clientY: number) {
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };

  await page.mouse.move(viewport.width - 1, viewport.height - 1, { steps: 8 });
  await page.evaluate(({ x, y }) => {
    document.documentElement.dispatchEvent(
      new MouseEvent("mouseleave", {
        bubbles: true,
        cancelable: true,
        buttons: 1,
        clientX: x,
        clientY: y,
        relatedTarget: null,
      }),
    );
    window.dispatchEvent(new Event("blur"));
  }, { x: clientX, y: clientY });
}

async function dispatchReleaseLikeMoveAndReadState(widget: Locator, clientX: number, clientY: number) {
  return widget.evaluate(
    (element, point) => {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          buttons: 0,
          clientX: point.x,
          clientY: point.y,
        }),
      );

      const activeDragItems = [...document.querySelectorAll<HTMLElement>(".grid-stack-item.ui-draggable-dragging")];

      return {
        isResizing: element.classList.contains("ui-resizable-resizing"),
        isDragging:
          element.classList.contains("ui-draggable-dragging") ||
          activeDragItems.some(
            (item) =>
              item.getAttribute("data-widget-id") === element.getAttribute("data-widget-id") ||
              item.getAttribute("gs-id") === element.getAttribute("gs-id"),
          ),
      };
    },
    { x: clientX, y: clientY },
  );
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
  const [titleBox, targetBox] = await Promise.all([
    title.boundingBox(),
    target.boundingBox(),
  ]);
  if (!titleBox || !targetBox) {
    throw new Error("External drop geometry is unavailable");
  }

  await page.mouse.move(
    titleBox.x + titleBox.width / 2,
    titleBox.y + titleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 16 },
  );
  await page.mouse.up();
}

async function startWidgetDrag(page: Page, widget: Locator) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const box = await widget.boundingBox();
  if (!box) {
    throw new Error("Widget bounding box is not available");
  }

  const startX = box.x + 56;
  const startY = box.y + 24;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  return { startX, startY };
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
  const handleBox = await handle.boundingBox();
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function resizeWidgetWithDomEvents(widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  await widget.evaluate(
    (element, delta) => {
      const handle = element.querySelector<HTMLElement>(".ui-resizable-se");
      if (!handle) {
        throw new Error("Resize handle is not available");
      }

      const rect = handle.getBoundingClientRect();
      const startX = rect.left + rect.width / 2;
      const startY = rect.top + rect.height / 2;

      handle.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          clientX: startX,
          clientY: startY,
        }),
      );
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          buttons: 1,
          clientX: startX + delta.x,
          clientY: startY + delta.y,
        }),
      );
      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          clientX: startX + delta.x,
          clientY: startY + delta.y,
        }),
      );
    },
    { x: deltaX, y: deltaY },
  );
}

async function dragWidgetWithDomEvents(widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  return widget.evaluate(
    (element, delta) => {
      const dragTarget = element.querySelector<HTMLElement>(".grid-stack-item-content") ?? element;
      const rect = dragTarget.getBoundingClientRect();
      const startX = rect.left + 56;
      const startY = rect.top + 24;

      dragTarget.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          clientX: startX,
          clientY: startY,
        }),
      );
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          buttons: 1,
          clientX: startX + delta.x,
          clientY: startY + delta.y,
        }),
      );

      const didStart =
        element.classList.contains("ui-draggable-dragging") ||
        [...document.querySelectorAll<HTMLElement>(".grid-stack-item.ui-draggable-dragging")].some(
          (item) =>
            item.getAttribute("data-widget-id") === element.getAttribute("data-widget-id") ||
            item.getAttribute("gs-id") === element.getAttribute("gs-id"),
        );

      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          clientX: startX + delta.x,
          clientY: startY + delta.y,
        }),
      );

      return didStart;
    },
    { x: deltaX, y: deltaY },
  );
}

async function startWidgetResize(page: Page, widget: Locator) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) {
    throw new Error("Widget bounding box is not available");
  }

  await widget.hover({ position: { x: widgetBox.width - 4, y: widgetBox.height - 4 } });
  const handle = widget.locator(".ui-resizable-se");
  const handleBox = await handle.boundingBox();
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  return { startX, startY };
}

async function addWidgetFromDialog(page: Page, width = "2", height = "2") {
  await page.getByRole("button", { name: "위젯 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("새 위젯 너비").selectOption(width);
  await dialog.getByLabel("새 위젯 높이").selectOption(height);
  await dialog.getByRole("button", { name: "위젯 저장" }).click();
}

test("supports the Widget playground workflow", async ({ page }) => {
  await page.goto("/examples/widget");

  await expect(page.getByRole("heading", { name: "위젯" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();

  await addWidgetFromDialog(page);
  await expect(page.getByTestId("dashboard-widget-widget-4")).toBeVisible();

  await page.getByRole("button", { name: "매출 최대화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "true");

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "true");

  await page.getByRole("button", { name: "매출 복원" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "false");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "false");

  await page.getByRole("button", { name: "매출 삭제" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
});

test("keeps widget shell aligned with the GridStack content box", async ({ page }) => {
  await page.goto("/examples/widget");
  const sales = page.getByTestId("dashboard-widget-sales");

  await expect(sales).toBeVisible();
  const before = await sales.evaluate((item) => {
    const content = item.querySelector(".grid-stack-item-content");
    const shell = item.querySelector(".comins-grid-layout-widget");
    const contentRect = content?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();

    return {
      contentHeight: Math.round(contentRect?.height ?? 0),
      shellHeight: Math.round(shellRect?.height ?? 0),
      contentBottom: Math.round(contentRect?.bottom ?? 0),
      shellBottom: Math.round(shellRect?.bottom ?? 0),
    };
  });

  expect(before.shellHeight).toBe(before.contentHeight);
  expect(before.shellBottom).toBe(before.contentBottom);

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(sales).toHaveAttribute("data-minimized", "true");

  const after = await sales.evaluate((item) => {
    const content = item.querySelector(".grid-stack-item-content");
    const shell = item.querySelector(".comins-grid-layout-widget");
    const contentRect = content?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();

    return {
      contentHeight: Math.round(contentRect?.height ?? 0),
      shellHeight: Math.round(shellRect?.height ?? 0),
      contentBottom: Math.round(contentRect?.bottom ?? 0),
      shellBottom: Math.round(shellRect?.bottom ?? 0),
    };
  });

  expect(after.shellHeight).toBe(after.contentHeight);
  expect(after.shellBottom).toBe(after.contentBottom);
});

test("saves and restores the current layout as JSON", async ({ page }) => {
  await page.goto("/examples/layout");

  await page.getByLabel("컬럼 선택").selectOption("4");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");

  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const json = await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue();
  const saved = JSON.parse(json);
  expect(saved.columns).toBe(4);
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "sales",
        title: "Sales",
        layout: expect.objectContaining({ id: "sales", w: 4 }),
      }),
    ]),
  );

  await page.getByLabel("컬럼 선택").selectOption("6");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");

  await page.getByRole("button", { name: "전체 상태 복원" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "4");
  await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText("전체 상태와 컬럼 캐시를 복원했습니다.");
});

test("supports selector-significant widget IDs", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  const widgetId = 'sales\"] .grid-stack-item';

  await page.goto("/examples/layout");
  await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").fill(
    JSON.stringify({
      columns: 12,
      previousLayouts: {},
      widgets: [
        {
          id: widgetId,
          title: "Selector-safe widget",
          layout: { id: widgetId, x: 0, y: 0, w: 2, h: 2 },
          data: { description: "selector-safe widget", value: "safe" },
        },
      ],
    }),
  );
  await page.getByRole("button", { name: "전체 상태 복원" }).click();

  const widget = page.getByTestId(`dashboard-widget-${widgetId}`);
  await expect(widget).toBeVisible();
  await expect(widget).toHaveAttribute("data-widget-id", widgetId);
  await expect
    .poll(() => widget.evaluate((element) => Boolean((element as HTMLElement & { gridstackNode?: unknown }).gridstackNode)))
    .toBe(true);
  expect(diagnostics).toEqual([]);
});

test("keeps 100 widgets stable through repeated column changes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-resource", "Chrome CDP resource checks run in the isolated resource project only.");
  test.setTimeout(120_000);

  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/examples/layout");

  const grid = page.getByTestId("dashboard-grid");
  const layoutJson = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
  await layoutJson.fill(JSON.stringify(createStressSnapshot()));
  await page.getByRole("button", { name: "전체 상태 복원" }).click();

  await expect(page.getByText("위젯 100개")).toBeVisible();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(grid.locator(".grid-stack-item")).toHaveCount(100);

  const columnSelect = page.getByLabel("컬럼 선택");
  for (let warmupCycle = 0; warmupCycle < 2; warmupCycle += 1) {
    await runColumnCycle(columnSelect, grid);
  }
  const columnCycleCounters: ResourceCounters[] = [await readResourceCounters(page)];

  // Preserve the minimum stress count, then collect only until the bounded
  // tail reaches steady state or the maximum exposes sustained growth.
  while (shouldCollectMoreSteadyStateSamples(columnCycleCounters, COLUMN_STEADY_STATE_SAMPLING)) {
    await runColumnCycle(columnSelect, grid);
    columnCycleCounters.push(await readResourceCounters(page));
  }

  const columnSteadyStateCounters = selectSteadyStateWindow(columnCycleCounters, STEADY_STATE_WINDOW_SIZE);

  const stressWidget = page.getByTestId("dashboard-widget-stress-0");
  const beforeDrag = await readWidgetLayout(stressWidget);
  await dragWidget(page, stressWidget, 80, 120);
  await expect.poll(async () => readWidgetLayout(stressWidget)).not.toEqual(beforeDrag);
  await waitForInteractionToSettle(stressWidget);

  const beforeResize = await readWidgetLayout(stressWidget);
  await resizeWidget(page, stressWidget, 120, 80);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(stressWidget);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);
  await waitForInteractionToSettle(stressWidget);
  const interactionWarmupCounters: ResourceCounters[] = [await readResourceCounters(page)];

  const interactionCounters: ResourceCounters[] = [];

  while (shouldCollectMoreSteadyStateSamples(interactionCounters, INTERACTION_STEADY_STATE_SAMPLING)) {
    await dragWidget(page, stressWidget, 0, 180);
    await resizeWidget(page, stressWidget, 80, 60);
    await waitForInteractionToSettle(stressWidget);

    interactionCounters.push(await readResourceCounters(page));
  }
  const interactionSteadyStateCounters = selectSteadyStateWindow(interactionCounters, STEADY_STATE_WINDOW_SIZE);
  const allInteractionCounters = [...interactionWarmupCounters, ...interactionCounters];

  const resourceCounters = {
    columnCycles: columnCycleCounters,
    interactionWarmup: interactionWarmupCounters,
    repeatedInteractions: interactionCounters,
  };

  await testInfo.attach("100-widget-resource-counters.json", {
    body: JSON.stringify(resourceCounters, null, 2),
    contentType: "application/json",
  });
  console.log("100-widget resource counters", JSON.stringify(resourceCounters));

  expect(diagnostics).toEqual([]);
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(grid.locator(".grid-stack-item")).toHaveCount(100);
  await expect.poll(async () => (await readWidgetInteractionState(stressWidget)).isDragging).toBe(false);
  await expect.poll(async () => (await readWidgetInteractionState(stressWidget)).isResizing).toBe(false);

  const columnBaseline = columnCycleCounters[0];
  if (!columnBaseline) {
    throw new Error("Column-cycle resource baseline is unavailable");
  }

  expect(
    columnCycleCounters.every((counter) => counter.documents === columnBaseline.documents),
    "100-widget column cycles changed the CDP Documents counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    columnCycleCounters.every((counter) => counter.listeners === columnBaseline.listeners),
    "100-widget column cycles changed the CDP Event Listeners counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    columnCycleCounters.every((counter) => counter.nodes === columnBaseline.nodes),
    "100-widget column cycles changed the CDP DOM Nodes counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    staysWithinHeapPeak(columnCycleCounters, HEAP_PEAK_TOLERANCE),
    `100-widget column-cycle heap exceeded the ${HEAP_PEAK_TOLERANCE * 100}% transient peak budget; inspect 100-widget-resource-counters.json`,
  ).toBe(true);
  expect(
    staysWithinFinalHeapGrowth(columnSteadyStateCounters, HEAP_FINAL_GROWTH_TOLERANCE),
    `100-widget column-cycle steady-state heap exceeded the ${HEAP_FINAL_GROWTH_TOLERANCE * 100}% final-growth budget; inspect 100-widget-resource-counters.json`,
  ).toBe(true);
  expect(
    growsMonotonicallyBeyondTolerance(
      columnSteadyStateCounters.map((counter) => counter.heap),
      HEAP_FINAL_GROWTH_TOLERANCE,
    ),
    `100-widget column-cycle steady-state heap grew monotonically beyond the ${HEAP_FINAL_GROWTH_TOLERANCE * 100}% budget; inspect 100-widget-resource-counters.json`,
  ).toBe(false);

  const interactionBaseline = allInteractionCounters[0];
  if (!interactionBaseline) {
    throw new Error("Interaction resource baseline is unavailable");
  }

  expect(
    allInteractionCounters.every((counter) => counter.documents === interactionBaseline.documents),
    "100-widget interactions changed the CDP Documents counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    allInteractionCounters.every((counter) => counter.nodes === interactionBaseline.nodes),
    "100-widget interactions changed the CDP DOM Nodes counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    allInteractionCounters.every((counter) => counter.listeners === interactionBaseline.listeners),
    "100-widget interactions changed the CDP Event Listeners counter; inspect 100-widget-resource-counters.json",
  ).toBe(true);
  expect(
    staysWithinHeapPeak(allInteractionCounters, HEAP_PEAK_TOLERANCE),
    `100-widget interaction heap exceeded the ${HEAP_PEAK_TOLERANCE * 100}% transient peak budget; inspect 100-widget-resource-counters.json`,
  ).toBe(true);
  expect(
    staysWithinFinalHeapGrowth(interactionSteadyStateCounters, HEAP_FINAL_GROWTH_TOLERANCE),
    `100-widget interaction steady-state heap exceeded the ${HEAP_FINAL_GROWTH_TOLERANCE * 100}% final-growth budget; inspect 100-widget-resource-counters.json`,
  ).toBe(true);
  expect(
    growsMonotonicallyBeyondTolerance(
      interactionSteadyStateCounters.map((counter) => counter.heap),
      HEAP_FINAL_GROWTH_TOLERANCE,
    ),
    `100-widget interaction steady-state heap grew monotonically beyond the ${HEAP_FINAL_GROWTH_TOLERANCE * 100}% budget; inspect 100-widget-resource-counters.json`,
  ).toBe(false);
});

test("exposes a live GridStack handle and deduplicates explicit layout commits", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Advanced handle lifecycle is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  await expect(page.getByRole("heading", { name: "Interactive dashboards for React" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);

  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());
  const snapshot = await page.evaluate(() => window.__cominsReadmeDemo?.moveWithGridStack("overview", 2, 0));

  expect(snapshot?.widgets.find((widget) => widget.id === "overview")?.x).toBe(2);
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("data-layout-x", "2");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
  await page.evaluate(() => window.__cominsReadmeDemo?.refresh());
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);
  await expect(page.getByTestId("dashboard-widget-overview")).toHaveAttribute("data-layout-x", "2");

  await page.evaluate(() => {
    window.__retainedCominsGridHandle = window.__cominsReadmeDemo?.getHandle();
    history.pushState({}, "", "/api");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "1. Dashboard 렌더링" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__retainedCominsGridHandle?.getGridStack()?.getColumn() ?? null))
    .toBeNull();
});

test("commits an interaction that returns to a layout seen before a controlled sync", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Controlled sync dedupe is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  const overview = page.getByTestId("dashboard-widget-overview");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);

  await page.evaluate(() => window.__cominsReadmeDemo?.moveWithGridStack("overview", 2, 0));
  await expect(overview).toHaveAttribute("data-layout-x", "2");

  await page.evaluate(() => window.__cominsReadmeDemo?.setOverviewPosition(0, 0));
  await expect(overview).toHaveAttribute("data-layout-x", "0");
  await expect(overview).toHaveAttribute("gs-x", "0");
  await page.evaluate(() => {
    window.__cominsReadmeDemo?.resetCommitCount();
    window.__cominsReadmeDemo?.resetInteractionEvents();
  });

  const overviewBox = await overview.boundingBox();
  if (!overviewBox) {
    throw new Error("Overview bounding box is not available");
  }
  const titleBox = await overview.locator(".comins-grid-layout-widget__title").boundingBox();
  if (!titleBox) {
    throw new Error("Overview drag handle bounding box is not available");
  }
  const startX = titleBox.x + titleBox.width / 2;
  const startY = titleBox.y + titleBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + overviewBox.width, startY, { steps: 12 });
  await page.mouse.up();

  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents() ?? [])).toEqual(
    expect.arrayContaining(["drag-start:overview", "drag-stop:overview"]),
  );
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
  await expect.poll(() => page.evaluate(
    () => window.__cominsReadmeDemo?.getLastCommittedLayout()?.widgets.find((widget) => widget.id === "overview")?.x ?? null,
  )).toBe(2);
  await expect(overview).toHaveAttribute("data-layout-x", "2");

  await page.evaluate(() => window.__cominsReadmeDemo?.setCustomDragHandle(false));
  await expect(overview).toHaveAttribute("data-layout-x", "2");
});

test("compacts only through the explicit handle command and commits once", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Advanced compact behavior is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  await expect(page.getByTestId("dashboard-widget-orders")).toHaveAttribute("data-layout-x", "4");
  await expect.poll(() => page.evaluate(
    () => window.__cominsReadmeDemo?.getHandle()?.getGridStack() ?? null,
  )).not.toBeNull();
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

  const snapshot = await page.evaluate(() => window.__cominsReadmeDemo?.compact("compact"));

  expect(snapshot?.widgets.find((widget) => widget.id === "orders")?.x).toBe(2);
  await expect(page.getByTestId("dashboard-widget-orders")).toHaveAttribute("data-layout-x", "2");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
});

test("updates a supported GridStack engine option without remounting", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Engine option synchronization is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  const readDragHandle = () => page.evaluate(() => {
    const draggable = window.__cominsReadmeDemo?.getHandle()?.getGridStack()?.opts.draggable;
    return typeof draggable === "object" ? draggable.handle ?? null : null;
  });
  await expect.poll(readDragHandle).toBe(".comins-grid-layout-widget__title");

  await page.evaluate(() => window.__cominsReadmeDemo?.setCustomDragHandle(false));

  await expect.poll(readDragHandle).toBe(".grid-stack-item-content");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);
});

test("removes controlled widgets from the engine before clear and same-id re-add", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Controlled CRUD engine reconciliation is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds().sort())).toEqual([
    "orders",
    "overview",
  ]);

  await page.evaluate(() => window.__cominsReadmeDemo?.removeWidget("overview"));
  await expect(page.getByTestId("dashboard-widget-overview")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds().sort())).toEqual([
    "orders",
  ]);

  await page.evaluate(() => window.__cominsReadmeDemo?.clearWidgets());
  await expect(page.getByText("0 widgets")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds())).toEqual([]);

  await page.evaluate(() => window.__cominsReadmeDemo?.addWidgetWithId("overview"));
  await expect(page.getByTestId("dashboard-widget-overview")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds())).toEqual(["overview"]);
});

test("applies inherited and runtime RTL positioning to existing widgets", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "RTL engine synchronization is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  const orders = page.getByTestId("dashboard-widget-orders");
  await expect(orders).toHaveCSS("direction", "ltr");

  await page.evaluate(() => {
    window.__cominsReadmeDemo?.setDirection("rtl");
    window.__cominsReadmeDemo?.setRtl("auto");
  });
  await expect(page.getByTestId("dashboard-grid")).toHaveClass(/grid-stack-rtl/);
  await expect.poll(() => orders.evaluate((element) => ({
    left: (element as HTMLElement).style.left,
    right: (element as HTMLElement).style.right,
  }))).toEqual({ left: "", right: "calc(4 * var(--gs-column-width))" });

  await page.evaluate(() => window.__cominsReadmeDemo?.setRtl(false));
  await expect(page.getByTestId("dashboard-grid")).not.toHaveClass(/grid-stack-rtl/);
  await expect.poll(() => orders.evaluate((element) => ({
    left: (element as HTMLElement).style.left,
    right: (element as HTMLElement).style.right,
  }))).toEqual({ left: "calc(4 * var(--gs-column-width))", right: "" });
});

test("updates size-to-content classes for existing widgets", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Size-to-content synchronization is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  const overview = page.getByTestId("dashboard-widget-overview");
  await expect(overview).not.toHaveClass(/size-to-content/);

  await page.evaluate(() => window.__cominsReadmeDemo?.setSizeToContent(true));
  await expect(overview).toHaveClass(/size-to-content/);

  await page.evaluate(() => window.__cominsReadmeDemo?.setSizeToContent(false));
  await expect(overview).not.toHaveClass(/size-to-content/);
});

test("uses the active responsive column in DOM, snapshots, and atomic React state", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Responsive state ownership is covered on supported desktop browsers.");

  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.setResponsive(true));

  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(4);
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");
  const snapshot = await page.evaluate(() => window.__cominsReadmeDemo?.getHandle()?.commitLayout());
  expect(snapshot?.columns).toBe(4);
  await expect(page.getByLabel("Columns")).toHaveValue("4");

  await page.setViewportSize({ width: 1300, height: 800 });
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(6);
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");
  await expect(page.getByLabel("Columns")).toHaveValue("6");
});

test("orders drag lifecycle callbacks after the committed layout", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Interaction callback ordering is covered on supported desktop browsers.");

  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());
  const overview = page.getByTestId("dashboard-widget-overview");
  const title = overview.locator(".comins-grid-layout-widget__title");
  const titleBox = await title.boundingBox();
  if (!titleBox) {
    throw new Error("Custom drag handle bounding box is not available");
  }
  await page.mouse.move(titleBox.x + titleBox.width / 2, titleBox.y + titleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(titleBox.x + titleBox.width / 2 + 180, titleBox.y + titleBox.height / 2, { steps: 12 });
  await page.mouse.up();
  await waitForInteractionToSettle(overview);
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents().at(-1))).toBe("drag-stop:overview");

  const events = await page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents() ?? []);
  const layoutIndex = events.findIndex((event) => event === "widget-layout:overview");
  const commitIndex = events.indexOf("layout-commit");
  const stopIndex = events.indexOf("drag-stop:overview");
  expect(events[0]).toBe("drag-start:overview");
  expect(layoutIndex).toBeGreaterThan(0);
  expect(commitIndex).toBeGreaterThan(layoutIndex);
  expect(stopIndex).toBeGreaterThan(commitIndex);

  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());
  await resizeWidget(page, overview, 200, 120);
  await waitForInteractionToSettle(overview);
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents().at(-1))).toBe("resize-stop:overview");

  const resizeEvents = await page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents() ?? []);
  const resizeLayoutIndex = resizeEvents.findIndex((event) => event === "widget-layout:overview");
  const resizeCommitIndex = resizeEvents.indexOf("layout-commit");
  const resizeStopIndex = resizeEvents.indexOf("resize-stop:overview");
  expect(resizeEvents[0]).toBe("resize-start:overview");
  expect(resizeLayoutIndex).toBeGreaterThan(0);
  expect(resizeCommitIndex).toBeGreaterThan(resizeLayoutIndex);
  expect(resizeStopIndex).toBeGreaterThan(resizeCommitIndex);
});

test("emits one external drop event and removes controlled state through the consumer", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());

  const widget = page.getByTestId("dashboard-widget-overview");
  const target = page.getByTestId("external-drop-trash-child");
  await dragWidgetToTarget(page, widget, target);

  await expect(widget).toBeHidden();
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents()),
  ).toContain("external-drop:trash:overview");
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getEngineWidgetIds()),
  ).not.toContain("overview");
  expect(await page.evaluate(
    () => window.__cominsReadmeDemo
      ?.getInteractionEvents()
      .filter((event) => event.startsWith("external-drop:")),
  )).toEqual(["external-drop:trash:overview"]);

  const payload = await page.evaluate(() => ({
    committed: window.__cominsReadmeDemo?.getLastCommittedLayout() ?? null,
    event: window.__cominsReadmeDemo?.getLastExternalDropEvent() ?? null,
    liveColumns: window.__cominsReadmeDemo?.getColumn() ?? null,
  }));
  expect(payload.event).not.toBeNull();
  expect(payload.committed).not.toBeNull();
  if (!payload.event || !payload.committed) {
    throw new Error("External drop payload snapshots are unavailable");
  }
  expect(payload.event.widgetId).toBe("overview");
  expect(payload.event.targetId).toBe("trash");
  expect(payload.event.columns).toBe(payload.liveColumns);
  expect(payload.committed.columns).toBe(payload.liveColumns);
  expect(payload.event.layout).toEqual(
    payload.committed.widgets.find((layout) => layout.id === "overview"),
  );
});

test("does not emit an external drop event when dropping outside the target", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/examples/advanced");

  const widget = page.getByTestId("dashboard-widget-sales");
  await dragWidget(page, widget, 180, 0);
  await waitForInteractionToSettle(widget);

  await expect(widget).toBeVisible();
  await expect(page.getByRole("status", { name: "외부 드롭 처리 상태" })).toHaveText(
    "위젯을 삭제 영역으로 드래그해 보세요.",
  );
});

test("resolves an external drop target remounted after grid initialization", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.setTrashVisible(false));
  await expect(page.getByTestId("external-drop-trash")).toBeHidden();
  await page.evaluate(() => window.__cominsReadmeDemo?.setTrashVisible(true));
  const target = page.getByTestId("external-drop-trash-child");
  await expect(target).toBeVisible();
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());

  const widget = page.getByTestId("dashboard-widget-overview");
  await dragWidgetToTarget(page, widget, target);

  await expect(widget).toBeHidden();
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents()),
  ).toContain("external-drop:trash:overview");
});

test("does not emit an external drop event for a non-movable widget", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(
    () => window.__cominsReadmeDemo?.getHandle()?.getGridStack() ?? null,
  )).not.toBeNull();
  await page.evaluate(() => {
    window.__cominsReadmeDemo?.setOverviewMovable(false);
    window.__cominsReadmeDemo?.resetInteractionEvents();
  });

  const widget = page.getByTestId("dashboard-widget-overview");
  await expect.poll(() => widget.evaluate((element) => element.classList.contains("ui-draggable-disabled"))).toBe(true);
  await dragWidgetToTarget(page, widget, page.getByTestId("external-drop-trash-child"));

  await expect(widget).toBeVisible();
  expect(await page.evaluate(
    () => window.__cominsReadmeDemo
      ?.getInteractionEvents()
      .filter((event) => event.startsWith("external-drop:")),
  )).toEqual([]);
});

test("does not emit an external drop event for a locked widget", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await expect.poll(() => page.evaluate(
    () => window.__cominsReadmeDemo?.getHandle()?.getGridStack() ?? null,
  )).not.toBeNull();
  await page.evaluate(() => {
    window.__cominsReadmeDemo?.setOverviewLocked(true);
    window.__cominsReadmeDemo?.resetInteractionEvents();
  });

  const widget = page.getByTestId("dashboard-widget-overview");
  await expect.poll(() => widget.evaluate((element) => element.classList.contains("ui-draggable-disabled"))).toBe(true);
  await dragWidgetToTarget(page, widget, page.getByTestId("external-drop-trash-child"));

  await expect(widget).toBeVisible();
  expect(await page.evaluate(
    () => window.__cominsReadmeDemo
      ?.getInteractionEvents()
      .filter((event) => event.startsWith("external-drop:")),
  )).toEqual([]);
});

test("does not emit an external drop event while resizing", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());

  const widget = page.getByTestId("dashboard-widget-overview");
  await resizeWidget(page, widget, 120, 80);
  await waitForInteractionToSettle(widget);

  await expect(widget).toBeVisible();
  expect(await page.evaluate(
    () => window.__cominsReadmeDemo
      ?.getInteractionEvents()
      .filter((event) => event.startsWith("external-drop:")),
  )).toEqual([]);
});

test("orders the external drop callback after layout commit and before drag stop", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "External drop is covered on supported desktop browsers.");
  await page.setViewportSize({ width: 1280, height: 1400 });
  await page.goto("/readme-demo");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetInteractionEvents());

  await dragWidgetToTarget(
    page,
    page.getByTestId("dashboard-widget-overview"),
    page.getByTestId("external-drop-trash-child"),
  );
  await expect.poll(
    () => page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents()),
  ).toContain("drag-stop:overview");

  const events = await page.evaluate(() => window.__cominsReadmeDemo?.getInteractionEvents() ?? []);
  const layoutCommitIndex = events.indexOf("layout-commit");
  const externalDropIndex = events.indexOf("external-drop:trash:overview");
  const dragStopIndex = events.indexOf("drag-stop:overview");
  if (layoutCommitIndex >= 0) {
    expect(externalDropIndex).toBeGreaterThan(layoutCommitIndex);
  }
  expect(externalDropIndex).toBeGreaterThanOrEqual(0);
  expect(dragStopIndex).toBeGreaterThan(externalDropIndex);
});

test("drops a widget on a plain div with mobile touch", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch external drop is covered in mobile Chrome.");
  await page.setViewportSize({ width: 412, height: 1400 });
  await page.goto("/examples/advanced");

  const widget = page.getByTestId("dashboard-widget-sales");
  const dragHandle = widget.locator(".grid-stack-item-content");
  const target = page.locator("[data-dashboard-drop-target='trash']");
  await waitForWidgetGridEngine(widget);
  await performTouchGestureToTarget(page, dragHandle, target, 12);

  await expect(widget).toBeHidden();
  await expect(page.getByRole("status", { name: "외부 드롭 처리 상태" })).toContainText(
    "target=trash; widget=sales; columns=12; layout=",
  );
  const targetBox = await target.boundingBox();
  expect(targetBox?.width).toBeLessThanOrEqual(300);
});

test("moves a widget with touch after a runtime column change", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch interaction is verified in the mobile project only.");

  await page.goto("/readme-demo");
  await page.getByLabel("Columns").selectOption("8");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "8");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getColumn() ?? null)).toBe(8);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

  const widget = page.getByTestId("dashboard-widget-overview");
  const title = widget.locator(".comins-grid-layout-widget__title");
  await waitForWidgetGridEngine(widget);
  const beforeMove = await readWidgetLayout(widget);
  await performTouchGesture(page, title, { x: 96, y: 0 }, 3);

  await expect.poll(async () => (await readWidgetLayout(widget)).x).not.toBe(beforeMove.x);
  const committedMove = await readWidgetLayout(widget);
  expect(committedMove.x).toBeGreaterThanOrEqual(0);
  expect(committedMove.x).toBeLessThanOrEqual(8 - committedMove.w);
  expect(committedMove.y).toBe(beforeMove.y);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect.poll(() => readWidgetLayout(widget)).toEqual(committedMove);
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
});

test("resizes a widget with touch and commits the controlled layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch interaction is verified in the mobile project only.");

  await page.goto("/readme-demo");
  const widget = page.getByTestId("dashboard-widget-overview");
  const handle = widget.locator(".ui-resizable-se");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

  await waitForWidgetGridEngine(widget);
  await performTouchGesture(page, handle, { x: 72, y: 104 }, 1);

  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect(widget).toHaveAttribute("data-layout-w", "3");
  await expect(widget).toHaveAttribute("data-layout-h", "3");
});

test("adds widgets with user-selected size into horizontal free space", async ({ page }) => {
  await page.goto("/examples/widget");

  await addWidgetFromDialog(page, "2", "3");
  const firstAdded = page.getByTestId("dashboard-widget-widget-4");
  await expect(firstAdded).toHaveAttribute("data-layout-x", "0");
  await expect(firstAdded).toHaveAttribute("data-layout-y", "2");
  await expect(firstAdded).toHaveAttribute("data-layout-w", "2");
  await expect(firstAdded).toHaveAttribute("data-layout-h", "3");

  await addWidgetFromDialog(page, "2", "3");
  const secondAdded = page.getByTestId("dashboard-widget-widget-5");
  await expect(secondAdded).toHaveAttribute("data-layout-x", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-y", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-w", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-h", "3");

  const saved = JSON.parse((await page.getByLabel("현재 위젯 상태 JSON").textContent()) ?? "{}");
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "widget-4",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
      expect.objectContaining({
        id: "widget-5",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
    ]),
  );
});

test("clears all widgets and applies distinct add/delete button colors", async ({ page }) => {
  await page.goto("/examples/layout");

  const addButton = page.getByRole("button", { name: "위젯 추가" });
  const clearButton = page.getByRole("button", { name: "전체 삭제" });
  const removeButton = page.getByRole("button", { name: "선택 위젯 삭제" });

  await expect(addButton).toBeVisible();
  await expect(clearButton).toBeVisible();
  await expect(removeButton).toBeVisible();

  const colors = await Promise.all([
    addButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    clearButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    removeButton.evaluate((element) => getComputedStyle(element).color),
  ]);

  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[1]).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors[2]).not.toBe("rgb(23, 32, 38)");

  await clearButton.click();

  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
  await expect(page.getByText("위젯 0개")).toBeVisible();
});

test("selects 1 through 12 columns and leaves already-full rows unchanged", async ({ page }) => {
  await page.goto("/examples/layout");

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);

  await columnSelect.selectOption("12");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "4");

  await page.getByRole("button", { name: "빈 공간 채우기" }).click();

  await expect(page.getByRole("status", { name: "레이아웃 작업 상태" })).toHaveText("빈 공간이 없어 변경하지 않았습니다.");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "4");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "4");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-w", "8");
});

test("renders widget actions as icon-only buttons", async ({ page }) => {
  await page.goto("/examples/widget");

  const sales = page.getByTestId("dashboard-widget-sales");
  const maximize = sales.getByRole("button", { name: "매출 최대화" });
  const minimize = sales.getByRole("button", { name: "매출 최소화" });
  const restore = sales.getByRole("button", { name: "매출 복원" });
  const remove = sales.getByRole("button", { name: "매출 삭제" });

  for (const button of [maximize, minimize, restore, remove]) {
    await expect(button.locator("svg")).toBeVisible();
    await expect(button).toHaveText("");
  }
});

test("expands only the selected widget when its header is double-clicked", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Header double-click behavior is verified on supported desktop browsers.");

  await page.goto("/examples/advanced");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const salesTitle = sales.locator(".comins-grid-layout-widget__title");

  await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").fill(JSON.stringify({
    columns: 12,
    widgets: [
      { id: "sales", title: "매출", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
      { id: "traffic", title: "트래픽", layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 } },
      { id: "orders", title: "주문", layout: { id: "orders", x: 0, y: 2, w: 6, h: 2 } },
      { id: "alerts", title: "알림", layout: { id: "alerts", x: 6, y: 2, w: 6, h: 2 } },
    ],
  }));
  await page.getByRole("button", { name: "전체 상태 복원" }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");

  await salesTitle.dblclick();

  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "9");
  await expect(traffic).toHaveAttribute("data-layout-x", "9");
  await expect(traffic).toHaveAttribute("data-layout-w", "3");
});

test("does not fill empty row space when a widget action button is double-clicked", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Header double-click behavior is verified on supported desktop browsers.");

  await page.goto("/examples/layout");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");

  await page.getByLabel("활성 레이아웃 JSON").fill(JSON.stringify({
    columns: 12,
    widgets: [
      { id: "sales", x: 0, y: 0, w: 3, h: 2 },
      { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
      { id: "orders", x: 0, y: 2, w: 6, h: 2 },
      { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
    ],
  }));
  await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");

  await sales.getByRole("button", { name: "Sales 복원" }).dblclick();

  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");
});

test("does not resize row widgets on header double-click when the row has no empty space", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Header double-click behavior is verified on supported desktop browsers.");

  await page.goto("/examples/advanced");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const layoutJson = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
  const fullRowSnapshot = {
    columns: 12,
    widgets: [
      {
        id: "sales",
        title: "매출",
        layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 },
        data: { description: "월간 반복 매출", value: "1.28억" },
      },
      {
        id: "traffic",
        title: "트래픽",
        layout: { id: "traffic", x: 4, y: 0, w: 8, h: 2 },
        data: { description: "활성 세션", value: "4.28만" },
      },
      {
        id: "orders",
        title: "주문",
        layout: { id: "orders", x: 0, y: 2, w: 6, h: 2 },
        data: { description: "완료 주문", value: "1,284" },
      },
      {
        id: "alerts",
        title: "알림",
        layout: { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
        data: { description: "미해결 이슈", value: "3" },
      },
    ],
  };

  await layoutJson.fill(JSON.stringify(fullRowSnapshot, null, 2));
  await page.getByRole("button", { name: "전체 상태 복원" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
  await expect(sales).toHaveAttribute("data-layout-w", "4");
  await expect(traffic).toHaveAttribute("data-layout-x", "4");
  await expect(traffic).toHaveAttribute("data-layout-w", "8");

  await sales.locator(".comins-grid-layout-widget__header").dblclick();

  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "4");
  await expect(traffic).toHaveAttribute("data-layout-x", "4");
  await expect(traffic).toHaveAttribute("data-layout-w", "8");
});

test("preserves independent controlled caches when columns change during a resize", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction regression runs on supported desktop browsers.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/layout");

  const grid = page.getByTestId("dashboard-grid");
  const columnSelect = page.getByLabel("컬럼 선택");
  const stateEditor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
  const sales = page.getByTestId("dashboard-widget-sales");
  const orders = page.getByTestId("dashboard-widget-orders");

  const initialTwelve = await readDashboardLayouts(page);
  await resizeWidget(page, orders, 0, 110);
  await expect.poll(() => readDashboardLayouts(page)).not.toEqual(initialTwelve);
  const targetTwelve = await readDashboardLayouts(page);

  await columnSelect.selectOption("6");
  await expect(grid).toHaveAttribute("data-columns", "6");
  const initialSix = await readDashboardLayouts(page);
  await resizeWidget(page, sales, 0, 110);
  await expect.poll(() => readDashboardLayouts(page)).not.toEqual(initialSix);
  const sourceSix = await readDashboardLayouts(page);
  expect(sourceSix).not.toEqual(targetTwelve);

  await columnSelect.selectOption("12");
  await expect.poll(() => readDashboardLayouts(page)).toEqual(targetTwelve);
  await columnSelect.selectOption("6");
  await expect.poll(() => readDashboardLayouts(page)).toEqual(sourceSix);

  const { startX, startY } = await startWidgetResize(page, sales);

  await page.mouse.move(startX + 120, startY + 90, { steps: 8 });
  await columnSelect.evaluate((element) => {
    const select = element as HTMLSelectElement;
    select.value = "12";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect.poll(() => readGridEngineColumn(grid)).toBe(6);

  await page.mouse.move(startX + 180, startY + 130, { steps: 8 });
  await page.mouse.up();

  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect.poll(() => readGridEngineColumn(grid)).toBe(12);
  await expect.poll(() => readDashboardLayouts(page)).toEqual(targetTwelve);

  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const restoredState = JSON.parse(await stateEditor.inputValue()) as {
    layoutsByColumn: Record<string, { widgets: IdentifiedWidgetLayout[] }>;
  };
  expect(restoredState.layoutsByColumn["6"]?.widgets).toEqual(sourceSix);
  expect(restoredState.layoutsByColumn["12"]?.widgets).toEqual(targetTwelve);
  expect(restoredState.layoutsByColumn["6"]?.widgets).not.toEqual(
    restoredState.layoutsByColumn["12"]?.widgets,
  );

  await page.waitForTimeout(100);
  expect(diagnostics).toEqual([]);
});

test("finalizes widget resize when the pointer leaves the browser boundary", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction regression runs on supported desktop browsers.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/layout");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  await expect(grid).toHaveAttribute("data-columns", "12");
  const targetTwelveLayout = await readWidgetLayout(sales);

  await page.getByLabel("컬럼 선택").selectOption("6");
  await expect(grid).toHaveAttribute("data-columns", "6");

  try {
    const { startX, startY } = await startWidgetResize(page, sales);
    await page.mouse.move(startX + 140, startY + 110, { steps: 8 });

    await page.getByLabel("컬럼 선택").evaluate((element) => {
      const select = element as HTMLSelectElement;
      select.value = "12";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await expect.poll(() => readGridEngineColumn(grid)).toBe(6);

    const releaseX = startX + 900;
    const releaseY = startY + 420;
    await simulateBrowserBoundaryExit(page, releaseX, releaseY);

    await expect.poll(async () => (await readWidgetInteractionState(sales)).isResizing).toBe(true);
    await expect.poll(() => readGridEngineColumn(grid)).toBe(6);

    const stateAfterReleaseSignal = await dispatchReleaseLikeMoveAndReadState(sales, releaseX, releaseY);
    expect(stateAfterReleaseSignal.isResizing).toBe(true);

    await expect.poll(async () => (await readWidgetInteractionState(sales)).isResizing).toBe(false);
    await expect(grid).toHaveAttribute("data-columns", "12");
    await expect.poll(() => readGridEngineColumn(grid)).toBe(12);
    await expect.poll(() => readWidgetLayout(sales)).toEqual(targetTwelveLayout);
    await page.mouse.up().catch(() => undefined);
    await page.bringToFront();

    const afterForcedEnd = targetTwelveLayout;
    await resizeWidgetWithDomEvents(sales, 180, 130);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(sales);
      return layout.w !== afterForcedEnd.w || layout.h !== afterForcedEnd.h;
    }).toBe(true);
    expect(diagnostics).toEqual([]);
  } finally {
    await page.mouse.up().catch(() => undefined);
  }
});

test("finalizes widget drag when the pointer leaves the browser boundary", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction regression runs on supported desktop browsers.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/widget");

  const sales = page.getByTestId("dashboard-widget-sales");
  const beforeDrag = await readWidgetLayout(sales);

  try {
    const { startX, startY } = await startWidgetDrag(page, sales);
    await page.mouse.move(startX + 140, startY + 160, { steps: 8 });

    await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(true);

    const releaseX = startX + 900;
    const releaseY = startY + 420;
    await simulateBrowserBoundaryExit(page, releaseX, releaseY);

    await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(true);

    const stateAfterReleaseSignal = await dispatchReleaseLikeMoveAndReadState(sales, releaseX, releaseY);
    expect(stateAfterReleaseSignal.isDragging).toBe(true);

    await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(false);
    await expect.poll(async () => {
      const layout = await readWidgetLayout(sales);
      return layout.x !== beforeDrag.x || layout.y !== beforeDrag.y;
    }).toBe(true);

    await page.mouse.up().catch(() => undefined);
    await page.bringToFront();

    const didStartFollowUpDrag = await dragWidgetWithDomEvents(sales, 120, 120);
    expect(didStartFollowUpDrag).toBe(true);
    await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(false);
    expect(diagnostics).toEqual([]);
  } finally {
    await page.mouse.up().catch(() => undefined);
  }
});

test("finishes widget resize after leaving the grid area", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction regression runs on supported desktop browsers.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/widget");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const beforeResize = await readWidgetLayout(sales);
  const gridBox = await grid.boundingBox();

  if (!gridBox) {
    throw new Error("Grid bounding box is not available");
  }

  const { startX, startY } = await startWidgetResize(page, sales);

  await page.mouse.move(startX + 180, startY + 120, { steps: 8 });
  await page.mouse.move(gridBox.x + gridBox.width + 16, startY + 120, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await readWidgetInteractionState(sales)).isResizing).toBe(false);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);
  expect(diagnostics).toEqual([]);
});

test("finishes widget drag after leaving the grid area", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction regression runs on supported desktop browsers.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/widget");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const gridBox = await grid.boundingBox();

  if (!gridBox) {
    throw new Error("Grid bounding box is not available");
  }

  const { startX, startY } = await startWidgetDrag(page, sales);

  await page.mouse.move(startX + 120, startY + 120, { steps: 8 });
  await page.mouse.move(gridBox.x + gridBox.width + 16, startY + 120, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(false);
  const didStartFollowUpDrag = await dragWidgetWithDomEvents(sales, 120, 120);
  expect(didStartFollowUpDrag).toBe(true);
  await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(false);
  expect(diagnostics).toEqual([]);
});

test("executes the complete feature set through explicit playground routes", async ({ page }, testInfo) => {
  test.skip(!isDesktopBrowserProject(testInfo.project.name), "Pointer interaction smoke test runs on supported desktop browsers.");

  await page.goto("/examples/layout");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");

  await expect(page.getByRole("heading", { name: "레이아웃", exact: true })).toBeVisible();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(sales).toBeVisible();
  await expect(page.getByText("위젯 4개")).toBeVisible();

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);
  await columnSelect.selectOption("12");
  await expect(grid).toHaveAttribute("data-columns", "12");

  await page.getByLabel("활성 레이아웃 JSON").fill(JSON.stringify({
    columns: 12,
    widgets: [
      { id: "sales", x: 0, y: 0, w: 3, h: 2 },
      { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
      { id: "orders", x: 0, y: 2, w: 6, h: 2 },
      { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
    ],
  }));
  await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
  await page.getByRole("button", { name: "빈 공간 채우기" }).click();
  await expect(sales).toHaveAttribute("data-layout-w", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "6");

  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const savedJson = await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue();
  expect(JSON.parse(savedJson)).toMatchObject({ columns: 12 });
  await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText("전체 상태와 컬럼 캐시를 저장했습니다.");

  await columnSelect.selectOption("4");
  await expect(grid).toHaveAttribute("data-columns", "4");
  await page.getByRole("button", { name: "전체 상태 복원" }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(page.getByRole("status", { name: "전체 상태 저장 복원 상태" })).toHaveText("전체 상태와 컬럼 캐시를 복원했습니다.");

  await addWidgetFromDialog(page);
  await expect(page.getByTestId("dashboard-widget-widget-5")).toBeVisible();
  await expect(page.getByText("위젯 5개")).toBeVisible();

  await page.getByRole("button", { name: "Sales 최대화" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "true");
  await expect(sales).toHaveAttribute("data-layout-w", "12");

  await page.getByRole("button", { name: "Sales 최소화" }).click();
  await expect(sales).toHaveAttribute("data-minimized", "true");
  await expect(sales).toHaveAttribute("data-layout-h", "1");

  await page.getByRole("button", { name: "Sales 복원" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "false");
  await expect(sales).toHaveAttribute("data-minimized", "false");

  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(sales).toHaveAttribute("data-layout-x", "0");

  await page.getByRole("button", { name: "레이아웃 초기화" }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "4");

  await page.getByRole("button", { name: "Sales 삭제" }).click();
  await expect(sales).toBeHidden();
  await expect(page.getByText("위젯 3개")).toBeVisible();

  await page.getByRole("button", { name: "전체 삭제" }).click();
  await expect(page.getByText("위젯 0개")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toBeHidden();

  expect(await page.locator(".grid-stack-item").count()).toBe(0);

  await page.goto("/examples/advanced");
  const advancedSales = page.getByTestId("dashboard-widget-sales");
  const advancedSalesBox = await advancedSales.boundingBox();
  if (!advancedSalesBox) {
    throw new Error("Advanced widget bounding box is not available");
  }

  await page.getByRole("button", { name: "이동 가능" }).click();
  await expect(page.getByRole("button", { name: "이동 불가" })).toHaveAttribute("data-active", "false");
  await expect.poll(() => grid.evaluate((element) => Boolean((element as HTMLElement & {
    gridstack?: { opts?: { disableDrag?: boolean } };
  }).gridstack?.opts?.disableDrag))).toBe(true);
  const lockedPosition = await readWidgetLayout(advancedSales);
  expect(await dragWidgetWithDomEvents(advancedSales, advancedSalesBox.width, 0)).toBe(false);
  await expect.poll(() => readWidgetLayout(advancedSales)).toEqual(lockedPosition);

  await page.getByRole("button", { name: "이동 불가" }).click();
  await expect(page.getByRole("button", { name: "이동 가능" })).toHaveAttribute("data-active", "true");
  await expect.poll(() => grid.evaluate((element) => Boolean((element as HTMLElement & {
    gridstack?: { opts?: { disableDrag?: boolean } };
  }).gridstack?.opts?.disableDrag))).toBe(false);
  await expect.poll(() => advancedSales.evaluate((element) => Boolean((element as HTMLElement & {
    gridstackNode?: { noMove?: boolean };
  }).gridstackNode?.noMove))).toBe(false);
  await advancedSales.scrollIntoViewIfNeeded();
  const advancedBodyBox = await advancedSales.locator(".dashboard-widget-body").boundingBox();
  if (!advancedBodyBox) {
    throw new Error("Advanced widget drag surface is not available");
  }
  const advancedDragX = advancedBodyBox.x + advancedBodyBox.width / 2;
  const advancedDragY = advancedBodyBox.y + advancedBodyBox.height / 2;
  await page.mouse.move(advancedDragX, advancedDragY);
  await page.mouse.down();
  await page.mouse.move(advancedDragX + advancedSalesBox.width, advancedDragY, { steps: 12 });
  await expect.poll(async () => (await readWidgetInteractionState(advancedSales)).isDragging).toBe(true);
  await page.mouse.up();
  await expect.poll(async () => {
    const layout = await readWidgetLayout(advancedSales);
    return layout.x !== lockedPosition.x || layout.y !== lockedPosition.y;
  }).toBe(true);

  await page.getByRole("button", { name: "크기 조절 가능" }).click();
  await expect(page.getByRole("button", { name: "크기 조절 불가" })).toHaveAttribute("data-active", "false");
  await expect.poll(() => grid.evaluate((element) => Boolean((element as HTMLElement & {
    gridstack?: { opts?: { disableResize?: boolean } };
  }).gridstack?.opts?.disableResize))).toBe(true);
  const lockedSize = await readWidgetLayout(advancedSales);
  await expect(advancedSales.locator(".ui-resizable-se")).toBeHidden();
  await expect.poll(() => readWidgetLayout(advancedSales)).toEqual(lockedSize);

  await page.getByRole("button", { name: "크기 조절 불가" }).click();
  await expect(page.getByRole("button", { name: "크기 조절 가능" })).toHaveAttribute("data-active", "true");
  await expect.poll(() => grid.evaluate((element) => Boolean((element as HTMLElement & {
    gridstack?: { opts?: { disableResize?: boolean } };
  }).gridstack?.opts?.disableResize))).toBe(false);
  const beforeResize = await readWidgetLayout(advancedSales);
  await resizeWidget(page, advancedSales, 140, 100);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(advancedSales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);

  await page.getByRole("button", { name: "레이아웃 갱신" }).click();
  await expect(page.getByRole("status", { name: "handle 작업 상태" })).toHaveText("레이아웃을 갱신했습니다.");
  await expect(advancedSales).toBeVisible();
});
