import type { Page } from "@playwright/test";

import { PLAYGROUND_LOCALE_STORAGE_KEY } from "../../../example/src/i18n/playground-locale";

export { PLAYGROUND_LOCALE_STORAGE_KEY } from "../../../example/src/i18n/playground-locale";

export async function initializePlaygroundLocale(page: Page, locale: "en" | "ko") {
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: PLAYGROUND_LOCALE_STORAGE_KEY, value: locale },
  );
}
