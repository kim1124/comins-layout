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
