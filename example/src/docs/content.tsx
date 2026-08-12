import { defineLocalizedText, resolveLocalizedText } from "../i18n/playground-locale";
import type { PlaygroundLocale } from "../i18n/types";
import type {
  ApiFeatureSection,
  DocsCodeSample,
  DocsNavGroup,
  DocsPage,
  DocsSearchItem,
  LocalizedApiFeatureSection,
  LocalizedDocsCodeSample,
  LocalizedDocsExampleCase,
  LocalizedDocsPage,
} from "./types";

const text = defineLocalizedText;

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
      onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
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
/>\n`;

const widgetLockSample = `dashboard.commands.updateWidget("sales", { movable: false });
dashboard.commands.updateWidget("sales", { resizable: false });
dashboard.commands.updateWidget("sales", { locked: true });`;

const componentApiSample = `import { DashboardGrid } from "comins-grid-layout";

<DashboardGrid
  columns={dashboard.columns}
  editable
  movable
  resizable
  refreshKey={dashboard.refreshVersion}
  widgets={dashboard.widgets}
  onLayoutCommit={(snapshot) => console.log(snapshot)}
  onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
  renderWidget={(widget) => <strong>{widget.title}</strong>}
/>;`;

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

<DashboardGrid editable={true} movable={false} resizable={true} widgets={[lockedWidget]} />;`;

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

const localizedApiFeatures: LocalizedApiFeatureSection[] = [
  {
    id: "api-dashboard-rendering",
    title: text("Dashboard 렌더링", "Dashboard rendering"),
    summary: text(
      "DashboardGrid와 useDashboardGrid를 연결해 widget 목록을 화면에 렌더링하는 기본 기능입니다.",
      "Connect DashboardGrid and useDashboardGrid to render a widget list.",
    ),
    props: [
      {
        name: "DashboardGridProps",
        type: "type",
        description: text("DashboardGrid component가 받는 전체 props contract입니다.", "The complete props contract accepted by DashboardGrid."),
        detail: text(
          "DashboardInteractionOptions를 확장하며 widgets, columns, renderWidget, layout/event callback, header action callback을 포함합니다.",
          "Extends DashboardInteractionOptions and includes widgets, columns, renderWidget, layout/event callbacks, and header action callbacks.",
        ),
      },
      {
        name: "widgets",
        type: "DashboardWidget<TData>[]",
        description: text("렌더링할 widget 목록입니다.", "The widget list to render."),
        detail: text(
          "id와 layout을 가진 serializable widget state를 전달하며 grid의 단일 source of truth가 됩니다.",
          "Pass serializable widget state with ids and layouts; it becomes the grid's single source of truth.",
        ),
      },
      {
        name: "columns",
        type: "DashboardColumnCount",
        description: text("DashboardGrid가 사용할 runtime column count입니다.", "The runtime column count used by DashboardGrid."),
        detail: text("1부터 12까지 지원하며 생략하면 12 column으로 동작합니다.", "Supports 1 through 12 and defaults to 12 columns when omitted."),
      },
      {
        name: "refreshKey",
        type: "number | undefined",
        description: text("외부 상태 변경 후 GridStack layout refresh를 요청하는 key입니다.", "A key that requests a GridStack layout refresh after external state changes."),
        detail: text("값이 바뀌면 adapter refresh가 실행되어 크기 계산과 handle 상태를 다시 동기화합니다.", "When the value changes, the adapter refreshes and resynchronizes size calculations and handle state."),
      },
      {
        name: "renderWidget",
        type: "(widget) => ReactNode",
        description: text("consumer-owned widget content renderer입니다.", "The consumer-owned widget content renderer."),
        detail: text("패키지는 shell과 layout만 담당하고 실제 내용은 consumer가 ReactNode로 렌더링합니다.", "The package owns the shell and layout; the consumer renders actual content as ReactNode."),
      },
    ],
    methods: [
      {
        name: "refreshLayout",
        params: "()",
        returns: "void",
        description: text("GridStack adapter refresh를 요청합니다.", "Requests a GridStack adapter refresh."),
        sample: { code: refreshMethodSample, language: "ts", title: text("refreshLayout", "refreshLayout") },
      },
    ],
    samples: [{ code: basicSample, language: "tsx", title: text("Dashboard 렌더링 예제", "Dashboard rendering example") }],
  },
  {
    id: "api-widget-crud",
    title: text("Widget 추가 / 삭제", "Add and remove widgets"),
    summary: text("widget을 추가하거나 삭제하는 기능입니다.", "Functions for adding or removing widgets."),
    props: [
      {
        name: "DashboardWidget",
        type: "type",
        description: text("id, title, layout, data, view state, interaction option을 포함한 widget 모델입니다.", "The widget model containing id, title, layout, data, view state, and interaction options."),
        detail: text("TData generic으로 consumer domain data를 보존합니다.", "Preserves consumer domain data through the TData generic."),
      },
      {
        name: "DashboardWidgetLayout",
        type: "type",
        description: text("widget의 x, y, w, h와 min/max 크기 제약을 담는 layout 타입입니다.", "The layout type containing x, y, w, h, and min/max size constraints."),
        detail: text("layout id는 widget id와 동일하게 유지되어야 하며 모든 좌표는 serializable number입니다.", "The layout id must remain identical to the widget id, and all coordinates are serializable numbers."),
      },
      {
        name: "showControls",
        type: "boolean",
        description: text("위젯 header action 표시 여부입니다.", "Whether widget header actions are shown."),
        detail: text("false면 maximize, minimize, restore, remove 버튼을 숨깁니다.", "When false, hides maximize, minimize, restore, and remove buttons."),
      },
      {
        name: "actionLabels",
        type: "Partial<DashboardWidgetActionLabels>",
        description: text("위젯 header action 접근성 label을 변경합니다.", "Changes accessibility labels for widget header actions."),
        detail: text("maximize, minimize, restore, remove label을 consumer 언어 정책에 맞게 바꿀 수 있습니다.", "Lets consumers adapt maximize, minimize, restore, and remove labels to their language policy."),
      },
      {
        name: "onRemoveWidget",
        type: "(id: string) => void",
        description: text("위젯 삭제 action callback입니다.", "The widget removal action callback."),
        detail: text("DashboardGrid의 header action을 useDashboardGrid command와 연결할 때 사용합니다.", "Use it to connect DashboardGrid header actions to useDashboardGrid commands."),
      },
    ],
    methods: [
      {
        name: "addWidget / removeWidget / clearWidgets",
        params: "widget 또는 widget id",
        returns: "void",
        description: text("widget 추가, 삭제, 전체 삭제 command입니다.", "Commands to add, remove, or clear widgets."),
        sample: { code: crudSample, language: "ts", title: text("Widget 추가 / 삭제 methods", "Widget add/remove methods") },
      },
    ],
    events: [
      {
        name: "onRemoveWidget",
        payload: "id: string",
        when: text("widget header의 삭제 action이 실행될 때 호출됩니다.", "Called when the widget header removal action runs."),
        description: text("consumer state에서 해당 widget을 제거하는 연결 지점입니다.", "The integration point that removes the widget from consumer state."),
      },
    ],
    samples: [{ code: crudSample, language: "ts", title: text("Widget 추가 / 삭제 예제", "Widget add/remove example") }],
  },
  {
    id: "api-layout-save-restore",
    title: text("Layout 저장 / 복원", "Save and restore layout"),
    summary: text("현재 layout 또는 전체 widget state를 저장 가능한 snapshot으로 직렬화하고 복원하는 기능입니다.", "Provides layout serialization and restoration for the current layout or complete widget state as persistable snapshots."),
    props: [
      {
        name: "onLayoutCommit",
        type: "(snapshot: DashboardLayoutSnapshot) => void",
        description: text("drag/resize commit 후 layout snapshot을 전달합니다.", "Delivers a layout snapshot after a drag or resize commit."),
        detail: text("좌표 중심 저장이 필요할 때 사용합니다.", "Use when coordinate-focused persistence is needed."),
      },
      {
        name: "onWidgetLayoutChange",
        type: "(id, layout) => void",
        description: text("개별 widget layout 변경을 consumer state로 전달합니다.", "Delivers individual widget layout changes to consumer state."),
        detail: text("useDashboardGrid의 updateWidgetLayout command와 연결하는 기본 callback입니다.", "The primary callback for useDashboardGrid's updateWidgetLayout command."),
      },
      {
        name: "DashboardLayoutSnapshot / DashboardStateSnapshot / DashboardColumnLayoutSnapshot / DashboardLayoutsByColumn",
        type: "type",
        description: text("layout-only 저장과 full-state 저장을 구분하는 snapshot 타입입니다.", "Snapshot types that distinguish layout-only persistence from full-state persistence."),
        detail: text(
          "serializeState()은 widgets, columns, previousLayouts, layoutsByColumn을 저장합니다. DashboardLayoutsByColumn은 DashboardColumnLayoutSnapshot의 지원 컬럼별 cache입니다. serializeLayout()은 활성 columns와 widget geometry만 저장합니다. active top-level widgets와 previousLayouts가 active cache보다 authoritative입니다. legacy snapshot은 layoutsByColumn 없이 복원할 수 있습니다. 12 -> 6 -> 12 전환 후 serializeState()와 restoreLayout()은 각 컬럼 cache를 보존합니다.",
          "serializeState() stores widgets, columns, previousLayouts, and layoutsByColumn. DashboardLayoutsByColumn is the supported per-column cache for DashboardColumnLayoutSnapshot. serializeLayout() stores only active columns and widget geometry. Active top-level widgets and previousLayouts are authoritative over the active cache. Legacy snapshots can be restored without layoutsByColumn. After a 12 -> 6 -> 12 transition, serializeState() and restoreLayout() preserve every column cache.",
        ),
      },
    ],
    methods: [
      {
        name: "serializeLayout / serializeState / resetLayout / restoreLayout",
        params: "resetLayout(snapshot?), restoreLayout(snapshot)",
        returns: "serializeLayout: DashboardLayoutSnapshot, serializeState: DashboardStateSnapshot, reset/restore: void",
        description: text("restore geometry가 필요하면 serializeState를, geometry-only 전달에는 serializeLayout을 사용합니다.", "Use serializeState when restore geometry is required and serializeLayout for geometry-only transfer."),
        sample: { code: layoutSample, language: "ts", title: text("Layout 저장 / 복원 methods", "Save and restore layout methods") },
      },
    ],
    events: [
      {
        name: "onLayoutCommit",
        payload: "DashboardLayoutSnapshot",
        when: text("drag 또는 resize interaction이 commit될 때 호출됩니다.", "Called when a drag or resize interaction commits."),
        description: text("현재 column과 widget layout 좌표를 저장소나 외부 상태에 반영할 때 사용합니다.", "Use to persist the current columns and widget layout coordinates to storage or external state."),
      },
      {
        name: "onWidgetLayoutChange",
        payload: "id: string, layout: DashboardWidgetLayout",
        when: text("adapter가 개별 widget layout 변경을 동기화할 때 호출됩니다.", "Called when the adapter synchronizes an individual widget layout change."),
        description: text("useDashboardGrid의 updateWidgetLayout command와 연결하는 기본 layout 변경 이벤트입니다.", "The primary layout-change event for useDashboardGrid's updateWidgetLayout command."),
      },
    ],
    samples: [{ code: layoutSample, language: "ts", title: text("Layout 저장 / 복원 예제", "Save and restore layout example") }],
  },
  {
    id: "api-column-arrange",
    title: text("Column / 정렬", "Columns and arrangement"),
    summary: text("runtime column 수를 바꾸고 widget 배치를 현재 column 기준으로 정렬하는 기능입니다.", "Changes runtime column counts and arranges widgets for the active column count."),
    props: [
      {
        name: "columns",
        type: "DashboardColumnCount",
        description: text("DashboardGrid runtime column 수입니다.", "The DashboardGrid runtime column count."),
        detail: text("DashboardGrid prop과 hook state 모두 1..12 범위를 사용합니다.", "Both the DashboardGrid prop and hook state use the 1..12 range."),
      },
      {
        name: "DashboardColumnCount / DASHBOARD_COLUMN_COUNTS",
        type: "type / const",
        description: text("지원 column 범위 1..12를 표현합니다.", "Represents the supported 1..12 column range."),
        detail: text("Select option이나 validation UI를 만들 때 DASHBOARD_COLUMN_COUNTS 상수를 재사용할 수 있습니다.", "Reuse DASHBOARD_COLUMN_COUNTS when creating select options or validation UI."),
      },
    ],
    methods: [
      {
        name: "setColumns / autoArrangeWidgets / fitWidgetsToColumns / fitWidgetToColumns / clampDashboardColumnCount",
        params: "columns number 또는 widget id",
        returns: "void 또는 DashboardColumnCount",
        description: text("column 변경, 자동 정렬, 빈 공간 채우기, 단일 widget 확장, column clamp를 수행합니다.", "Changes columns, automatically arranges widgets, fills empty space, expands a widget, and clamps column counts."),
        sample: { code: columnMethodSample, language: "ts", title: text("Column / 정렬 methods", "Column arrangement methods") },
      },
    ],
    samples: [{ code: `${layoutSample}\n\n${columnMethodSample}`, language: "ts", title: text("Column / 정렬 예제", "Column arrangement example") }],
  },
  {
    id: "api-interaction-lock",
    title: text("이동 / 리사이즈 / 잠금", "Move, resize, and lock"),
    summary: text("grid 전체 또는 개별 widget의 이동, 리사이즈, 잠금 정책을 제어하는 기능입니다.", "Controls move, resize, and lock policies for the entire grid or individual widgets."),
    props: [
      {
        name: "editable / movable / resizable",
        type: "boolean",
        description: text("전체 grid의 편집, 이동, 리사이즈 가능 여부를 제어합니다.", "Controls whether the entire grid is editable, movable, and resizable."),
        detail: text("global option이 false면 개별 widget option이 true여도 해당 interaction은 비활성화됩니다.", "When a global option is false, the interaction stays disabled even if an individual widget option is true."),
      },
      {
        name: "DashboardWidget.locked",
        type: "boolean",
        description: text("개별 widget의 이동과 리사이즈를 모두 막는 shortcut입니다.", "A shortcut that blocks both moving and resizing an individual widget."),
        detail: text("기존 locked 기반 사용 흐름과 movable/resizable 분리 옵션을 함께 지원합니다.", "Supports both the existing locked workflow and separate movable/resizable options."),
      },
      {
        name: "DashboardWidget.movable / DashboardWidget.resizable",
        type: "boolean",
        description: text("개별 widget 단위의 이동과 리사이즈 가능 여부입니다.", "Whether an individual widget can be moved or resized."),
        detail: text("global option을 override하지 않으며 global true 상태에서 widget 단위로만 제한합니다.", "Does not override global options; it only restricts individual widgets while globals are true."),
      },
      {
        name: "DashboardInteractionOptions",
        type: "type",
        description: text("grid 전체 편집 가능 여부를 제어하는 option 묶음입니다.", "The option set that controls whole-grid editability."),
        detail: text("editable, movable, resizable로 전체 layout interaction을 제어합니다.", "Controls whole-layout interactions through editable, movable, and resizable."),
      },
    ],
    methods: [
      {
        name: "updateWidget / refreshLayout",
        params: "widget id와 interaction option patch",
        returns: "void",
        description: text("개별 widget interaction option을 변경하고 layout 상태를 다시 동기화합니다.", "Changes individual widget interaction options and resynchronizes layout state."),
        sample: { code: widgetLockSample, language: "ts", title: text("이동 / 리사이즈 / 잠금 methods", "Move, resize, and lock methods") },
      },
    ],
    samples: [{ code: interactionApiSample, language: "tsx", title: text("이동 / 리사이즈 / 잠금 예제", "Move, resize, and lock example") }],
  },
  {
    id: "api-maximize-minimize-restore",
    title: text("Maximize / Minimize / Restore", "Maximize / minimize / restore"),
    summary: text("위젯을 확장, 축소, 복원하고 header action 또는 double-click과 연결하는 기능입니다.", "Maximizes, minimizes, and restores widgets through header actions or double-clicks."),
    props: [
      {
        name: "onMaximizeWidget / onMinimizeWidget / onRestoreWidget",
        type: "(id: string) => void",
        description: text("위젯 header action callback입니다.", "Widget header action callbacks."),
        detail: text("DashboardGrid action을 useDashboardGrid command와 연결할 때 사용합니다.", "Use to connect DashboardGrid actions to useDashboardGrid commands."),
      },
      {
        name: "onWidgetHeaderDoubleClick",
        type: "(id: string) => void",
        description: text("위젯 header double-click callback입니다.", "The widget header double-click callback."),
        detail: text("fitWidgetToColumns와 조합하면 row 빈 공간 확장 interaction을 만들 수 있습니다.", "Combine with fitWidgetToColumns to create an interaction that expands into empty row space."),
      },
    ],
    methods: [
      {
        name: "maximizeWidget / minimizeWidget / restoreWidget / fitWidgetToColumns",
        params: "widget id",
        returns: "void",
        description: text("widget view state를 변경하거나 현재 row의 빈 column 공간을 단일 widget에 채웁니다.", "Changes widget view state or fills the current row's empty columns with one widget."),
        sample: { code: maximizeMethodSample, language: "ts", title: text("Maximize / Minimize / Restore methods", "Maximize / minimize / restore methods") },
      },
    ],
    events: [
      {
        name: "onMaximizeWidget / onMinimizeWidget / onRestoreWidget",
        payload: "id: string",
        when: text("widget header의 maximize, minimize, restore action이 실행될 때 호출됩니다.", "Called when a widget header maximize, minimize, or restore action runs."),
        description: text("header action을 consumer-owned widget state command와 연결합니다.", "Connects header actions to consumer-owned widget state commands."),
      },
      {
        name: "onWidgetHeaderDoubleClick",
        payload: "id: string",
        when: text("widget header가 double-click되고 action button 영역이 아닐 때 호출됩니다.", "Called when a widget header is double-clicked outside its action button area."),
        description: text("fitWidgetToColumns 같은 header-level shortcut interaction을 연결할 수 있습니다.", "Lets consumers connect a header-level shortcut interaction such as fitWidgetToColumns."),
      },
    ],
    samples: [{ code: maximizeMethodSample, language: "ts", title: text("Maximize / Minimize / Restore 예제", "Maximize / minimize / restore example") }],
  },
  {
    id: "api-resize-adapter",
    title: text("Resize frame / Adapter utility", "Resize frame / adapter utility"),
    summary: text("resize frame event와 GridStack option mapping을 다루는 고급 public utility입니다.", "Advanced public utilities for resize frame events and GridStack option mapping."),
    props: [
      {
        name: "onWidgetResizeFrame",
        type: "(event: DashboardWidgetResizeFrameEvent) => void",
        description: text("resize 중 widget content에 전달할 frame event callback입니다.", "The frame event callback delivered to widget content during resizing."),
        detail: text("chart/table 같은 내부 content가 resize frame에 맞춰 다시 계산할 때 사용합니다.", "Use when internal content such as charts or tables must recalculate for each resize frame."),
      },
      {
        name: "DashboardGridEngineOptions.cellHeight / margin",
        type: "GridStackOptions field",
        description: text("GridStack engine으로 전달되는 cell height와 margin mapping option입니다.", "Cell height and margin mapping options passed to the GridStack engine."),
        detail: text("Comins adapter boundary 내부에서 사용하며 직접 GridStack 인스턴스를 노출하지 않습니다.", "Used inside the Comins adapter boundary without exposing a GridStack instance directly."),
      },
      {
        name: "DashboardGridHandle",
        type: "type",
        description: text("getGridStack, refresh, compact, commitLayout을 제공하는 advanced public handle입니다.", "The advanced public handle providing getGridStack, refresh, compact, and commitLayout."),
        detail: text("getGridStack()은 escape hatch입니다. controlled example에서는 raw GridStack add/remove/destroy를 호출하지 않습니다.", "getGridStack() is an escape hatch. Controlled examples do not call raw GridStack add/remove/destroy."),
      },
      {
        name: "DashboardWidgetResizeFrameEvent / DashboardResizeScheduler",
        type: "type",
        description: text("resize frame event와 scheduler contract입니다.", "The resize frame event and scheduler contracts."),
        detail: text("scheduler는 pending resize event를 requestAnimationFrame 단위로 모아 전달합니다.", "The scheduler batches pending resize events per requestAnimationFrame."),
      },
    ],
    methods: [
      {
        name: "createDashboardResizeScheduler / mapDashboardGridOptions / mapDashboardWidgetOptions",
        params: "resize callback 또는 Comins interaction options",
        returns: "DashboardResizeScheduler 또는 GridStack option object",
        description: text("resize event batch 처리와 Comins option to GridStack option mapping을 수행합니다.", "Batches resize events and maps Comins options to GridStack options."),
        sample: { code: utilityApiSample, language: "ts", title: text("Resize frame / Adapter utility methods", "Resize frame / adapter utility methods") },
      },
    ],
    events: [
      {
        name: "onWidgetResizeFrame",
        payload: "DashboardWidgetResizeFrameEvent",
        when: text("widget resize 중 requestAnimationFrame 단위로 크기 변경이 schedule될 때 호출됩니다.", "Called when a size change is scheduled per requestAnimationFrame during widget resize."),
        description: text("chart, table, canvas처럼 내부 content가 resize frame에 맞춰 다시 계산되어야 할 때 사용합니다.", "Use when internal content such as charts, tables, or canvases must recalculate for resize frames."),
      },
    ],
    samples: [{ code: utilityApiSample, language: "ts", title: text("Resize frame / Adapter utility 예제", "Resize frame / adapter utility example") }],
  },
];

const localizedDocsPages: LocalizedDocsPage[] = [
  {
    body: [text("설치, stylesheet import, 첫 dashboard 렌더링 흐름을 확인합니다.", "Review installation, stylesheet imports, and the first dashboard render.")],
    category: text("시작하기", "Getting started"),
    examples: [
      {
        codeSamples: [
          { code: installSample, language: "bash", title: text("패키지 설치", "Install the package") },
          { code: cssSample, language: "ts", title: text("스타일", "Styles") },
          { code: basicSample, language: "tsx", title: text("최소 대시보드", "Minimal dashboard") },
        ],
        description: text("패키지와 GridStack stylesheet을 연결하고 DashboardGrid를 렌더링합니다.", "Connect the package and GridStack stylesheet, then render DashboardGrid."),
        title: text("기본 dashboard 연결", "Basic dashboard setup"),
      },
    ],
    label: text("시작하기", "Getting started"),
    path: "/docs/getting-started",
    summary: text("패키지 설치와 기본 사용 흐름입니다.", "Package installation and basic usage."),
    title: text("시작하기", "Getting started"),
  },
  {
    category: text("예제", "Examples"),
    examples: [
      {
        codeSamples: [{ code: crudSample, language: "ts", title: text("Widget 추가/삭제 command", "Widget add/remove commands") }],
        description: text("기본 3개 위젯에서 Dialog를 통해 위젯을 추가하고, 선택 위젯을 삭제합니다.", "Add widgets through a dialog from the initial three widgets and remove the selected widget."),
        liveExampleId: "widget",
        title: text("위젯 CRUD", "Widget CRUD"),
      },
    ],
    label: text("위젯", "Widgets"),
    path: "/examples/widget",
    summary: text("widget create, delete 흐름입니다.", "Widget creation and deletion flow."),
    title: text("위젯", "Widgets"),
  },
  {
    category: text("예제", "Examples"),
    examples: [
      {
        codeSamples: [{ code: layoutSample, language: "ts", title: text("저장 및 복원", "Save and restore") }],
        description: text("현재 dashboard state를 JSON으로 저장하고 column 변경 후 다시 복원합니다.", "Save the current dashboard state as JSON and restore it after column changes."),
        liveExampleId: "layout",
        title: text("레이아웃 저장 / 불러오기", "Save and load layout"),
      },
      {
        codeSamples: [{ code: `dashboard.commands.setColumns(4);`, language: "ts", title: text("동적 컬럼", "Dynamic columns") }],
        description: text("1부터 12까지 column option을 선택하고 12개 위젯 배치가 동적으로 바뀌는지 확인합니다.", "Select column options from 1 through 12 and check that the twelve-widget arrangement changes dynamically."),
        title: text("컬럼 레이아웃 동적 수정", "Dynamic column layout"),
      },
      {
        codeSamples: [{ code: lockSample, language: "tsx", title: text("전체 잠금", "Global lock") }],
        description: text("전체 레이아웃 잠금 시 등록된 위젯의 이동과 리사이즈를 모두 금지합니다.", "When the whole layout is locked, blocks moving and resizing every registered widget."),
        title: text("레이아웃 잠금 / 해제", "Lock and unlock layout"),
      },
    ],
    label: text("레이아웃", "Layout"),
    path: "/examples/layout",
    summary: text("저장/복원, column 변경, 전체 잠금 흐름입니다.", "Save/restore, column changes, and whole-layout locking."),
    title: text("레이아웃", "Layout"),
  },
  {
    category: text("예제", "Examples"),
    examples: [
      {
        codeSamples: [{ code: `${layoutSample}\n\n${widgetLockSample}`, language: "ts", title: text("고급 제어 상태", "Advanced controlled state") }],
        description: text("responsive column, public handle query, external drop, 전체 상태와 컬럼 cache 복원을 제어된 React state로 확인합니다.", "Review responsive columns, public handle queries, external drops, whole state, and column cache restoration with controlled React state."),
        liveExampleId: "advanced",
        title: text("고급 제어 예제", "Advanced controlled example"),
      },
    ],
    label: text("고급 예제", "Advanced example"),
    path: "/examples/advanced",
    summary: text("responsive, handle, external drop, 전체 상태 cache 흐름입니다.", "Responsive, handle, external drop, and complete state cache flow."),
    title: text("고급 예제", "Advanced example"),
  },
  {
    category: text("API", "API"),
    examples: [],
    label: text("API", "API"),
    path: "/api",
    summary: text("기능별 Props, Methods, 예제 코드입니다.", "Feature-based props, methods, and example code."),
    title: text("API", "API"),
  },
];

function resolveCodeSample(sample: LocalizedDocsCodeSample, locale: PlaygroundLocale): DocsCodeSample {
  return { ...sample, title: resolveLocalizedText(sample.title, locale) };
}

function resolveExample(example: LocalizedDocsExampleCase, locale: PlaygroundLocale) {
  return {
    ...example,
    codeSamples: example.codeSamples.map((sample) => resolveCodeSample(sample, locale)),
    description: resolveLocalizedText(example.description, locale),
    title: resolveLocalizedText(example.title, locale),
  };
}

function resolveApiFeature(section: LocalizedApiFeatureSection, locale: PlaygroundLocale): ApiFeatureSection {
  return {
    ...section,
    events: section.events?.map((event) => ({
      ...event,
      description: resolveLocalizedText(event.description, locale),
      when: resolveLocalizedText(event.when, locale),
    })),
    methods: section.methods?.map((method) => ({
      ...method,
      description: resolveLocalizedText(method.description, locale),
      sample: method.sample ? resolveCodeSample(method.sample, locale) : undefined,
    })),
    props: section.props.map((prop) => ({
      ...prop,
      description: resolveLocalizedText(prop.description, locale),
      detail: resolveLocalizedText(prop.detail, locale),
    })),
    samples: section.samples.map((sample) => resolveCodeSample(sample, locale)),
    summary: resolveLocalizedText(section.summary, locale),
    title: resolveLocalizedText(section.title, locale),
  };
}

export function createDocsContent(locale: PlaygroundLocale) {
  const apiFeatures = localizedApiFeatures.map((section) => resolveApiFeature(section, locale));
  const pages = localizedDocsPages.map((page) => ({
    ...page,
    apiFeatures: page.path === "/api" ? apiFeatures : undefined,
    body: page.body?.map((line) => resolveLocalizedText(line, locale)),
    category: resolveLocalizedText(page.category, locale),
    examples: page.examples.map((example) => resolveExample(example, locale)),
    label: resolveLocalizedText(page.label, locale),
    summary: resolveLocalizedText(page.summary, locale),
    title: resolveLocalizedText(page.title, locale),
  }));

  return { apiFeatures, pages };
}

export function createDocsNavGroups(pages: DocsPage[]): DocsNavGroup[] {
  return pages.reduce<DocsNavGroup[]>((groups, page) => {
    const group = groups.find((item) => item.category === page.category);
    if (group) {
      group.pages.push(page);
      return groups;
    }

    groups.push({ category: page.category, pages: [page] });
    return groups;
  }, []);
}

function createDocsSearchItems(pages: DocsPage[]): DocsSearchItem[] {
  return pages.flatMap((page) => {
    const pageText = [page.path, page.category, page.label, page.title, page.summary].join(" ");
    const pageItem: DocsSearchItem = {
      id: `page:${page.path}`,
      kind: page.apiFeatures ? "api" : "document",
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

      return [
        {
          id: `example:${exampleId}`,
          kind: "example" as const,
          title: example.title,
          description: example.description,
          path: page.path,
          hash: `#${exampleId}`,
          keywords: exampleText,
        },
        ...example.codeSamples.map((sample) => ({
          id: `code:${page.path}:${sample.title}`,
          kind: "code" as const,
          title: sample.title,
          description: `${example.title}: ${sample.language}`,
          path: page.path,
          hash: `#${exampleId}`,
          keywords: `${exampleText} ${sample.code}`,
        })),
      ];
    });

    const apiItems = (page.apiFeatures ?? []).flatMap((section) => {
      const propText = section.props.map((prop) => `${prop.name} ${prop.type} ${prop.description} ${prop.detail}`);
      const methodText = (section.methods ?? []).map((method) => `${method.name} ${method.params} ${method.returns} ${method.description} ${method.sample?.code ?? ""}`);
      const eventText = (section.events ?? []).map((event) => `${event.name} ${event.payload} ${event.when} ${event.description}`);
      const sampleText = section.samples.map((sample) => `${sample.title} ${sample.language} ${sample.code}`);
      const sectionText = [section.id, section.title, section.summary, ...propText, ...methodText, ...eventText, ...sampleText].join(" ");

      return [
        {
          id: `api-section:${section.id}`,
          kind: "api" as const,
          title: section.title,
          description: section.summary,
          path: page.path,
          hash: `#${section.id}`,
          keywords: sectionText,
        },
        ...section.props.map((prop) => ({
          id: `api-prop:${section.id}:${prop.name}`,
          kind: "api" as const,
          title: prop.name,
          description: prop.description,
          path: page.path,
          hash: `#${section.id}`,
          keywords: `${sectionText} ${prop.name} ${prop.type} ${prop.description} ${prop.detail}`,
        })),
        ...(section.methods ?? []).map((method) => ({
          id: `api-method:${section.id}:${method.name}`,
          kind: "api" as const,
          title: method.name,
          description: method.description,
          path: page.path,
          hash: `#${section.id}`,
          keywords: `${sectionText} ${method.name} ${method.params} ${method.returns} ${method.description} ${method.sample?.code ?? ""}`,
        })),
        ...(section.events ?? []).map((event) => ({
          id: `api-event:${section.id}:${event.name}`,
          kind: "api" as const,
          title: event.name,
          description: event.description,
          path: page.path,
          hash: `#${section.id}`,
          keywords: `${sectionText} ${event.name} ${event.payload} ${event.when} ${event.description}`,
        })),
        ...section.samples.map((sample) => ({
          id: `api-code:${section.id}:${sample.title}`,
          kind: "code" as const,
          title: sample.title,
          description: `${section.title}: ${sample.language}`,
          path: page.path,
          hash: `#${section.id}`,
          keywords: `${sectionText} ${sample.title} ${sample.language} ${sample.code}`,
        })),
      ];
    });

    return [pageItem, ...exampleItems, ...apiItems];
  });
}

export function searchDocs(query: string, pages: DocsPage[], limit = 10): DocsSearchItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return createDocsSearchItems(pages)
    .filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      if (aTitle !== bTitle) {
        return aTitle - bTitle;
      }

      const aApi = a.kind === "api" ? 0 : 1;
      const bApi = b.kind === "api" ? 0 : 1;
      if (aApi !== bApi) {
        return aApi - bApi;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}
