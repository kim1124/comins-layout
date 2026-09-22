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
    summary: "DashboardGrid에 위젯 목록과 콘텐츠를 전달하고 useDashboardGrid로 배치 상태를 관리합니다.",
    props: [
      {
        name: "DashboardGridProps",
        type: "type",
        description: "DashboardGrid 컴포넌트에 전달할 속성의 타입입니다.",
        detail: "필수 속성은 widgets와 renderWidget입니다. DashboardInteractionOptions를 포함하며 컬럼 수, 배치·조작 이벤트, 타이틀 버튼의 동작을 함께 설정합니다.",
      },
      {
        name: "widgets",
        type: "DashboardWidget<TData>[]",
        description: "화면에 표시할 위젯 목록입니다.",
        detail: "앱이 관리하는 id, layout, data 등을 전달합니다. 목록과 배치의 기준은 이 React 상태이며, 조작 결과를 유지하려면 onLayoutCommit을 상태 갱신 함수에 연결합니다.",
      },
      {
        name: "columns",
        type: "DashboardColumnCount",
        description: "그리드를 가로로 나누는 컬럼 수입니다.",
        detail: "1~12를 지원하며 생략하면 12입니다. 실행 중에도 변경할 수 있으며 위젯의 x와 w는 이 컬럼 단위를 사용합니다.",
      },
      {
        name: "engineOptions / responsive / className",
        type: "DashboardGridEngineOptions / DashboardResponsiveOptions / string",
        description: "엔진 설정, 반응형 컬럼 정책, 그리드의 CSS 클래스를 지정합니다.",
        detail: "engineOptions는 공개 타입에 정의된 옵션만 지원합니다. rtl/sizeToContent 변경 시 엔진을 재초기화하며 nonce는 초기화 시에만 적용합니다. responsive의 기본 기준은 그리드 컨테이너 너비입니다.",
      },
      {
        name: "engineOptions.sizeToContent / DashboardWidget.sizeToContent / resizeToContentParent",
        type: "boolean / boolean | number / string",
        description: "콘텐츠 높이에 맞춰 위젯이 차지하는 행 수 h를 자동으로 조정합니다.",
        detail: "cellHeight는 유지하며 헤더를 포함해 측정하고 minH/maxH 제약을 따릅니다. 기본적으로 활성화되지 않는 선택 기능입니다. 위젯의 sizeToContent=false로 개별 제외하고 resizeToContentParent로 측정 영역을 지정할 수 있습니다. 숫자 sizeToContent는 행 단위의 소프트 상한입니다. 결과는 onLayoutCommit으로 상태에 반영하며 콘텐츠 변경 후 refreshKey 또는 refresh()로 재측정합니다. 최대화·최소화 중에는 중단하고 복원 후 재개합니다. 끄더라도 이전 높이로 자동 복원하지 않습니다.",
      },
      {
        name: "engineOptions.staticGrid",
        type: "boolean",
        description: "위젯 배치를 유지하면서 그리드 엔진의 드래그와 리사이즈를 비활성화합니다.",
        detail: "기본값은 false입니다. movable/resizable로 상호작용만 잠그는 것과 달리 엔진을 정적 모드로 전환하며 외부 위젯 드롭 수신도 차단합니다. 삭제 버튼이나 콘텐츠 입력을 막는 읽기 전용 권한은 아니므로 앱의 버튼·입력은 별도로 제어해야 합니다. 레이아웃 잠금 예제의 잠금 방식에서 두 모드를 비교할 수 있습니다.",
      },
      {
        name: "engineOptions.float",
        type: "boolean",
        description: "위젯 위쪽의 빈 공간을 유지할지, 가능한 위쪽으로 당겨 채울지 설정합니다.",
        detail: "기본값 false는 위젯을 위쪽으로 당겨 배치합니다. true는 빈 공간을 유지합니다. Float 예제는 비교를 위해 true로 시작하며 위젯을 이동해 차이를 확인할 수 있습니다.",
      },
      {
        name: "responsive.columnWidth / columnMax / breakpoints / breakpointForWindow",
        type: "DashboardResponsiveOptions",
        description: "그리드 영역의 너비에 따라 컬럼 수를 자동으로 전환합니다.",
        detail: "columnWidth는 컬럼 수 계산 기준이며 픽셀 너비를 고정하지 않습니다. 컨테이너 너비를 기준값으로 나눈 결과를 반올림하고 지원 범위와 columnMax로 제한합니다. breakpoints는 maxWidth별 columns를 지정합니다. 기본 기준은 컨테이너이며 breakpointForWindow=true일 때만 창 너비를 사용합니다. onColumnsChange와 onLayoutCommit을 연결해 컬럼과 배치를 상태에 반영합니다. 예제의 180px, 640px, 960px 등은 패키지 기본값이 아닙니다. 컬럼 결정 방식과 배치 정책은 서로 다른 설정이며 통합 반응형 예제에서 독립적으로 비교합니다.",
      },
      {
        name: "responsive.layout / DashboardColumnLayout",
        type: '"list" | "compact" | "moveScale" | "move" | "scale" | "none"',
        description: "컬럼 수가 바뀔 때 위젯 위치와 너비를 조정하는 방식을 선택합니다.",
        detail: "moveScale은 가로 위치 x와 너비 w를 비례 조정하고 move는 위치, scale은 너비만 비례 조정합니다. list는 순서를 유지해 배치하고 compact는 빈 공간을 채우도록 재배치합니다. none은 비례 변환을 하지 않지만 컬럼 경계와 겹침은 보정합니다. none도 반응형으로 동작하며 픽셀 너비를 유지하는 설정은 아닙니다. 방문한 컬럼 수의 저장된 배치가 있으면 이를 복원하며 캐시 보존에는 serializeState를 사용합니다.",
      },
      {
        name: "engineOptions.rtl / dragHandle / alwaysShowResizeHandle",
        type: "boolean | 'auto' / string / boolean | 'mobile'",
        description: "오른쪽 기준 배치, 드래그 시작 영역, 리사이즈 핸들 표시 방식을 설정합니다.",
        detail: "rtl=true는 오른쪽 기준 배치입니다. dragHandle은 이동을 시작할 요소의 CSS 선택자이며 타이틀로 제한하면 콘텐츠 조작과 이동을 구분할 수 있습니다. alwaysShowResizeHandle은 핸들 표시만 바꾸고 이동·리사이즈 허용 여부를 바꾸지 않습니다. mobile은 터치 환경에서 상시 표시하는 설정입니다. 모바일 예제의 3컬럼 전환은 별도의 responsive 설정입니다.",
      },
      {
        name: "refreshKey",
        type: "number | undefined",
        description: "값을 변경해 콘텐츠와 드래그 핸들의 재측정을 요청합니다.",
        detail: "콘텐츠 자동 높이를 사용하는 위젯을 재측정하고 필요한 배치 보정을 onLayoutCommit으로 전달합니다. 드래그·리사이즈 중에는 배치 전달을 조작 종료까지 지연합니다.",
      },
      {
        name: "renderWidget",
        type: "(widget) => ReactNode",
        description: "위젯 안에 표시할 콘텐츠를 반환하는 함수입니다.",
        detail: "패키지는 위젯 외곽과 배치를 담당하며 차트·표·텍스트는 앱이 ReactNode로 제공합니다. 다른 DashboardGrid를 반환하면 독립된 상태를 가진 중첩 Grid를 구성할 수 있습니다. 중첩만으로 Grid 간 전송이 활성화되지는 않습니다.",
      },
      {
        name: "renderWidgetActions / lazyRenderWidget",
        type: "renderer / boolean",
        description: "각각 타이틀 버튼을 교체하거나 화면 밖 콘텐츠의 최초 표시를 지연합니다.",
        detail: "renderWidgetActions는 showControls=true일 때 기본 버튼 영역을 대체합니다. lazyRenderWidget는 콘텐츠의 최초 표시만 지연하며 표시된 콘텐츠는 유지되고 이후 React 상태 변경도 반영됩니다. 두 속성은 독립적으로 사용합니다.",
      },
    ],
    methods: [
      {
        name: "refreshLayout",
        params: "없음",
        returns: "void",
        description: "refreshVersion을 갱신합니다. 이를 DashboardGrid의 refreshKey에 연결하면 콘텐츠와 핸들 재측정을 요청할 수 있습니다.",
        sample: { code: refreshMethodSample, language: "ts", title: "refreshLayout" },
      },
    ],
    samples: [{ code: basicSample, language: "tsx", title: "Dashboard 렌더링 예제" }],
  },
  {
    id: "api-widget-crud",
    title: "Widget 추가 / 삭제",
    summary: "앱이 관리하는 위젯 목록에 항목을 추가하거나 개별·전체 삭제합니다.",
    props: [
      {
        name: "DashboardWidget",
        type: "type",
        description: "위젯의 ID, 제목, 배치, 데이터, 표시 상태와 조작 설정을 담습니다.",
        detail: "TData로 앱 데이터의 타입을 지정합니다. ID는 앱이 제공하며 같은 Grid 안에서 중복되면 안 됩니다. 예제의 연속 번호 발급은 패키지 기능이 아닙니다.",
      },
      {
        name: "DashboardWidgetLayout",
        type: "type",
        description: "위젯의 위치 x/y, 크기 w/h, 최소·최대 크기 제약을 담는 타입입니다.",
        detail: "x/y는 0부터 시작하는 컬럼·행 위치이고 w/h는 차지하는 컬럼·행 수입니다. 픽셀 단위가 아닙니다. layout.id는 widget.id와 같아야 합니다.",
      },
      {
        name: "showControls",
        type: "boolean",
        description: "위젯 타이틀의 버튼 영역을 표시할지 설정합니다.",
        detail: "기본값은 true입니다. false면 기본 버튼과 renderWidgetActions 영역을 숨깁니다. 앱의 콘텐츠 버튼이나 드래그·리사이즈 허용 여부에는 영향을 주지 않습니다.",
      },
      {
        name: "actionLabels",
        type: "Partial<DashboardWidgetActionLabels>",
        description: "기본 타이틀 버튼의 접근성 이름을 변경합니다.",
        detail: "maximize, minimize, restore, remove 이름을 앱의 언어에 맞게 지정합니다. 직접 만든 버튼의 이름은 앱이 설정합니다.",
      },
      {
        name: "onRemoveWidget",
        type: "(id: string) => void",
        description: "기본 삭제 버튼을 눌렀을 때 위젯 ID를 전달합니다.",
        detail: "실제 삭제에는 dashboard.commands.removeWidget 등 앱의 상태 갱신 함수를 연결해야 합니다.",
      },
    ],
    methods: [
      {
        name: "addWidget / removeWidget / clearWidgets",
        params: "widget 또는 widget id",
        returns: "void",
        description: "위젯을 추가하거나 ID로 삭제하거나 모두 삭제합니다. ID 생성과 외부 저장소 반영은 앱에서 처리합니다.",
        sample: { code: crudSample, language: "ts", title: "Widget add/remove methods" },
      },
    ],
    events: [
      {
        name: "onRemoveWidget",
        payload: "id: string",
        when: "위젯 타이틀의 기본 삭제 버튼을 누를 때 호출됩니다.",
        description: "removeWidget에 연결해 해당 위젯을 React 상태에서 제거합니다.",
      },
    ],
    samples: [{ code: crudSample, language: "ts", title: "Widget 추가 / 삭제 예제" }],
  },
  {
    id: "api-layout-save-restore",
    title: "Layout 저장 / 복원",
    summary: "현재 배치 또는 전체 위젯 상태를 스냅샷으로 만들고 복원합니다. 파일·서버·브라우저 저장소에 보관하는 처리는 앱이 담당합니다.",
    props: [
      {
        name: "onLayoutCommit",
        type: "(snapshot: DashboardLayoutSnapshot) => void",
        description: "조작 완료 또는 엔진의 배치·콘텐츠 높이 보정 후 layout snapshot을 전달합니다.",
        detail: "applyLayoutSnapshot에 연결해 React 상태와 실제 좌표를 일치시킵니다. 동일 snapshot은 중복 commit하지 않습니다.",
      },
      {
        name: "onWidgetLayoutChange",
        type: "(id, layout) => void",
        description: "배치 스냅샷을 전달할 때 각 위젯의 ID와 배치를 알립니다.",
        detail: "변경된 위젯만 필터링하는 이벤트는 아닙니다. 개별 배치 관찰에 사용하며 기본 상태 연결은 onLayoutCommit과 applyLayoutSnapshot입니다. 두 경로에 같은 상태 갱신을 중복 연결하지 않습니다.",
      },
      {
        name: "onLayoutMutation",
        type: "(event: DashboardLayoutMutationEvent<TData>) => void",
        description: "useDashboardGrid의 상태 명령 처리 결과와 전체 스냅샷을 알리는 옵션입니다.",
        detail: "DashboardGrid의 prop이 아니라 hook 옵션입니다. kind는 widget:add, widget:update, widget:remove, widgets:clear, layout:commit, layout:reset, layout:restore, layout:arrange, layout:fill, columns:change입니다. 이동 허용 여부 같은 속성 변경도 포함합니다. 더블 클릭 자체는 포함하지 않지만 해당 콜백에서 실행한 상태 명령의 결과는 포함될 수 있습니다.",
      },
      {
        name: "DashboardLayoutSnapshot / DashboardStateSnapshot / DashboardColumnLayoutSnapshot / DashboardLayoutsByColumn",
        type: "type",
        description: "현재 배치만 저장하거나 위젯 속성과 컬럼별 배치까지 저장하는 타입입니다.",
        detail:
          "serializeState()는 widgets, columns, previousLayouts, layoutsByColumn을 포함합니다. previousLayouts는 최대화·최소화 전 복원 배치이며 DashboardLayoutsByColumn은 컬럼 수별 DashboardColumnLayoutSnapshot을 보관합니다. serializeLayout()은 현재 columns와 위젯 배치만 포함합니다. 현재 컬럼의 캐시보다 최상위 widgets와 previousLayouts가 우선합니다. layoutsByColumn이 없는 이전 형식도 복원할 수 있습니다. 12 -> 6 -> 12 전환 시 기존 12컬럼 배치를 복원하며, serializeState와 restoreLayout은 이 컬럼별 배치를 보존합니다.",
      },
    ],
    methods: [
      {
        name: "serializeLayout / serializeState / resetLayout / restoreLayout",
        params: "resetLayout(snapshot?), restoreLayout(snapshot)",
        returns: "serializeLayout: DashboardLayoutSnapshot, serializeState: DashboardStateSnapshot, reset/restore: void",
        description: "배치만 전달할 때는 serializeLayout과 applyLayoutSnapshot을, 위젯 속성과 컬럼별 배치까지 복원할 때는 serializeState와 restoreLayout을 사용합니다. resetLayout()은 최초 입력 상태로 돌아갑니다. 저장/불러오기 예제는 페이지 메모리에만 보관하므로 새로고침·페이지 이탈 시 저장본이 사라집니다.",
        sample: { code: layoutSample, language: "ts", title: "Layout 저장 / 복원 methods" },
      },
      {
        name: "updateWidgetLayout / applyLayoutSnapshot",
        params: "updateWidgetLayout(id, patch), applyLayoutSnapshot(snapshot)",
        returns: "void",
        description: "updateWidgetLayout은 지정 위젯의 좌표·크기 일부를 변경합니다. applyLayoutSnapshot은 전체 배치 스냅샷을 한 번에 반영하며 onLayoutCommit에 연결하는 기본 경로입니다. 두 함수를 같은 commit에 중복 연결하지 않습니다.",
      },
    ],
    events: [
      {
        name: "onLayoutCommit",
        payload: "DashboardLayoutSnapshot",
        when: "drag/resize 완료 또는 제어 상태의 배치·크기 보정 결과가 확정될 때 호출됩니다.",
        description: "현재 column과 widget layout 좌표를 저장소나 외부 상태에 반영할 때 사용합니다.",
      },
      {
        name: "onWidgetLayoutChange",
        payload: "id: string, layout: DashboardWidgetLayout",
        when: "전체 배치 스냅샷을 전달하기 전 각 위젯에 대해 호출됩니다.",
        description: "개별 배치를 관찰할 때 사용합니다. 기본 상태 연결은 onLayoutCommit → applyLayoutSnapshot입니다.",
      },
      {
        name: "onLayoutMutation",
        payload: "DashboardLayoutMutationEvent<TData>",
        when: "useDashboardGrid가 명령을 처리하고 React 상태를 반영한 뒤 호출됩니다.",
        description: "kind, widgetIds, columns, snapshot을 제공합니다. 좌표 차이만 감지하는 이벤트가 아니며 위젯 속성 변경도 포함합니다.",
      },
    ],
    samples: [{ code: layoutSample, language: "ts", title: "Layout 저장 / 복원 예제" }],
  },
  {
    id: "api-column-arrange",
    title: "Column / 정렬",
    summary: "컬럼 수를 변경하고 위젯을 배열 순서대로 재배치하거나 같은 행의 너비를 재분배합니다.",
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
        description: "setColumns는 컬럼을 전환하고 방문한 컬럼의 배치를 복원합니다. autoArrangeWidgets는 배열 순서대로 행을 채우며, fitWidgetsToColumns는 시작 y가 같은 행의 빈 컬럼 공간을 가능한 균등하게 재분배합니다. fitWidgetToColumns는 같은 행의 빈 너비를 지정 위젯에 더합니다. 모두 크기 제약을 따르며 clampDashboardColumnCount는 숫자를 1~12로 제한합니다.",
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
        description: "그리드 전체의 드래그와 리사이즈 허용 여부를 설정합니다.",
        detail: "기본값은 모두 true입니다. editable=false는 두 조작을 함께 막고 movable/resizable은 각각 제어합니다. 전체 설정이 false면 위젯 설정이 true여도 조작할 수 없습니다. 추가·삭제 버튼이나 콘텐츠 입력을 막는 권한 설정은 아닙니다.",
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
        description: "전체 그리드의 드래그·리사이즈 설정을 묶은 타입입니다.",
        detail: "editable, movable, resizable을 포함합니다. 앱의 데이터 변경 권한과는 별개입니다.",
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
        detail: "fitWidgetToColumns와 조합하면 row 빈 공간 확장 interaction을 만들 수 있습니다. onWidgetHeaderDoubleClick은 0.2.1부터 deprecated인 alias입니다.",
      },
      {
        name: "Move / Resize / Title lifecycle callbacks",
        type: "onBefore* / on* / onAfter*",
        description: "move, layout resize, title double-click을 before/action/after 단계로 관찰합니다.",
        detail: "진행 중 이동·리사이즈 이벤트는 animation frame 단위로 병합됩니다. 종료 이벤트는 필요한 레이아웃 콜백 전달 후 최종 좌표로 호출되지만 React 화면 갱신이나 비동기 작업 완료를 기다리지 않습니다.",
      },
      {
        name: "onBeforeMove / onMove / onAfterMove / onBeforeResize / onResize / onAfterResize / onBeforeTitleDoubleClick / onTitleDoubleClick / onAfterTitleDoubleClick",
        type: "(event: DashboardWidgetInteractionEvent) => void",
        description: "move, layout resize, title-only double-click의 canonical lifecycle입니다.",
        detail: "before는 시작 알림이며 취소 API가 아닙니다. 이동·리사이즈는 시작 → 진행 → 종료 순서입니다. 타이틀 더블 클릭의 세 콜백은 모두 클릭 시점의 좌표를 받으며 최대화 등 동작은 앱이 연결합니다. onWidgetResizeFrame은 픽셀 크기 알림으로 별도입니다.",
      },
      {
        name: "onWidgetDragStart / onWidgetDragStop / onWidgetResizeStart / onWidgetResizeStop / onWidgetHeaderDoubleClick",
        type: "deprecated compatibility callbacks",
        description: "0.2.x에서 호출 순서를 유지하는 legacy alias입니다.",
        detail: "신규 예제에서는 canonical lifecycle만 사용하며 alias 제거는 0.3.0 별도 breaking-change gate에서 검토합니다.",
      },
    ],
    methods: [
      {
        name: "maximizeWidget / minimizeWidget / restoreWidget / fitWidgetToColumns",
        params: "widget id",
        returns: "void",
        description: "widget view state를 변경하거나 현재 row의 빈 column 공간을 단일 widget에 채웁니다. 최대화·최소화 중 콘텐츠 크기 맞춤은 중단되고 복원 후 재개됩니다.",
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
        description: "한 행의 높이와 위젯 사이 여백을 지정합니다.",
        detail: "패키지 기본값은 cellHeight=96, margin=8입니다. 셀 높이를 바꾸면 위젯의 행 수 h를 유지한 채 픽셀 높이가 달라집니다. 그리드 라인은 예제 CSS의 시각 보조이며 Transform 예제는 부모 CSS의 scale/translate를 사용합니다. 둘 다 별도의 패키지 옵션은 아닙니다.",
      },
      {
        name: "DashboardGridHandle",
        type: "type",
        description: "안전한 query, refresh, compact, commitLayout을 제공하는 advanced public handle입니다.",
        detail: "getColumnCount/getRowCount/getFloat은 컬럼 수, minRow를 포함한 행 수, float 설정을 조회합니다. isAreaEmpty는 지정 영역의 점유 여부, willItFit은 최대 행 수 maxRow 내 배치 가능 여부를 검사합니다. maxRow 제한이 없으면 willItFit은 true이며 빈 위치라는 보장은 아닙니다. 엔진 준비 전에는 null일 수 있습니다. getGridStack()은 직접 엔진에 접근하는 escape hatch이며 일반 사용에서는 위젯 추가·삭제·destroy를 직접 호출하지 않습니다.",
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
        returns: "조회: number | boolean | null, compact/commitLayout: DashboardLayoutSnapshot | null, refresh: void",
        description: "compact는 배치를 정리하고 onLayoutCommit으로 결과를 전달한 뒤 스냅샷을 반환합니다. commitLayout은 현재 배치를 전달·반환하고 동일 결과의 중복 전달을 억제합니다. React 상태 반영에는 onLayoutCommit → applyLayoutSnapshot 연결이 필요합니다. refresh는 콘텐츠와 핸들을 재측정하고 필요한 배치 보정을 전달합니다.",
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
    summary: "팔레트에서 위젯을 추가하거나 Grid 간 이동·복사를 처리하고, 화면 밖 콘텐츠의 최초 표시를 지연하는 방법입니다.",
    props: [
      {
        name: "gridId / acceptExternalWidgets / gridTransferMode",
        type: "string / boolean | predicate / move | copy",
        description: "transfer source와 target identity, acceptance, Grid source mode를 설정합니다.",
        detail: "Grid 간 전송에는 고유한 gridId를 사용합니다. 팔레트는 항상 copy이며 Grid source는 기본 move입니다. move는 원본을 제거하고 copy는 원본을 유지합니다. 복사도 위젯 ID를 유지하므로 대상에 같은 ID가 있으면 거부됩니다. acceptExternalWidgets는 후보를 허용하는 조건이며 최종 적용에는 onWidgetDropRequest에서 React 상태를 갱신해야 합니다. 복사 드래그는 원래 자리에 원본 모양을 남기고 + 윤곽선만 이동합니다. 같은 Grid 내부 드롭은 복사가 아닌 위치 변경입니다.",
      },
      {
        name: "externalDropTargets / onWidgetExternalDrop",
        type: "ReadonlyArray<DashboardExternalDropTarget> / callback",
        description: "위젯을 그리드 밖 HTML 영역에 놓으면 대상 ID와 위젯 정보를 알립니다.",
        detail: "같은 문서의 HTML 대상을 ID와 CSS 선택자로 등록합니다. iframe과 Shadow DOM 내부 대상은 지원하지 않습니다. 휴지통 예제는 targetId를 확인한 뒤 removeWidget으로 삭제합니다. 삭제 콜백이 없거나 휴지통 밖에 놓으면 삭제되지 않지만 일반 이동 배치는 onLayoutCommit으로 반영될 수 있습니다. Grid 간 전송은 onWidgetDropRequest를 사용합니다.",
      },
      {
        name: "lazyRenderWidget / DashboardWidget.lazyLoad",
        type: "boolean / boolean",
        description: "화면 밖 위젯 콘텐츠의 최초 표시를 스크롤 영역 진입 시점까지 지연합니다.",
        detail: "lazyRenderWidget 기본값은 false입니다. 가장 가까운 data-dashboard-lazy-scroll 영역 또는 없으면 화면을 기준으로 합니다. 표시된 콘텐츠는 계속 유지되고 이후 React 상태 변경도 반영됩니다. 위젯 외곽과 배치 영역은 항상 존재하므로 전체 위젯 가상화나 데이터 다운로드 기능은 아닙니다. widget.lazyLoad=false로 개별 제외하며 true만으로 전역 기능이 켜지지는 않습니다. IntersectionObserver가 없으면 즉시 표시합니다. 실행 예제에서 실제 렌더링 개수와 위젯별 대기/완료를 확인합니다. 다시 실험은 Grid를 새로 마운트해 최초 진입을 재현합니다.",
      },
      {
        name: "DashboardGridEngineOptions.lazyLoad",
        type: "boolean (deprecated)",
        description: "React-owned content를 지연하지 않는 GridStack native option입니다.",
        detail: "0.2.x compatibility mapping만 유지하며 신규 코드는 lazyRenderWidget을 사용합니다. 0.3.0 제거 대상입니다.",
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
        when: "외부 드롭 후보가 허용되고 엔진의 임시 이동을 되돌린 뒤 호출됩니다.",
        description: "앱이 이 요청을 상태에 반영해야 전송이 적용됩니다. 상태를 갱신하지 않으면 위젯은 추가·이동되지 않습니다(fail-closed). 예제 버튼은 같은 전송 함수를 사용하되 드롭 위치 대신 대상의 마지막 행 아래에 배치합니다.",
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
        description: "전체 위젯 상태와 컬럼별 배치를 페이지 메모리에 저장하고 복원합니다. 새로고침·페이지 이탈 후에도 보관하려면 앱에서 저장소를 연결해야 합니다.",
        title: "레이아웃 저장 / 불러오기",
      },
      {
        codeSamples: [{ code: `dashboard.commands.setColumns(4);`, language: "ts", title: "Dynamic columns" }],
        description: "컬럼 수를 1~12로 바꾸며 10개 위젯 배치를 확인합니다. 이전 컬럼 수로 돌아오면 저장된 배치를 복원합니다.",
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
    summary: "기능 설명과 실행 예제로 동작을 확인한 뒤, 적용 코드와 상세 API를 살펴보세요.",
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
