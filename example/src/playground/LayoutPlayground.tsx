import { useEffect, useRef, useState } from "react";
import { Boxes, Columns3, RotateCcw, Save } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import type { DashboardLayoutSnapshot, DashboardStateSnapshotInput, DashboardWidgetLayout } from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { DashboardPreview, PlaygroundHeader } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import { createLayoutPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const JSON_ERROR_STATUS = "JSON 형식 또는 레이아웃 값을 확인해 주세요.";
const layoutLimitKeys = ["minW", "minH", "maxW", "maxH"] as const;
const supportedColumnKeys = new Set(DASHBOARD_COLUMN_COUNTS.map(String));

type PendingLayoutOperation = {
  before: string;
  type: "arrange" | "fill";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayout(value: unknown): value is DashboardWidgetLayout {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    [value.x, value.y, value.w, value.h].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) &&
    layoutLimitKeys.every((key) => value[key] === undefined || (typeof value[key] === "number" && Number.isFinite(value[key]))) &&
    (value.w as number) > 0 &&
    (value.h as number) > 0
  );
}

function hasUniqueLayoutIds(layouts: DashboardWidgetLayout[]): boolean {
  return new Set(layouts.map((layout) => layout.id)).size === layouts.length;
}

function isPreviousLayoutMap(value: unknown, widgetIds: ReadonlySet<string>): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([id, layout]) => widgetIds.has(id) && isLayout(layout) && layout.id === id,
    )
  );
}

function isColumnLayoutSnapshot(value: unknown, widgetIds: ReadonlySet<string>): boolean {
  if (!isRecord(value) || !Array.isArray(value.widgets) || !value.widgets.every(isLayout)) {
    return false;
  }

  return (
    hasUniqueLayoutIds(value.widgets) &&
    value.widgets.every((layout) => widgetIds.has(layout.id)) &&
    isPreviousLayoutMap(value.previousLayouts, widgetIds)
  );
}

function isLayoutsByColumn(value: unknown, widgetIds: ReadonlySet<string>): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([column, snapshot]) => !supportedColumnKeys.has(column) || isColumnLayoutSnapshot(snapshot, widgetIds),
  );
}

function isSupportedColumns(value: unknown): value is DashboardLayoutSnapshot["columns"] {
  return typeof value === "number" && DASHBOARD_COLUMN_COUNTS.includes(value as DashboardLayoutSnapshot["columns"]);
}

function isLayoutSnapshot(value: unknown): value is DashboardLayoutSnapshot {
  return isRecord(value) && isSupportedColumns(value.columns) && Array.isArray(value.widgets) && value.widgets.every(isLayout);
}

function isStateSnapshot(value: unknown): value is DashboardStateSnapshotInput<ExampleWidgetData> {
  if (!isRecord(value) || !isSupportedColumns(value.columns) || !Array.isArray(value.widgets)) {
    return false;
  }

  const validWidgets = value.widgets.every(
    (widget) =>
      isRecord(widget) &&
      typeof widget.id === "string" &&
      isLayout(widget.layout) &&
      widget.layout.id === widget.id,
  );
  if (!validWidgets) {
    return false;
  }

  const widgetIds = new Set(value.widgets.map((widget) => (widget as { id: string }).id));
  if (widgetIds.size !== value.widgets.length) {
    return false;
  }

  return (
    (value.previousLayouts === undefined || isPreviousLayoutMap(value.previousLayouts, widgetIds)) &&
    (value.layoutsByColumn === undefined || isLayoutsByColumn(value.layoutsByColumn, widgetIds))
  );
}

export function LayoutPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [activeLayoutJson, setActiveLayoutJson] = useState("");
  const [activeLayoutStatus, setActiveLayoutStatus] = useState("저장된 활성 레이아웃이 없습니다.");
  const [fullStateJson, setFullStateJson] = useState("");
  const [fullStateStatus, setFullStateStatus] = useState("저장된 전체 상태가 없습니다.");
  const [operationStatus, setOperationStatus] = useState("자동 정렬 또는 빈 공간 채우기를 실행해 보세요.");
  const pendingOperation = useRef<PendingLayoutOperation | null>(null);

  useEffect(() => {
    const pending = pendingOperation.current;
    if (!pending) {
      return;
    }

    pendingOperation.current = null;
    const changed = pending.before !== JSON.stringify(dashboard.commands.serializeLayout());
    if (pending.type === "fill") {
      setOperationStatus(changed ? "행의 빈 공간을 채웠습니다." : "빈 공간이 없어 변경하지 않았습니다.");
      return;
    }

    setOperationStatus(changed ? "패키지 순서로 위젯을 자동 정렬했습니다." : "자동 정렬할 변경이 없습니다.");
  }, [dashboard.state]);

  const saveActiveLayout = () => {
    setActiveLayoutJson(JSON.stringify(dashboard.commands.serializeLayout(), null, 2));
    setActiveLayoutStatus("활성 레이아웃을 저장했습니다.");
  };

  const restoreActiveLayout = () => {
    try {
      const parsed: unknown = JSON.parse(activeLayoutJson);
      if (!isLayoutSnapshot(parsed)) {
        throw new Error("invalid layout snapshot");
      }
      dashboard.commands.applyLayoutSnapshot(parsed);
      setActiveLayoutStatus("활성 레이아웃을 복원했습니다.");
    } catch {
      setActiveLayoutStatus(JSON_ERROR_STATUS);
    }
  };

  const saveFullState = () => {
    setFullStateJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setFullStateStatus("전체 상태와 컬럼 캐시를 저장했습니다.");
  };

  const restoreFullState = () => {
    try {
      const parsed: unknown = JSON.parse(fullStateJson);
      if (!isStateSnapshot(parsed)) {
        throw new Error("invalid state snapshot");
      }
      dashboard.commands.restoreLayout(parsed);
      setFullStateStatus("전체 상태와 컬럼 캐시를 복원했습니다.");
    } catch {
      setFullStateStatus(JSON_ERROR_STATUS);
    }
  };

  const runLayoutOperation = (type: PendingLayoutOperation["type"]) => {
    pendingOperation.current = {
      before: JSON.stringify(dashboard.commands.serializeLayout()),
      type,
    };
    if (type === "fill") {
      dashboard.commands.fitWidgetsToColumns();
      return;
    }
    dashboard.commands.autoArrangeWidgets();
  };

  const resetLayout = () => {
    pendingOperation.current = null;
    dashboard.commands.resetLayout();
    setOperationStatus("초기 12컬럼 레이아웃과 캐시로 복원했습니다.");
  };

  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader kicker="레이아웃 예제" title="레이아웃" />
      <section aria-label="레이아웃 예제 컨트롤" className="playground-controls playground-layout-controls">
        <section aria-label="레이아웃 위젯 CRUD" className="example-control-group">
          <h2>위젯 CRUD</h2>
          <WidgetCrudControls canClear canEdit dashboard={dashboard} mode="layout" />
        </section>

        <section aria-label="레이아웃 컬럼" className="example-control-group">
          <h2>컬럼</h2>
          <div className="example-actions">
            <Select
              id="layout-columns"
              label="컬럼 선택"
              options={columnOptions}
              value={String(dashboard.columns)}
              onChange={(value) => dashboard.commands.setColumns(Number(value))}
            />
          </div>
          <p aria-label="활성 컬럼 상태" className="example-status" role="status">
            현재 {dashboard.columns}컬럼입니다.
          </p>
        </section>

        <section aria-label="활성 레이아웃 저장 복원" className="example-control-group">
          <h2>활성 레이아웃</h2>
          <div className="example-actions">
            <button type="button" onClick={saveActiveLayout}>
              <Save aria-hidden="true" size={14} />
              활성 레이아웃 저장
            </button>
            <button type="button" onClick={restoreActiveLayout}>활성 레이아웃 복원</button>
          </div>
          <LayoutJson
            id="layout-active-json"
            label="활성 레이아웃 JSON"
            status={activeLayoutStatus}
            statusLabel="활성 레이아웃 저장 복원 상태"
            value={activeLayoutJson}
            onChange={setActiveLayoutJson}
          />
        </section>

        <section aria-label="전체 상태 저장 복원" className="example-control-group">
          <h2>전체 상태와 컬럼 캐시</h2>
          <div className="example-actions">
            <button type="button" onClick={saveFullState}>
              <Save aria-hidden="true" size={14} />
              전체 상태 저장
            </button>
            <button type="button" onClick={restoreFullState}>전체 상태 복원</button>
          </div>
          <LayoutJson
            id="layout-full-state-json"
            label="전체 상태 및 컬럼 캐시 JSON"
            status={fullStateStatus}
            statusLabel="전체 상태 저장 복원 상태"
            value={fullStateJson}
            onChange={setFullStateJson}
          />
        </section>

        <section aria-label="레이아웃 재배치" className="example-control-group">
          <h2>정렬과 초기화</h2>
          <p className="example-control-description">
            자동 정렬은 패키지 순서로 위젯을 위에서부터 배치하고, 빈 공간 채우기는 같은 y 행의 가로 빈 공간만 재분배합니다.
          </p>
          <div className="example-actions">
            <button type="button" onClick={() => runLayoutOperation("arrange")}>
              <Boxes aria-hidden="true" size={14} />
              자동 정렬
            </button>
            <button type="button" onClick={() => runLayoutOperation("fill")}>
              <Columns3 aria-hidden="true" size={14} />
              빈 공간 채우기
            </button>
            <button type="button" onClick={resetLayout}>
              <RotateCcw aria-hidden="true" size={14} />
              레이아웃 초기화
            </button>
          </div>
          <p aria-label="레이아웃 작업 상태" className="example-status" role="status">
            {operationStatus}
          </p>
        </section>
      </section>
      <section aria-label="레이아웃 dashboard" className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} onLayoutCommit={dashboard.commands.applyLayoutSnapshot} />
      </section>
    </section>
  );
}
