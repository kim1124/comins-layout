export type PlaygroundLocale = "en" | "ko";
export type PlaygroundLabel = Record<PlaygroundLocale, string>;

export type PlaygroundSubmenu = {
  label: PlaygroundLabel;
  path: string;
};

export type PlaygroundMenu = {
  label: PlaygroundLabel;
  path: string;
  prefix: string;
  submenus: ReadonlyArray<PlaygroundSubmenu>;
};

export const playgroundMenus: ReadonlyArray<PlaygroundMenu> = [
  {
    label: { en: "Widget", ko: "위젯" },
    path: "/examples/widget/basic",
    prefix: "/examples/widget/",
    submenus: [
      { label: { en: "Basic", ko: "Basic" }, path: "/examples/widget/basic" },
      { label: { en: "Add / Delete All / Reset", ko: "추가 / 전체 삭제 / 초기화" }, path: "/examples/widget/manage" },
      { label: { en: "Events", ko: "이벤트" }, path: "/examples/widget/events" },
    ],
  },
  {
    label: { en: "Layout", ko: "레이아웃" },
    path: "/examples/layout/basic",
    prefix: "/examples/layout/",
    submenus: [
      { label: { en: "Basic", ko: "Basic" }, path: "/examples/layout/basic" },
      { label: { en: "Lock / Unlock", ko: "레이아웃 잠금 / 해제" }, path: "/examples/layout/lock" },
      { label: { en: "Save / Load", ko: "레이아웃 저장 / 불러오기" }, path: "/examples/layout/persistence" },
      { label: { en: "Auto Arrange / Fill Gaps", ko: "자동 정렬 / 빈 공간 채우기" }, path: "/examples/layout/arrange" },
      { label: { en: "Layout Events", ko: "레이아웃 이벤트" }, path: "/examples/layout/events" },
    ],
  },
  {
    label: { en: "Advanced Examples", ko: "고급 예제" },
    path: "/examples/advanced/cell-height",
    prefix: "/examples/advanced/",
    submenus: [
      { label: { en: "Cell Height", ko: "셀 높이" }, path: "/examples/advanced/cell-height" },
      { label: { en: "Grid Lines", ko: "그리드 라인" }, path: "/examples/advanced/grid-lines" },
      { label: { en: "Float", ko: "Float" }, path: "/examples/advanced/float" },
      { label: { en: "Lazy Loading", ko: "Lazy Loading" }, path: "/examples/advanced/lazy-load" },
      { label: { en: "Mobile Touch", ko: "모바일 터치" }, path: "/examples/advanced/mobile-touch" },
      { label: { en: "Nested Grid - Basic", ko: "Nested Grid - Basic" }, path: "/examples/advanced/nested/basic" },
      { label: { en: "Nested Grid - Advanced", ko: "Nested Grid - 고급" }, path: "/examples/advanced/nested/advanced" },
      { label: { en: "Nested Grid - Constraints", ko: "Nested Grid - 제약" }, path: "/examples/advanced/nested/constraints" },
      { label: { en: "Responsive - Column Width", ko: "반응형 - 컬럼 너비" }, path: "/examples/advanced/responsive/column" },
      { label: { en: "Responsive - Breakpoints", ko: "반응형 - Breakpoint" }, path: "/examples/advanced/responsive/breakpoints" },
      { label: { en: "Responsive - Layout None", ko: "반응형 - Layout None" }, path: "/examples/advanced/responsive/none" },
      { label: { en: "RTL", ko: "RTL" }, path: "/examples/advanced/rtl" },
      { label: { en: "Size To Content", ko: "Size To Content" }, path: "/examples/advanced/size-to-content" },
      { label: { en: "Static Grid", ko: "Static Grid" }, path: "/examples/advanced/static" },
      { label: { en: "Title Drag Handle", ko: "타이틀 Drag Handle" }, path: "/examples/advanced/title-drag" },
      { label: { en: "Transform", ko: "Transform" }, path: "/examples/advanced/transform" },
      { label: { en: "Multiple Grids - Horizontal", ko: "다중 Grid - 가로" }, path: "/examples/advanced/multi-grid/horizontal" },
      { label: { en: "Multiple Grids - Vertical", ko: "다중 Grid - 세로" }, path: "/examples/advanced/multi-grid/vertical" },
      { label: { en: "Safe Public Handlers / Methods", ko: "안전한 공개 핸들러 / 메서드" }, path: "/examples/advanced/public-api" },
    ],
  },
];

export const compatibilityRoutes: Readonly<Record<string, string>> = {
  "/": "/examples/widget/basic",
  "/examples/basic": "/docs/getting-started",
  "/examples/complete": "/examples/advanced/public-api",
  "/examples/crud": "/examples/widget/manage",
  "/examples/widget": "/examples/widget/basic",
  "/examples/layout": "/examples/layout/basic",
  "/examples/advanced": "/examples/advanced/cell-height",
};

export const playgroundPaths = new Set([
  ...playgroundMenus.flatMap((menu) => menu.submenus.map((submenu) => submenu.path)),
  "/examples/transfer",
]);

export function resolvePlaygroundPath(pathname: string) {
  if (playgroundPaths.has(pathname)) {
    return pathname;
  }
  return compatibilityRoutes[pathname];
}
