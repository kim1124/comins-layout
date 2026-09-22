import { useRef, useState } from "react";
import { ArrowLeftRight, Copy, MoveRight, Trash2 } from "lucide-react";

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
  status: "idle" | "accepted" | "rejected" | "cleared";
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

  const clearAllGridWidgets = () => {
    gridA.commands.clearWidgets();
    gridB.commands.clearWidgets();
    setOperation({ status: "cleared" });
  };

  const operationStatusText = operation.status === "idle"
    ? text("전송 대기", "Ready")
    : operation.status === "cleared"
      ? text("삭제 완료 · Grid A/B", "Cleared · Grid A/B")
      : operation.status === "rejected"
        ? text(`거부 · ${operation.reason ?? "unknown"}`, `Rejected · ${operation.reason ?? "unknown"}`)
        : text(
            `완료 · ${operation.widgetId ?? "-"} → ${operation.target ?? "-"}`,
            `Completed · ${operation.widgetId ?? "-"} → ${operation.target ?? "-"}`,
          );

  return (
    <section
      className="playground-workspace transfer-playground"
      data-example-mode="transfer"
      data-transfer-orientation={orientation}
    >
      <PlaygroundHeader
        description={text(
          "팔레트에서 위젯을 추가하거나 두 Grid 사이에서 이동·복사하고, 허용 조건에 따른 결과를 확인합니다.",
          "Add widgets from a palette or move and copy them between two grids, then inspect acceptance results.",
        )}
        kicker={text("전송 예제", "Transfer Example")}
        title={text("다중 Grid 전송", "Multiple Grid Transfer")}
      />
      <PlaygroundFeatureGuide
        code={`<DashboardGrid\n  gridId="grid-a"\n  gridTransferMode={mode}\n  acceptExternalWidgets={acceptCandidate}\n  onWidgetDropRequest={applyAcceptedRequest}\n/>`}
        items={[
          text("복사 모드에서는 원래 위치에 원본 모양을 남기고 + 윤곽선만 움직입니다. 대상 Grid의 배치 예정 영역에 놓으면 복사됩니다. 같은 Grid 안에 놓으면 기존처럼 위치만 바뀌며 복제되지 않습니다.", "Copy mode leaves a visual of the source in place and moves only a + outline. Drop on the target grid's placement preview to copy. Dropping within the same grid still moves the widget; it does not duplicate it."),
          text("팔레트 항목은 복사 방식으로 새 위젯을 만듭니다. acceptExternalWidgets가 허용한 요청을 onWidgetDropRequest에서 받아 앱의 React 상태를 갱신해야 추가됩니다. 요청만 받고 상태를 갱신하지 않으면 추가되지 않습니다.", "Palette items create widgets by copying. After acceptExternalWidgets accepts a candidate, handle onWidgetDropRequest and update the app's React state to add it. Receiving the request alone does not add a widget."),
          text("Grid 간 이동은 원본을 제거하고 복사는 원본을 유지합니다. 복사도 위젯 ID를 유지하므로 대상에 같은 ID가 있으면 거부됩니다. locked·이동 불가·최소화·최대화 위젯도 전송할 수 없습니다.", "Moving between grids removes the source widget; copying keeps it. Copies retain the widget ID, so an existing target ID causes rejection. Locked, non-movable, minimized, and maximized widgets cannot transfer."),
          text("서로 다른 컬럼 수에서도 포인터로 잡은 지점을 대상 셀 크기로 환산합니다. 제한 위젯은 허용 조건에서 거부됩니다. 적용되지 않은 전송은 양쪽 위젯 목록을 유지합니다.", "The grab point is mapped into target cells even when column counts differ. The restricted widget is rejected by the acceptance rule. Unapplied transfers preserve both widget lists."),
          text(orientation === "horizontal" ? "두 Grid를 가로로 배치해 좌우 전송 동선을 확인합니다." : "두 Grid를 세로로 배치해 상하 전송 동선을 확인합니다.", orientation === "horizontal" ? "Places both grids horizontally to inspect left-right transfer flow." : "Places both grids vertically to inspect top-bottom transfer flow."),
          text("전송 버튼은 같은 transferDashboardWidget 함수를 사용하는 키보드 조작 대안입니다. 드래그는 놓은 위치를 사용하고, 버튼은 대상 Grid의 마지막 행 아래에 배치합니다.", "Transfer buttons provide a keyboard alternative using the same transferDashboardWidget helper. Dragging uses the drop location; buttons place the widget below the target grid's last row."),
        ]}
      />
      <PlaygroundStage kind="controls">
        <section aria-label={text("전송 예제 컨트롤", "Transfer example controls")} className="playground-controls transfer-controls">
          <div className="transfer-controls__group">
            <div aria-label={text("Grid 배치 방향", "Grid layout orientation")} className="example-actions" role="group">
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
          </div>
          <div aria-label={text("Grid 전송 모드", "Grid transfer mode")} className="transfer-controls__group" role="group">
            <button
              className="example-toggle-button transfer-controls__mode"
              type="button"
              onClick={() => setTransferMode((mode) => mode === "move" ? "copy" : "move")}
              {...toggleStateProps(transferMode === "copy")}
            >
              {transferMode === "copy" ? <Copy aria-hidden="true" size={14} /> : <MoveRight aria-hidden="true" size={14} />}
              {transferMode === "copy" ? text("복사 모드", "Copy mode") : text("이동 모드", "Move mode")}
            </button>
          </div>
          <button
            aria-label={text("Grid A/B 위젯 전체 삭제", "Clear all Grid A/B widgets")}
            className="example-action-button example-action-button--danger transfer-controls__clear"
            disabled={gridA.widgets.length === 0 && gridB.widgets.length === 0}
            title={text("Grid A/B 위젯 전체 삭제", "Clear all Grid A/B widgets")}
            type="button"
            onClick={clearAllGridWidgets}
          >
            <Trash2 aria-hidden="true" size={14} />
          </button>
          <p
            aria-label={text("전송 작업 상태", "Transfer operation status")}
            className="transfer-controls__status"
            data-operation={JSON.stringify(operation)}
            data-reason={operation.reason}
            data-transfer-result={operation.status}
            role="status"
          >
            <span>{operationStatusText}</span>
          </p>
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
