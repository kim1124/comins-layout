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
import { performTouchGesture } from "../touch-gesture";

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
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

async function readGridEngineColumn(grid: Locator): Promise<number> {
  return grid.evaluate((element) => {
    const gridstack = (element as HTMLElement & { gridstack?: { opts?: { column?: number } } }).gridstack;
    return Number(gridstack?.opts?.column ?? 0);
  });
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

async function startWidgetDrag(page: Page, widget: Locator) {
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

test("supports the dashboard example workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "comins-grid-layout" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();

  await addWidgetFromDialog(page);
  await expect(page.getByTestId("dashboard-widget-widget-5")).toBeVisible();

  await page.getByRole("button", { name: "매출 최대화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "true");

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "true");

  await page.getByRole("button", { name: "매출 복원" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "false");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "false");

  await page.getByLabel("컬럼 선택").selectOption("4");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");

  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-x", "0");

  await page.getByRole("button", { name: "매출 삭제" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
});

test("keeps widget shell aligned with the GridStack content box", async ({ page }) => {
  await page.goto("/");
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
  await page.goto("/");

  await page.getByLabel("컬럼 선택").selectOption("4");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const json = await page.getByLabel("저장된 레이아웃 JSON").inputValue();
  const saved = JSON.parse(json);
  expect(saved.columns).toBe(4);
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "sales",
        title: "매출",
        layout: expect.objectContaining({ id: "sales", w: 3 }),
      }),
    ]),
  );

  await page.getByLabel("컬럼 선택").selectOption("6");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");

  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "3");
  await expect(page.getByText("복원 완료")).toBeVisible();
});

test("supports selector-significant widget IDs", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  const widgetId = 'sales\"] .grid-stack-item';

  await page.goto("/");
  await page.getByLabel("저장된 레이아웃 JSON").fill(
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
  await page.getByRole("button", { name: "레이아웃 복원" }).click();

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
  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const layoutJson = page.getByLabel("저장된 레이아웃 JSON");
  await layoutJson.fill(JSON.stringify(createStressSnapshot()));
  await page.getByRole("button", { name: "레이아웃 복원" }).click();

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

  expect(columnCycleCounters.every((counter) => counter.documents === columnBaseline.documents)).toBe(true);
  expect(columnCycleCounters.every((counter) => counter.listeners === columnBaseline.listeners)).toBe(true);
  expect(columnCycleCounters.every((counter) => counter.nodes === columnBaseline.nodes)).toBe(true);
  expect(staysWithinHeapPeak(columnCycleCounters, HEAP_PEAK_TOLERANCE)).toBe(true);
  expect(staysWithinFinalHeapGrowth(columnSteadyStateCounters, HEAP_FINAL_GROWTH_TOLERANCE)).toBe(true);
  expect(
    growsMonotonicallyBeyondTolerance(
      columnSteadyStateCounters.map((counter) => counter.heap),
      HEAP_FINAL_GROWTH_TOLERANCE,
    ),
  ).toBe(false);

  const interactionBaseline = allInteractionCounters[0];
  if (!interactionBaseline) {
    throw new Error("Interaction resource baseline is unavailable");
  }

  expect(allInteractionCounters.every((counter) => counter.documents === interactionBaseline.documents)).toBe(true);
  expect(allInteractionCounters.every((counter) => counter.nodes === interactionBaseline.nodes)).toBe(true);
  expect(allInteractionCounters.every((counter) => counter.listeners === interactionBaseline.listeners)).toBe(true);
  expect(staysWithinHeapPeak(allInteractionCounters, HEAP_PEAK_TOLERANCE)).toBe(true);
  expect(staysWithinFinalHeapGrowth(interactionSteadyStateCounters, HEAP_FINAL_GROWTH_TOLERANCE)).toBe(true);
  expect(
    growsMonotonicallyBeyondTolerance(
      interactionSteadyStateCounters.map((counter) => counter.heap),
      HEAP_FINAL_GROWTH_TOLERANCE,
    ),
  ).toBe(false);
});

test("exposes a live GridStack handle and deduplicates explicit layout commits", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Advanced handle lifecycle is covered once on desktop Chromium.");

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
  await performTouchGesture(page, title, { x: 96, y: 0 }, 3);

  await expect(widget).toHaveAttribute("data-layout-x", "1");
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  await expect(widget).toHaveAttribute("data-layout-x", "1");
  await expect.poll(() => page.evaluate(() => window.__cominsReadmeDemo?.getCommitCount() ?? -1)).toBe(1);
});

test("resizes a widget with touch and commits the controlled layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chrome", "Touch interaction is verified in the mobile project only.");

  await page.goto("/readme-demo");
  const widget = page.getByTestId("dashboard-widget-overview");
  const handle = widget.locator(".ui-resizable-se");
  await page.evaluate(() => window.__cominsReadmeDemo?.resetCommitCount());

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
  await page.goto("/");

  await addWidgetFromDialog(page, "2", "3");
  const firstAdded = page.getByTestId("dashboard-widget-widget-5");
  await expect(firstAdded).toHaveAttribute("data-layout-x", "0");
  await expect(firstAdded).toHaveAttribute("data-layout-y", "4");
  await expect(firstAdded).toHaveAttribute("data-layout-w", "2");
  await expect(firstAdded).toHaveAttribute("data-layout-h", "3");

  await addWidgetFromDialog(page, "2", "3");
  const secondAdded = page.getByTestId("dashboard-widget-widget-6");
  await expect(secondAdded).toHaveAttribute("data-layout-x", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-y", "4");
  await expect(secondAdded).toHaveAttribute("data-layout-w", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-h", "3");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const saved = JSON.parse(await page.getByLabel("저장된 레이아웃 JSON").inputValue());
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "widget-5",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
      expect.objectContaining({
        id: "widget-6",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
    ]),
  );
});

test("clears all widgets and applies distinct add/delete button colors", async ({ page }) => {
  await page.goto("/");

  const addButton = page.getByRole("button", { name: "위젯 추가" });
  const clearButton = page.getByRole("button", { name: "전체 삭제" });
  const removeButton = page.getByRole("button", { name: "매출 삭제" });

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

test("selects 1 through 12 columns and fits widgets to empty space", async ({ page }) => {
  await page.goto("/");

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);

  await columnSelect.selectOption("12");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "3");

  await page.getByRole("button", { name: "빈 공간 채우기" }).click();

  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-x", "0");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-w", "6");
});

test("renders widget actions as icon-only buttons", async ({ page }) => {
  await page.goto("/");

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
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const salesTitle = sales.locator(".comins-grid-layout-widget__title");

  await page.getByLabel("컬럼 선택").selectOption("12");
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
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");

  await page.getByLabel("컬럼 선택").selectOption("12");
  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");

  await sales.getByRole("button", { name: "매출 복원" }).dblclick();

  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");
});

test("does not resize row widgets on header double-click when the row has no empty space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const layoutJson = page.getByLabel("저장된 레이아웃 JSON");
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
  await page.getByRole("button", { name: "레이아웃 복원" }).click();
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

test("defers grid sync while a widget is actively resizing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  await expect(grid).toHaveAttribute("data-columns", "6");

  const beforeResize = await readWidgetLayout(sales);
  const { startX, startY } = await startWidgetResize(page, sales);

  await page.mouse.move(startX + 120, startY + 90, { steps: 8 });
  await page.getByLabel("컬럼 선택").evaluate((element) => {
    const select = element as HTMLSelectElement;
    select.value = "12";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect.poll(() => readGridEngineColumn(grid)).toBe(6);

  await page.mouse.move(startX + 180, startY + 130, { steps: 8 });
  await page.mouse.up();

  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect.poll(() => readGridEngineColumn(grid)).toBe(12);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);

  await page.waitForTimeout(100);
  expect(diagnostics).toEqual([]);
});

test("finalizes widget resize when the pointer leaves the browser boundary", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");

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
    const forcedLayout = await readWidgetLayout(sales);
    expect(forcedLayout.w).toBe(6);
    expect(forcedLayout.h).toBeGreaterThan(2);
    await page.mouse.up().catch(() => undefined);
    await page.bringToFront();

    const afterForcedEnd = forcedLayout;
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
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

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
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const beforeResize = await readWidgetLayout(sales);
  const gridBox = await grid.boundingBox();

  if (!gridBox) {
    throw new Error("Grid bounding box is not available");
  }

  const { startX, startY } = await startWidgetResize(page, sales);

  await page.mouse.move(startX + 180, startY + 120, { steps: 8 });
  await page.mouse.move(gridBox.x + gridBox.width + 80, startY + 120, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await readWidgetInteractionState(sales)).isResizing).toBe(false);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);
  expect(diagnostics).toEqual([]);
});

test("finishes widget drag after leaving the grid area", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const beforeDrag = await readWidgetLayout(sales);
  const gridBox = await grid.boundingBox();

  if (!gridBox) {
    throw new Error("Grid bounding box is not available");
  }

  const { startX, startY } = await startWidgetDrag(page, sales);

  await page.mouse.move(startX + 120, startY + 120, { steps: 8 });
  await page.mouse.move(gridBox.x + gridBox.width + 80, startY + 120, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => (await readWidgetInteractionState(sales)).isDragging).toBe(false);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.x !== beforeDrag.x || layout.y !== beforeDrag.y;
  }).toBe(true);
  expect(diagnostics).toEqual([]);
});

test("executes the complete dashboard feature set in development mode", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction smoke test runs on the desktop project only.");

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");

  await expect(page.getByRole("heading", { name: "comins-grid-layout" })).toBeVisible();
  await expect(grid).toHaveAttribute("data-columns", "6");
  await expect(sales).toBeVisible();
  await expect(page.getByText("위젯 4개")).toBeVisible();

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);
  await columnSelect.selectOption("12");
  await expect(grid).toHaveAttribute("data-columns", "12");

  await page.getByRole("button", { name: "빈 공간 채우기" }).click();
  await expect(sales).toHaveAttribute("data-layout-w", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "6");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const savedJson = await page.getByLabel("저장된 레이아웃 JSON").inputValue();
  expect(JSON.parse(savedJson)).toMatchObject({ columns: 12 });
  await expect(page.getByText("저장 완료")).toBeVisible();

  await columnSelect.selectOption("4");
  await expect(grid).toHaveAttribute("data-columns", "4");
  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(page.getByText("복원 완료")).toBeVisible();

  await addWidgetFromDialog(page);
  await expect(page.getByTestId("dashboard-widget-widget-5")).toBeVisible();
  await expect(page.getByText("위젯 5개")).toBeVisible();

  await page.getByRole("button", { name: "매출 최대화" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "true");
  await expect(sales).toHaveAttribute("data-layout-w", "12");

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(sales).toHaveAttribute("data-minimized", "true");
  await expect(sales).toHaveAttribute("data-layout-h", "1");

  await page.getByRole("button", { name: "매출 복원" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "false");
  await expect(sales).toHaveAttribute("data-minimized", "false");

  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(sales).toHaveAttribute("data-layout-x", "0");

  await page.getByRole("button", { name: "레이아웃 초기화" }).click();
  await expect(grid).toHaveAttribute("data-columns", "6");
  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "3");

  await page.getByRole("button", { name: "이동 가능" }).click();
  await expect(page.getByRole("button", { name: "이동 불가" })).toHaveAttribute("data-active", "false");
  const lockedPosition = await readWidgetLayout(sales);
  await dragWidget(page, sales, 0, 220);
  await expect.poll(() => readWidgetLayout(sales)).toEqual(lockedPosition);

  await page.getByRole("button", { name: "이동 불가" }).click();
  await expect(page.getByRole("button", { name: "이동 가능" })).toHaveAttribute("data-active", "true");
  await dragWidget(page, sales, 0, 220);
  await expect.poll(async () => (await readWidgetLayout(sales)).y).not.toBe(lockedPosition.y);

  await page.getByRole("button", { name: "크기 조절 가능" }).click();
  await expect(page.getByRole("button", { name: "크기 조절 불가" })).toHaveAttribute("data-active", "false");
  const lockedSize = await readWidgetLayout(sales);
  await expect(sales.locator(".ui-resizable-se")).toBeHidden();
  await expect.poll(() => readWidgetLayout(sales)).toEqual(lockedSize);

  await page.getByRole("button", { name: "크기 조절 불가" }).click();
  await expect(page.getByRole("button", { name: "크기 조절 가능" })).toHaveAttribute("data-active", "true");
  const beforeResize = await readWidgetLayout(sales);
  await resizeWidget(page, sales, 140, 100);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);

  await page.getByRole("button", { name: "레이아웃 갱신" }).click();
  await expect(sales).toBeVisible();

  await page.getByRole("button", { name: "매출 삭제" }).click();
  await expect(sales).toBeHidden();
  await expect(page.getByText("위젯 3개")).toBeVisible();

  await page.getByRole("button", { name: "전체 삭제" }).click();
  await expect(page.getByText("위젯 0개")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toBeHidden();

  expect(await page.locator(".grid-stack-item").count()).toBe(0);
});
