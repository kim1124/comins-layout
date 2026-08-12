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

test("restores the English docs locale after reload", async ({ page }) => {
  await initializePlaygroundLocale(page, "en");
  await page.goto("/docs/getting-started");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("article").getByRole("heading", { name: "Getting started" })).toBeVisible();
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

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "KO" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("article").getByRole("heading", { name: "시작하기" })).toBeVisible();
});

test("searches resolved docs copy for each locale", async ({ page }) => {
  await page.goto("/docs/getting-started");

  await page.getByRole("searchbox", { name: "전체 문서 검색" }).fill("직렬화");
  await expect(page.getByRole("option", { name: /Layout 저장 \/ 복원/ }).first()).toBeVisible();

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "EN" }).click();
  await page.getByRole("searchbox", { name: "Search all docs" }).fill("serialization");
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

  for (const topNavTarget of [
    page.getByRole("searchbox", { name: "전체 문서 검색" }),
    page.getByRole("heading", { name: "comins-grid-layout" }),
  ]) {
    await expect(topNavTarget.click({ timeout: 750, trial: true })).rejects.toThrow("intercepts pointer events");
  }
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

  await page.getByTestId("playground-locale-toggle").getByRole("button", { name: "KO" }).click();
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
