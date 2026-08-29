import type { ApiFeatureSection, DocsPage, DocsSearchItem } from "./types";

const installSample = `npm install comins-grid-layout react react-dom`;

const cssSample = `import "gridstack/dist/gridstack.min.css";
import "comins-grid-layout/styles.css";`;

const basicSample = `import { DashboardGrid, useDashboardGrid, type DashboardWidget } from "comins-grid-layout";

const widgets: DashboardWidget[] = [
  { id: "sales", title: "Sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
  { id: "traffic", title: "Traffic", layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 } },
];

export function DashboardPage() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets: widgets });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
      renderWidget={(widget) => <strong>{widget.title}</strong>}
    />
  );
}`;

const crudSample = `const dashboard = useDashboardGrid({ initialColumns: 6, initialWidgets });

dashboard.commands.addWidget(widget);
dashboard.commands.removeWidget(widget.id);`;

const layoutSample = `dashboard.commands.setColumns(12);
dashboard.commands.setColumns(6);
dashboard.commands.setColumns(12); // restores the cached 12-column geometry

const snapshot = dashboard.commands.serializeState();
dashboard.commands.restoreLayout(snapshot);`;

const lockSample = `<DashboardGrid
  movable={!layoutLocked}
  resizable={!layoutLocked}
  widgets={dashboard.widgets}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => <strong>{widget.title}</strong>}
/>\n`;

const widgetLockSample = `dashboard.commands.updateWidget("sales", { movable: false });
dashboard.commands.updateWidget("sales", { resizable: false });
dashboard.commands.updateWidget("sales", { locked: true });`;

const componentApiSample = `import { DashboardGrid, useDashboardGrid } from "comins-grid-layout";

export function DashboardPage() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets: [] });

  return (
    <DashboardGrid
      columns={dashboard.columns}
      editable
      movable
      resizable
      refreshKey={dashboard.refreshVersion}
      widgets={dashboard.widgets}
      onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
      renderWidget={(widget) => <strong>{widget.title}</strong>}
    />
  );
}`;

const hookApiSample = `const dashboard = useDashboardGrid({
  initialColumns: 6,
  initialWidgets,
});

dashboard.commands.addWidget(widget);
dashboard.commands.serializeState();
dashboard.commands.restoreLayout(snapshot);`;

const interactionApiSample = `const lockedWidget = {
  ...widget,
  locked: true,
  movable: false,
  resizable: false,
};

<DashboardGrid
  editable={true}
  movable={false}
  resizable={true}
  widgets={[lockedWidget]}
  renderWidget={(widget) => <strong>{widget.title}</strong>}
/>;`;

const utilityApiSample = `const columns = clampDashboardColumnCount(18);
const gridOptions = mapDashboardGridOptions({ columns, movable: true });
const widgetOptions = mapDashboardWidgetOptions(widget, { editable: true });
const scheduler = createDashboardResizeScheduler((event) => {
  console.log(event.id, event.width, event.height);
});`;

const refreshMethodSample = `dashboard.commands.refreshLayout();`;

const columnMethodSample = `dashboard.commands.setColumns(4);
dashboard.commands.fitWidgetsToColumns();`;

const maximizeMethodSample = `dashboard.commands.maximizeWidget("sales");
dashboard.commands.minimizeWidget("sales");
dashboard.commands.restoreWidget("sales");`;

const safeHandleMethodSample = `const columns = gridRef.current?.getColumnCount();
const rows = gridRef.current?.getRowCount();
const float = gridRef.current?.getFloat();
const empty = gridRef.current?.isAreaEmpty({ x: 0, y: 0, w: 2, h: 2 });
const fits = gridRef.current?.willItFit({ x: 0, y: 4, w: 3, h: 2 });

const compacted = gridRef.current?.compact("compact", true);
// compact() commits through DashboardGrid.onLayoutCommit and also returns the snapshot.`;

const transferApiSample = `import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  useDashboardDragIn,
  useDashboardGrid,
} from "comins-grid-layout";

let paletteSequence = 0;

export function TransferTarget() {
  const target = useDashboardGrid({ initialColumns: 12 });
  const paletteRef = useDashboardDragIn({
    sourceId: "metric-palette",
    previewLayout: { w: 2, h: 2 },
    createWidget: () => {
      const id = \`metric-\${++paletteSequence}\`;
      return { id, title: "Metric", layout: { id, x: 0, y: 0, w: 2, h: 2 } };
    },
  });

  return (
    <>
      <button ref={paletteRef} type="button">Drag metric</button>
      <DashboardGrid
        gridId="target-grid"
        acceptExternalWidgets
        widgets={target.widgets}
        onLayoutCommit={target.commands.applyLayoutSnapshot}
        onWidgetDropRequest={(request) => {
          const result = insertDashboardWidgetAtLayout(
            target.state,
            request.widget,
            request.targetLayout,
            request.targetSnapshot,
          );
          if (result.accepted) target.commands.restoreLayout(serializeDashboardState(result.state));
        }}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}`;

const lazyRenderSample = `import { DashboardGrid, useDashboardGrid } from "comins-grid-layout";

export function LazyDashboard() {
  const dashboard = useDashboardGrid({
    initialWidgets: [
      { id: "lazy", title: "Lazy content", layout: { id: "lazy", x: 0, y: 8, w: 3, h: 2 } },
    ],
  });

  return (
    <div data-dashboard-lazy-scroll style={{ maxHeight: 480, overflow: "auto" }}>
      <DashboardGrid
        lazyRenderWidget
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => <strong>{widget.title}</strong>}
      />
    </div>
  );
}`;

export const apiFeatures: ApiFeatureSection[] = [
  {
    id: "api-dashboard-rendering",
    title: "Dashboard 렌더링",
    summary: "DashboardGrid와 useDashboardGrid를 연결해 widget 목록을 화면에 렌더링하는 기본 기능입니다.",
    props: [
      {
        name: "DashboardGridProps",
        type: "type",
        description: "DashboardGrid component가 받는 전체 props contract입니다.",
        detail: "DashboardInteractionOptions를 확장하며 widgets, columns, renderWidget, layout/event callback, header action callback을 포함합니다.",
      },
      {
        name: "widgets",
        type: "DashboardWidget<TData>[]",
        description: "렌더링할 widget 목록입니다.",
        detail: "id와 layout을 가진 serializable widget state를 전달하며 grid의 단일 source of truth가 됩니다.",
      },
      {
        name: "columns",
        type: "DashboardColumnCount",
        description: "DashboardGrid가 사용할 runtime column count입니다.",
        detail: "1부터 12까지 지원하며 생략하면 12 column으로 동작합니다.",
      },
      {
        name: "engineOptions / responsive / className",
        type: "DashboardGridEngineOptions / DashboardResponsiveOptions / string",
        description: "지원 engine subset, responsive column 정책, grid section class를 설정합니다.",
        detail: "routine option은 sync되고 rtl/sizeToContent는 safe reinitialize, nonce는 initialization-only입니다. unsupported raw GridStack options는 노출하지 않습니다.",
      },
      {
        name: "refreshKey",
        type: "number | undefined",
        description: "외부 상태 변경 후 GridStack layout refresh를 요청하는 key입니다.",
        detail: "값이 바뀌면 adapter refresh가 실행되어 크기 계산과 handle 상태를 다시 동기화합니다.",
      },
      {
        name: "renderWidget",
        type: "(widget) => ReactNode",
        description: "consumer-owned widget content renderer입니다.",
        detail: "패키지는 shell과 layout만 담당하고 실제 내용은 consumer가 ReactNode로 렌더링합니다.",
      },
      {
        name: "renderWidgetActions / lazyRenderWidget",
        type: "renderer / boolean",
        description: "header action을 교체하고 viewport 진입 시 content를 한 번만 렌더링합니다.",
        detail: "action slot은 showControls=true일 때만 기본 control group을 대체합니다. lazy boundary는 outer widget DOM을 유지하고 content만 최초 교차 시점까지 지연합니다.",
      },
    ],
    methods: [
      {
        name: "refreshLayout",
        params: "없음",
        returns: "void",
        description: "GridStack adapter refresh를 요청합니다.",
        sample: { code: refreshMethodSample, language: "ts", title: "refreshLayout" },
      },
    ],
    samples: [{ code: basicSample, language: "tsx", title: "Dashboard 렌더링 예제" }],
  },
  {
    id: "api-widget-crud",
    title: "Widget 추가 / 삭제",
    summary: "widget을 추가하거나 삭제하는 기능입니다.",
    props: [
      {
        name: "DashboardWidget",
        type: "type",
        description: "id, title, layout, data, view state, interaction option을 포함한 widget 모델입니다.",
        detail: "TData generic으로 consumer domain data를 보존합니다.",
      },
      {
        name: "DashboardWidgetLayout",
        type: "type",
        description: "widget의 x, y, w, h와 min/max 크기 제약을 담는 layout 타입입니다.",
        detail: "layout id는 widget id와 동일하게 유지되어야 하며 모든 좌표는 serializable number입니다.",
      },
      {
        name: "showControls",
        type: "boolean",
        description: "위젯 header action 표시 여부입니다.",
        detail: "false면 maximize, minimize, restore, remove 버튼을 숨깁니다.",
      },
      {
        name: "actionLabels",
        type: "Partial<DashboardWidgetActionLabels>",
        description: "위젯 header action 접근성 label을 변경합니다.",
        detail: "maximize, minimize, restore, remove label을 consumer 언어 정책에 맞게 바꿀 수 있습니다.",
      },
      {
        name: "onRemoveWidget",
        type: "(id: string) => void",
        description: "위젯 삭제 action callback입니다.",
        detail: "DashboardGrid의 header action을 useDashboardGrid command와 연결할 때 사용합니다.",
      },
    ],
    methods: [
      {
        name: "addWidget / removeWidget / clearWidgets",
        params: "widget 또는 widget id",
        returns: "void",
        description: "widget 추가, 삭제, 전체 삭제 command입니다.",
        sample: { code: crudSample, language: "ts", title: "Widget add/remove methods" },
      },
    ],
    events: [
      {
        name: "onRemoveWidget",
        payload: "id: string",
        when: "widget header의 삭제 action이 실행될 때 호출됩니다.",
        description: "consumer state에서 해당 widget을 제거하는 연결 지점입니다.",
      },
    ],
    samples: [{ code: crudSample, language: "ts", title: "Widget 추가 / 삭제 예제" }],
  },
  {
    id: "api-layout-save-restore",
    title: "Layout 저장 / 복원",
    summary: "현재 layout 또는 전체 widget state를 저장 가능한 snapshot으로 직렬화하고 복원하는 기능입니다.",
    props: [
      {
        name: "onLayoutCommit",
        type: "(snapshot: DashboardLayoutSnapshot) => void",
        description: "drag/resize commit 후 layout snapshot을 전달합니다.",
        detail: "좌표 중심 저장이 필요할 때 사용합니다.",
      },
      {
        name: "onWidgetLayoutChange",
        type: "(id, layout) => void",
        description: "개별 widget layout 변경을 consumer state로 전달합니다.",
        detail: "개별 geometry persistence가 의도된 경우 사용합니다. 기본 controlled 연결은 onLayoutCommit과 applyLayoutSnapshot입니다.",
      },
      {
        name: "onLayoutMutation",
        type: "(event: DashboardLayoutMutationEvent<TData>) => void",
        description: "성공한 controlled layout mutation의 의미와 결과 snapshot을 전달합니다.",
        detail: "widget add/update/remove, clear, commit, reset/restore, arrange/fill, columns change를 구분하며 title double-click 같은 widget 내부 이벤트는 제외합니다.",
      },
      {
        name: "DashboardLayoutSnapshot / DashboardStateSnapshot / DashboardColumnLayoutSnapshot / DashboardLayoutsByColumn",
        type: "type",
        description: "layout-only 저장과 full-state 저장을 구분하는 snapshot 타입입니다.",
        detail:
          "serializeState()은 widgets, columns, previousLayouts, layoutsByColumn을 저장합니다. DashboardLayoutsByColumn은 DashboardColumnLayoutSnapshot의 지원 컬럼별 cache입니다. serializeLayout()은 활성 columns와 widget geometry만 저장합니다. active top-level widgets와 previousLayouts가 active cache보다 authoritative입니다. legacy snapshot은 layoutsByColumn 없이 복원할 수 있습니다. 12 -> 6 -> 12 전환 후 serializeState()와 restoreLayout()은 각 컬럼 cache를 보존합니다.",
      },
    ],
    methods: [
      {
        name: "serializeLayout / serializeState / resetLayout / restoreLayout",
        params: "resetLayout(snapshot?), restoreLayout(snapshot)",
        returns: "serializeLayout: DashboardLayoutSnapshot, serializeState: DashboardStateSnapshot, reset/restore: void",
        description: "restore geometry가 필요하면 serializeState를, geometry-only 전달에는 serializeLayout을 사용합니다.",
        sample: { code: layoutSample, language: "ts", title: "Layout 저장 / 복원 methods" },
      },
    ],
    events: [
      {
        name: "onLayoutCommit",
        payload: "DashboardLayoutSnapshot",
        when: "drag 또는 resize interaction이 commit될 때 호출됩니다.",
        description: "현재 column과 widget layout 좌표를 저장소나 외부 상태에 반영할 때 사용합니다.",
      },
      {
        name: "onWidgetLayoutChange",
        payload: "id: string, layout: DashboardWidgetLayout",
        when: "adapter가 개별 widget layout 변경을 동기화할 때 호출됩니다.",
        description: "useDashboardGrid의 updateWidgetLayout command와 연결하는 기본 layout 변경 이벤트입니다.",
      },
      {
        name: "onLayoutMutation",
        payload: "DashboardLayoutMutationEvent<TData>",
        when: "useDashboardGrid command가 실제 controlled state를 변경한 뒤 호출됩니다.",
        description: "semantic kind, widgetIds, columns, resulting full-state snapshot을 제공합니다.",
      },
    ],
    samples: [{ code: layoutSample, language: "ts", title: "Layout 저장 / 복원 예제" }],
  },
  {
    id: "api-column-arrange",
    title: "Column / 정렬",
    summary: "runtime column 수를 바꾸고 widget 배치를 현재 column 기준으로 정렬하는 기능입니다.",
    props: [
      {
        name: "columns",
        type: "DashboardColumnCount",
        description: "DashboardGrid runtime column 수입니다.",
        detail: "DashboardGrid prop과 hook state 모두 1..12 범위를 사용합니다.",
      },
      {
        name: "DashboardColumnCount / DASHBOARD_COLUMN_COUNTS",
        type: "type / const",
        description: "지원 column 범위 1..12를 표현합니다.",
        detail: "Select option이나 validation UI를 만들 때 DASHBOARD_COLUMN_COUNTS 상수를 재사용할 수 있습니다.",
      },
      {
        name: "onColumnsChange",
        type: "(columns: DashboardColumnCount) => void",
        description: "responsive engine의 실제 active column이 바뀔 때 전달됩니다.",
        detail: "동일 column 중복은 병합되며 controlled state에는 setColumns 또는 atomic snapshot으로 반영합니다.",
      },
    ],
    methods: [
      {
        name: "setColumns / autoArrangeWidgets / fitWidgetsToColumns / fitWidgetToColumns / clampDashboardColumnCount",
        params: "columns number 또는 widget id",
        returns: "void 또는 DashboardColumnCount",
        description: "column 변경, 자동 정렬, 빈 공간 채우기, 단일 widget 확장, column clamp를 수행합니다.",
        sample: { code: columnMethodSample, language: "ts", title: "Column / 정렬 methods" },
      },
    ],
    samples: [{ code: `${layoutSample}\n\n${columnMethodSample}`, language: "ts", title: "Column / 정렬 예제" }],
  },
  {
    id: "api-interaction-lock",
    title: "이동 / 리사이즈 / 잠금",
    summary: "grid 전체 또는 개별 widget의 이동, 리사이즈, 잠금 정책을 제어하는 기능입니다.",
    props: [
      {
        name: "editable / movable / resizable",
        type: "boolean",
        description: "전체 grid의 편집, 이동, 리사이즈 가능 여부를 제어합니다.",
        detail: "global option이 false면 개별 widget option이 true여도 해당 interaction은 비활성화됩니다.",
      },
      {
        name: "DashboardWidget.locked",
        type: "boolean",
        description: "개별 widget의 이동과 리사이즈를 모두 막는 shortcut입니다.",
        detail: "기존 locked 기반 사용 흐름과 movable/resizable 분리 옵션을 함께 지원합니다.",
      },
      {
        name: "DashboardWidget.movable / DashboardWidget.resizable",
        type: "boolean",
        description: "개별 widget 단위의 이동과 리사이즈 가능 여부입니다.",
        detail: "global option을 override하지 않으며 global true 상태에서 widget 단위로만 제한합니다.",
      },
      {
        name: "DashboardInteractionOptions",
        type: "type",
        description: "grid 전체 편집 가능 여부를 제어하는 option 묶음입니다.",
        detail: "editable, movable, resizable로 전체 layout interaction을 제어합니다.",
      },
    ],
    methods: [
      {
        name: "updateWidget / refreshLayout",
        params: "widget id와 interaction option patch",
        returns: "void",
        description: "개별 widget interaction option을 변경하고 layout 상태를 다시 동기화합니다.",
        sample: { code: widgetLockSample, language: "ts", title: "이동 / 리사이즈 / 잠금 methods" },
      },
    ],
    samples: [{ code: interactionApiSample, language: "tsx", title: "이동 / 리사이즈 / 잠금 예제" }],
  },
  {
    id: "api-maximize-minimize-restore",
    title: "Maximize / Minimize / Restore",
    summary: "위젯을 확장, 축소, 복원하고 header action 또는 double-click과 연결하는 기능입니다.",
    props: [
      {
        name: "onMaximizeWidget / onMinimizeWidget / onRestoreWidget",
        type: "(id: string) => void",
        description: "위젯 header action callback입니다.",
        detail: "DashboardGrid action을 useDashboardGrid command와 연결할 때 사용합니다.",
      },
      {
        name: "onTitleDoubleClick",
        type: "(event: DashboardWidgetInteractionEvent) => void",
        description: "위젯 title-only double-click action callback입니다.",
        detail: "fitWidgetToColumns와 조합하면 row 빈 공간 확장 interaction을 만들 수 있습니다. onWidgetHeaderDoubleClick은 0.2.1 deprecated alias입니다.",
      },
      {
        name: "Move / Resize / Title lifecycle callbacks",
        type: "onBefore* / on* / onAfter*",
        description: "move, layout resize, title double-click을 before/action/after 단계로 관찰합니다.",
        detail: "active move/resize callback은 animation frame 단위로 병합되며 after payload는 commit된 최종 geometry를 사용합니다.",
      },
      {
        name: "onBeforeMove / onMove / onAfterMove / onBeforeResize / onResize / onAfterResize / onBeforeTitleDoubleClick / onTitleDoubleClick / onAfterTitleDoubleClick",
        type: "(event: DashboardWidgetInteractionEvent) => void",
        description: "move, layout resize, title-only double-click의 canonical lifecycle입니다.",
        detail: "before 다음 active action, committed after 순서입니다. onWidgetResizeFrame은 content pixel notification으로 별도입니다.",
      },
      {
        name: "onWidgetDragStart / onWidgetDragStop / onWidgetResizeStart / onWidgetResizeStop / onWidgetHeaderDoubleClick",
        type: "deprecated compatibility callbacks",
        description: "0.2.1에서 호출 순서를 유지하는 legacy alias입니다.",
        detail: "신규 예제에서는 canonical lifecycle만 사용하며 alias 제거는 0.3.0 별도 breaking-change gate에서 검토합니다.",
      },
    ],
    methods: [
      {
        name: "maximizeWidget / minimizeWidget / restoreWidget / fitWidgetToColumns",
        params: "widget id",
        returns: "void",
        description: "widget view state를 변경하거나 현재 row의 빈 column 공간을 단일 widget에 채웁니다.",
        sample: { code: maximizeMethodSample, language: "ts", title: "Maximize / Minimize / Restore methods" },
      },
    ],
    events: [
      {
        name: "onMaximizeWidget / onMinimizeWidget / onRestoreWidget",
        payload: "id: string",
        when: "widget header의 maximize, minimize, restore action이 실행될 때 호출됩니다.",
        description: "header action을 consumer-owned widget state command와 연결합니다.",
      },
      {
        name: "onTitleDoubleClick",
        payload: "DashboardWidgetInteractionEvent",
        when: "widget title이 double-click될 때 호출됩니다.",
        description: "fitWidgetToColumns 같은 title-only shortcut interaction을 연결할 수 있습니다.",
      },
      {
        name: "onBeforeMove / onMove / onAfterMove 외 lifecycle",
        payload: "DashboardWidgetInteractionEvent",
        when: "move, layout resize, title double-click의 각 lifecycle 단계에서 호출됩니다.",
        description: "onWidgetResizeFrame은 content 크기 알림이며 onResize layout event와 별도입니다.",
      },
    ],
    samples: [{ code: maximizeMethodSample, language: "ts", title: "Maximize / Minimize / Restore 예제" }],
  },
  {
    id: "api-resize-adapter",
    title: "Resize frame / Adapter utility",
    summary: "resize frame event와 GridStack option mapping을 다루는 고급 public utility입니다.",
    props: [
      {
        name: "onWidgetResizeFrame",
        type: "(event: DashboardWidgetResizeFrameEvent) => void",
        description: "resize 중 widget content에 전달할 frame event callback입니다.",
        detail: "chart/table 같은 내부 content가 resize frame에 맞춰 다시 계산할 때 사용합니다.",
      },
      {
        name: "DashboardGridEngineOptions.cellHeight / margin",
        type: "GridStackOptions field",
        description: "GridStack engine으로 전달되는 cell height와 margin mapping option입니다.",
        detail: "Comins adapter boundary 내부에서 사용하며 직접 GridStack 인스턴스를 노출하지 않습니다.",
      },
      {
        name: "DashboardGridHandle",
        type: "type",
        description: "안전한 query, refresh, compact, commitLayout을 제공하는 advanced public handle입니다.",
        detail: "getColumnCount, getRowCount, getFloat, isAreaEmpty, willItFit은 read-only query입니다. getGridStack()은 escape hatch입니다. controlled example에서는 raw GridStack add/remove/destroy를 호출하지 않습니다.",
      },
      {
        name: "DashboardWidgetResizeFrameEvent / DashboardResizeScheduler",
        type: "type",
        description: "resize frame event와 scheduler contract입니다.",
        detail: "scheduler는 pending resize event를 requestAnimationFrame 단위로 모아 전달합니다.",
      },
    ],
    methods: [
      {
        name: "createDashboardResizeScheduler / mapDashboardGridOptions / mapDashboardWidgetOptions",
        params: "resize callback 또는 Comins interaction options",
        returns: "DashboardResizeScheduler 또는 GridStack option object",
        description: "resize event batch 처리와 Comins option to GridStack option mapping을 수행합니다.",
        sample: { code: utilityApiSample, language: "ts", title: "Resize frame / Adapter utility methods" },
      },
      {
        name: "DashboardGridHandle safe queries / compact / commitLayout / refresh",
        params: "query geometry 또는 compact layout",
        returns: "number, boolean, DashboardLayoutSnapshot 또는 null",
        description: "raw engine mutation 없이 상태를 조회하거나 controlled state에 반영할 snapshot을 반환합니다.",
        sample: { code: safeHandleMethodSample, language: "ts", title: "Safe public handle methods" },
      },
    ],
    events: [
      {
        name: "onWidgetResizeFrame",
        payload: "DashboardWidgetResizeFrameEvent",
        when: "widget resize 중 requestAnimationFrame 단위로 크기 변경이 schedule될 때 호출됩니다.",
        description: "chart, table, canvas처럼 내부 content가 resize frame에 맞춰 다시 계산되어야 할 때 사용합니다.",
      },
    ],
    samples: [{ code: utilityApiSample, language: "ts", title: "Resize frame / Adapter utility 예제" }],
  },
  {
    id: "api-transfer-lazy",
    title: "Palette / Grid Transfer / Lazy Content",
    summary: "incoming palette·Grid transfer와 React content lazy-render boundary의 controlled 계약입니다.",
    props: [
      {
        name: "gridId / acceptExternalWidgets / gridTransferMode",
        type: "string / boolean | predicate / move | copy",
        description: "transfer source와 target identity, acceptance, Grid source mode를 설정합니다.",
        detail: "transfer target은 gridId가 필수입니다. Palette는 항상 copy이고 Grid source는 기본 move 또는 명시적 copy입니다.",
      },
      {
        name: "externalDropTargets / onWidgetExternalDrop",
        type: "ReadonlyArray<DashboardExternalDropTarget> / callback",
        description: "Grid widget을 ordinary consumer HTML target에 놓은 결과를 non-destructive event로 보고합니다.",
        detail: "incoming palette/Grid transfer와 반대 방향입니다. Consumer가 removeWidget 같은 controlled mutation을 명시적으로 선택합니다.",
      },
      {
        name: "lazyRenderWidget / DashboardWidget.lazyLoad",
        type: "boolean / boolean",
        description: "React widget content mount를 최초 교차 시점까지 지연합니다.",
        detail: "widget shell과 outer Grid item은 유지됩니다. widget.lazyLoad=false는 global lazy를 opt-out하며 true만으로 global lazy를 켜지 않습니다. IntersectionObserver가 없으면 eager fallback합니다.",
      },
      {
        name: "DashboardGridEngineOptions.lazyLoad",
        type: "boolean (deprecated)",
        description: "React-owned content를 지연하지 않는 GridStack native option입니다.",
        detail: "0.2.1 compatibility mapping만 유지하며 신규 코드는 lazyRenderWidget을 사용합니다. 0.3.0 제거 대상입니다.",
      },
    ],
    methods: [
      {
        name: "useDashboardDragIn / insertWidgetAt / insertDashboardWidgetAtLayout / transferDashboardWidget",
        params: "palette source options 또는 source/target snapshot",
        returns: "callback ref, void, insertion result, transfer result",
        description: "palette source를 연결하고 single-grid insertion 또는 atomic cross-grid move/copy를 controlled state로 계산합니다.",
        sample: { code: transferApiSample, language: "tsx", title: "Palette transfer target" },
      },
    ],
    events: [
      {
        name: "onWidgetDropRequest",
        payload: "DashboardWidgetDropRequest<TData>",
        when: "incoming candidate가 승인되고 temporary GridStack DOM이 rollback된 뒤 호출됩니다.",
        description: "callback을 처리하지 않으면 controlled state가 바뀌지 않는 fail-closed contract입니다.",
      },
    ],
    samples: [
      { code: transferApiSample, language: "tsx", title: "Palette transfer 예제" },
      { code: lazyRenderSample, language: "tsx", title: "Lazy content 예제" },
    ],
  },
];

function paragraphs(lines: string[]) {
  return (
    <>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );
}

export const docsPages: DocsPage[] = [
  {
    body: paragraphs(["설치, stylesheet import, 첫 dashboard 렌더링 흐름을 확인합니다."]),
    category: "시작하기",
    examples: [
      {
        codeSamples: [
          { code: installSample, language: "bash", title: "Install" },
          { code: cssSample, language: "ts", title: "Styles" },
          { code: basicSample, language: "tsx", title: "Minimal dashboard" },
        ],
        description: "패키지와 GridStack stylesheet을 연결하고 DashboardGrid를 렌더링합니다.",
        title: "기본 dashboard 연결",
      },
    ],
    label: "시작하기",
    path: "/docs/getting-started",
    summary: "패키지 설치와 기본 사용 흐름입니다.",
    title: "시작하기",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: crudSample, language: "ts", title: "Widget add/remove commands" }],
        description: "10개 기본 위젯과 단조 증가 번호를 사용하는 추가, 전체 삭제, 초기화 흐름을 확인합니다.",
        title: "위젯 추가 / 전체 삭제 / 초기화",
      },
    ],
    label: "위젯",
    path: "/examples/widget/basic",
    summary: "Basic, 추가/전체 삭제/초기화, 실제 widget lifecycle event 흐름입니다.",
    title: "위젯",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: layoutSample, language: "ts", title: "Save and restore" }],
        description: "현재 dashboard state를 JSON으로 저장하고 column 변경 후 다시 복원합니다.",
        title: "레이아웃 저장 / 불러오기",
      },
      {
        codeSamples: [{ code: `dashboard.commands.setColumns(4);`, language: "ts", title: "Dynamic columns" }],
        description: "1부터 12까지 column option을 선택하고 12개 위젯 배치가 동적으로 바뀌는지 확인합니다.",
        title: "Col 레이아웃 동적 수정",
      },
      {
        codeSamples: [{ code: lockSample, language: "tsx", title: "Global lock" }],
        description: "전체 레이아웃 잠금 시 등록된 위젯의 이동과 리사이즈를 모두 금지합니다.",
        title: "레이아웃 잠금 / 해제",
      },
    ],
    label: "레이아웃",
    path: "/examples/layout/basic",
    summary: "저장/복원, column 변경, 전체 잠금 흐름입니다.",
    title: "레이아웃",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: `${layoutSample}\n\n${widgetLockSample}`, language: "ts", title: "Advanced controlled state" }],
        description: "responsive column, public handle query, external drop, 전체 상태와 컬럼 cache 복원을 제어된 React state로 확인합니다.",
        title: "고급 제어 예제",
      },
    ],
    label: "고급 예제",
    path: "/examples/advanced/cell-height",
    summary: "GridStack 고급 기능과 안전한 공개 handler/method 흐름입니다.",
    title: "고급 예제",
  },
  {
    category: "API",
    examples: [],
    label: "API",
    path: "/api",
    summary: "기능별 Props, Methods, 예제 코드입니다.",
    title: "API",
  },
];

export const docsNavGroups = docsPages.reduce<Array<{ category: string; pages: DocsPage[] }>>((groups, page) => {
  const group = groups.find((item) => item.category === page.category);
  if (group) {
    group.pages.push(page);
    return groups;
  }
  groups.push({ category: page.category, pages: [page] });
  return groups;
}, []);

const docsSearchItems = createDocsSearchItems();

function createDocsSearchItems(): DocsSearchItem[] {
  const pageItems = docsPages.flatMap((page) => {
    const pageText = [page.category, page.label, page.title, page.summary].join(" ");
    const pageItem: DocsSearchItem = {
      id: `page:${page.path}`,
      kind: page.category === "API" ? "API" : "문서",
      title: page.title,
      description: page.summary,
      path: page.path,
      keywords: pageText,
    };

    const exampleItems = page.examples.flatMap((example, index) => {
      const exampleId = `${page.path}-example-${index + 1}`;
      const exampleText = [
        pageText,
        example.title,
        example.description,
        ...example.codeSamples.map((sample) => `${sample.title} ${sample.language} ${sample.code}`),
      ].join(" ");

      const items: DocsSearchItem[] = [
        {
          id: `example:${exampleId}`,
          kind: "예제",
          title: example.title,
          description: example.description,
          path: page.path,
          hash: `#${exampleId}`,
          keywords: exampleText,
        },
      ];

      example.codeSamples.forEach((sample) => {
        items.push({
          id: `code:${page.path}:${sample.title}`,
          kind: "코드",
          title: sample.title,
          description: `${example.title} 예제 코드`,
          path: page.path,
          hash: `#${exampleId}`,
          keywords: `${exampleText} ${sample.code}`,
        });
      });

      return items;
    });

    return [pageItem, ...exampleItems];
  });

  const apiItems = apiFeatures.flatMap((section) => {
    const propText = section.props.map((prop) => `${prop.name} ${prop.type} ${prop.description} ${prop.detail}`);
    const methodText = (section.methods ?? []).map((method) => `${method.name} ${method.params} ${method.returns} ${method.description} ${method.sample?.code ?? ""}`);
    const eventText = (section.events ?? []).map((event) => `${event.name} ${event.payload} ${event.when} ${event.description}`);
    const sampleText = section.samples.map((sample) => `${sample.title} ${sample.language} ${sample.code}`);
    const sectionText = [
      section.title,
      section.summary,
      ...propText,
      ...methodText,
      ...eventText,
      ...sampleText,
    ].join(" ");

    return [
      {
        id: `api-section:${section.id}`,
        kind: "API" as const,
        title: section.title,
        description: section.summary,
        path: "/api",
        hash: `#${section.id}`,
        keywords: sectionText,
      },
      ...section.props.map((prop) => ({
        id: `api-prop:${section.id}:${prop.name}`,
        kind: "API" as const,
        title: prop.name,
        description: prop.description,
        path: "/api",
        hash: `#${section.id}`,
        keywords: `${sectionText} ${prop.name} ${prop.type} ${prop.description} ${prop.detail}`,
      })),
      ...(section.methods ?? []).map((method) => ({
        id: `api-method:${section.id}:${method.name}`,
        kind: "API" as const,
        title: method.name,
        description: method.description,
        path: "/api",
        hash: `#${section.id}`,
        keywords: `${sectionText} ${method.name} ${method.params} ${method.returns} ${method.description} ${method.sample?.code ?? ""}`,
      })),
      ...(section.events ?? []).map((event) => ({
        id: `api-event:${section.id}:${event.name}`,
        kind: "API" as const,
        title: event.name,
        description: event.description,
        path: "/api",
        hash: `#${section.id}`,
        keywords: `${sectionText} ${event.name} ${event.payload} ${event.when} ${event.description}`,
      })),
      ...section.samples.map((sample) => ({
        id: `api-code:${section.id}:${sample.title}`,
        kind: "코드" as const,
        title: sample.title,
        description: `${section.title} 예제 코드`,
        path: "/api",
        hash: `#${section.id}`,
        keywords: `${sectionText} ${sample.title} ${sample.language} ${sample.code}`,
      })),
    ];
  });

  return [...pageItems, ...apiItems];
}

export function searchDocs(query: string, limit = 10): DocsSearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return docsSearchItems
    .filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      if (aTitle !== bTitle) {
        return aTitle - bTitle;
      }

      const aApi = a.kind === "API" ? 0 : 1;
      const bApi = b.kind === "API" ? 0 : 1;
      if (aApi !== bApi) {
        return aApi - bApi;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
