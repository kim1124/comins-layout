import { useRef, useState } from "react";
import { ArrowLeftRight, Copy, MoveRight } from "lucide-react";

import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  transferDashboardWidget,
  useDashboardGrid,
} from "../../../src";
import type {
  DashboardLayoutState,
  DashboardWidget,
  DashboardWidgetDropCandidate,
  DashboardWidgetDropRequest,
  DashboardWidgetLayout,
  DashboardWidgetTransferMode,
  UseDashboardGridResult,
} from "../../../src";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { WidgetPalette } from "./components/WidgetPalette";
import type { WidgetPaletteDefinition } from "./components/WidgetPalette";
import { createWidget } from "./fixtures";
import type { LocalizedText } from "./locale";
import { usePlaygroundLocale } from "./locale";
import type { PlaygroundLocale } from "./routes";
import type { ExampleWidgetData } from "./types";

type GridId = "grid-a" | "grid-b";
type TransferRuntime = UseDashboardGridResult<ExampleWidgetData>;

type TransferOperation = {
  status: "idle" | "accepted" | "rejected";
  reason?: string;
  operationId?: string;
  source?: string;
  target?: string;
  mode?: DashboardWidgetTransferMode;
  widgetId?: string;
  targetLayout?: DashboardWidgetLayout;
};

const INITIAL_OPERATION: TransferOperation = {
  status: "idle",
};

const gridLabels: Record<GridId, string> = {
  "grid-a": "Grid A",
  "grid-b": "Grid B",
};

export function TransferPlayground() {
  const { text } = usePlaygroundLocale();
  const gridA = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: [
      createTransferWidget("a-sales", "매출 KPI", 0, 0, 2, 2, "kpi", "1.28억"),
      createTransferWidget("a-chart", "추세 차트", 2, 0, 4, 2, "chart", "+18.4%"),
    ],
  });
  const gridB = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: [
      createTransferWidget("b-table", "주문 표", 0, 0, 4, 2, "table", "1,284건"),
    ],
  });
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");
  const [transferMode, setTransferMode] = useState<DashboardWidgetTransferMode>("move");
  const [operation, setOperation] = useState<TransferOperation>(INITIAL_OPERATION);
  const paletteSequence = useRef<Record<string, number>>({});
  const buttonOperationSequence = useRef(0);

  const runtimeFor = (gridId: GridId) => gridId === "grid-a" ? gridA : gridB;

  const createPaletteWidget = (
    paletteId: string,
    label: string,
    kind: NonNullable<ExampleWidgetData["kind"]>,
    previewLayout: { w: number; h: number },
  ) => {
    const sequence = (paletteSequence.current[paletteId] ?? 0) + 1;
    paletteSequence.current[paletteId] = sequence;
    const id = `${paletteId}-${sequence}`;
    return createTransferWidget(
      id,
      label,
      0,
      0,
      previewLayout.w,
      previewLayout.h,
      kind,
      kind === "kpi" ? "42" : kind === "chart" ? "+12.6%" : kind === "table" ? "320행" : "거부됨",
    );
  };

  const paletteDefinitions: ReadonlyArray<WidgetPaletteDefinition<ExampleWidgetData>> = [
    {
      id: "palette-kpi",
      label: "KPI",
      description: text("2×2 핵심 지표", "2×2 key metric"),
      previewLayout: { w: 2, h: 2 },
      createWidget: () => createPaletteWidget("palette-kpi", "신규 KPI", "kpi", { w: 2, h: 2 }),
    },
    {
      id: "palette-chart",
      label: text("차트", "Chart"),
      description: text("4×2 추세 시각화", "4×2 trend visualization"),
      previewLayout: { w: 4, h: 2 },
      createWidget: () => createPaletteWidget("palette-chart", "신규 차트", "chart", { w: 4, h: 2 }),
    },
    {
      id: "palette-table",
      label: text("표", "Table"),
      description: text("6×2 데이터 목록", "6×2 data list"),
      previewLayout: { w: 6, h: 2 },
      createWidget: () => createPaletteWidget("palette-table", "신규 표", "table", { w: 6, h: 2 }),
    },
    {
      id: "palette-restricted",
      label: text("제한 위젯", "Restricted widget"),
      description: text("predicate 거부 확인", "Verify predicate rejection"),
      previewLayout: { w: 2, h: 2 },
      restricted: true,
      createWidget: () => createPaletteWidget("palette-restricted", "제한 위젯", "restricted", { w: 2, h: 2 }),
    },
  ];

  const updateRejectedOperation = (
    candidate: DashboardWidgetDropCandidate<ExampleWidgetData>,
    reason: string,
  ) => {
    setOperation({
      status: "rejected",
      reason,
      source: describeSource(candidate),
      target: candidate.targetGridId,
      mode: candidate.mode,
      widgetId: candidate.widget.id,
    });
  };

  const acceptCandidate = (candidate: DashboardWidgetDropCandidate<ExampleWidgetData>) => {
    return candidate.widget.data?.kind !== "restricted";
  };

  const applyAcceptedRequest = (request: DashboardWidgetDropRequest<ExampleWidgetData>) => {
    const target = runtimeFor(request.targetGridId as GridId);
    if (request.source.kind === "palette") {
      const insertion = insertDashboardWidgetAtLayout(
        target.state,
        request.widget,
        request.targetLayout,
        request.targetSnapshot,
      );
      if (!insertion.accepted) {
        updateRejectedOperation(request, insertion.reason);
        return;
      }
      target.commands.restoreLayout(serializeDashboardState(insertion.state));
    } else {
      const source = runtimeFor(request.source.gridId as GridId);
      const result = transferDashboardWidget({
        source: source.state,
        target: target.state,
        widgetId: request.source.widgetId,
        targetLayout: request.targetLayout,
        targetSnapshot: request.targetSnapshot,
        mode: request.mode,
      });
      if (!result.accepted) {
        updateRejectedOperation(request, result.reason);
        return;
      }
      source.commands.restoreLayout(serializeDashboardState(result.source));
      target.commands.restoreLayout(serializeDashboardState(result.target));
    }

    setOperation({
      status: "accepted",
      operationId: request.operationId,
      source: describeSource(request),
      target: request.targetGridId,
      mode: request.mode,
      widgetId: request.widget.id,
      targetLayout: request.targetLayout,
    });
  };

  const addPaletteWidget = (
    definition: WidgetPaletteDefinition<ExampleWidgetData>,
    targetGridId: string,
  ) => {
    const target = runtimeFor(targetGridId as GridId);
    const widget = definition.createWidget();
    const candidate: DashboardWidgetDropCandidate<ExampleWidgetData> = {
      source: { kind: "palette", sourceId: definition.id },
      targetGridId,
      widget,
      mode: "copy",
    };
    if (!acceptCandidate(candidate)) {
      updateRejectedOperation(candidate, "predicate-rejected");
      return;
    }
    const targetLayout = createButtonTargetLayout(widget, target.state);
    const targetSnapshot = {
      columns: target.columns,
      widgets: [...target.widgets.map((existing) => existing.layout), targetLayout],
    };
    const insertion = insertDashboardWidgetAtLayout(
      target.state,
      widget,
      targetLayout,
      targetSnapshot,
    );
    if (!insertion.accepted) {
      updateRejectedOperation(candidate, insertion.reason);
      return;
    }
    target.commands.restoreLayout(serializeDashboardState(insertion.state));
    buttonOperationSequence.current += 1;
    setOperation({
      status: "accepted",
      operationId: `button-palette-${buttonOperationSequence.current}`,
      source: definition.id,
      target: targetGridId,
      mode: "copy",
      widgetId: widget.id,
      targetLayout,
    });
  };

  const transferWithButton = (sourceGridId: GridId, targetGridId: GridId, widgetId: string) => {
    const source = runtimeFor(sourceGridId);
    const target = runtimeFor(targetGridId);
    const widget = source.widgets.find((candidate) => candidate.id === widgetId);
    if (!widget) {
      return;
    }
    const targetLayout = createButtonTargetLayout(widget, target.state);
    const targetSnapshot = {
      columns: target.columns,
      widgets: [...target.widgets.map((candidate) => candidate.layout), targetLayout],
    };
    const result = transferDashboardWidget({
      source: source.state,
      target: target.state,
      widgetId,
      targetLayout,
      targetSnapshot,
      mode: transferMode,
    });
    if (!result.accepted) {
      setOperation({
        status: "rejected",
        reason: result.reason,
        source: sourceGridId,
        target: targetGridId,
        mode: transferMode,
        widgetId,
      });
      return;
    }
    source.commands.restoreLayout(serializeDashboardState(result.source));
    target.commands.restoreLayout(serializeDashboardState(result.target));
    buttonOperationSequence.current += 1;
    setOperation({
      status: "accepted",
      operationId: `button-grid-${buttonOperationSequence.current}`,
      source: sourceGridId,
      target: targetGridId,
      mode: transferMode,
      widgetId,
      targetLayout,
    });
  };

  return (
    <section
      className="playground-workspace transfer-playground"
      data-example-mode="transfer"
      data-transfer-orientation={orientation}
    >
      <PlaygroundHeader
        description={text(
          "외부 팔레트 복사, Grid 간 move/copy, 승인과 rollback을 제어 상태로 확인합니다.",
          "Verifies external palette copies, cross-grid move/copy, approval, and rollback in controlled state.",
        )}
        kicker={text("전송 예제", "Transfer Example")}
        title={text("다중 Grid 전송", "Multiple Grid Transfer")}
      />
      <PlaygroundFeatureGuide
        code={`<DashboardGrid\n  gridId="grid-a"\n  gridTransferMode={mode}\n  acceptExternalWidgets={acceptCandidate}\n  onWidgetDropRequest={applyAcceptedRequest}\n/>`}
        items={[
          text("Palette 항목은 항상 copy 후보로 전달되고 대상 Grid의 승인 후 제어 상태에 추가됩니다.", "Palette items are always copy candidates and enter controlled state only after target approval."),
          text("Grid source는 move/copy 모드를 선택하며 중복 ID, locked, non-movable, 거부 predicate는 변경 없이 rollback됩니다.", "Grid sources select move/copy mode; duplicate IDs, locked or non-movable widgets, and rejected predicates roll back without state changes."),
          text(orientation === "horizontal" ? "두 Grid를 가로로 배치해 좌우 전송 동선을 확인합니다." : "두 Grid를 세로로 배치해 상하 전송 동선을 확인합니다.", orientation === "horizontal" ? "Places both grids horizontally to inspect left-right transfer flow." : "Places both grids vertically to inspect top-bottom transfer flow."),
          text("드래그 대신 위젯의 전송 버튼으로도 동일한 transferDashboardWidget 상태 전이를 실행할 수 있습니다.", "Widget transfer buttons provide the same transferDashboardWidget state transition as a keyboard-accessible drag alternative."),
        ]}
      />
      <PlaygroundStage kind="controls">
        <section aria-label={text("전송 예제 컨트롤", "Transfer example controls")} className="playground-controls transfer-controls">
          <section aria-label={text("Grid 배치 방향", "Grid layout orientation")} className="example-control-group">
            <h3>{text("Grid 배치 방향", "Grid layout orientation")}</h3>
            <div className="example-actions">
              <button
                className="example-toggle-button"
                type="button"
                onClick={() => setOrientation("horizontal")}
                {...toggleStateProps(orientation === "horizontal")}
              >
                {text("가로 배치", "Horizontal layout")}
              </button>
              <button
                className="example-toggle-button"
                type="button"
                onClick={() => setOrientation("vertical")}
                {...toggleStateProps(orientation === "vertical")}
              >
                {text("세로 배치", "Vertical layout")}
              </button>
            </div>
          </section>
          <section aria-label={text("Grid 전송 모드", "Grid transfer mode")} className="example-control-group">
            <h3>{text("Grid 간 전송 모드", "Cross-grid transfer mode")}</h3>
            <div className="example-actions">
              <button
                className="example-toggle-button"
                type="button"
                onClick={() => setTransferMode((mode) => mode === "move" ? "copy" : "move")}
                {...toggleStateProps(transferMode === "copy")}
              >
                {transferMode === "copy" ? <Copy aria-hidden="true" size={14} /> : <MoveRight aria-hidden="true" size={14} />}
                {transferMode === "copy" ? text("복사 모드", "Copy mode") : text("이동 모드", "Move mode")}
              </button>
            </div>
            <p className="example-status">
              {text(
                `Palette는 항상 copy이며 Grid source는 현재 ${transferMode} 모드를 사용합니다.`,
                `The palette always copies; grid sources currently use ${transferMode} mode.`,
              )}
            </p>
          </section>
          <section aria-label={text("전송 작업 결과", "Transfer operation result")} className="example-control-group transfer-operation-panel">
            <h3>{text("최근 전송 결과", "Latest transfer result")}</h3>
            <p
              aria-label={text("전송 작업 상태", "Transfer operation status")}
              className="example-status"
              data-reason={operation.reason}
              data-transfer-result={operation.status}
              role="status"
            >
              {operation.status}: {operation.reason
                ?? (operation.status === "idle"
                  ? text("팔레트 또는 Grid 전송을 실행해 보세요.", "Try a palette or grid transfer.")
                  : `${operation.widgetId} → ${operation.target}`)}
            </p>
            <pre aria-label={text("전송 작업 JSON", "Transfer operation JSON")}>{JSON.stringify(operation, null, 2)}</pre>
          </section>
        </section>
        <WidgetPalette definitions={paletteDefinitions} onAdd={addPaletteWidget} />
      </PlaygroundStage>

      <PlaygroundStage kind="grid">
        <section aria-label={text("전송 Grid 영역", "Transfer grid area")} className="transfer-grid-layout playground-grid-region">
          <TransferGridPanel
            dashboard={gridA}
            gridId="grid-a"
            mode={transferMode}
            targetGridId="grid-b"
            onAccept={acceptCandidate}
            onDropRequest={applyAcceptedRequest}
            onTransferButton={transferWithButton}
          />
          <TransferGridPanel
            dashboard={gridB}
            gridId="grid-b"
            mode={transferMode}
            targetGridId="grid-a"
            onAccept={acceptCandidate}
            onDropRequest={applyAcceptedRequest}
            onTransferButton={transferWithButton}
          />
        </section>
      </PlaygroundStage>
    </section>
  );
}

function TransferGridPanel({
  dashboard,
  gridId,
  mode,
  targetGridId,
  onAccept,
  onDropRequest,
  onTransferButton,
}: {
  dashboard: TransferRuntime;
  gridId: GridId;
  mode: DashboardWidgetTransferMode;
  targetGridId: GridId;
  onAccept: (candidate: DashboardWidgetDropCandidate<ExampleWidgetData>) => boolean;
  onDropRequest: (request: DashboardWidgetDropRequest<ExampleWidgetData>) => void;
  onTransferButton: (sourceGridId: GridId, targetGridId: GridId, widgetId: string) => void;
}) {
  const { locale, text } = usePlaygroundLocale();
  const label = gridLabels[gridId];
  const targetLabel = gridLabels[targetGridId];
  const presentedWidgets = dashboard.widgets.map((widget) => presentTransferWidget(widget, locale));

  return (
    <section aria-label={text(`${label} 패널`, `${label} panel`)} className="transfer-grid-panel" data-transfer-grid={gridId}>
      <header>
        <div>
          <p className="example-kicker">{dashboard.columns} columns</p>
          <h2>{label}</h2>
        </div>
        <output aria-label={text(`${label} 위젯 수`, `${label} widget count`)}>
          {text(`${dashboard.widgets.length}개`, `${dashboard.widgets.length} widgets`)}
        </output>
      </header>
      <DashboardGrid
        acceptExternalWidgets={onAccept}
        columns={dashboard.columns}
        engineOptions={{ animate: false, cellHeight: 84 }}
        gridId={gridId}
        gridTransferMode={mode}
        refreshKey={dashboard.refreshVersion}
        showControls={false}
        widgets={presentedWidgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        onWidgetDropRequest={onDropRequest}
        renderWidget={(widget) => (
          <div className="dashboard-widget-body transfer-widget-body">
            <span>{widget.data?.description}</span>
            <strong>{widget.data?.value}</strong>
            <button
              type="button"
              onClick={() => onTransferButton(gridId, targetGridId, widget.id)}
            >
              <ArrowLeftRight aria-hidden="true" size={13} />
              {text(
                `${targetLabel}로 ${mode === "move" ? "이동" : "복사"}`,
                `${mode === "move" ? "Move" : "Copy"} to ${targetLabel}`,
              )}
            </button>
          </div>
        )}
      />
      <pre aria-label={text(`${label} 상태 JSON`, `${label} state JSON`)} className="transfer-grid-state">
        {JSON.stringify(dashboard.widgets.map((widget) => ({ id: widget.id, layout: widget.layout })), null, 2)}
      </pre>
    </section>
  );
}

type TransferWidgetPresentation = {
  description: LocalizedText;
  title: LocalizedText;
  value?: LocalizedText;
};

const transferWidgetPresentations: ReadonlyArray<readonly [string, TransferWidgetPresentation]> = [
  ["a-sales", { title: { ko: "매출 KPI", en: "Sales KPI" }, description: { ko: "매출 KPI kpi", en: "Sales KPI kpi" }, value: { ko: "1.28억", en: "KRW 128M" } }],
  ["a-chart", { title: { ko: "추세 차트", en: "Trend Chart" }, description: { ko: "추세 차트 chart", en: "Trend chart" } }],
  ["b-table", { title: { ko: "주문 표", en: "Order Table" }, description: { ko: "주문 표 table", en: "Order table" }, value: { ko: "1,284건", en: "1,284 orders" } }],
  ["palette-kpi-", { title: { ko: "신규 KPI", en: "New KPI" }, description: { ko: "신규 KPI kpi", en: "New KPI" } }],
  ["palette-chart-", { title: { ko: "신규 차트", en: "New Chart" }, description: { ko: "신규 차트 chart", en: "New chart" } }],
  ["palette-table-", { title: { ko: "신규 표", en: "New Table" }, description: { ko: "신규 표 table", en: "New table" }, value: { ko: "320행", en: "320 rows" } }],
  ["palette-restricted-", { title: { ko: "제한 위젯", en: "Restricted Widget" }, description: { ko: "제한 위젯 restricted", en: "Restricted widget" }, value: { ko: "거부됨", en: "Rejected" } }],
];

function presentTransferWidget(
  widget: DashboardWidget<ExampleWidgetData>,
  locale: PlaygroundLocale,
): DashboardWidget<ExampleWidgetData> {
  const presentation = transferWidgetPresentations.find(([idPrefix]) => widget.id.startsWith(idPrefix))?.[1];
  if (!presentation) {
    return widget;
  }
  return {
    ...widget,
    title: presentation.title[locale],
    data: widget.data ? {
      ...widget.data,
      description: presentation.description[locale],
      value: presentation.value?.[locale] ?? widget.data.value,
    } : widget.data,
  };
}

function createTransferWidget(
  id: string,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: NonNullable<ExampleWidgetData["kind"]>,
  value: string,
): DashboardWidget<ExampleWidgetData> {
  return createWidget(id, title, x, y, w, h, {
    description: `${title} ${kind}`,
    value,
    kind,
  });
}

function createButtonTargetLayout(
  widget: DashboardWidget<ExampleWidgetData>,
  target: DashboardLayoutState<ExampleWidgetData>,
): DashboardWidgetLayout {
  const y = target.widgets.reduce((maximum, candidate) =>
    Math.max(maximum, candidate.layout.y + candidate.layout.h), 0);
  const w = Math.min(widget.layout.w, target.columns);
  return {
    ...widget.layout,
    id: widget.id,
    x: 0,
    y,
    w,
  };
}

function describeSource(candidate: DashboardWidgetDropCandidate<ExampleWidgetData>): string {
  return candidate.source.kind === "palette"
    ? candidate.source.sourceId
    : `${candidate.source.gridId}:${candidate.source.widgetId}`;
}
