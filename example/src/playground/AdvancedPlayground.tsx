import { useState } from "react";
import { Boxes, Columns3, Lock, Move, RotateCcw, Save, Settings2, Trash2, Unlock } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import type {
  DashboardExternalDropTarget,
  DashboardStateSnapshot,
  DashboardWidgetExternalDropEvent,
} from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import { createAdvancedPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const externalDropTargets = [
  { id: "trash", selector: "#advanced-widget-trash" },
] as const satisfies ReadonlyArray<DashboardExternalDropTarget>;

export function AdvancedPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: createAdvancedPlaygroundFixture(),
  });
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 레이아웃이 없습니다.");
  const [externalDropStatus, setExternalDropStatus] = useState("위젯을 삭제 영역으로 드래그해 보세요.");
  const [locked, setLocked] = useState(false);

  const saveLayout = () => {
    setLayoutJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setLayoutStatus("저장 완료");
  };

  const restoreLayout = () => {
    try {
      const parsed = JSON.parse(layoutJson) as DashboardStateSnapshot<ExampleWidgetData>;
      dashboard.commands.restoreLayout(parsed);
      setLayoutStatus("복원 완료");
    } catch {
      setLayoutStatus("JSON 형식을 확인해 주세요.");
    }
  };

  const handleWidgetExternalDrop = (event: DashboardWidgetExternalDropEvent) => {
    if (event.targetId !== "trash") {
      return;
    }

    dashboard.commands.removeWidget(event.widgetId);
    setExternalDropStatus(`${event.widgetId} 위젯을 삭제했습니다.`);
  };

  return (
    <section className="playground-workspace" data-example-mode="advanced">
      <PlaygroundHeader kicker="개발 예제" title="고급 예제" />
      <section aria-label="고급 예제 컨트롤" className="playground-controls">
        <WidgetCrudControls dashboard={dashboard} mode="advanced" />
        <div className="example-actions" aria-label="advanced layout actions">
          <button type="button" onClick={() => dashboard.commands.autoArrangeWidgets()}>
            <Boxes aria-hidden="true" size={14} />
            자동 정렬
          </button>
          <Select
            id="advanced-columns"
            label="컬럼 선택"
            options={columnOptions}
            value={String(dashboard.columns)}
            onChange={(value) => dashboard.commands.setColumns(Number(value))}
          />
          <button type="button" onClick={() => dashboard.commands.fitWidgetsToColumns()}>
            <Columns3 aria-hidden="true" size={14} />
            빈 공간 채우기
          </button>
          <button className="example-toggle-button" type="button" onClick={() => setMovable((value) => !value)} {...toggleStateProps(movable)}>
            <Move aria-hidden="true" size={14} />
            {movable ? "이동 가능" : "이동 불가"}
          </button>
          <button className="example-toggle-button" type="button" onClick={() => setResizable((value) => !value)} {...toggleStateProps(resizable)}>
            <Settings2 aria-hidden="true" size={14} />
            {resizable ? "크기 조절 가능" : "크기 조절 불가"}
          </button>
          <button className="example-toggle-button" type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
            {locked ? <Unlock aria-hidden="true" size={14} /> : <Lock aria-hidden="true" size={14} />}
            {locked ? "레이아웃 잠금" : "레이아웃 해제"}
          </button>
          <button type="button" onClick={() => dashboard.commands.resetLayout()}>
            <RotateCcw aria-hidden="true" size={14} />
            레이아웃 초기화
          </button>
          <button type="button" onClick={() => dashboard.commands.refreshLayout()}>
            레이아웃 갱신
          </button>
          <button type="button" onClick={saveLayout}>
            <Save aria-hidden="true" size={14} />
            레이아웃 저장
          </button>
          <button type="button" onClick={restoreLayout}>
            레이아웃 복원
          </button>
          <button className="example-action-button example-action-button--danger" type="button" onClick={() => dashboard.commands.clearWidgets()}>
            전체 삭제
          </button>
        </div>
        <LayoutJson id="advanced-layout-json" status={layoutStatus} value={layoutJson} onChange={setLayoutJson} />
        <section aria-label="외부 드롭 삭제 예제" className="example-external-drop">
          <div
            aria-describedby="advanced-external-drop-status"
            aria-label="위젯을 여기에 놓으면 삭제됩니다"
            className="example-external-drop__target"
            id="advanced-widget-trash"
          >
            <Trash2 aria-hidden="true" size={28} />
            <strong>위젯 삭제 영역</strong>
            <span>드래그한 위젯을 여기에 놓으세요.</span>
          </div>
          <p aria-label="외부 드롭 처리 상태" id="advanced-external-drop-status" role="status">
            {externalDropStatus}
          </p>
        </section>
      </section>
      <section aria-label="고급 예제 dashboard" className="playground-grid-region">
        <DashboardPreview
          dashboard={dashboard}
          externalDropTargets={externalDropTargets}
          movable={movable && !locked}
          resizable={resizable && !locked}
          onWidgetExternalDrop={handleWidgetExternalDrop}
        />
      </section>
    </section>
  );
}
