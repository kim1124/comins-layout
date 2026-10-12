import { expect, test } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import {
  growsMonotonicallyBeyondTolerance,
  selectSteadyStateWindow,
  shouldCollectMoreSteadyStateSamples,
  staysWithinFinalHeapGrowth,
  staysWithinHeapPeak,
  type HeapCounter,
} from "./resource-stability";
import { openDashboardFixture } from "./framework-fixtures";

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

async function dragWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  await waitForWidgetGridEngine(widget);
  await widget.scrollIntoViewIfNeeded();
  const box = await widget.locator(".comins-grid-layout-widget__header").boundingBox();
  if (!box) {
    throw new Error("Widget bounding box is not available");
  }

  // The leading header padding remains draggable even when a narrow widget's
  // action buttons consume most of its title width. Never start on an action.
  const start = { x: box.x + 4, y: box.y + box.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + deltaX, start.y + deltaY, { steps: 12 });
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
  const handleBox = await handle.boundingBox();
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
  await page.mouse.up();
}

export async function verifyDashboardResourceStability(page: Page, testInfo: TestInfo, framework: "react" | "vue") {
  test.setTimeout(120_000);

  const diagnostics = collectBrowserDiagnostics(page);
  await openDashboardFixture(page, framework);
  // Vue's development runtime buffers component instances for late DevTools
  // injection for three seconds. Observe its release before replacing the
  // initial widgets; otherwise the first baseline counts already-unmounted DOM.
  // This is read-only and a no-op for React/production; all measured budgets
  // and the two column warm-up cycles below remain identical.
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { __VUE_DEVTOOLS_HOOK_REPLAY__?: unknown }).__VUE_DEVTOOLS_HOOK_REPLAY__ == null,
  )).toBe(true);

  const grid = page.getByTestId("dashboard-grid");
  const layoutJson = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
  await layoutJson.fill(JSON.stringify(createStressSnapshot()));
  await page.getByRole("button", { name: "전체 상태 복원" }).click();

  await expect(page.getByText("위젯 100개")).toBeVisible();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(grid.locator(".grid-stack-item")).toHaveCount(100);

  const columnSelect = page.getByLabel("컬럼 선택");
  let columnRoundTripInsertedItems = 0;
  const reorderProbe = await grid.evaluateHandle((element) => {
    let insertedItems = 0;
    const count = (records: MutationRecord[]) => {
      insertedItems += records.reduce((total, record) => total + record.addedNodes.length, 0);
    };
    const observer = new MutationObserver(count);
    observer.observe(element, { childList: true });
    return {
      finish() {
        count(observer.takeRecords());
        observer.disconnect();
        return insertedItems;
      },
    };
  });
  try {
    await columnSelect.selectOption("6");
    await expect(grid).toHaveAttribute("data-columns", "6");
    await columnSelect.selectOption("12");
    await expect(grid).toHaveAttribute("data-columns", "12");
    await waitForPageToSettle(page);
    columnRoundTripInsertedItems = await reorderProbe.evaluate((probe) => probe.finish());
    // Each transition may reorder once for the engine column change and once
    // for the complete controlled snapshot, rather than once per widget.
    expect(columnRoundTripInsertedItems).toBeLessThanOrEqual(100 * 2 * 2);
  } finally {
    await reorderProbe.evaluate((probe) => probe.finish());
    await reorderProbe.dispose();
  }
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
    columnRoundTripInsertedItems,
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
}
