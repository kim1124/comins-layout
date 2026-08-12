import type { DashboardWidget } from "../../../src";
import { defineLocalizedText, resolveLocalizedText } from "../i18n/playground-locale";
import type { LocalizedText, PlaygroundLocale } from "../i18n/types";
import type { ExampleFixtureCopyKey, ExampleWidgetData } from "./types";

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
