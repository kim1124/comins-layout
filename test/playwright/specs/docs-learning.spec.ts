import { expect, test } from "@playwright/test";
import { liveExamples } from "../../../example/src/docs/live-examples";

test("combined examples fit narrow screens and preserve old responsive links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  for (const route of ["column", "breakpoints", "none"]) {
    await page.goto(`/examples/advanced/responsive/${route}`);
    await expect(page).toHaveURL(/\/examples\/advanced\/responsive$/);
    await expect(page.getByRole("heading", { name: "반응형", exact: true })).toBeVisible();
    await expect(page.locator('.playground-sidebar__submenu-link[href*="responsive"]')).toHaveCount(1);
    await expect(page.locator('[aria-busy="false"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await page.goto("/examples/advanced/lazy-load");
  await expect(page.getByLabel("콘텐츠 렌더링 수")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator(".comins-grid-layout-widget__actions")).toHaveCount(0);
});

test("responsive controls independently select column calculation and layout policy", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/examples/advanced/responsive");
  const grid = page.locator(".responsive-demo-container .grid-stack");
  await page.getByLabel("컬럼 결정 방식").selectOption("breakpoints");
  await page.getByLabel("컨테이너 너비", { exact: true }).fill("600");
  await expect(grid).toHaveAttribute("data-columns", "2");
  await page.getByLabel("컬럼 결정 방식").selectOption("columnWidth");
  await expect(grid).toHaveAttribute("data-columns", "3");
  await expect(grid.locator('[data-widget-id="widget-1"]')).toHaveAttribute("data-layout-w", "1");
  await page.getByLabel("배치 정책").selectOption("none");
  await expect(grid).toHaveAttribute("data-columns", "3");
  await expect(grid.locator('[data-widget-id="widget-1"]')).toHaveAttribute("data-layout-w", "3");
  await expect(page.getByLabel("실제 컨테이너 너비")).toHaveText("600px");
  await page.getByLabel("컨테이너 너비", { exact: true }).fill("1080");
  await expect(grid).toHaveAttribute("data-columns", "6");
  await page.getByRole("button", { name: "반응형 설정 적용", exact: true }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
});

test("lazy example reports actual mounts and can restart the first-entry experiment", async ({ page }) => {
  await page.goto("/examples/advanced/lazy-load");
  const boundaries = page.locator('[data-lazy-rendered="true"]');
  const count = page.getByLabel("콘텐츠 렌더링 수");
  await expect.poll(() => boundaries.count()).toBeGreaterThan(0);
  const initial = await boundaries.count();
  expect(initial).toBeLessThan(10);
  await expect(count).toHaveText(`${initial} / 10`);
  await page.locator('[data-widget-id="widget-10"]').scrollIntoViewIfNeeded();
  await expect(count).toHaveText("10 / 10");
  await page.getByRole("button", { name: "다시 실험", exact: true }).click();
  await expect(count).toHaveText(`${initial} / 10`);
  await page.getByRole("button", { name: "지연 렌더링 켜짐", exact: true }).click();
  await expect(count).toHaveText("10 / 10");
  await page.getByRole("button", { name: "지연 렌더링 꺼짐", exact: true }).click();
  await expect(count).toHaveText("10 / 10");
});

test("trash drop target spans its container and reset sits at the live example heading edge", async ({ page }) => {
  await page.goto("/examples/advanced/external-drop-trash");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const target = page.getByTestId("playground-external-drop-trash");
    const controls = page.getByRole("region", { name: "휴지통 삭제 컨트롤" });
    const targetBox = await target.boundingBox();
    const controlsBox = await controls.boundingBox();
    expect(targetBox).not.toBeNull();
    expect(controlsBox).not.toBeNull();
    expect(Math.abs(targetBox!.width - controlsBox!.width)).toBeLessThanOrEqual(2);
    const header = page.locator(".playground-example-stage--grid > header");
    const reset = header.getByRole("button", { name: "초기화", exact: true });
    await expect(reset).toBeVisible();
    const headerBox = await header.boundingBox();
    const resetBox = await reset.boundingBox();
    expect(Math.abs(resetBox!.x + resetBox!.width - (headerBox!.x + headerBox!.width))).toBeLessThanOrEqual(2);
    await reset.click();
    await expect(page.locator(".grid-stack-item")).toHaveCount(4);
  }
});

test("content-sized widgets keep the resize handle on the painted card @firefox-parity", async ({ page }) => {
  await page.goto("/examples/advanced/size-to-content");
  const widget = page.locator(".grid-stack-item").first();
  await widget.scrollIntoViewIfNeeded();
  await widget.hover();
  await expect(widget.locator(".ui-resizable-se")).toBeVisible();
  const gap = await widget.evaluate((element) => {
    const area = element.querySelector<HTMLElement>(".grid-stack-item-content")!;
    const shell = element.querySelector<HTMLElement>(".comins-grid-layout-widget")!;
    const card = getComputedStyle(area).backgroundColor === "rgba(0, 0, 0, 0)" ? shell : area;
    const handle = element.querySelector(".ui-resizable-se")!.getBoundingClientRect();
    return Math.abs(card.getBoundingClientRect().bottom - (handle.top + handle.height / 2));
  });
  expect(gap).toBeLessThanOrEqual(12);
});

test("content example grows and shrinks React and engine heights without hiding manual resizing", async ({ page }) => {
  await page.goto("/examples/advanced/size-to-content");
  const widget = page.locator(".grid-stack-item").first();
  await expect.poll(() => widget.evaluate(element => element.getAttribute("gs-h") === element.getAttribute("data-layout-h"))).toBe(true);
  const initial = Number(await widget.getAttribute("data-layout-h"));
  for (let index = 0; index < 5; index++) await page.getByRole("button", { name: "내용 추가", exact: true }).click();
  await expect.poll(async () => Number(await widget.getAttribute("data-layout-h"))).toBeGreaterThan(initial);
  await expect.poll(() => widget.evaluate(element => element.getAttribute("gs-h") === element.getAttribute("data-layout-h"))).toBe(true);
  for (let index = 0; index < 5; index++) await page.getByRole("button", { name: "내용 삭제", exact: true }).click();
  await expect(widget).toHaveAttribute("data-layout-h", String(initial));
  await expect(widget).toHaveAttribute("gs-h", String(initial));
  await page.getByRole("button", { name: "Size To Content 켜짐", exact: true }).click();
  for (let index = 0; index < 5; index++) await page.getByRole("button", { name: "내용 추가", exact: true }).click();
  await expect(widget).toHaveAttribute("data-layout-h", String(initial));
  await widget.hover();
  await expect(widget.locator(".ui-resizable-se")).toBeVisible();
});

test("content sizing settles without a repeated React refresh loop", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error" && errors.length < 10) errors.push(message.text()); });
  page.on("pageerror", error => { if (errors.length < 10) errors.push(error.message); });
  await page.goto("/examples/advanced/size-to-content");
  await page.getByRole("button", { name: "내용 추가", exact: true }).click();
  // Observe a bounded quiet period: a frame-by-frame refresh can pass immediate geometry checks.
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("API entries run the same examples inline and unmount the previous preview", async ({ page }) => {
  await page.goto("/api");
  await page.evaluate(() => localStorage.setItem("comins-grid-layout-playground-locale", "en"));
  await expect(page.locator("iframe")).toHaveCount(0);
  const rendering = page.locator("#api-dashboard-rendering");
  await rendering.getByRole("button", { name: "Size To Content 실행", exact: true }).first().click();
  const preview = page.frameLocator('iframe[title="Size To Content 실행 예제"]');
  await expect(preview.getByRole("button", { name: "내용 추가", exact: true })).toBeVisible();
  await preview.getByRole("button", { name: "내용 추가", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("항목 3개");
  await expect(preview.getByRole("navigation", { name: "예제 메뉴" })).toHaveCount(0);
  await rendering.getByText("상세 API 보기", { exact: true }).click();
  const staticEntry = rendering.locator(".docs-reference-list__item").filter({ has: page.locator("dt", { hasText: "engineOptions.staticGrid" }) });
  await staticEntry.getByRole("button", { name: "레이아웃 잠금 / 정적 모드 실행", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator('iframe[title="Size To Content 실행 예제"]')).toHaveCount(0);
  const lock = page.frameLocator('iframe[title="레이아웃 잠금 / 정적 모드 실행 예제"]');
  await expect(lock.getByRole("combobox", { name: "잠금 방식" })).toBeVisible();
  await page.getByRole("button", { name: "실행 예제 닫기", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("comins-grid-layout-playground-locale"))).toBe("en");
});

test("every API example renders without the nested navigation or browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const path of new Set(Object.values(liveExamples).map(example => example.path))) {
    await page.goto(`${path}?embed=1`);
    await expect(page.locator(".playground-embed")).toBeVisible();
    await expect(page.locator(".grid-stack").first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "예제 메뉴" })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("legacy static route opens the combined lock example and both modes block dragging", async ({ page }) => {
  await page.goto("/examples/advanced/static");
  await expect(page).toHaveURL(/\/examples\/layout\/lock$/);
  const widget = page.locator(".grid-stack-item").first();
  for (const mode of ["interaction", "static"]) {
    await page.getByRole("combobox", { name: "잠금 방식" }).selectOption(mode);
    const lock = page.getByRole("button", { name: "레이아웃 잠금", exact: true });
    if (await lock.count()) await lock.click();
    await expect(widget).toHaveClass(/ui-draggable-disabled/);
    await expect(widget).toHaveClass(/ui-resizable-disabled/);
    await expect(widget.getByRole("row", { name: "이동 불가", exact: true })).toBeVisible();
    await expect(widget.getByRole("row", { name: "리사이즈 불가", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Title 1 삭제", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "레이아웃 해제", exact: true }).click();
    await expect(widget).not.toHaveClass(/ui-draggable-disabled/);
  }
});

test("basic widget example demonstrates maximize minimize and restore through public commands", async ({ page }) => {
  await page.goto("/examples/widget/basic");
  const first = page.getByTestId("dashboard-widget-widget-1");
  await page.getByRole("button", { name: "선택 위젯 최대화", exact: true }).click();
  await expect(first).toHaveAttribute("data-maximized", "true");
  await expect(first).toHaveAttribute("data-layout-w", "12");
  await page.getByRole("button", { name: "선택 위젯 복원", exact: true }).click();
  await expect(first).toHaveAttribute("data-layout-w", "3");
  await page.getByRole("button", { name: "선택 위젯 최소화", exact: true }).click();
  await expect(first).toHaveAttribute("data-minimized", "true");
  await page.getByRole("button", { name: "선택 위젯 복원", exact: true }).click();
  await expect(first).toHaveAttribute("data-layout-h", "2");
});
