import { StrictMode, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router";
import { Highlight, themes } from "prism-react-renderer";
import { Boxes, Columns3, Lock, Move, PanelLeft, Plus, RotateCcw, Save, Search, Settings2, Trash2, Unlock } from "lucide-react";
import { DASHBOARD_COLUMN_COUNTS, DashboardGrid, useDashboardGrid } from "../../src";
import type { DashboardStateSnapshot, DashboardWidget } from "../../src";
import { Dialog } from "./components/ui/dialog";
import { Select } from "./components/ui/select";
import type { SelectOption } from "./components/ui/select";
import "gridstack/dist/gridstack.min.css";
import "../../src/styles.css";
import "./styles.css";

type ExampleWidgetData = {
  description: string;
  value: string;
};

type DocsCodeLanguage = "bash" | "css" | "ts" | "tsx";

type DocsCodeSample = {
  code: string;
  language: DocsCodeLanguage;
  title: string;
};

type LiveExampleId = "basic" | "crud" | "layout-save" | "layout-columns" | "layout-lock" | "widget" | "complete";

type DocsExampleCase = {
  codeSamples: DocsCodeSample[];
  description: string;
  liveExampleId?: LiveExampleId;
  title: string;
};

type DocsPage = {
  body?: ReactNode;
  category: string;
  examples: DocsExampleCase[];
  label: string;
  liveOnly?: boolean;
  path: string;
  summary: string;
  title: string;
};

type ApiPropEntry = {
  name: string;
  type: string;
  description: string;
  detail: string;
};

type ApiMethodEntry = {
  name: string;
  params: string;
  returns: string;
  description: string;
  sample?: DocsCodeSample;
};

type ApiEventEntry = {
  name: string;
  payload: string;
  when: string;
  description: string;
};

type ApiFeatureSection = {
  id: string;
  title: string;
  summary: string;
  props: ApiPropEntry[];
  events?: ApiEventEntry[];
  methods?: ApiMethodEntry[];
  samples: DocsCodeSample[];
};

type DocsSearchItem = {
  id: string;
  kind: "문서" | "예제" | "API" | "코드";
  title: string;
  description: string;
  path: string;
  hash?: string;
  keywords: string;
};

type DashboardRuntime = ReturnType<typeof useDashboardGrid<ExampleWidgetData>>;

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const heightOptions: SelectOption[] = [1, 2, 3, 4].map((height) => ({
  label: String(height),
  value: String(height),
}));

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

const layoutSample = `const snapshot = dashboard.commands.serializeState();
dashboard.commands.setColumns(4);
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

const apiFeatures: ApiFeatureSection[] = [
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
        detail: "useDashboardGrid의 updateWidgetLayout command와 연결하는 기본 callback입니다.",
      },
      {
        name: "DashboardLayoutSnapshot / DashboardStateSnapshot",
        type: "type",
        description: "layout-only 저장과 full-state 저장을 구분하는 snapshot 타입입니다.",
        detail:
          "serializeState()은 widgets, columns, previousLayouts를 저장합니다. 최대화 또는 최소화 후에도 restore가 원래 geometry를 복원합니다. serializeLayout()은 columns와 widget geometry만 저장합니다. pending maximize/minimize restore geometry는 포함하지 않습니다. 이전 JSON은 DashboardStateSnapshotInput으로 previousLayouts 없이 읽을 수 있습니다.",
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
        name: "onWidgetHeaderDoubleClick",
        type: "(id: string) => void",
        description: "위젯 header double-click callback입니다.",
        detail: "fitWidgetToColumns와 조합하면 row 빈 공간 확장 interaction을 만들 수 있습니다.",
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
        name: "onWidgetHeaderDoubleClick",
        payload: "id: string",
        when: "widget header가 double-click되고 action button 영역이 아닐 때 호출됩니다.",
        description: "fitWidgetToColumns 같은 header-level shortcut interaction을 연결할 수 있습니다.",
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
];

function createWidget(
  id: string,
  title: string,
  layout: DashboardWidget<ExampleWidgetData>["layout"],
  value: string,
  description: string,
  patch: Partial<DashboardWidget<ExampleWidgetData>> = {},
): DashboardWidget<ExampleWidgetData> {
  return {
    id,
    title,
    layout,
    data: { description, value },
    ...patch,
  };
}

const completeWidgets: DashboardWidget<ExampleWidgetData>[] = [
  createWidget("sales", "매출", { id: "sales", x: 0, y: 0, w: 3, h: 2 }, "1.28억", "월간 반복 매출"),
  createWidget("traffic", "트래픽", { id: "traffic", x: 3, y: 0, w: 3, h: 2 }, "4.28만", "활성 세션"),
  createWidget("orders", "주문", { id: "orders", x: 0, y: 2, w: 2, h: 2 }, "1,284", "완료 주문"),
  createWidget("alerts", "알림", { id: "alerts", x: 2, y: 2, w: 4, h: 2 }, "3", "미해결 이슈"),
];

const crudWidgets: DashboardWidget<ExampleWidgetData>[] = [
  createWidget("sales", "매출", { id: "sales", x: 0, y: 0, w: 2, h: 2 }, "1.28억", "월간 반복 매출"),
  createWidget("traffic", "트래픽", { id: "traffic", x: 2, y: 0, w: 2, h: 2 }, "4.28만", "활성 세션"),
  createWidget("orders", "주문", { id: "orders", x: 4, y: 0, w: 2, h: 2 }, "1,284", "완료 주문"),
];

const basicWidgets: DashboardWidget<ExampleWidgetData>[] = [
  createWidget("metric-01", "매출", { id: "metric-01", x: 0, y: 0, w: 3, h: 2 }, "1.28억", "월간 반복 매출"),
  createWidget("metric-02", "트래픽", { id: "metric-02", x: 3, y: 0, w: 2, h: 2 }, "4.28만", "활성 세션"),
  createWidget("metric-03", "주문", { id: "metric-03", x: 5, y: 0, w: 4, h: 2 }, "1,284", "완료 주문"),
  createWidget("metric-04", "알림", { id: "metric-04", x: 9, y: 0, w: 3, h: 3 }, "3", "미해결 이슈"),
  createWidget("metric-05", "전환", { id: "metric-05", x: 0, y: 2, w: 4, h: 3 }, "8.4%", "방문 대비 전환"),
  createWidget("metric-06", "품질", { id: "metric-06", x: 4, y: 2, w: 2, h: 2 }, "99.8%", "정상 응답률"),
  createWidget("metric-07", "대기열", { id: "metric-07", x: 6, y: 2, w: 3, h: 2 }, "42", "처리 대기"),
  createWidget("metric-08", "비용", { id: "metric-08", x: 9, y: 3, w: 3, h: 2 }, "620만", "이번 달 비용"),
  createWidget("metric-09", "성능", { id: "metric-09", x: 0, y: 5, w: 2, h: 2 }, "128ms", "평균 응답"),
  createWidget("metric-10", "오류", { id: "metric-10", x: 2, y: 5, w: 2, h: 2 }, "0.03%", "오류율"),
  createWidget("metric-11", "작업", { id: "metric-11", x: 4, y: 4, w: 5, h: 3 }, "16", "진행 중 작업"),
  createWidget("metric-12", "릴리스", { id: "metric-12", x: 9, y: 5, w: 3, h: 2 }, "7", "최근 배포"),
];

const layoutWidgets = basicWidgets.map((widget, index) => ({
  ...widget,
  id: `layout-${index + 1}`,
  title: `레이아웃 ${index + 1}`,
  layout: { ...widget.layout, id: `layout-${index + 1}` },
}));

function paragraphs(lines: string[]) {
  return (
    <>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  );
}

const docsPages: DocsPage[] = [
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
        liveExampleId: "basic",
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
        description: "기본 3개 위젯에서 Dialog를 통해 위젯을 추가하고, 선택 위젯을 삭제합니다.",
        liveExampleId: "crud",
        title: "추가 / 삭제",
      },
    ],
    label: "추가 / 삭제",
    path: "/examples/crud",
    summary: "widget create, delete 흐름입니다.",
    title: "추가 / 삭제",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: layoutSample, language: "ts", title: "Save and restore" }],
        description: "현재 dashboard state를 JSON으로 저장하고 column 변경 후 다시 복원합니다.",
        liveExampleId: "layout-save",
        title: "레이아웃 저장 / 불러오기",
      },
      {
        codeSamples: [{ code: `dashboard.commands.setColumns(4);`, language: "ts", title: "Dynamic columns" }],
        description: "1부터 12까지 column option을 선택하고 12개 위젯 배치가 동적으로 바뀌는지 확인합니다.",
        liveExampleId: "layout-columns",
        title: "Col 레이아웃 동적 수정",
      },
      {
        codeSamples: [{ code: lockSample, language: "tsx", title: "Global lock" }],
        description: "전체 레이아웃 잠금 시 등록된 위젯의 이동과 리사이즈를 모두 금지합니다.",
        liveExampleId: "layout-lock",
        title: "레이아웃 잠금 / 해제",
      },
    ],
    label: "레이아웃",
    path: "/examples/layout",
    summary: "저장/복원, column 변경, 전체 잠금 흐름입니다.",
    title: "레이아웃",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: widgetLockSample, language: "ts", title: "Widget interaction flags" }],
        description: "위젯 목록에서 개별 위젯의 이동과 리사이즈 잠금을 분리해서 확인합니다.",
        liveExampleId: "widget",
        title: "개별 위젯 interaction",
      },
    ],
    label: "위젯",
    path: "/examples/widget",
    summary: "위젯별 이동, 리사이즈, 이동 잠금, 리사이즈 잠금 흐름입니다.",
    title: "위젯",
  },
  {
    category: "Examples",
    examples: [
      {
        codeSamples: [{ code: `${crudSample}\n\n${layoutSample}\n\n${widgetLockSample}`, language: "ts", title: "Complete smoke" }],
        description: "위젯 추가/삭제, 레이아웃 저장/복원, column 변경, 전체 잠금, 개별 위젯 잠금을 한 화면에서 확인합니다.",
        liveExampleId: "complete",
        title: "종합 예제",
      },
    ],
    label: "종합 예제",
    liveOnly: true,
    path: "/examples/complete",
    summary: "1부터 4까지의 핵심 흐름을 한 화면에서 확인합니다.",
    title: "종합 예제",
  },
  {
    body: <ApiReference />,
    category: "API",
    examples: [],
    label: "API",
    path: "/api",
    summary: "기능별 Props, Methods, 예제 코드입니다.",
    title: "API",
  },
];

const docsNavGroups = docsPages.reduce<Array<{ category: string; pages: DocsPage[] }>>((groups, page) => {
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

function searchDocs(query: string, limit = 10): DocsSearchItem[] {
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

function ApiReference() {
  return (
    <div className="docs-reference-list">
      {apiFeatures.map((section, index) => (
        <section className="docs-reference-list__group" id={section.id} key={section.id}>
          <h2>
            {index + 1}. {section.title}
          </h2>
          <p>{section.summary}</p>
          {section.props.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Props`}>
              <h3>Props</h3>
              <dl>
                {section.props.map((prop) => (
                  <div className="docs-reference-list__item" key={prop.name}>
                    <dt>
                      <span>{prop.name}</span>
                      <em>{prop.type}</em>
                    </dt>
                    <dd>
                      <p>{prop.description}</p>
                      <small>{prop.detail}</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {section.methods?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Methods`}>
              <h3>Methods</h3>
              <dl>
                {section.methods.map((method) => (
                  <div className="docs-reference-list__item" key={method.name}>
                    <dt>
                      <span>{method.name}</span>
                      <em>method</em>
                    </dt>
                    <dd>
                      <p>{method.description}</p>
                      <small>
                        <strong>파라미터:</strong> {method.params}
                      </small>
                      <small>
                        <strong>리턴값:</strong> {method.returns}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
              {section.methods.map((method) =>
                method.sample ? (
                  <div className="docs-reference-list__sample" key={method.sample.title}>
                    <h4>간단한 예제 코드</h4>
                    <CodeExample sample={method.sample} />
                  </div>
                ) : null,
              )}
            </section>
          ) : null}
          {section.events?.length ? (
            <section className="docs-reference-list__subsection" aria-label={`${section.title} Events`}>
              <h3>Events</h3>
              <dl>
                {section.events.map((event) => (
                  <div className="docs-reference-list__item" key={event.name}>
                    <dt>
                      <span>{event.name}</span>
                      <em>event</em>
                    </dt>
                    <dd>
                      <p>{event.description}</p>
                      <small>
                        <strong>발생 시점:</strong> {event.when}
                      </small>
                      <small>
                        <strong>페이로드:</strong> {event.payload}
                      </small>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          <section className="docs-reference-list__subsection" aria-label={`${section.title} 예제 코드`}>
            <h3>예제 코드</h3>
            {section.samples.map((sample) => (
              <div className="docs-reference-list__sample" key={sample.title}>
                <CodeExample sample={sample} />
              </div>
            ))}
          </section>
        </section>
      ))}
    </div>
  );
}

function DocsShell() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start" });
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  return (
    <div className="docs-shell">
      <DocsTopNav />
      <div className="docs-shell__body">
        <DocsSidebar />
        <main className="docs-shell__content">
          <Routes key={location.pathname} location={location}>
            <Route element={<Navigate replace to="/examples/complete" />} path="/" />
            <Route element={<Navigate replace to="/docs/getting-started" />} path="/examples/basic" />
            {docsPages.map((page) => (
              <Route
                element={
                  <RouteLifecycleBoundary routePath={page.path}>
                    <DocsArticle page={page} />
                  </RouteLifecycleBoundary>
                }
                key={page.path}
                path={page.path}
              />
            ))}
            <Route element={<Navigate replace to="/examples/complete" />} path="*" />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DocsTopNav() {
  return (
    <header className="docs-topnav">
      <div className="docs-topnav__brand">
        <p className="docs-topnav__eyebrow">Comins Playground</p>
        <h1>comins-grid-layout</h1>
      </div>
      <GlobalDocsSearch />
    </header>
  );
}

function GlobalDocsSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDocs(query), [query]);

  useEffect(() => {
    setQuery("");
  }, [location.key]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectResult = (item: DocsSearchItem) => {
    navigate(`${item.path}${item.hash ?? ""}`);
    setQuery("");

    if (item.hash) {
      setTimeout(() => {
        document.getElementById(decodeURIComponent(item.hash!.slice(1)))?.scrollIntoView({ block: "start" });
      }, 0);
    }
  };

  return (
    <div className="global-docs-search" ref={rootRef}>
      <div className="example-search">
        <Search aria-hidden="true" size={16} />
        <input
          aria-controls={query.trim() ? "global-docs-search-results" : undefined}
          aria-expanded={Boolean(query.trim())}
          aria-label="전체 문서 검색"
          placeholder="전체 문서 검색"
          role="searchbox"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
            }
          }}
        />
      </div>
      {query.trim() ? (
        <div aria-label="전체 문서 검색 결과" className="global-search-popup" id="global-docs-search-results" role="listbox">
          {results.length ? (
            results.map((item) => (
              <button
                aria-label={`${item.kind} ${item.title} ${item.description}`}
                className="global-search-popup__item"
                key={item.id}
                role="option"
                type="button"
                onClick={() => selectResult(item)}
              >
                <span className="global-search-popup__badge">{item.kind}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="global-search-popup__empty">검색된 결과가 없습니다.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DocsSidebar() {
  return (
    <aside aria-label="GridStack 문서" className="docs-sidebar">
      <div className="docs-sidebar__heading">
        <PanelLeft aria-hidden="true" size={16} />
        <strong>문서</strong>
      </div>
      <nav aria-label="문서 메뉴">
        {docsNavGroups.map((group) => (
          <section className="docs-sidebar__group" key={group.category}>
            <h2>{group.category}</h2>
            <div className="docs-sidebar__links">
              {group.pages.map((page) => (
                <NavLink className="docs-sidebar__link" key={page.path} to={page.path}>
                  {page.label}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

function DocsArticle({ page }: { page: DocsPage }) {
  if (page.liveOnly) {
    const liveExampleId = page.examples.find((example) => example.liveExampleId)?.liveExampleId;

    return (
      <article aria-label={page.title} className="docs-article docs-article--live-only">
        {liveExampleId ? <LiveExampleSection liveExampleId={liveExampleId} /> : null}
      </article>
    );
  }

  return (
    <article className="docs-article">
      <header className="docs-article__header">
        <p className="docs-article__eyebrow">{page.category}</p>
        <h1>{page.title}</h1>
        <p>{page.summary}</p>
      </header>

      {page.body ? <section className="docs-article__body">{page.body}</section> : null}

      {page.examples.map((example, index) => (
        <section className="docs-example-case" id={`${page.path}-example-${index + 1}`} key={`${page.path}-${example.title}`}>
          <header className="docs-example-case__header">
            <h2>
              {index + 1}. {example.title}
            </h2>
            <p>{example.description}</p>
          </header>

          {example.codeSamples.map((sample) => (
            <CodeExample key={`${page.path}-${example.title}-${sample.title}`} sample={sample} />
          ))}

          {example.liveExampleId ? <LiveExampleSection liveExampleId={example.liveExampleId} /> : null}
        </section>
      ))}
    </article>
  );
}

function CodeExample({ sample }: { sample: DocsCodeSample }) {
  return (
    <section aria-label={sample.title} className="docs-code">
      <div className="docs-code__header">
        <span>{sample.title}</span>
        <span>{sample.language}</span>
      </div>
      <Highlight code={sample.code.trim()} language={sample.language} theme={themes.github}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} docs-code__pre`} style={style}>
            {tokens.map((line, lineIndex) => (
              <div key={lineIndex} {...getLineProps({ className: "docs-code__line", line })}>
                <span className="docs-code__line-number">{lineIndex + 1}</span>
                <span className="docs-code__line-content">
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </section>
  );
}

function LiveExampleSection({ liveExampleId }: { liveExampleId: LiveExampleId }) {
  return (
    <section aria-label="라이브 예제" className="docs-live">
      <LiveExample id={liveExampleId} />
    </section>
  );
}

function LiveExample({ id }: { id: LiveExampleId }) {
  switch (id) {
    case "basic":
      return <BasicExample />;
    case "crud":
      return <CrudExample />;
    case "layout-save":
      return <LayoutSaveRestoreExample />;
    case "layout-columns":
      return <LayoutColumnsExample />;
    case "layout-lock":
      return <LayoutLockExample />;
    case "widget":
      return <WidgetExample />;
    case "complete":
      return <CompleteExample />;
    default:
      return null;
  }
}

function BasicExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: basicWidgets,
  });
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);

  return (
    <div className="example-shell" data-example-mode="basic">
      <ExampleToolbar kicker="개발 예제" title="기본 12 column dashboard" />
      <section className="example-actions" aria-label="basic dashboard actions">
        <button className="example-toggle-button" type="button" onClick={() => setMovable((value) => !value)} {...toggleStateProps(movable)}>
          <Move aria-hidden="true" size={14} />
          {movable ? "이동 가능" : "이동 불가"}
        </button>
        <button className="example-toggle-button" type="button" onClick={() => setResizable((value) => !value)} {...toggleStateProps(resizable)}>
          <Settings2 aria-hidden="true" size={14} />
          {resizable ? "크기 조절 가능" : "크기 조절 불가"}
        </button>
      </section>
      <DashboardPreview dashboard={dashboard} movable={movable} resizable={resizable} showControls={false} />
    </div>
  );
}

function CrudExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: crudWidgets,
  });

  return <CrudWorkbench dashboard={dashboard} mode="crud" />;
}

function LayoutSaveRestoreExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: crudWidgets,
  });
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 레이아웃이 없습니다.");

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

  return (
    <div className="example-shell" data-example-mode="layout-save">
      <ExampleToolbar kicker="레이아웃 예제" title="저장과 복원" />
      <section className="example-actions" aria-label="layout save restore actions">
        <Select
          id="layout-save-columns"
          label="컬럼 선택"
          options={columnOptions}
          value={String(dashboard.columns)}
          onChange={(value) => dashboard.commands.setColumns(Number(value))}
        />
        <button type="button" onClick={saveLayout}>
          <Save aria-hidden="true" size={14} />
          레이아웃 저장
        </button>
        <button type="button" onClick={restoreLayout}>
          <RotateCcw aria-hidden="true" size={14} />
          레이아웃 복원
        </button>
      </section>
      <LayoutJson value={layoutJson} status={layoutStatus} onChange={setLayoutJson} id="layout-save-json" />
      <DashboardPreview dashboard={dashboard} />
    </div>
  );
}

function LayoutColumnsExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: layoutWidgets,
  });

  return (
    <div className="example-shell" data-example-mode="layout-columns">
      <ExampleToolbar kicker="레이아웃 예제" title="Column 조정" />
      <section className="example-actions" aria-label="layout columns actions">
        <Select
          id="layout-columns"
          label="컬럼 선택"
          options={columnOptions}
          value={String(dashboard.columns)}
          onChange={(value) => dashboard.commands.setColumns(Number(value))}
        />
        <button type="button" onClick={() => dashboard.commands.fitWidgetsToColumns()}>
          <Columns3 aria-hidden="true" size={14} />
          빈 공간 채우기
        </button>
      </section>
      <DashboardPreview dashboard={dashboard} showControls={false} />
    </div>
  );
}

function LayoutLockExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: crudWidgets,
  });
  const [locked, setLocked] = useState(false);

  return (
    <div className="example-shell" data-example-mode="layout-lock">
      <ExampleToolbar kicker="레이아웃 예제" title="전체 잠금" />
      <section className="example-actions" aria-label="layout lock actions">
        <button className="example-toggle-button" type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
          {locked ? <Unlock aria-hidden="true" size={14} /> : <Lock aria-hidden="true" size={14} />}
          {locked ? "레이아웃 잠금" : "레이아웃 해제"}
        </button>
      </section>
      <DashboardPreview dashboard={dashboard} movable={!locked} resizable={!locked} />
    </div>
  );
}

function WidgetExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: crudWidgets,
  });

  return <WidgetWorkbench dashboard={dashboard} mode="widget" />;
}

function CompleteExample() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: completeWidgets,
  });
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 레이아웃이 없습니다.");
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

  return (
    <div className="example-shell" data-example-mode="complete">
      <ExampleToolbar kicker="개발 예제" title="DashboardGrid" />
      <CrudControls dashboard={dashboard} mode="complete" />
      <section className="example-actions" aria-label="complete layout actions">
        <button type="button" onClick={() => dashboard.commands.autoArrangeWidgets()}>
          <Boxes aria-hidden="true" size={14} />
          자동 정렬
        </button>
        <Select
          id="complete-columns"
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
      </section>
      <LayoutJson value={layoutJson} status={layoutStatus} onChange={setLayoutJson} id="complete-layout-json" />
      <DashboardPreview dashboard={dashboard} movable={movable && !locked} resizable={resizable && !locked} />
    </div>
  );
}

function CrudWorkbench({ dashboard, mode }: { dashboard: DashboardRuntime; mode: string }) {
  return (
    <div className="example-shell" data-example-mode={mode}>
      <ExampleToolbar kicker="추가 / 삭제 예제" title="Widget 추가 / 삭제" />
      <CrudControls dashboard={dashboard} mode={mode} />
      <DashboardPreview dashboard={dashboard} />
    </div>
  );
}

function WidgetWorkbench({ dashboard, mode }: { dashboard: DashboardRuntime; mode: string }) {
  const [selectedId, setSelectedId] = useState("sales");
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedId) ?? dashboard.widgets[0];
  const selectedValue = selectedWidget?.id ?? "";
  const moveLocked = selectedWidget?.locked === true || selectedWidget?.movable === false;
  const resizeLocked = selectedWidget?.locked === true || selectedWidget?.resizable === false;
  const fullyLocked = selectedWidget?.locked === true;
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: widget.title ?? widget.id,
    value: widget.id,
  }));

  const toggleMoveLock = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.updateWidget(selectedWidget.id, { movable: selectedWidget.movable === false ? true : false, locked: false });
  };

  const toggleResizeLock = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.updateWidget(selectedWidget.id, { resizable: selectedWidget.resizable === false ? true : false, locked: false });
  };

  return (
    <div className="example-shell" data-example-mode={mode}>
      <ExampleToolbar kicker="위젯 예제" title="Widget interaction" />
      <CrudControls dashboard={dashboard} mode={mode} onAfterAdd={(id) => setSelectedId(id)} />
      <section className="example-actions" aria-label="widget interaction actions">
        <Select id={`${mode}-widget-select`} label="위젯 선택" options={widgetOptions} value={selectedValue} onChange={setSelectedId} />
        <button className="example-toggle-button" type="button" onClick={toggleMoveLock} {...toggleStateProps(moveLocked)}>
          <Move aria-hidden="true" size={14} />
          이동 잠금
        </button>
        <button className="example-toggle-button" type="button" onClick={toggleResizeLock} {...toggleStateProps(resizeLocked)}>
          <Settings2 aria-hidden="true" size={14} />
          리사이즈 잠금
        </button>
        <button
          className="example-toggle-button"
          type="button"
          onClick={() =>
            selectedWidget ? dashboard.commands.updateWidget(selectedWidget.id, { locked: !selectedWidget.locked }) : undefined
          }
          {...toggleStateProps(fullyLocked)}
        >
          <Lock aria-hidden="true" size={14} />
          전체 잠금
        </button>
      </section>
      <DashboardPreview dashboard={dashboard} />
    </div>
  );
}

function CrudControls({
  dashboard,
  mode,
  onAfterAdd,
}: {
  dashboard: DashboardRuntime;
  mode: string;
  onAfterAdd?: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("새 위젯");
  const [draftValue, setDraftValue] = useState("신규");
  const [newWidgetHeight, setNewWidgetHeight] = useState(2);
  const [newWidgetWidth, setNewWidgetWidth] = useState(2);
  const [selectedId, setSelectedId] = useState("sales");
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedId) ?? dashboard.widgets[0];
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: widget.title ?? widget.id,
    value: widget.id,
  }));
  const selectedValue = selectedWidget?.id ?? "";

  const addWidget = () => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    const id = `widget-${number}`;
    dashboard.commands.addWidget(
      createWidget(id, draftTitle || `위젯 ${number}`, { id, x: 0, y: 0, w: newWidgetWidth, h: newWidgetHeight }, draftValue || String(number), "새 대시보드 위젯"),
    );
    setSelectedId(id);
    onAfterAdd?.(id);
    setDialogOpen(false);
  };

  const removeSelectedWidget = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.removeWidget(selectedWidget.id);
    const nextWidget = dashboard.widgets.find((widget) => widget.id !== selectedWidget.id);
    if (nextWidget) {
      setSelectedId(nextWidget.id);
    }
  };

  const openAddDialog = () => {
    const number = nextWidgetNumber.current;
    setDraftTitle(`위젯 ${number}`);
    setDraftValue(String(number));
    setDialogOpen(true);
  };

  return (
    <>
      <section className="example-actions example-crud-actions" aria-label={`${mode} widget actions`}>
        <button className="example-action-button example-action-button--add" type="button" onClick={openAddDialog}>
          <Plus aria-hidden="true" size={14} />
          위젯 추가
        </button>
        <Select id={`${mode}-delete-widget`} label="삭제 대상" options={widgetOptions} value={selectedValue} onChange={setSelectedId} />
        <button className="example-action-button example-action-button--danger" type="button" onClick={removeSelectedWidget}>
          <Trash2 aria-hidden="true" size={14} />
          위젯 삭제
        </button>
      </section>

      <Dialog description="추가할 위젯의 너비와 높이를 선택합니다." open={dialogOpen} title="위젯 추가" onOpenChange={setDialogOpen}>
        <div className="example-dialog-form">
          <label className="example-input" htmlFor={`${mode}-new-widget-title`}>
            <span>위젯명</span>
            <input id={`${mode}-new-widget-title`} value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
          </label>
          <label className="example-input" htmlFor={`${mode}-new-widget-value`}>
            <span>값</span>
            <input id={`${mode}-new-widget-value`} value={draftValue} onChange={(event) => setDraftValue(event.target.value)} />
          </label>
          <Select
            id={`${mode}-new-widget-width`}
            label="새 위젯 너비"
            options={columnOptions}
            value={String(newWidgetWidth)}
            onChange={(value) => setNewWidgetWidth(Number(value))}
          />
          <Select
            id={`${mode}-new-widget-height`}
            label="새 위젯 높이"
            options={heightOptions}
            value={String(newWidgetHeight)}
            onChange={(value) => setNewWidgetHeight(Number(value))}
          />
          <div className="example-dialog__footer">
            <button type="button" onClick={() => setDialogOpen(false)}>
              취소
            </button>
            <button className="example-action-button example-action-button--add" type="button" onClick={addWidget}>
              위젯 저장
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function toggleStateProps(active: boolean) {
  return {
    "aria-pressed": active,
    "data-active": active ? "true" : "false",
  } as const;
}

function ExampleToolbar({ kicker, title }: { kicker: string; title: string }) {
  return (
    <section className="example-toolbar" aria-labelledby={`page-title-${title}`}>
      <div>
        <p className="example-kicker">{kicker}</p>
        <h2 id={`page-title-${title}`}>{title}</h2>
      </div>
    </section>
  );
}

function DashboardPreview({
  dashboard,
  movable = true,
  resizable = true,
  showControls = true,
}: {
  dashboard: DashboardRuntime;
  movable?: boolean;
  resizable?: boolean;
  showControls?: boolean;
}) {
  return (
    <>
      <p className="example-widget-count">위젯 {dashboard.widgets.length}개</p>
      <DashboardGrid
        columns={dashboard.columns}
        movable={movable}
        refreshKey={dashboard.refreshVersion}
        resizable={resizable}
        showControls={showControls}
        widgets={dashboard.widgets}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
        renderWidget={(widget) => (
          <div className="dashboard-widget-body">
            <span>{widget.data?.description}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
    </>
  );
}

function LayoutJson({
  id,
  onChange,
  status,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  status: string;
  value: string;
}) {
  return (
    <section className="example-layout-json" aria-label="layout json controls">
      <label htmlFor={id}>저장된 레이아웃 JSON</label>
      <textarea id={id} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />
      <p role="status">{status}</p>
    </section>
  );
}

function RouteLifecycleBoundary({ children, routePath }: { children: ReactNode; routePath: string }) {
  const cleanupCountRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanupCountRef.current += 1;
      if (cleanupCountRef.current > 1) {
        window.__cominsGridLayoutLastUnmount = { routePath };
      }
    };
  }, [routePath]);

  return <>{children}</>;
}

declare global {
  interface Window {
    __cominsGridLayoutExampleRoot?: Root;
    __cominsGridLayoutLastUnmount?: { routePath: string } | string;
  }
}

const container = document.getElementById("root") as HTMLElement;
const root = window.__cominsGridLayoutExampleRoot ?? createRoot(container);
window.__cominsGridLayoutExampleRoot = root;

root.render(
  <StrictMode>
    <BrowserRouter>
      <DocsShell />
    </BrowserRouter>
  </StrictMode>,
);
