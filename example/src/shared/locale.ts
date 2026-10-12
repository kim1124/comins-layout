export type LocalizedText = Readonly<{ en: string; ko: string }>;
export type Locale = keyof LocalizedText;
export function resolveLocalizedText(copy: LocalizedText, locale: Locale): string { return copy[locale]; }
export function readExampleLocale(search: string): Locale {
  return new URLSearchParams(search).get("locale") === "en" ? "en" : "ko";
}
