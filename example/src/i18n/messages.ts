import { defineLocalizedText } from "./playground-locale";

export const playgroundMessages = {
  closeDialog: defineLocalizedText("팝업 닫기", "Close dialog"),
  docsNavigation: defineLocalizedText("문서 메뉴", "Docs menu"),
  localeToggle: defineLocalizedText("Playground 언어", "Playground language"),
  noSearchResults: defineLocalizedText("검색된 결과가 없습니다.", "No results found."),
  search: defineLocalizedText("전체 문서 검색", "Search all docs"),
} as const;
