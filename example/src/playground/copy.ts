import type { DashboardWidget } from "../../../src";
import { defineLocalizedText, resolveLocalizedText } from "../i18n/playground-locale";
import type { LocalizedText, PlaygroundLocale } from "../i18n/types";
import type { ExampleFixtureCopyKey, ExampleWidgetData } from "./types";

export type WidgetStatus =
  | { type: "added"; title: string }
  | { type: "edited"; title: string }
  | { type: "empty" }
  | { type: "fullLock"; active: boolean }
  | { type: "moveLock"; active: boolean }
  | { type: "resizeLock"; active: boolean }
  | { type: "selected"; title: string };

export const sharedPlaygroundCopy = {
  addWidget: defineLocalizedText("위젯 추가", "Add widget"),
  cancel: defineLocalizedText("취소", "Cancel"),
  clearAll: defineLocalizedText("전체 삭제", "Clear all"),
  closeDialog: defineLocalizedText("팝업 닫기", "Close dialog"),
  deleteSelectedWidget: defineLocalizedText("선택 위젯 삭제", "Delete selected widget"),
  dialog: {
    add: {
      description: defineLocalizedText("추가할 위젯의 제목, 값, 너비와 높이를 입력합니다.", "Enter the new widget's title, value, width, and height."),
      title: defineLocalizedText("위젯 추가", "Add widget"),
    },
    edit: {
      description: defineLocalizedText("선택한 위젯의 제목과 값을 변경합니다.", "Change the selected widget's title and value."),
      title: defineLocalizedText("위젯 수정", "Edit widget"),
    },
  },
  editSelectedWidget: defineLocalizedText("선택 위젯 수정", "Edit selected widget"),
  newWidgetHeight: defineLocalizedText("새 위젯 높이", "New widget height"),
  newWidgetWidth: defineLocalizedText("새 위젯 너비", "New widget width"),
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
} as const;

export const widgetPlaygroundCopy = {
  controls: defineLocalizedText("위젯 예제 컨트롤", "Widget example controls"),
  dashboard: defineLocalizedText("위젯 대시보드", "Widget dashboard"),
  description: defineLocalizedText(
    "위젯을 추가·수정·삭제하고 개별 이동 및 크기 조절 잠금을 확인합니다.",
    "Add, edit, and delete widgets, then verify individual movement and resize locks.",
  ),
  fullLock: defineLocalizedText("전체 잠금", "Lock all"),
  interactionActions: defineLocalizedText("위젯 상호작용 작업", "Widget interaction actions"),
  kicker: defineLocalizedText("위젯 예제", "Widget example"),
  moveLock: defineLocalizedText("이동 잠금", "Lock movement"),
  resizeLock: defineLocalizedText("리사이즈 잠금", "Lock resizing"),
  state: {
    jsonLabel: defineLocalizedText("현재 위젯 상태 JSON", "Current widget state JSON"),
    summary: defineLocalizedText("현재 위젯 상태", "Current widget state"),
  },
  status: {
    added: {
      en: (title: string) => `Added the ${title} widget.`,
      ko: (title: string) => `${title} 위젯을 추가했습니다.`,
    },
    edited: {
      en: (title: string) => `Updated the ${title} widget.`,
      ko: (title: string) => `${title} 위젯을 수정했습니다.`,
    },
    empty: defineLocalizedText("선택할 위젯이 없습니다.", "There are no widgets to select."),
    fullLock: {
      en: (active: boolean) => active ? "Fully locked the selected widget." : "Unlocked the selected widget.",
      ko: (active: boolean) => active ? "선택 위젯을 전체 잠금했습니다." : "선택 위젯의 전체 잠금을 해제했습니다.",
    },
    label: defineLocalizedText("위젯 작업 상태", "Widget action status"),
    moveLock: {
      en: (active: boolean) => active ? "Locked movement for the selected widget." : "Unlocked movement for the selected widget.",
      ko: (active: boolean) => active ? "선택 위젯의 이동을 잠갔습니다." : "선택 위젯의 이동 잠금을 해제했습니다.",
    },
    resizeLock: {
      en: (active: boolean) => active ? "Locked resizing for the selected widget." : "Unlocked resizing for the selected widget.",
      ko: (active: boolean) => active ? "선택 위젯의 리사이즈를 잠갔습니다." : "선택 위젯의 리사이즈 잠금을 해제했습니다.",
    },
    selected: {
      en: (title: string) => `Selected the ${title} widget.`,
      ko: (title: string) => `${title} 위젯을 선택했습니다.`,
    },
  },
  title: defineLocalizedText("위젯", "Widget"),
} as const;

const WIDGET_STATUS_FIXTURE_PREFIX = "fixture:";

export function toWidgetStatusTitle(widget: DashboardWidget<ExampleWidgetData>): string {
  const fixtureCopyKey = widget.data?.fixtureCopyKey;
  return fixtureCopyKey ? `${WIDGET_STATUS_FIXTURE_PREFIX}${fixtureCopyKey}` : widget.title ?? widget.id;
}

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

function resolveWidgetStatusTitle(title: string, locale: PlaygroundLocale): string {
  const fixtureCopyKey = title.startsWith(WIDGET_STATUS_FIXTURE_PREFIX)
    ? title.slice(WIDGET_STATUS_FIXTURE_PREFIX.length) as ExampleFixtureCopyKey
    : undefined;
  const fixturePresentation = fixtureCopyKey ? fixturePresentations[fixtureCopyKey] : undefined;

  return fixturePresentation ? resolveLocalizedText(fixturePresentation.title, locale) : title;
}

export function formatWidgetStatus(status: WidgetStatus, locale: PlaygroundLocale): string {
  switch (status.type) {
    case "added":
    case "edited":
    case "selected":
      return widgetPlaygroundCopy.status[status.type][locale](resolveWidgetStatusTitle(status.title, locale));
    case "empty":
      return resolveLocalizedText(widgetPlaygroundCopy.status.empty, locale);
    case "fullLock":
    case "moveLock":
    case "resizeLock":
      return widgetPlaygroundCopy.status[status.type][locale](status.active);
  }
}

export function createPresentedWidgets(
  widgets: DashboardWidget<ExampleWidgetData>[],
  locale: PlaygroundLocale,
): DashboardWidget<ExampleWidgetData>[] {
  return widgets.map((widget) => {
    const presentation = resolveWidgetPresentation(widget, locale);
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
): { description: string; title: string } {
  const fixtureCopyKey = widget.data?.fixtureCopyKey;
  const fixturePresentation = fixtureCopyKey ? fixturePresentations[fixtureCopyKey] : undefined;

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
