import { expect, test, type Browser } from "@playwright/test";

import { readDashboardGeometry } from "../helpers/dashboard-interactions";
import { initializePlaygroundLocale, PLAYGROUND_LOCALE_STORAGE_KEY } from "../helpers/playground-locale";

test("switches the docs shell and locale search without changing the route", async ({ page }) => {
  await page.goto("/docs/getting-started");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/docs\/getting-started$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("searchbox", { name: "Search all docs" })).toBeVisible();
  await expect(page.getByRole("article").getByRole("heading", { name: "Getting started" })).toBeVisible();
});

test("localizes the external drop route without remounting or losing its canonical path", async ({ page }) => {
  await page.goto("/examples/advanced/external-drop");
  await page.getByTestId("dashboard-grid").evaluate((element) => {
    element.setAttribute("data-mount-probe", "external-drop-locale");
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/advanced\/external-drop$/);
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-mount-probe", "external-drop-locale");
  await expect(page.getByRole("heading", { name: "External drop" }).first()).toBeVisible();
  await expect(page.getByText("Dropping outside the target does not emit the callback, so the widget remains in controlled state.", { exact: true })).toBeVisible();
});

test("persists an English locale chosen from the default Korean UI across reload", async ({ page }) => {
  await page.goto("/docs/getting-started");
  const localeToggle = page.getByTestId("playground-locale-toggle");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(localeToggle.getByRole("button", { name: "한" })).toHaveAttribute("aria-pressed", "true");

  await localeToggle.getByRole("button", { name: "EN" }).click();
  await expect.poll(
    () => page.evaluate((key) => window.localStorage.getItem(key), PLAYGROUND_LOCALE_STORAGE_KEY),
  ).toBe("en");

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(localeToggle.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
  await expect(localeToggle.getByRole("button", { name: "한" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("article").getByRole("heading", { name: "Getting started" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search all docs" })).toBeVisible();
});

test("falls back to Korean when stored locale is invalid", async ({ page }) => {
  await page.addInitScript((key) => window.localStorage.setItem(key, "unsupported"), PLAYGROUND_LOCALE_STORAGE_KEY);
  await page.goto("/docs/getting-started");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("article").getByRole("heading", { name: "시작하기" })).toBeVisible();
});

test("keeps the default Korean locale when locale storage reads throw", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("storage read blocked");
    };
  });
  await page.goto("/docs/getting-started");

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("searchbox", { name: "전체 문서 검색" })).toBeVisible();
});

test("keeps the in-memory locale when locale storage writes throw", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");
  await page.goto("/docs/getting-started");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("storage write blocked");
    };
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("article").getByRole("heading", { name: "시작하기" })).toBeVisible();
});

test("places the locale toggle immediately left of search", async ({ page }) => {
  await page.goto("/docs/getting-started");

  await expect(page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }))
    .toHaveAttribute("aria-pressed", "true");
  const locale = await page.getByTestId("playground-locale-toggle").boundingBox();
  const search = await page.getByRole("searchbox", { name: "전체 문서 검색" }).boundingBox();
  expect(locale).not.toBeNull();
  expect(search).not.toBeNull();
  expect(locale!.x + locale!.width).toBeLessThanOrEqual(search!.x);
});

test("keeps locale and search controls within a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 800 });
  await page.goto("/docs/getting-started");

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(300);

  const controls = await page.locator(".docs-topnav__controls").boundingBox();
  const search = await page.locator(".global-docs-search").boundingBox();
  expect(controls).not.toBeNull();
  expect(search).not.toBeNull();
  expect(search!.x).toBeGreaterThanOrEqual(controls!.x);
  expect(search!.x + search!.width).toBeLessThanOrEqual(controls!.x + controls!.width);
});

test("searches resolved docs copy for each locale", async ({ page }) => {
  await page.goto("/docs/getting-started");

  await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("직렬화");
  await expect(page.getByRole("option", { name: /Layout 저장 \/ 복원/ }).first()).toBeVisible();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  const englishSearch = page.getByRole("searchbox", { name: "Search all docs" });
  await expect(englishSearch).toHaveValue("");
  await expect(page.getByRole("listbox", { name: "All docs search results" })).toHaveCount(0);

  await englishSearch.fill("직렬화");
  const oppositeLanguageResults = page.getByRole("listbox", { name: "All docs search results" });
  await expect(oppositeLanguageResults).toBeVisible();
  await expect(oppositeLanguageResults.getByRole("option")).toHaveCount(0);
  await expect(oppositeLanguageResults).toContainText("No results found.");

  await englishSearch.fill("serialization");
  await expect(page.getByRole("option", { name: /Save and restore layout/ }).first()).toBeVisible();
});

test("uses code notation without Korean connectors in the English API", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");
  await page.goto("/api");

  const apiReference = page.locator(".docs-reference-list");
  await expect(apiReference).not.toContainText("또는");
  await expect(apiReference).not.toContainText("와");
  await expect(apiReference).toContainText("widget | widget id");
  await expect(apiReference).toContainText("void | DashboardColumnCount");
  await expect(apiReference).toContainText("renderWidgetActions");
  await expect(apiReference).toContainText("Overrides the default actions; showControls=false hides all actions, including custom actions.");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await expect(apiReference).toContainText("기본 action을 대체하며 showControls=false이면 custom action을 포함한 모든 action을 숨깁니다.");
});

test("preserves the docs example DOM node while locale copy changes", async ({ page }) => {
  const exampleId = "/docs/getting-started-example-1";
  await page.goto("/docs/getting-started");

  const originalExample = await page.locator(`[id="${exampleId}"]`).elementHandle();
  expect(originalExample).not.toBeNull();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.locator(`[id="${exampleId}"]`)).toContainText("Basic dashboard setup");
  expect(await originalExample!.evaluate((node, id) => node === document.getElementById(id), exampleId)).toBe(true);
});

async function getReadmeDemoOutput(browser: Browser, baseURL: string, locale: "en" | "ko") {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await initializePlaygroundLocale(page, locale);
  await page.goto("/readme-demo");

  await expect(page.getByRole("heading", { name: "Interactive dashboards for React" })).toBeVisible();
  const output = await page.locator(".readme-demo").innerText();
  await context.close();

  return output;
}

test("leaves the readme demo output unchanged for Korean and English storage", async ({ browser }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  expect(typeof baseURL).toBe("string");

  const koreanOutput = await getReadmeDemoOutput(browser, baseURL as string, "ko");
  const englishOutput = await getReadmeDemoOutput(browser, baseURL as string, "en");

  expect(englishOutput).toBe(koreanOutput);
});

test("resolves shared Widget controls, validation, and fixture presentation immediately", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("button", { name: "위젯 추가" }).click();

  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").fill("");
  await dialog.getByLabel("값").fill("");
  await dialog.getByRole("button", { name: "위젯 저장" }).click();
  await expect(dialog.getByText("위젯명을 입력해 주세요.")).toBeVisible();
  await expect(dialog.getByText("값을 입력해 주세요.")).toBeVisible();

  await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.getByRole("button", { name: "Add widget" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-widget-2")).toContainText("Widget 2");
  await expect(page.getByTestId("dashboard-widget-widget-2")).toContainText("Widget 2 content");
  await expect(page.getByTestId("dashboard-widget-widget-2").getByRole("button", { name: "Widget 2 Edit" })).toBeVisible();
  const localizedDialog = page.getByRole("dialog", { name: "Add widget" });
  await expect(localizedDialog).toBeVisible();
  await expect(page.getByLabel("Widget name")).toHaveAttribute("aria-invalid", "true");
  await expect(localizedDialog.getByText("Enter a widget name.")).toBeVisible();
  await expect(localizedDialog.getByText("Enter a value.")).toBeVisible();
  await expect(localizedDialog.getByRole("button", { name: "Save widget" })).toBeVisible();
  await expect(localizedDialog.getByRole("button", { name: "Close dialog" }).last()).toBeVisible();
});

test("moves initial focus into the dialog and keeps the backdrop out of the tab order", async ({ page }) => {
  await page.goto("/examples/widget");
  const opener = page.getByRole("button", { name: "위젯 추가" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  const koreanLocale = dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "KO" });
  await expect(koreanLocale).toBeFocused();
  await expect(page.locator(".example-dialog__backdrop")).toHaveAttribute("tabindex", "-1");
});

test("contains forward and reverse Tab navigation within the dialog", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("button", { name: "위젯 추가" }).click();

  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  const koreanLocale = dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "KO" });
  const saveButton = dialog.getByRole("button", { name: "위젯 저장" });
  await koreanLocale.focus();

  await page.keyboard.press("Shift+Tab");
  await expect(saveButton).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(koreanLocale).toBeFocused();
});

test("closes the dialog with Escape and restores focus to its opener", async ({ page }) => {
  await page.goto("/examples/widget");
  const opener = page.getByRole("button", { name: "위젯 추가" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").focus();
  await page.keyboard.press("Escape");

  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("closes from a backdrop coordinate without activating covered page controls", async ({ page }) => {
  await page.goto("/examples/widget");
  const opener = page.getByRole("button", { name: "위젯 추가" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  const search = page.getByRole("searchbox", { name: "전체 문서 검색" });
  const searchBox = await search.boundingBox();
  expect(searchBox).not.toBeNull();
  const point = {
    x: searchBox!.x + searchBox!.width / 2,
    y: searchBox!.y + searchBox!.height / 2,
  };
  expect(await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.classList.contains("example-dialog__backdrop") ?? false,
    point,
  )).toBe(true);

  await page.mouse.click(point.x, point.y);

  await expect(dialog).toHaveCount(0);
  await expect(search).toHaveValue("");
  await expect(opener).toBeFocused();
});

test("keeps Widget selection, geometry, and dialog draft across locale changes", async ({ page }) => {
  await page.goto("/examples/widget");
  const selectedBody = page.getByTestId("dashboard-widget-widget-2").locator(".dashboard-widget-body");
  await selectedBody.click();
  const before = await page.getByTestId("dashboard-widget-widget-2").getAttribute("data-layout-x");
  await page.getByRole("button", { name: "위젯 추가" }).click();
  await page.getByLabel("위젯명").fill("사용자 지표");
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByRole("dialog", { name: "위젯 추가" }).getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/widget$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.getByRole("dialog", { name: "Add widget" })).toBeVisible();
  await expect(page.getByLabel("Widget name")).toHaveValue("사용자 지표");
  await expect(selectedBody).toHaveAttribute("data-selected", "true");
  await expect(page.getByTestId("dashboard-widget-widget-2")).toHaveAttribute("data-layout-x", before ?? "");
});

test("localizes Widget controls without changing selected, locked, or geometric state", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-2");
  const geometryBeforeLocaleChange = await Promise.all([
    widget.getAttribute("data-layout-x"),
    widget.getAttribute("data-layout-y"),
    widget.getAttribute("data-layout-w"),
    widget.getAttribute("data-layout-h"),
  ]);

  await widget.locator(".dashboard-widget-body").click();
  await widget.getByRole("button", { name: "위젯 2 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 트래픽");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await page.getByRole("button", { name: "이동 잠금" }).click();
  await expect(page.getByRole("button", { name: "이동 잠금 해제" })).toHaveAttribute("aria-pressed", "true");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.locator(".playground-header").getByText("Widget example", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Widget", exact: true })).toBeVisible();
  await expect(page.getByText("Add, edit, and delete widgets, then verify individual movement and resize locks.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Widget example controls");
  await expect(page.locator(".example-interaction-actions")).toHaveAttribute("aria-label", "Widget interaction actions");
  await expect(page.getByRole("button", { name: "Unlock movement" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Lock resizing" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Lock all" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Widget dashboard");
  await expect(widget.locator(".dashboard-widget-body")).toHaveAttribute("data-selected", "true");
  await expect(widget).toContainText("사용자 트래픽");
  await expect(widget).toContainText("사용자 값");
  await expect(widget).toHaveAttribute("data-layout-x", geometryBeforeLocaleChange[0] ?? "");
  await expect(widget).toHaveAttribute("data-layout-y", geometryBeforeLocaleChange[1] ?? "");
  await expect(widget).toHaveAttribute("data-layout-w", geometryBeforeLocaleChange[2] ?? "");
  await expect(widget).toHaveAttribute("data-layout-h", geometryBeforeLocaleChange[3] ?? "");
  await expect(page.locator('[data-example-mode="widget"]')).toHaveCount(1);
});

test("keeps prefix-like user Widget titles literal in Korean and English", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-2");
  await widget.getByRole("button", { name: "위젯 2 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("fixture:sales");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await expect(widget).toContainText("fixture:sales");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(widget).toContainText("fixture:sales");
  await expect(widget).toContainText("사용자 값");
});

test("keeps prototype-like user Widget titles literal without throwing", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("button", { name: "위젯 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").fill("fixture:__proto__");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "위젯 저장" }).click();

  await expect(page.getByTestId("dashboard-widget-widget-4")).toContainText("fixture:__proto__");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(page.getByTestId("dashboard-widget-widget-4")).toContainText("fixture:__proto__");
  await expect(page.getByTestId("dashboard-widget-widget-4")).toContainText("사용자 값");
});

test("localizes generated Widget descriptions without translating user title or value", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("button", { name: "위젯 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").fill("사용자 생성 위젯");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "위젯 저장" }).click();

  const added = page.getByTestId("dashboard-widget-widget-4");
  await expect(added).toContainText("새 대시보드 위젯");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(added).toContainText("New dashboard widget");
  await expect(added).toContainText("사용자 생성 위젯");
  await expect(added).toContainText("사용자 값");
});

test("localizes an edited indexed Widget description while keeping user values literal", async ({ page }) => {
  await page.goto("/examples/widget");
  const widget = page.getByTestId("dashboard-widget-widget-2");
  await widget.getByRole("button", { name: "위젯 2 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 수정 위젯");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await expect(widget).toContainText("수정된 대시보드 위젯");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(widget).toContainText("Updated dashboard widget");
  await expect(widget).toContainText("사용자 수정 위젯");
  await expect(widget).toContainText("사용자 값");
});

test("keeps an edit draft and semantic validation error while the dialog changes locale", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByTestId("dashboard-widget-widget-2").getByRole("button", { name: "위젯 2 수정" }).click();

  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 초안 트래픽");
  await dialog.getByLabel("값").fill("");
  await dialog.getByRole("button", { name: "변경 저장" }).click();
  await expect(dialog.getByText("값을 입력해 주세요.")).toBeVisible();

  const searchBox = await page.getByRole("searchbox", { name: "전체 문서 검색" }).boundingBox();
  expect(searchBox).not.toBeNull();
  expect(await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.classList.contains("example-dialog__backdrop") ?? false,
    { x: searchBox!.x + searchBox!.width / 2, y: searchBox!.y + searchBox!.height / 2 },
  )).toBe(true);
  await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();

  const localizedDialog = page.getByRole("dialog", { name: "Edit widget" });
  await expect(localizedDialog.getByLabel("Widget name")).toHaveValue("사용자 초안 트래픽");
  await expect(localizedDialog.getByLabel("Value")).toHaveValue("");
  await expect(localizedDialog.getByText("Enter a value.")).toBeVisible();

  await localizedDialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "KO" }).click();
  await expect(page.getByRole("dialog", { name: "위젯 수정" }).getByLabel("위젯명")).toHaveValue("사용자 초안 트래픽");
  await expect(page.getByRole("dialog", { name: "위젯 수정" }).getByText("값을 입력해 주세요.")).toBeVisible();
});

test("resolves Advanced fixture presentation without changing its widget geometry", async ({ page }) => {
  await page.goto("/examples/advanced");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const beforeX = await traffic.getAttribute("data-layout-x");
  const beforeY = await traffic.getAttribute("data-layout-y");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(traffic).toContainText("Traffic");
  await expect(traffic).toContainText("Active sessions");
  await expect(traffic).toHaveAttribute("data-layout-x", beforeX ?? "");
  await expect(traffic).toHaveAttribute("data-layout-y", beforeY ?? "");
});

test("uses indexed fixture presentation until an edited Widget has user-owned data", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  const widget = page.getByTestId("dashboard-widget-widget-2");
  await expect(widget).toContainText("Widget 2");

  await widget.getByRole("button", { name: "Widget 2 Edit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit widget" });
  await dialog.getByLabel("Widget name").fill("사용자 트래픽");
  await dialog.getByLabel("Value").fill("사용자 값");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(widget).toContainText("사용자 트래픽");
  await expect(widget).toContainText("사용자 값");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(widget).toContainText("사용자 트래픽");
  await expect(widget).toContainText("사용자 값");
});


test("localizes shared fallback CRUD generated add copy in Layout", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");

  for (const fixture of [
    { addedId: "widget-7", defaultTitle: "Widget 7", route: "/examples/layout" },
  ] as const) {
    await page.goto(fixture.route);
    await page.getByRole("button", { name: "Add widget" }).click();

    let dialog = page.getByRole("dialog", { name: "Add widget" });
    await expect(dialog.getByLabel("Widget name")).toHaveValue(fixture.defaultTitle);
    await dialog.getByLabel("Widget name").fill("사용자 생성 제목");
    await dialog.getByLabel("Value").fill("사용자 생성 값");
    await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "KO" }).click();

    dialog = page.getByRole("dialog", { name: "위젯 추가" });
    await expect(dialog.getByLabel("위젯명")).toHaveValue("사용자 생성 제목");
    await expect(dialog.getByLabel("값")).toHaveValue("사용자 생성 값");
    await dialog.getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();

    dialog = page.getByRole("dialog", { name: "Add widget" });
    await dialog.getByRole("button", { name: "Save widget" }).click();
    const added = page.getByTestId(`dashboard-widget-${fixture.addedId}`);
    await expect(added).toContainText("New dashboard widget");
    await expect(added).toContainText("사용자 생성 제목");
    await expect(added).toContainText("사용자 생성 값");

    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
    await expect(added).toContainText("새 대시보드 위젯");
    await expect(added).toContainText("사용자 생성 제목");
    await expect(added).toContainText("사용자 생성 값");
    await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  }
});

test("localizes the Layout toolbar without remounting its grid", async ({ page }) => {
  await page.goto("/examples/layout");
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/layout$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.locator(".playground-header").getByText("Layout example", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
  await expect(page.getByText("Save and restore a layout, then compare auto arrange and fill space.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Layout example controls");
  for (const name of ["Add widget", "Clear all", "Save layout", "Restore layout", "Auto arrange", "Fill space", "Reset"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Select columns" })).toHaveCount(0);
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Layout dashboard");
  await expect(page.getByTestId("dashboard-widget-sales").getByRole("button", { name: "Sales remove" })).toBeVisible();
});

test("localizes the dynamic column route without resetting its live state", async ({ page }) => {
  await page.goto("/examples/layout/columns");
  const columns = page.getByRole("combobox", { name: "레이아웃 컬럼" });
  await columns.selectOption("6");
  await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", "6");
  const sixColumnGeometry = await readDashboardGeometry(page);
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/layout\/columns$/);
  await expect(page.getByRole("combobox", { name: "Layout columns" })).toHaveValue("6");
  await expect(page.getByRole("navigation", { name: "Docs menu" }).getByRole("link", { name: "Dynamic columns" }))
    .toHaveAttribute("aria-current", "page");
  expect(await readDashboardGeometry(page)).toEqual(sixColumnGeometry);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
});

test("localizes Advanced engine controls without resetting engine state", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1100 });
  await page.goto("/examples/advanced");

  await page.getByRole("button", { name: "반응형 컬럼 사용" }).click();
  await page.getByRole("button", { name: "Float 사용" }).click();
  await page.getByRole("button", { name: "정적 모드 사용" }).click();
  await page.getByRole("combobox", { name: "셀 높이" }).selectOption("80");
  await page.getByRole("combobox", { name: "여백" }).selectOption("12");
  await page.getByRole("combobox", { name: "행 제한" }).selectOption("two-eight");
  await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", "6");
  await expect(page.locator(".grid-stack")).toHaveClass(/grid-stack-static/);
  const trafficGeometry = await page.getByTestId("dashboard-widget-traffic").evaluate((element) => ({
    h: element.getAttribute("data-layout-h"),
    w: element.getAttribute("data-layout-w"),
    x: element.getAttribute("data-layout-x"),
    y: element.getAttribute("data-layout-y"),
  }));
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/advanced$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.locator(".playground-header").getByText("Responsive and engine options", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Advanced example" })).toBeVisible();
  await expect(page.getByText("Verify responsive columns and the real behavior of supported GridStack engine options.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Advanced example controls");
  await expect(page.getByText("Columns change automatically with the viewport width.")).toBeVisible();
  await expect(page.getByText("Change GridStack layout, rendering, and interaction options.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Disable responsive columns" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Disable float" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Disable static mode" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Cell height" })).toHaveValue("80");
  await expect(page.getByRole("combobox", { name: "Margin" })).toHaveValue("12");
  await expect(page.getByRole("combobox", { name: "Row limit" })).toHaveValue("two-eight");
  await expect(page.getByText("4 widgets", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Advanced example dashboard");
  await expect(page.getByRole("textbox", { name: /JSON/ })).toHaveCount(0);
  await expect(page.locator("[data-dashboard-drop-target]")).toHaveCount(0);
  await expect(page.locator(".grid-stack")).toHaveAttribute("data-columns", "6");
  await expect(page.locator(".grid-stack")).toHaveClass(/grid-stack-static/);
  expect(await page.getByTestId("dashboard-widget-traffic").evaluate((element) => ({
    h: element.getAttribute("data-layout-h"),
    w: element.getAttribute("data-layout-w"),
    x: element.getAttribute("data-layout-x"),
    y: element.getAttribute("data-layout-y"),
  }))).toEqual(trafficGeometry);
});

test("localizes the Advanced state route without replacing editor text, saved state, or user literals", async ({ page }) => {
  await page.goto("/examples/advanced/state");
  await page.getByText("전체 상태 및 컬럼 캐시 JSON 편집기").click();
  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const editor = page.getByLabel("전체 상태 및 컬럼 캐시 JSON");
  const state = JSON.parse(await editor.inputValue()) as {
    widgets: Array<{ data?: { fixtureCopyKey?: string }; id: string; title?: string }>;
  };
  const sales = state.widgets.find((widget) => widget.id === "sales");
  expect(sales).toBeDefined();
  if (!sales) throw new Error("Expected sales fixture widget");
  sales.title = "사용자 보존 제목";
  if (sales.data) delete sales.data.fixtureCopyKey;
  const userState = JSON.stringify(state, null, 2);
  await editor.fill(userState);
  await page.getByTestId("dashboard-grid").evaluate((element) => {
    element.setAttribute("data-mount-probe", "state-locale");
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/advanced\/state$/);
  await expect(page.getByLabel("Full state and column cache JSON")).toHaveValue(userState);
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-mount-probe", "state-locale");
  await page.getByRole("button", { name: "Restore full state" }).click();
  await expect(page.getByRole("status", { name: "Full state save and restore status" })).toHaveText(
    "Restored the full state and column cache.",
  );
  await expect(page.getByTestId("dashboard-widget-sales")).toContainText("사용자 보존 제목");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await expect(page.getByLabel("전체 상태 및 컬럼 캐시 JSON")).toHaveValue(userState);
  await expect(page.getByTestId("dashboard-widget-sales")).toContainText("사용자 보존 제목");
});
