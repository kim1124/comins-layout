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
        name: "DashboardGridHandle",
        type: "type",
        description: "getGridStack, refresh, compact, commitLayout을 제공하는 advanced public handle입니다.",
        detail: "getGridStack()은 escape hatch입니다. controlled example에서는 raw GridStack add/remove/destroy를 호출하지 않습니다.",
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
        description: "기본 3개 위젯에서 Dialog를 통해 위젯을 추가하고, 선택 위젯을 삭제합니다.",
        title: "위젯 CRUD",
      },
    ],
    label: "위젯",
    path: "/examples/widget",
    summary: "widget create, delete 흐름입니다.",
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
    path: "/examples/layout",
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
    path: "/examples/advanced",
    summary: "responsive, handle, external drop, 전체 상태 cache 흐름입니다.",
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
