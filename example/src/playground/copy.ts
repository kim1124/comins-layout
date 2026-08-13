import type { DashboardWidget } from "../../../src";
import { defineLocalizedText, resolveLocalizedText } from "../i18n/playground-locale";
import type { LocalizedText, PlaygroundLocale } from "../i18n/types";
import type { PastelColorKey } from "./palette";
import type { ExampleFixtureCopyKey, ExampleGeneratedDescriptionKey, ExampleWidgetData } from "./types";

export type LayoutJsonStatus =
  | { type: "activeMissing" }
  | { type: "activeRestored" }
  | { type: "activeSaved" }
  | { type: "fullMissing" }
  | { type: "fullRestored" }
  | { type: "fullSaved" }
  | { type: "invalidLayout" };

export type LayoutOperationStatus =
  | { type: "arrange"; changed: boolean }
  | { type: "fill"; changed: boolean }
  | { type: "initial" }
  | { type: "reset" };

export type AdvancedLayoutStatus =
  | { type: "invalidState" }
  | { type: "missing" }
  | { type: "restored" }
  | { type: "saved" };

export type AdvancedHandleStatus =
  | { type: "compacted"; layout: "compact" | "list" }
  | { type: "notReady" }
  | { type: "queried" }
  | { type: "ready" }
  | { type: "refreshed" };

export type AdvancedCommitStatus =
  | { type: "committed"; columns: number }
  | { type: "missing" };

export type AdvancedDiagnosticStatus =
  | { type: "diagnostic"; value: string }
  | { type: "externalDropInitial" }
  | { type: "gridNotReady" };

export const sharedPlaygroundCopy = {
  addWidget: defineLocalizedText("위젯 추가", "Add widget"),
  cancel: defineLocalizedText("취소", "Cancel"),
  clearAll: defineLocalizedText("전체 삭제", "Clear all"),
  color: defineLocalizedText("색상", "Color"),
  closeDialog: defineLocalizedText("팝업 닫기", "Close dialog"),
  deleteSelectedWidget: defineLocalizedText("선택 위젯 삭제", "Delete selected widget"),
  dialog: {
    add: {
      description: defineLocalizedText("추가할 위젯의 제목, 값, 너비와 높이를 입력합니다.", "Enter the new widget's title, value, width, and height."),
      title: defineLocalizedText("위젯 추가", "Add widget"),
    },
    edit: {
      description: defineLocalizedText("선택한 위젯의 제목, 값, 너비, 높이와 색상을 변경합니다.", "Change the selected widget's title, value, width, height, and color."),
      title: defineLocalizedText("위젯 수정", "Edit widget"),
    },
  },
  editSelectedWidget: defineLocalizedText("선택 위젯 수정", "Edit selected widget"),
  generatedWidgetTitle: {
    en: (number: number) => `Widget ${number}`,
    ko: (number: number) => `위젯 ${number}`,
  },
  newWidgetHeight: defineLocalizedText("높이", "Height"),
  newWidgetWidth: defineLocalizedText("너비", "Width"),
  saveChanges: defineLocalizedText("변경 저장", "Save changes"),
  saveWidget: defineLocalizedText("위젯 저장", "Save widget"),
  selectWidget: defineLocalizedText("위젯 선택", "Select widget"),
  value: defineLocalizedText("값", "Value"),
  validation: {
    titleRequired: defineLocalizedText("위젯명을 입력해 주세요.", "Enter a widget name."),
    valueRequired: defineLocalizedText("값을 입력해 주세요.", "Enter a value."),
  },
  widgetActions: defineLocalizedText("위젯 작업", "Widget actions"),
  widgetCount: defineLocalizedText("위젯 {count}개", "{count} widgets"),
  widgetName: defineLocalizedText("위젯명", "Widget name"),
  widgetSelect: defineLocalizedText("위젯 선택", "Select widget"),
  layoutJson: {
    active: {
      label: defineLocalizedText("활성 레이아웃 JSON", "Active layout JSON"),
      statusLabel: defineLocalizedText("활성 레이아웃 저장 복원 상태", "Active layout save and restore status"),
    },
    controls: defineLocalizedText("레이아웃 JSON 컨트롤", "Layout JSON controls"),
    defaultLabel: defineLocalizedText("저장된 레이아웃 JSON", "Saved layout JSON"),
    fullState: {
      label: defineLocalizedText("전체 상태 및 컬럼 캐시 JSON", "Full state and column cache JSON"),
      statusLabel: defineLocalizedText("전체 상태 저장 복원 상태", "Full state save and restore status"),
    },
  },
  dashboardActions: {
    maximize: defineLocalizedText("최대화", "maximize"),
    minimize: defineLocalizedText("최소화", "minimize"),
    remove: defineLocalizedText("삭제", "remove"),
    restore: defineLocalizedText("복원", "restore"),
  },
  columns: {
    activeStatusLabel: defineLocalizedText("활성 컬럼 상태", "Active column status"),
    availableCacheLabel: defineLocalizedText("사용 가능한 컬럼 캐시", "Available column cache"),
    select: defineLocalizedText("컬럼 선택", "Select columns"),
    status: {
      en: (columns: number) => `Currently using ${columns} columns.`,
      ko: (columns: number) => `현재 ${columns}컬럼입니다.`,
    },
    cacheStatus: {
      en: (keys: string) => `Available cached columns: ${keys}`,
      ko: (keys: string) => `사용 가능한 캐시 컬럼: ${keys}`,
    },
  },
  colors: {
    lavender: defineLocalizedText("라벤더", "Lavender"),
    lemon: defineLocalizedText("레몬", "Lemon"),
    mint: defineLocalizedText("민트", "Mint"),
    peach: defineLocalizedText("피치", "Peach"),
    rose: defineLocalizedText("로즈", "Rose"),
    sky: defineLocalizedText("하늘", "Sky"),
  } satisfies Record<PastelColorKey, LocalizedText>,
} as const;

export const layoutPlaygroundCopy = {
  controls: defineLocalizedText("레이아웃 예제 컨트롤", "Layout example controls"),
  dashboard: defineLocalizedText("레이아웃 dashboard", "Layout dashboard"),
  description: defineLocalizedText(
    "레이아웃을 저장·복원하고 자동 정렬 및 공간 채우기 결과를 비교합니다.",
    "Save and restore a layout, then compare auto arrange and fill space.",
  ),
  kicker: defineLocalizedText("레이아웃 예제", "Layout example"),
  title: defineLocalizedText("레이아웃", "Layout"),
  groups: {
    rearrange: defineLocalizedText("레이아웃 정렬", "Layout arrangement"),
    reset: defineLocalizedText("레이아웃 초기화", "Layout reset"),
    saveRestore: defineLocalizedText("레이아웃 저장 복원", "Layout save and restore"),
    widgetCrud: defineLocalizedText("레이아웃 위젯", "Layout widgets"),
  },
  headings: {
    activeLayout: defineLocalizedText("활성 레이아웃", "Active layout"),
    arrangeReset: defineLocalizedText("정렬과 초기화", "Arrange and reset"),
    columns: defineLocalizedText("컬럼", "Columns"),
    fullState: defineLocalizedText("전체 상태와 컬럼 캐시", "Full state and column cache"),
    widgetCrud: defineLocalizedText("위젯 CRUD", "Widget CRUD"),
  },
  actions: {
    arrange: defineLocalizedText("자동 정렬", "Auto arrange"),
    fill: defineLocalizedText("공간 채우기", "Fill space"),
    reset: defineLocalizedText("초기화", "Reset"),
    restore: defineLocalizedText("레이아웃 복원", "Restore layout"),
    save: defineLocalizedText("레이아웃 저장", "Save layout"),
    restoreActive: defineLocalizedText("활성 레이아웃 복원", "Restore active layout"),
    restoreFull: defineLocalizedText("전체 상태 복원", "Restore full state"),
    saveActive: defineLocalizedText("활성 레이아웃 저장", "Save active layout"),
    saveFull: defineLocalizedText("전체 상태 저장", "Save full state"),
  },
  operationDescription: defineLocalizedText(
    "자동 정렬은 패키지 순서로 위젯을 위에서부터 배치하고, 빈 공간 채우기는 같은 y 행의 가로 빈 공간만 재분배합니다.",
    "Auto arrange places widgets from the top in package order, while fill empty space redistributes only horizontal gaps within the same y row.",
  ),
  operationStatusLabel: defineLocalizedText("레이아웃 작업 상태", "Layout operation status"),
  status: {
    json: {
      activeMissing: defineLocalizedText("저장된 활성 레이아웃이 없습니다.", "No active layout has been saved."),
      activeRestored: defineLocalizedText("활성 레이아웃을 복원했습니다.", "Restored the active layout."),
      activeSaved: defineLocalizedText("활성 레이아웃을 저장했습니다.", "Saved the active layout."),
      fullMissing: defineLocalizedText("저장된 전체 상태가 없습니다.", "No full state has been saved."),
      fullRestored: defineLocalizedText("전체 상태와 컬럼 캐시를 복원했습니다.", "Restored the full state and column cache."),
      fullSaved: defineLocalizedText("전체 상태와 컬럼 캐시를 저장했습니다.", "Saved the full state and column cache."),
      invalidLayout: defineLocalizedText(
        "JSON 형식 또는 레이아웃 값을 확인해 주세요.",
        "Check the JSON format or layout values.",
      ),
    },
    operation: {
      arrange: {
        changed: defineLocalizedText("패키지 순서로 위젯을 자동 정렬했습니다.", "Auto-arranged widgets in package order."),
        unchanged: defineLocalizedText("자동 정렬할 변경이 없습니다.", "There are no changes to auto-arrange."),
      },
      fill: {
        changed: defineLocalizedText("행의 빈 공간을 채웠습니다.", "Filled empty space in the rows."),
        unchanged: defineLocalizedText("빈 공간이 없어 변경하지 않았습니다.", "No empty space; no changes were made."),
      },
      initial: defineLocalizedText("자동 정렬 또는 빈 공간 채우기를 실행해 보세요.", "Try auto arrange or fill empty space."),
      reset: defineLocalizedText("초기 12컬럼 레이아웃과 캐시로 복원했습니다.", "Restored the initial 12-column layout and cache."),
    },
  },
} as const;

export const layoutColumnsCopy = {
  controls: defineLocalizedText("동적 컬럼 컨트롤", "Dynamic column controls"),
  dashboard: defineLocalizedText("동적 컬럼 dashboard", "Dynamic column dashboard"),
  description: defineLocalizedText(
    "1부터 12까지 컬럼을 직접 변경하여 여섯 위젯의 배치 변화를 확인합니다.",
    "Change between 1 and 12 columns to observe how six widgets adapt.",
  ),
  kicker: defineLocalizedText("레이아웃 예제", "Layout example"),
  select: defineLocalizedText("레이아웃 컬럼", "Layout columns"),
  title: defineLocalizedText("컬럼 레이아웃 동적 수정", "Dynamic column layout"),
} as const;

export const layoutLockCopy = {
  controls: defineLocalizedText("레이아웃 잠금 컨트롤", "Layout lock controls"),
  dashboard: defineLocalizedText("잠금 예제 dashboard", "Lock example dashboard"),
  description: defineLocalizedText(
    "하나의 토글로 여섯 위젯의 이동, 크기 조절과 삭제를 함께 잠그고 해제합니다.",
    "Use one toggle to lock and unlock movement, resizing, and deletion for six widgets.",
  ),
  kicker: defineLocalizedText("레이아웃 예제", "Layout example"),
  lockLayout: defineLocalizedText("레이아웃 잠금", "Lock layout"),
  title: defineLocalizedText("레이아웃 잠금 / 해제", "Layout lock and unlock"),
  unlockLayout: defineLocalizedText("레이아웃 잠금 해제", "Unlock layout"),
} as const;

export const advancedPlaygroundCopy = {
  controls: defineLocalizedText("고급 예제 컨트롤", "Advanced example controls"),
  dashboard: defineLocalizedText("고급 예제 dashboard", "Advanced example dashboard"),
  description: defineLocalizedText(
    "반응형 컬럼과 지원되는 GridStack 엔진 옵션의 실제 동작을 확인합니다.",
    "Verify responsive columns and the real behavior of supported GridStack engine options.",
  ),
  kicker: defineLocalizedText("반응형·엔진 옵션", "Responsive and engine options"),
  title: defineLocalizedText("고급 예제", "Advanced example"),
  groups: {
    engine: defineLocalizedText("엔진 옵션", "Engine options"),
    responsive: defineLocalizedText("반응형 컬럼", "Responsive columns"),
    externalDrop: defineLocalizedText("외부 드롭 삭제 예제", "External drop delete example"),
    fullState: defineLocalizedText("전체 상태 저장 복원", "Full state save and restore"),
    handle: defineLocalizedText("공개 handle 예제", "Public handle example"),
    widgetCrud: defineLocalizedText("고급 위젯 CRUD", "Advanced widget CRUD"),
  },
  headings: {
    engine: defineLocalizedText("엔진 옵션", "Engine options"),
    responsive: defineLocalizedText("반응형 컬럼", "Responsive columns"),
    fullState: defineLocalizedText("전체 상태와 컬럼 캐시", "Full state and column cache"),
    handle: defineLocalizedText("안전한 공개 handle", "Safe public handle"),
    widgets: defineLocalizedText("제어 위젯", "Controlled widgets"),
  },
  descriptions: {
    controls: {
      animate: defineLocalizedText(
        "위젯 이동과 재배치에 전환 효과를 적용합니다. 정적 모드에서는 상호작용 애니메이션을 확인할 수 없습니다.",
        "Applies transitions to widget movement and rearrangement. Interaction animation is not visible in static mode.",
      ),
      cellHeight: defineLocalizedText(
        "Grid 한 행의 높이를 60, 80 또는 100px로 변경하며 위젯의 전체 높이는 행 수에 따라 함께 변합니다.",
        "Changes the height of one row to 60, 80, or 100px, so widget height scales with its row span.",
      ),
      float: defineLocalizedText(
        "Float를 사용하면 위젯이 빈 행 위에 현재 세로 위치를 유지할 수 있습니다. 해제하면 빈 공간을 위쪽부터 채웁니다.",
        "Float lets widgets keep their vertical position above empty rows. Disabling it packs empty rows from the top.",
      ),
      margin: defineLocalizedText(
        "위젯 사이 여백을 4, 8 또는 12px로 변경합니다. Grid 외곽이 아니라 각 위젯 콘텐츠의 간격에 적용됩니다.",
        "Changes spacing between widgets to 4, 8, or 12px. It affects widget content gaps, not the outer Grid edge.",
      ),
      rowLimit: defineLocalizedText(
        "Grid의 최소·최대 행을 유효한 쌍으로 제한합니다. 제한 없음은 0/0이며 다른 preset은 resize 하한과 상한을 함께 적용합니다.",
        "Constrains the Grid minimum and maximum rows as a valid pair. No limit is 0/0; other presets apply resize minimum and maximum together.",
      ),
      rtl: defineLocalizedText(
        "수평 배치 기준을 오른쪽 가장자리로 전환합니다. 세로 좌표와 컬럼 수는 변경하지 않습니다.",
        "Moves the horizontal layout origin to the right edge without changing vertical coordinates or column count.",
      ),
      sizeToContent: defineLocalizedText(
        "위젯을 내부 콘텐츠의 고유 높이에 맞춰 늘립니다. 콘텐츠가 현재 셀 높이를 넘을 때만 행 수가 증가합니다.",
        "Expands widgets to their content's intrinsic height. Row count grows only when content exceeds the current cell height.",
      ),
      staticGrid: defineLocalizedText(
        "모든 위젯 이동과 크기 조절을 막습니다. 옵션을 해제하면 기존 상호작용이 다시 활성화됩니다.",
        "Blocks all widget moving and resizing. Disabling the option restores the existing interactions.",
      ),
    },
    engine: defineLocalizedText(
      "GridStack의 배치, 렌더링과 상호작용 옵션을 변경합니다.",
      "Change GridStack layout, rendering, and interaction options.",
    ),
    responsive: defineLocalizedText(
      "화면 너비에 따라 컬럼이 자동으로 변경됩니다.",
      "Columns change automatically with the viewport width.",
    ),
  },
  actions: {
    clearAll: sharedPlaygroundCopy.clearAll,
    compact: defineLocalizedText("compact 정렬 후 커밋", "Run compact and commit"),
    list: defineLocalizedText("list 정렬 후 커밋", "Run list and commit"),
    query: defineLocalizedText("엔진 상태 조회", "Query engine state"),
    refresh: defineLocalizedText("레이아웃 갱신", "Refresh layout"),
    restore: defineLocalizedText("전체 상태 복원", "Restore full state"),
    save: defineLocalizedText("전체 상태 저장", "Save full state"),
  },
  toggles: {
    animate: {
      disable: defineLocalizedText("애니메이션 해제", "Disable animation"),
      enable: defineLocalizedText("애니메이션 사용", "Enable animation"),
    },
    float: {
      disable: defineLocalizedText("Float 해제", "Disable float"),
      enable: defineLocalizedText("Float 사용", "Enable float"),
    },
    responsive: {
      disable: defineLocalizedText("반응형 컬럼 해제", "Disable responsive columns"),
      enable: defineLocalizedText("반응형 컬럼 사용", "Enable responsive columns"),
    },
    rtl: {
      disable: defineLocalizedText("RTL 해제", "Disable RTL"),
      enable: defineLocalizedText("RTL 사용", "Enable RTL"),
    },
    sizeToContent: {
      disable: defineLocalizedText("콘텐츠 높이 해제", "Disable content height"),
      enable: defineLocalizedText("콘텐츠 높이 사용", "Enable content height"),
    },
    staticGrid: {
      disable: defineLocalizedText("정적 모드 해제", "Disable static mode"),
      enable: defineLocalizedText("정적 모드 사용", "Enable static mode"),
    },
  },
  selects: {
    cellHeight: defineLocalizedText("셀 높이", "Cell height"),
    margin: defineLocalizedText("여백", "Margin"),
    rowLimit: defineLocalizedText("행 제한", "Row limit"),
  },
  rowLimits: [
    { key: "none", label: defineLocalizedText("제한 없음", "No limit") },
    { key: "two-eight", label: defineLocalizedText("2–8행", "Rows 2–8") },
    { key: "four-twelve", label: defineLocalizedText("4–12행", "Rows 4–12") },
  ],
  sizeToContentProbe: [
    defineLocalizedText("콘텐츠 높이 측정 기준", "Intrinsic content height probe"),
    defineLocalizedText("첫 번째 상세 행", "First detail row"),
    defineLocalizedText("두 번째 상세 행", "Second detail row"),
    defineLocalizedText("세 번째 상세 행", "Third detail row"),
    defineLocalizedText("네 번째 상세 행", "Fourth detail row"),
  ],
  externalDrop: {
    description: defineLocalizedText("드래그한 위젯을 여기에 놓으세요.", "Drop a dragged widget here."),
    label: defineLocalizedText("위젯을 여기에 놓으면 삭제됩니다", "Drop a widget here to delete it"),
    statusLabel: defineLocalizedText("외부 드롭 처리 상태", "External drop status"),
    title: defineLocalizedText("위젯 삭제 영역", "Widget delete area"),
  },
  statusLabels: {
    commit: defineLocalizedText("제어 레이아웃 커밋 상태", "Controlled layout commit status"),
    handle: defineLocalizedText("handle 작업 상태", "Handle operation status"),
    query: defineLocalizedText("GridStack 읽기 전용 상태", "Read-only GridStack status"),
  },
  status: {
    commitMissing: defineLocalizedText("커밋된 제어 레이아웃이 없습니다.", "No controlled layout has been committed."),
    commit: {
      en: (columns: number) => `Committed the ${columns}-column layout to React state.`,
      ko: (columns: number) => `${columns}컬럼 레이아웃을 React 상태에 커밋했습니다.`,
    },
    externalDropInitial: defineLocalizedText("위젯을 삭제 영역으로 드래그해 보세요.", "Drag a widget to the delete area."),
    gridNotReady: defineLocalizedText("GridStack이 아직 준비되지 않았습니다.", "GridStack is not ready yet."),
    handle: {
      compact: defineLocalizedText("compact 정렬을 커밋했습니다.", "Committed the compact arrangement."),
      list: defineLocalizedText("list 정렬을 커밋했습니다.", "Committed the list arrangement."),
      queried: defineLocalizedText("GridStack 상태를 조회했습니다.", "Queried the GridStack state."),
      ready: defineLocalizedText("GridStack이 준비되었습니다.", "GridStack is ready."),
      refreshed: defineLocalizedText("레이아웃을 갱신했습니다.", "Refreshed the layout."),
    },
    layout: {
      invalidState: defineLocalizedText("JSON 형식 또는 상태 값을 확인해 주세요.", "Check the JSON format or state values."),
      missing: defineLocalizedText("저장된 전체 상태가 없습니다.", "No full state has been saved."),
      restored: defineLocalizedText("전체 상태와 컬럼 캐시를 복원했습니다.", "Restored the full state and column cache."),
      saved: defineLocalizedText("전체 상태와 컬럼 캐시를 저장했습니다.", "Saved the full state and column cache."),
    },
  },
} as const;

export const widgetPlaygroundCopy = {
  controls: defineLocalizedText("위젯 예제 컨트롤", "Widget example controls"),
  dashboard: defineLocalizedText("위젯 대시보드", "Widget dashboard"),
  description: defineLocalizedText(
    "위젯을 추가·수정·삭제하고 개별 이동 및 크기 조절 잠금을 확인합니다.",
    "Add, edit, and delete widgets, then verify individual movement and resize locks.",
  ),
  actions: {
    delete: defineLocalizedText("삭제", "Delete"),
    edit: defineLocalizedText("수정", "Edit"),
    refresh: defineLocalizedText("새로고침", "Refresh"),
  },
  fullLock: {
    lock: defineLocalizedText("전체 잠금", "Lock all"),
    unlock: defineLocalizedText("전체 잠금 해제", "Unlock all"),
  },
  interactionActions: defineLocalizedText("위젯 상호작용 작업", "Widget interaction actions"),
  kicker: defineLocalizedText("위젯 예제", "Widget example"),
  moveLock: {
    lock: defineLocalizedText("이동 잠금", "Lock movement"),
    unlock: defineLocalizedText("이동 잠금 해제", "Unlock movement"),
  },
  refreshStatus: {
    en: (title: string) => `Refreshing ${title} content`,
    ko: (title: string) => `${title} 콘텐츠 새로고침 중`,
  },
  resizeLock: {
    lock: defineLocalizedText("리사이즈 잠금", "Lock resizing"),
    unlock: defineLocalizedText("리사이즈 잠금 해제", "Unlock resizing"),
  },
  title: defineLocalizedText("위젯", "Widget"),
} as const;

type FixturePresentation = {
  description: LocalizedText;
  title: LocalizedText;
};

const fixturePresentations: Record<ExampleFixtureCopyKey, FixturePresentation> = {
  alerts: {
    description: defineLocalizedText("미해결 이슈", "Unresolved issues"),
    title: defineLocalizedText("알림", "Alerts"),
  },
  orders: {
    description: defineLocalizedText("완료 주문", "Completed orders"),
    title: defineLocalizedText("주문", "Orders"),
  },
  sales: {
    description: defineLocalizedText("월간 반복 매출", "Monthly recurring revenue"),
    title: defineLocalizedText("매출", "Sales"),
  },
  traffic: {
    description: defineLocalizedText("활성 세션", "Active sessions"),
    title: defineLocalizedText("트래픽", "Traffic"),
  },
};

const generatedDescriptionPresentations: Record<ExampleGeneratedDescriptionKey, LocalizedText> = {
  editedWidget: defineLocalizedText("수정된 대시보드 위젯", "Updated dashboard widget"),
  newWidget: defineLocalizedText("새 대시보드 위젯", "New dashboard widget"),
};

function isExampleFixtureCopyKey(value: unknown): value is ExampleFixtureCopyKey {
  return value === "alerts" || value === "orders" || value === "sales" || value === "traffic";
}

function isExampleGeneratedDescriptionKey(value: unknown): value is ExampleGeneratedDescriptionKey {
  return value === "editedWidget" || value === "newWidget";
}

function getFixturePresentation(value: unknown): FixturePresentation | undefined {
  return isExampleFixtureCopyKey(value) ? fixturePresentations[value] : undefined;
}

function getGeneratedDescriptionPresentation(value: unknown): LocalizedText | undefined {
  return isExampleGeneratedDescriptionKey(value) ? generatedDescriptionPresentations[value] : undefined;
}


export function formatLayoutJsonStatus(status: LayoutJsonStatus, locale: PlaygroundLocale): string {
  return resolveLocalizedText(layoutPlaygroundCopy.status.json[status.type], locale);
}

export function formatLayoutOperationStatus(status: LayoutOperationStatus, locale: PlaygroundLocale): string {
  if (status.type === "arrange" || status.type === "fill") {
    return resolveLocalizedText(
      layoutPlaygroundCopy.status.operation[status.type][status.changed ? "changed" : "unchanged"],
      locale,
    );
  }

  return resolveLocalizedText(layoutPlaygroundCopy.status.operation[status.type], locale);
}

export function formatAdvancedLayoutStatus(status: AdvancedLayoutStatus, locale: PlaygroundLocale): string {
  return resolveLocalizedText(advancedPlaygroundCopy.status.layout[status.type], locale);
}

export function formatAdvancedHandleStatus(status: AdvancedHandleStatus, locale: PlaygroundLocale): string {
  if (status.type === "compacted") {
    return resolveLocalizedText(advancedPlaygroundCopy.status.handle[status.layout], locale);
  }
  if (status.type === "notReady") {
    return resolveLocalizedText(advancedPlaygroundCopy.status.gridNotReady, locale);
  }

  return resolveLocalizedText(advancedPlaygroundCopy.status.handle[status.type], locale);
}

export function formatAdvancedCommitStatus(status: AdvancedCommitStatus, locale: PlaygroundLocale): string {
  return status.type === "committed"
    ? advancedPlaygroundCopy.status.commit[locale](status.columns)
    : resolveLocalizedText(advancedPlaygroundCopy.status.commitMissing, locale);
}

export function formatAdvancedDiagnosticStatus(status: AdvancedDiagnosticStatus, locale: PlaygroundLocale): string {
  if (status.type === "diagnostic") {
    return status.value;
  }

  return resolveLocalizedText(advancedPlaygroundCopy.status[status.type], locale);
}

export function resolveDashboardActionLabels(locale: PlaygroundLocale) {
  return {
    maximize: resolveLocalizedText(sharedPlaygroundCopy.dashboardActions.maximize, locale),
    minimize: resolveLocalizedText(sharedPlaygroundCopy.dashboardActions.minimize, locale),
    remove: resolveLocalizedText(sharedPlaygroundCopy.dashboardActions.remove, locale),
    restore: resolveLocalizedText(sharedPlaygroundCopy.dashboardActions.restore, locale),
  };
}

export function createPresentedWidgets(
  widgets: DashboardWidget<ExampleWidgetData>[],
  locale: PlaygroundLocale,
  indexedFixtures = false,
): DashboardWidget<ExampleWidgetData>[] {
  return widgets.map((widget) => {
    const presentation = resolveWidgetPresentation(widget, locale, indexedFixtures);
    return {
      ...widget,
      data: widget.data ? { ...widget.data, description: presentation.description } : widget.data,
      title: presentation.title,
    };
  });
}

export function resolveWidgetPresentation(
  widget: DashboardWidget<ExampleWidgetData>,
  locale: PlaygroundLocale,
  indexedFixture = false,
): { description: string; title: string } {
  const generatedDescription = getGeneratedDescriptionPresentation(widget.data?.generatedDescriptionKey);

  if (generatedDescription) {
    return {
      description: resolveLocalizedText(generatedDescription, locale),
      title: widget.title ?? widget.id,
    };
  }

  if (indexedFixture && widget.data?.fixtureIndex !== undefined) {
    const fixtureIndex = widget.data.fixtureIndex;
    return {
      description: locale === "ko" ? `위젯 ${fixtureIndex} 콘텐츠` : `Widget ${fixtureIndex} content`,
      title: sharedPlaygroundCopy.generatedWidgetTitle[locale](fixtureIndex),
    };
  }

  const fixturePresentation = getFixturePresentation(widget.data?.fixtureCopyKey);

  if (fixturePresentation) {
    return {
      description: resolveLocalizedText(fixturePresentation.description, locale),
      title: resolveLocalizedText(fixturePresentation.title, locale),
    };
  }

  return {
    description: widget.data?.description ?? "",
    title: widget.title ?? widget.id,
  };
}
