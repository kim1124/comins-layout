import { expect, test, type Browser } from "@playwright/test";

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
  await expect(page.getByRole("combobox", { name: "Select widget" })).toHaveValue("sales");
  await expect(page.getByRole("option", { name: "Traffic" })).toBeAttached();
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("Traffic");
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("Active sessions");
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

test("keeps Widget selection, geometry, dialog draft, and detail state across locale changes", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  const before = await page.getByTestId("dashboard-widget-traffic").getAttribute("data-layout-x");
  await page.locator("summary", { hasText: "현재 위젯 상태" }).click();
  await page.getByRole("button", { name: "위젯 추가" }).click();
  await page.getByLabel("위젯명").fill("사용자 지표");
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByRole("dialog", { name: "위젯 추가" }).getByTestId("dialog-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page).toHaveURL(/\/examples\/widget$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.getByRole("combobox", { name: "Select widget" })).toHaveValue("traffic");
  await expect(page.getByRole("dialog", { name: "Add widget" })).toBeVisible();
  await expect(page.getByLabel("Widget name")).toHaveValue("사용자 지표");
  await expect(page.locator("details.example-state-output")).toHaveAttribute("open", "");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", before ?? "");
});

test("renders Widget status semantically in English without changing selected, locked, or serialized state", async ({ page }) => {
  await page.goto("/examples/widget");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const geometryBeforeLocaleChange = await Promise.all([
    traffic.getAttribute("data-layout-x"),
    traffic.getAttribute("data-layout-y"),
    traffic.getAttribute("data-layout-w"),
    traffic.getAttribute("data-layout-h"),
  ]);

  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  await page.getByRole("button", { name: "선택 위젯 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 트래픽");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await page.getByRole("button", { name: "이동 잠금" }).click();
  await expect(page.getByRole("button", { name: "이동 잠금" })).toHaveAttribute("aria-pressed", "true");
  const serializedBeforeLocaleChange = await page.getByLabel("현재 위젯 상태 JSON").textContent();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.locator(".playground-header").getByText("Widget example", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Widget", exact: true })).toBeVisible();
  await expect(page.getByText("Add, edit, and delete widgets, then verify individual movement and resize locks.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Widget example controls");
  await expect(page.locator(".example-interaction-actions")).toHaveAttribute("aria-label", "Widget interaction actions");
  await expect(page.getByRole("combobox", { name: "Select widget" })).toHaveValue("traffic");
  await expect(page.getByRole("button", { name: "Lock movement" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Lock resizing" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Lock all" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("status", { name: "Widget action status" })).toHaveText(
    "Locked movement for the selected widget.",
  );
  await expect(page.locator("details.example-state-output").getByText("Current widget state", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Current widget state JSON")).toHaveText(serializedBeforeLocaleChange ?? "");
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Widget dashboard");
  await expect(traffic).toContainText("사용자 트래픽");
  await expect(traffic).toContainText("사용자 값");
  await expect(traffic).toHaveAttribute("data-layout-x", geometryBeforeLocaleChange[0] ?? "");
  await expect(traffic).toHaveAttribute("data-layout-y", geometryBeforeLocaleChange[1] ?? "");
  await expect(traffic).toHaveAttribute("data-layout-w", geometryBeforeLocaleChange[2] ?? "");
  await expect(traffic).toHaveAttribute("data-layout-h", geometryBeforeLocaleChange[3] ?? "");
  await expect(page.locator('[data-example-mode="widget"]')).toHaveCount(1);
});

test("keeps prefix-like user Widget titles literal in Korean and English status text", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  await page.getByRole("button", { name: "선택 위젯 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("fixture:sales");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  await expect(page.getByRole("status", { name: "위젯 작업 상태" })).toHaveText("fixture:sales 위젯을 수정했습니다.");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(page.getByRole("status", { name: "Widget action status" })).toHaveText("Updated the fixture:sales widget.");
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("fixture:sales");
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("사용자 값");
});

test("keeps prototype-like user Widget titles literal without throwing", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("button", { name: "위젯 추가" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 추가" });
  await dialog.getByLabel("위젯명").fill("fixture:__proto__");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "위젯 저장" }).click();

  await expect(page.getByRole("status", { name: "위젯 작업 상태" })).toHaveText("fixture:__proto__ 위젯을 추가했습니다.");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(page.getByRole("status", { name: "Widget action status" })).toHaveText("Added the fixture:__proto__ widget.");
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

test("localizes edited fixture Widget descriptions without retaining fixture presentation metadata", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  await page.getByRole("button", { name: "선택 위젯 수정" }).click();
  const dialog = page.getByRole("dialog", { name: "위젯 수정" });
  await dialog.getByLabel("위젯명").fill("사용자 수정 위젯");
  await dialog.getByLabel("값").fill("사용자 값");
  await dialog.getByRole("button", { name: "변경 저장" }).click();

  const traffic = page.getByTestId("dashboard-widget-traffic");
  await expect(traffic).toContainText("수정된 대시보드 위젯");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(traffic).toContainText("Updated dashboard widget");
  await expect(traffic).toContainText("사용자 수정 위젯");
  await expect(traffic).toContainText("사용자 값");

  const state = JSON.parse((await page.getByLabel("Current widget state JSON").textContent()) ?? "{}") as {
    widgets?: Array<{ data?: Record<string, unknown>; id: string }>;
  };
  expect(state.widgets?.find((widget) => widget.id === "traffic")?.data).toMatchObject({ generatedDescriptionKey: "editedWidget" });
  expect(state.widgets?.find((widget) => widget.id === "traffic")?.data).not.toHaveProperty("fixtureCopyKey");
});

test("keeps an edit draft and semantic validation error while the dialog changes locale", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByRole("combobox", { name: "위젯 선택" }).selectOption("traffic");
  await page.getByRole("button", { name: "선택 위젯 수정" }).click();

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

test("uses fixture presentation until an edited Widget has user-owned data", async ({ page }) => {
  await page.goto("/examples/widget");
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("Traffic");

  await page.getByRole("combobox", { name: "Select widget" }).selectOption("traffic");
  await page.getByRole("button", { name: "Edit selected widget" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit widget" });
  await dialog.getByLabel("Widget name").fill("사용자 트래픽");
  await dialog.getByLabel("Value").fill("사용자 값");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("사용자 트래픽");
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("사용자 값");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("사용자 트래픽");
  await expect(page.getByTestId("dashboard-widget-traffic")).toContainText("사용자 값");
});

test("keeps Layout JSON draft data while its shared labels change locale", async ({ page }) => {
  const draft = '{"columns":12,"widgets":[]}';
  await page.goto("/examples/layout");
  await page.getByLabel("활성 레이아웃 JSON").fill(draft);

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.getByLabel("Active layout JSON")).toHaveValue(draft);
  await expect(page.locator(".example-layout-json").first()).toHaveAttribute("aria-label", "Layout JSON controls");
  await expect(page.getByRole("status", { name: "Active layout save and restore status" })).toBeVisible();
});

test("localizes shared fallback CRUD generated add copy in Layout and Advanced", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");

  for (const fixture of [
    { addedId: "widget-7", defaultTitle: "Widget 7", route: "/examples/layout" },
    { addedId: "widget-5", defaultTitle: "Widget 5", route: "/examples/advanced" },
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

test("localizes shared fallback CRUD fixture edits in Layout", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");
  await page.goto("/examples/layout");
  await page.getByRole("combobox", { name: "Select widget" }).selectOption("traffic");
  await page.getByRole("button", { name: "Edit selected widget" }).click();

  const dialog = page.getByRole("dialog", { name: "Edit widget" });
  await expect(dialog.getByLabel("Widget name")).toHaveValue("Traffic");
  await dialog.getByLabel("Widget name").fill("사용자 수정 제목");
  await dialog.getByLabel("Value").fill("사용자 수정 값");
  await dialog.getByRole("button", { name: "Save changes" }).click();

  const traffic = page.getByTestId("dashboard-widget-traffic");
  await expect(traffic).toContainText("Updated dashboard widget");
  await expect(traffic).toContainText("사용자 수정 제목");
  await expect(traffic).toContainText("사용자 수정 값");

  await page.getByRole("button", { name: "Save full state" }).click();
  const state = JSON.parse(await page.getByLabel("Full state and column cache JSON").inputValue()) as {
    widgets: Array<{ data?: Record<string, unknown>; id: string }>;
  };
  expect(state.widgets.find((widget) => widget.id === "traffic")?.data).toMatchObject({
    generatedDescriptionKey: "editedWidget",
  });
  expect(state.widgets.find((widget) => widget.id === "traffic")?.data).not.toHaveProperty("fixtureCopyKey");

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "한" }).click();
  await expect(traffic).toContainText("수정된 대시보드 위젯");
  await expect(traffic).toContainText("사용자 수정 제목");
  await expect(traffic).toContainText("사용자 수정 값");
});

test("localizes Layout copy and semantic status without resetting layout state", async ({ page }) => {
  const invalidActiveLayout = '{"private-layout":"LAYOUT_DO_NOT_ECHO"';
  await page.goto("/examples/layout");
  await page.getByRole("combobox", { name: "컬럼 선택" }).selectOption("6");

  const activeLayout = {
    columns: 6,
    widgets: [
      { id: "sales", x: 4, y: 0, w: 2, h: 2 },
      { id: "traffic", x: 0, y: 0, w: 4, h: 2 },
      { id: "orders", x: 3, y: 2, w: 3, h: 2 },
      { id: "alerts", x: 0, y: 2, w: 3, h: 2 },
    ],
  };
  await page.getByLabel("활성 레이아웃 JSON").fill(JSON.stringify(activeLayout));
  await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(page.getByRole("status", { name: "레이아웃 작업 상태" })).toHaveText(
    "패키지 순서로 위젯을 자동 정렬했습니다.",
  );

  await page.getByRole("button", { name: "전체 상태 저장" }).click();
  const savedFullState = await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue();
  const savedLayoutsByColumn = (JSON.parse(savedFullState) as { layoutsByColumn: Record<string, unknown> }).layoutsByColumn;
  const savedCacheKeys = Object.keys(savedLayoutsByColumn).sort();
  expect(savedCacheKeys).toEqual(["12", "6"]);
  const geometryBeforeLocaleChange = await page.locator(".grid-stack-item").evaluateAll((elements) =>
    elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("data-widget-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })),
  );

  await page.getByLabel("활성 레이아웃 JSON").fill(invalidActiveLayout);
  await page.getByRole("button", { name: "활성 레이아웃 복원" }).click();
  await expect(page.getByRole("status", { name: "활성 레이아웃 저장 복원 상태" })).toHaveText(
    "JSON 형식 또는 레이아웃 값을 확인해 주세요.",
  );
  await page.evaluate(() => {
    window.__cominsGridLayoutLastUnmount = undefined;
  });

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();

  await expect(page.getByLabel("Full state and column cache JSON")).toHaveValue(savedFullState);
  await page.getByRole("button", { name: "Save full state" }).click();
  const localizedFullState = JSON.parse(await page.getByLabel("Full state and column cache JSON").inputValue()) as {
    layoutsByColumn: Record<string, unknown>;
  };
  expect(localizedFullState.layoutsByColumn).toEqual(savedLayoutsByColumn);
  await expect(page).toHaveURL(/\/examples\/layout$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.locator(".playground-header").getByText("Layout example", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Layout", exact: true })).toBeVisible();
  await expect(page.getByText("Save and restore layouts by column, then compare arranging and filling empty space.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Layout example controls");
  await expect(page.getByRole("combobox", { name: "Select columns" })).toHaveValue("6");
  await expect(page.getByRole("status", { name: "Active column status" })).toHaveText("Currently using 6 columns.");
  await expect(page.getByRole("button", { name: "Save active layout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore active layout" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save full state" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore full state" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Auto arrange" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fill empty space" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset layout" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Active layout save and restore status" })).toHaveText(
    "Check the JSON format or layout values.",
  );
  await expect(page.getByRole("status", { name: "Full state save and restore status" })).toHaveText(
    "Saved the full state and column cache.",
  );
  await expect(page.getByRole("status", { name: "Layout operation status" })).toHaveText(
    "Auto-arranged widgets in package order.",
  );
  await expect(page.getByLabel("Active layout JSON")).toHaveValue(invalidActiveLayout);
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Layout dashboard");
  await expect(page.getByTestId("dashboard-widget-sales").getByRole("button", { name: "Sales maximize" })).toBeVisible();
  expect(await page.locator(".grid-stack-item").evaluateAll((elements) =>
    elements.map((element) => ({
      h: element.getAttribute("data-layout-h"),
      id: element.getAttribute("data-widget-id"),
      w: element.getAttribute("data-layout-w"),
      x: element.getAttribute("data-layout-x"),
      y: element.getAttribute("data-layout-y"),
    })),
  )).toEqual(geometryBeforeLocaleChange);
  expect((await page.locator('[role="status"]').allTextContents()).join("\n")).not.toContain("LAYOUT_DO_NOT_ECHO");
});

test("localizes Advanced copy and semantic status without resetting engine state", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1100 });
  await page.goto("/examples/advanced");

  const responsiveToggle = page.getByRole("button", { name: "반응형 컬럼 사용" });
  const floatToggle = page.getByRole("button", { name: "Float 사용" });
  const movableToggle = page.getByRole("button", { name: "이동 가능" });
  const resizableToggle = page.getByRole("button", { name: "크기 조절 가능" });
  const lockToggle = page.getByRole("button", { name: "레이아웃 해제" });
  await responsiveToggle.click();
  await floatToggle.click();
  await expect(page.getByRole("status", { name: "GridStack 읽기 전용 상태" })).toHaveText(
    /^column=6; row=\d+; float=true$/,
  );

  const externalDropTarget = page.locator("[data-dashboard-drop-target='trash']");
  await page.getByTestId("dashboard-widget-sales").locator(".comins-grid-layout-widget__title").dragTo(externalDropTarget);
  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
  const externalDropDiagnostic = await page.getByRole("status", { name: "외부 드롭 처리 상태" }).textContent();
  expect(externalDropDiagnostic).toMatch(/^target=trash; widget=sales; columns=6; layout=\d+,\d+,\d+,\d+$/);

  await page.getByRole("button", { name: "compact 정렬 후 커밋" }).click();
  await expect(page.getByRole("status", { name: "handle 작업 상태" })).toHaveText("compact 정렬을 커밋했습니다.");
  await movableToggle.click();
  await resizableToggle.click();
  await lockToggle.click();
  await page.getByRole("button", { name: "전체 상태 저장" }).click();

  const savedState = await page.getByLabel("전체 상태 및 컬럼 캐시 JSON").inputValue();
  const savedLayoutsByColumn = (JSON.parse(savedState) as { layoutsByColumn: Record<string, unknown> }).layoutsByColumn;
  expect(Object.keys(savedLayoutsByColumn).sort()).toEqual(["12", "6"]);
  const queryDiagnostic = await page.getByRole("status", { name: "GridStack 읽기 전용 상태" }).textContent();
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

  await expect(page.getByLabel("Full state and column cache JSON")).toHaveValue(savedState);
  await page.getByRole("button", { name: "Save full state" }).click();
  const localizedState = JSON.parse(await page.getByLabel("Full state and column cache JSON").inputValue()) as {
    layoutsByColumn: Record<string, unknown>;
  };
  expect(localizedState.layoutsByColumn).toEqual(savedLayoutsByColumn);
  await expect(page).toHaveURL(/\/examples\/advanced$/);
  expect(await page.evaluate(() => window.__cominsGridLayoutLastUnmount)).toBeUndefined();
  await expect(page.locator(".playground-header").getByText("Development example", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-header").getByRole("heading", { name: "Advanced example" })).toBeVisible();
  await expect(page.getByText("Verify responsive columns, a safe GridStack handle, and external drop with controlled state.")).toBeVisible();
  await expect(page.locator(".playground-controls")).toHaveAttribute("aria-label", "Advanced example controls");
  await expect(page.getByRole("button", { name: "Use responsive columns" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Use float" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Not movable" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Not resizable" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Layout locked" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("combobox", { name: "Select columns" })).toHaveValue("6");
  await expect(page.getByRole("status", { name: "Active column status" })).toHaveText("Currently using 6 columns.");
  await expect(page.getByRole("status", { name: "Available column cache" })).toHaveText("Available cached columns: 6, 12");
  await expect(page.getByRole("status", { name: "Handle operation status" })).toHaveText("Committed the compact arrangement.");
  await expect(page.getByRole("status", { name: "Controlled layout commit status" })).toHaveText(
    "Committed the 6-column layout to React state.",
  );
  await expect(page.getByRole("status", { name: "Full state save and restore status" })).toHaveText(
    "Saved the full state and column cache.",
  );
  await expect(page.getByRole("status", { name: "Read-only GridStack status" })).toHaveText(queryDiagnostic ?? "");
  await expect(page.getByRole("status", { name: "External drop status" })).toHaveText(externalDropDiagnostic ?? "");
  await expect(page.getByText("3 widgets", { exact: true })).toBeVisible();
  await expect(page.locator(".playground-grid-region")).toHaveAttribute("aria-label", "Advanced example dashboard");
  await expect(page.getByTestId("dashboard-widget-traffic").getByRole("button", { name: "Traffic maximize" })).toBeVisible();
  expect(await page.getByTestId("dashboard-widget-traffic").evaluate((element) => ({
    h: element.getAttribute("data-layout-h"),
    w: element.getAttribute("data-layout-w"),
    x: element.getAttribute("data-layout-x"),
    y: element.getAttribute("data-layout-y"),
  }))).toEqual(trafficGeometry);
});
