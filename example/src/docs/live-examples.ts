// The API reference runs the canonical Playground routes, not a second implementation.
export const liveExamples = {
  basic: { label: "위젯 기본", path: "/examples/widget/basic", instruction: "위젯을 이동·리사이즈하고 설정 표의 좌표와 크기를 확인합니다." },
  crud: { label: "추가 / 삭제 / 초기화", path: "/examples/widget/manage", instruction: "추가, 개별 삭제, 전체 삭제, 초기화를 순서대로 실행합니다." },
  events: { label: "위젯 이벤트", path: "/examples/widget/events", instruction: "위젯을 이동·리사이즈하거나 제목을 더블클릭하고 이벤트 로그를 확인합니다." },
  columns: { label: "컬럼 변경", path: "/examples/layout/basic", instruction: "컬럼 수를 바꾸고 위젯 좌표와 너비의 변화를 확인합니다." },
  lock: { label: "레이아웃 잠금 / 정적 모드", path: "/examples/layout/lock", instruction: "잠금 방식을 선택한 뒤 잠금·해제하여 이동과 리사이즈를 비교합니다. 두 방식 모두 위젯 삭제까지 막지는 않습니다." },
  persistence: { label: "레이아웃 저장 / 복원", path: "/examples/layout/persistence", instruction: "저장한 뒤 위젯을 변경하고 불러오기로 복원합니다. 저장된 JSON도 함께 확인합니다." },
  arrange: { label: "자동 정렬 / 빈 공간 채우기", path: "/examples/layout/arrange", instruction: "위젯 사이에 빈 공간을 만든 뒤 자동 정렬과 빈 공간 채우기의 차이를 확인합니다." },
  mutations: { label: "레이아웃 이벤트", path: "/examples/layout/events", instruction: "위젯을 조작하고 변경 이벤트의 좌표·크기를 확인합니다." },
  size: { label: "Size To Content", path: "/examples/advanced/size-to-content", instruction: "내용을 추가·삭제하며 h 변화를 확인하고, 옵션을 끈 상태와 비교합니다." },
  cell: { label: "셀 높이", path: "/examples/advanced/cell-height", instruction: "셀 높이를 바꿔 동일한 행 수 h에서 픽셀 높이가 달라지는 모습을 확인합니다." },
  float: { label: "Float", path: "/examples/advanced/float", instruction: "Float를 켜고 끈 뒤 위젯을 아래로 이동해 위쪽 빈 공간의 유지 여부를 비교합니다." },
  responsive: { label: "반응형", path: "/examples/advanced/responsive", instruction: "컬럼 결정 방식과 배치 정책을 따로 선택하고 너비를 바꿔 비교합니다. 방식·정책 변경 또는 다시 실험은 배치 캐시도 초기화합니다." },
  rtl: { label: "RTL", path: "/examples/advanced/rtl", instruction: "RTL 설정에 따른 가로 좌표 방향을 비교합니다." },
  title: { label: "제목 드래그 핸들", path: "/examples/advanced/title-drag", instruction: "제목과 본문에서 각각 드래그하여 드래그 시작 영역을 비교합니다." },
  touch: { label: "모바일 터치", path: "/examples/advanced/mobile-touch", instruction: "터치 입력 환경에서 리사이즈 핸들과 드래그 동작을 확인합니다." },
  actions: { label: "최대화 / 최소화 / 복원", path: "/examples/widget/basic", instruction: "대상 위젯을 선택하고 최대화·최소화·복원 버튼으로 레이아웃 변화를 확인합니다." },
  publicApi: { label: "공개 핸들러 / 메서드", path: "/examples/advanced/public-api", instruction: "상태 조회와 정렬 후 커밋을 실행합니다. 타입·어댑터 유틸리티는 아래 적용 코드도 함께 참고하세요." },
  transfer: { label: "그리드 간 이동 / 복사", path: "/examples/advanced/multi-grid/horizontal", instruction: "팔레트의 위젯을 추가하거나 A/B 그리드 사이로 옮기고 이동·복사 결과를 비교합니다." },
  trash: { label: "외부 드롭 / 삭제", path: "/examples/advanced/external-drop-trash", instruction: "위젯을 휴지통 영역으로 끌어 놓고 외부 드롭 처리 결과를 확인합니다." },
  lazy: { label: "콘텐츠 지연 렌더링", path: "/examples/advanced/lazy-load", instruction: "내부 스크롤로 대기→완료와 렌더링 개수를 확인합니다. 켜짐 상태에서 다시 실험을 누르면 최초 렌더링부터 재현합니다." },
} as const;

export type LiveExampleId = keyof typeof liveExamples;

const sectionExamples: Record<string, readonly LiveExampleId[]> = {
  "api-dashboard-rendering": ["basic", "size", "lock", "responsive"],
  "api-widget-crud": ["crud"],
  "api-layout-save-restore": ["persistence", "mutations"],
  "api-column-arrange": ["columns", "arrange"],
  "api-interaction-lock": ["lock", "basic"],
  "api-maximize-minimize-restore": ["actions", "events"],
  "api-resize-adapter": ["publicApi", "cell"],
  "api-transfer-lazy": ["transfer", "trash", "lazy"],
};

export function examplesForApi(sectionId: string, name?: string): readonly LiveExampleId[] {
  if (!name) return sectionExamples[sectionId] ?? [];
  if (/sizeToContent|resizeToContentParent|refreshKey/.test(name)) return ["size"];
  if (/staticGrid|editable|InteractionOptions|\.locked|\.movable/.test(name)) return ["lock"];
  if (/\.float/.test(name)) return ["float"];
  if (/responsive\.(layout|column)/.test(name)) return ["responsive"];
  if (/\.rtl|dragHandle|alwaysShowResizeHandle/.test(name)) return ["rtl", "title", "touch"];
  if (/lazyRenderWidget|lazyLoad/.test(name)) return ["lazy"];
  if (/externalDropTargets|onWidgetExternalDrop/.test(name)) return ["trash"];
  if (/cellHeight/.test(name)) return ["cell"];
  if (/lifecycle|onBeforeMove|onWidgetDragStart|onTitleDoubleClick/.test(name)) return ["events"];
  if (/onLayoutCommit|onWidgetLayoutChange|onLayoutMutation/.test(name)) return ["mutations"];
  return sectionExamples[sectionId] ?? [];
}
