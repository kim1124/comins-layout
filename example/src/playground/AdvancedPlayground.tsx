import { useEffect, useRef, useState } from "react";
import { Lock, Move, Save, Settings2, Trash2, Unlock } from "lucide-react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type {
  DashboardExternalDropTarget,
  DashboardGridHandle,
  DashboardLayoutSnapshot,
  DashboardResponsiveOptions,
  DashboardWidgetExternalDropEvent,
} from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import { createAdvancedPlaygroundFixture } from "./fixtures";
import { sanitizeDashboardStateSnapshot } from "./state-snapshot";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = [
  { label: "6", value: "6" },
  { label: "12", value: "12" },
];

const externalDropTargets = [
  { id: "trash", selector: "[data-dashboard-drop-target='trash']" },
] as const satisfies ReadonlyArray<DashboardExternalDropTarget>;

const responsiveOptions: DashboardResponsiveOptions = {
  breakpointForWindow: true,
  columnMax: 12,
  breakpoints: [{ maxWidth: 900, columns: 6, layout: "moveScale" }],
};

const INITIAL_EXTERNAL_DROP_STATUS = "위젯을 삭제 영역으로 드래그해 보세요.";
const GRID_NOT_READY_STATUS = "GridStack이 아직 준비되지 않았습니다.";
const JSON_ERROR_STATUS = "JSON 형식 또는 상태 값을 확인해 주세요.";

export function AdvancedPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createAdvancedPlaygroundFixture(),
  });
  const gridRef = useRef<DashboardGridHandle>(null);
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [locked, setLocked] = useState(false);
  const [responsiveEnabled, setResponsiveEnabled] = useState(false);
  const [floatEnabled, setFloatEnabled] = useState(false);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 전체 상태가 없습니다.");
  const [externalDropStatus, setExternalDropStatus] = useState(INITIAL_EXTERNAL_DROP_STATUS);
  const [handleStatus, setHandleStatus] = useState(GRID_NOT_READY_STATUS);
  const [queryStatus, setQueryStatus] = useState(GRID_NOT_READY_STATUS);
  const [commitStatus, setCommitStatus] = useState("커밋된 제어 레이아웃이 없습니다.");

  const cacheKeys = Object.keys(dashboard.state.layoutsByColumn)
    .map(Number)
    .sort((left, right) => left - right)
    .join(", ");

  const refreshGridQueries = () => {
    const grid = gridRef.current?.getGridStack();
    if (!grid) {
      setQueryStatus(GRID_NOT_READY_STATUS);
      return false;
    }

    setQueryStatus(`column=${grid.getColumn()}; row=${grid.getRow()}; float=${String(grid.getFloat())}`);
    return true;
  };

  useEffect(() => {
    let frame: number | undefined;
    let remainingAttempts = 120;

    const readWhenReady = () => {
      if (refreshGridQueries()) {
        setHandleStatus((status) => status === GRID_NOT_READY_STATUS ? "GridStack이 준비되었습니다." : status);
        return;
      }
      if (remainingAttempts <= 0) {
        return;
      }
      remainingAttempts -= 1;
      frame = window.requestAnimationFrame(readWhenReady);
    };

    frame = window.requestAnimationFrame(readWhenReady);
    return () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [dashboard.columns, floatEnabled, responsiveEnabled]);

  const saveLayout = () => {
    setLayoutJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setLayoutStatus("전체 상태와 컬럼 캐시를 저장했습니다.");
  };

  const restoreLayout = () => {
    try {
      const parsed: unknown = JSON.parse(layoutJson);
      const snapshot = sanitizeDashboardStateSnapshot<ExampleWidgetData>(parsed);
      if (!snapshot) {
        throw new Error("invalid dashboard state snapshot");
      }
      dashboard.commands.restoreLayout(snapshot);
      setLayoutStatus("전체 상태와 컬럼 캐시를 복원했습니다.");
    } catch {
      setLayoutStatus(JSON_ERROR_STATUS);
    }
  };

  const handleLayoutCommit = (snapshot: DashboardLayoutSnapshot) => {
    dashboard.commands.applyLayoutSnapshot(snapshot);
    setCommitStatus(`${snapshot.columns}컬럼 레이아웃을 React 상태에 커밋했습니다.`);
  };

  const handleWidgetExternalDrop = (event: DashboardWidgetExternalDropEvent) => {
    if (event.targetId !== "trash") {
      return;
    }

    dashboard.commands.removeWidget(event.widgetId);
    const { h, w, x, y } = event.layout;
    setExternalDropStatus(
      `target=${event.targetId}; widget=${event.widgetId}; columns=${event.columns}; layout=${x},${y},${w},${h}`,
    );
  };

  const compactAndCommit = (layout: "compact" | "list") => {
    const handle = gridRef.current;
    if (!handle?.getGridStack()) {
      setHandleStatus(GRID_NOT_READY_STATUS);
      return;
    }

    handle.compact(layout, true);
    const snapshot = handle.commitLayout();
    if (!snapshot) {
      setHandleStatus(GRID_NOT_READY_STATUS);
      return;
    }

    setHandleStatus(`${layout} 정렬을 커밋했습니다.`);
    window.requestAnimationFrame(refreshGridQueries);
  };

  const queryGridStatus = () => {
    if (refreshGridQueries()) {
      setHandleStatus("GridStack 상태를 조회했습니다.");
    }
  };

  const refreshLayout = () => {
    dashboard.commands.refreshLayout();
    setHandleStatus("레이아웃을 갱신했습니다.");
    window.requestAnimationFrame(refreshGridQueries);
  };

  return (
    <section className="playground-workspace" data-example-mode="advanced">
      <PlaygroundHeader
        description="반응형 컬럼, 안전한 GridStack handle, 외부 드롭을 제어 상태와 함께 검증합니다."
        kicker="개발 예제"
        title="고급 예제"
      />
      <section aria-label="고급 예제 컨트롤" className="playground-controls playground-advanced-controls">
        <section aria-label="고급 위젯 CRUD" className="example-control-group">
          <h2>제어 위젯</h2>
          <WidgetCrudControls dashboard={dashboard} mode="advanced" />
        </section>

        <section aria-label="고급 컬럼과 엔진 옵션" className="example-control-group">
          <h2>컬럼과 엔진 옵션</h2>
          <div className="example-actions">
            <Select
              id="advanced-columns"
              label="컬럼 선택"
              options={columnOptions}
              value={String(dashboard.columns)}
              onChange={(value) => dashboard.commands.setColumns(Number(value))}
            />
            <button
              className="example-toggle-button"
              type="button"
              onClick={() => setResponsiveEnabled((value) => !value)}
              {...toggleStateProps(responsiveEnabled)}
            >
              반응형 컬럼 사용
            </button>
            <button
              className="example-toggle-button"
              type="button"
              onClick={() => setFloatEnabled((value) => !value)}
              {...toggleStateProps(floatEnabled)}
            >
              Float 사용
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
          </div>
          <p aria-label="활성 컬럼 상태" className="example-status" role="status">
            현재 {dashboard.columns}컬럼입니다.
          </p>
          <p aria-label="사용 가능한 컬럼 캐시" className="example-status" role="status">
            사용 가능한 캐시 컬럼: {cacheKeys}
          </p>
        </section>

        <section aria-label="공개 handle 예제" className="example-control-group">
          <h2>안전한 공개 handle</h2>
          <div className="example-actions">
            <button type="button" onClick={() => compactAndCommit("compact")}>compact 정렬 후 커밋</button>
            <button type="button" onClick={() => compactAndCommit("list")}>list 정렬 후 커밋</button>
            <button type="button" onClick={refreshLayout}>레이아웃 갱신</button>
            <button type="button" onClick={queryGridStatus}>엔진 상태 조회</button>
          </div>
          <p aria-label="handle 작업 상태" className="example-status" role="status">{handleStatus}</p>
          <p aria-label="GridStack 읽기 전용 상태" className="example-status" role="status">{queryStatus}</p>
          <p aria-label="제어 레이아웃 커밋 상태" className="example-status" role="status">{commitStatus}</p>
        </section>

        <section aria-label="전체 상태 저장 복원" className="example-control-group">
          <h2>전체 상태와 컬럼 캐시</h2>
          <div className="example-actions">
            <button type="button" onClick={saveLayout}>
              <Save aria-hidden="true" size={14} />
              전체 상태 저장
            </button>
            <button type="button" onClick={restoreLayout}>전체 상태 복원</button>
            <button className="example-action-button example-action-button--danger" type="button" onClick={() => dashboard.commands.clearWidgets()}>
              전체 삭제
            </button>
          </div>
          <LayoutJson
            id="advanced-layout-json"
            label="전체 상태 및 컬럼 캐시 JSON"
            status={layoutStatus}
            statusLabel="전체 상태 저장 복원 상태"
            value={layoutJson}
            onChange={setLayoutJson}
          />
        </section>

        <section aria-label="외부 드롭 삭제 예제" className="example-external-drop">
          <div
            aria-describedby="advanced-external-drop-status"
            aria-label="위젯을 여기에 놓으면 삭제됩니다"
            className="example-external-drop__target"
            data-dashboard-drop-target="trash"
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
        <p className="example-widget-count">위젯 {dashboard.widgets.length}개</p>
        <DashboardGrid
          ref={gridRef}
          columns={dashboard.columns}
          engineOptions={{ animate: false, float: floatEnabled }}
          externalDropTargets={externalDropTargets}
          movable={movable && !locked}
          refreshKey={dashboard.refreshVersion}
          resizable={resizable && !locked}
          responsive={responsiveEnabled ? responsiveOptions : undefined}
          widgets={dashboard.widgets}
          onColumnsChange={dashboard.commands.setColumns}
          onLayoutCommit={handleLayoutCommit}
          onMaximizeWidget={dashboard.commands.maximizeWidget}
          onMinimizeWidget={dashboard.commands.minimizeWidget}
          onRemoveWidget={dashboard.commands.removeWidget}
          onRestoreWidget={dashboard.commands.restoreWidget}
          onWidgetExternalDrop={handleWidgetExternalDrop}
          onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
          renderWidget={(widget) => (
            <div className="dashboard-widget-body">
              <span>{widget.data?.description}</span>
              <strong>{widget.data?.value}</strong>
            </div>
          )}
        />
      </section>
    </section>
  );
}
