import { useRef, useState } from "react";
import { Lock, Move, Settings2 } from "lucide-react";

import { useDashboardGrid } from "../../../src";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import type { EditedWidgetDraft, NewWidgetDraft } from "./components/WidgetCrudControls";
import { createWidgetPlaygroundFixture } from "./fixtures";
import { createWidget } from "./fixtures";
import type { ExampleWidgetData } from "./types";

export function WidgetPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: createWidgetPlaygroundFixture(),
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | undefined>("sales");
  const [status, setStatus] = useState("매출 위젯을 선택했습니다.");
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedWidgetId);
  const moveLocked = selectedWidget?.locked === true || selectedWidget?.movable === false;
  const resizeLocked = selectedWidget?.locked === true || selectedWidget?.resizable === false;
  const fullyLocked = selectedWidget?.locked === true;

  const selectWidget = (id: string | undefined) => {
    setSelectedWidgetId(id);
    const widget = dashboard.widgets.find((candidate) => candidate.id === id);
    setStatus(widget ? `${widget.title ?? widget.id} 위젯을 선택했습니다.` : "선택할 위젯이 없습니다.");
  };

  const addWidget = (draft: NewWidgetDraft) => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    const id = `widget-${number}`;
    dashboard.commands.addWidget(
      createWidget(id, draft.title, 0, 0, draft.width, draft.height, {
        description: "새 대시보드 위젯",
        value: draft.value,
      }),
    );
    setSelectedWidgetId(id);
    setStatus(`${draft.title} 위젯을 추가했습니다.`);
  };

  const editWidget = (draft: EditedWidgetDraft) => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      data: {
        description: selectedWidget.data?.description ?? `${draft.title} dashboard widget`,
        value: draft.value,
      },
      title: draft.title,
    });
    setStatus(`${draft.title} 위젯을 수정했습니다.`);
  };

  const removeWidget = (id: string) => {
    const removedWidget = dashboard.widgets.find((widget) => widget.id === id);
    if (!removedWidget) {
      return;
    }

    const nextWidget = dashboard.widgets.find((widget) => widget.id !== id);
    dashboard.commands.removeWidget(id);
    setSelectedWidgetId(nextWidget?.id);
    setStatus(nextWidget ? `${nextWidget.title ?? nextWidget.id} 위젯을 선택했습니다.` : "선택할 위젯이 없습니다.");
  };

  const deleteWidget = () => {
    if (selectedWidget) {
      removeWidget(selectedWidget.id);
    }
  };

  const clearWidgets = () => {
    dashboard.commands.clearWidgets();
    setSelectedWidgetId(undefined);
    setStatus("선택할 위젯이 없습니다.");
  };

  const toggleMoveLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      movable: moveLocked,
    });
    setStatus(moveLocked ? "선택 위젯의 이동 잠금을 해제했습니다." : "선택 위젯의 이동을 잠갔습니다.");
  };

  const toggleResizeLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      resizable: resizeLocked,
    });
    setStatus(resizeLocked ? "선택 위젯의 리사이즈 잠금을 해제했습니다." : "선택 위젯의 리사이즈를 잠갔습니다.");
  };

  const toggleFullLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, { locked: !fullyLocked });
    setStatus(fullyLocked ? "선택 위젯의 전체 잠금을 해제했습니다." : "선택 위젯을 전체 잠금했습니다.");
  };

  const serializedState = JSON.stringify(dashboard.commands.serializeState(), null, 2);

  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader
        description="위젯을 추가·수정·삭제하고 개별 이동 및 크기 조절 잠금을 확인합니다."
        kicker="위젯 예제"
        title="위젯"
      />
      <section aria-label="위젯 예제 컨트롤" className="playground-controls">
        <WidgetCrudControls
          addDialogOpen={addDialogOpen}
          canEdit
          dashboard={dashboard}
          editDialogOpen={editDialogOpen}
          mode="widget"
          nextWidgetNumber={nextWidgetNumber.current}
          selectedWidgetId={selectedWidgetId}
          onAddDialogOpenChange={setAddDialogOpen}
          onAddWidget={addWidget}
          onClearWidgets={clearWidgets}
          onDeleteWidget={deleteWidget}
          onEditDialogOpenChange={setEditDialogOpen}
          onEditWidget={editWidget}
          onSelectedWidgetIdChange={selectWidget}
        />
        <fieldset className="example-actions example-interaction-actions" disabled={!selectedWidget} aria-label="widget interaction actions">
          <button className="example-toggle-button" disabled={!selectedWidget || fullyLocked} type="button" onClick={toggleMoveLock} {...toggleStateProps(moveLocked)}>
            <Move aria-hidden="true" size={14} />
            이동 잠금
          </button>
          <button className="example-toggle-button" disabled={!selectedWidget || fullyLocked} type="button" onClick={toggleResizeLock} {...toggleStateProps(resizeLocked)}>
            <Settings2 aria-hidden="true" size={14} />
            리사이즈 잠금
          </button>
          <button
            className="example-toggle-button"
            disabled={!selectedWidget}
            type="button"
            onClick={toggleFullLock}
            {...toggleStateProps(fullyLocked)}
          >
            <Lock aria-hidden="true" size={14} />
            전체 잠금
          </button>
        </fieldset>
        <p aria-label="위젯 작업 상태" aria-live="polite" className="example-status" role="status">
          {status}
        </p>
        <details className="example-state-output">
          <summary>현재 위젯 상태</summary>
          <pre aria-label="현재 위젯 상태 JSON">{serializedState}</pre>
        </details>
      </section>
      <section aria-label="위젯 dashboard" className="playground-grid-region">
        <DashboardPreview
          dashboard={dashboard}
          selectedWidgetId={selectedWidgetId}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          onWidgetRemove={removeWidget}
          onWidgetSelect={selectWidget}
        />
      </section>
    </section>
  );
}
