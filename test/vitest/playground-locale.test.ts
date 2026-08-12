import {
  defineLocalizedText,
  normalizePlaygroundLocale,
  resolveLocalizedText,
} from "../../example/src/i18n/playground-locale";

describe("Playground locale", () => {
  it("defaults invalid storage values to Korean", () => {
    expect(normalizePlaygroundLocale(null)).toBe("ko");
    expect(normalizePlaygroundLocale("unsupported")).toBe("ko");
    expect(normalizePlaygroundLocale("en")).toBe("en");
  });

  it("resolves complete copy and rejects incomplete pairs", () => {
    const value = defineLocalizedText("검색", "Search");
    expect(resolveLocalizedText(value, "ko")).toBe("검색");
    expect(resolveLocalizedText(value, "en")).toBe("Search");
    expect(() => defineLocalizedText("", "Search")).toThrow(
      "playground-localization: incomplete localized text",
    );
  });
});
