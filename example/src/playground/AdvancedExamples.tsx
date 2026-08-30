import { useRef, useState } from "react";
import { Columns3, Grid2X2, RefreshCcw, RotateCcw, Trash2 } from "lucide-react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type {
  DashboardGridEngineOptions,
  DashboardGridHandle,
  DashboardResponsiveOptions,
  DashboardExternalDropTarget,
  DashboardWidgetExternalDropEvent,
} from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetSettingsTable } from "./components/WidgetSettingsTable";
import { createNumberedPlaygroundFixture, createNumberedWidget } from "./fixtures";
import type { LocalizedText } from "./locale";
import { usePlaygroundLocale } from "./locale";
import type { ExampleWidgetData } from "./types";
import { useNumberedDashboard } from "./use-numbered-dashboard";

export type AdvancedFeature =
  | "cell-height"
  | "grid-lines"
  | "float"
  | "lazy-load"
  | "mobile-touch"
  | "responsive-column"
  | "responsive-breakpoints"
  | "responsive-none"
  | "rtl"
  | "size-to-content"
  | "static"
  | "title-drag"
  | "transform";

const featureText: Record<AdvancedFeature, { title: LocalizedText; description: LocalizedText }> = {
  "cell-height": {
    title: { ko: "셀 높이", en: "Cell Height" },
    description: { ko: "런타임에서 Grid 셀 높이를 변경합니다.", en: "Changes the grid cell height at runtime." },
  },
  "grid-lines": {
    title: { ko: "그리드 라인", en: "Grid Lines" },
    description: { ko: "현재 12컬럼과 셀 높이에 맞춘 가이드 라인을 표시합니다.", en: "Displays guide lines for the current 12 columns and cell height." },
  },
  float: {
    title: { ko: "Float", en: "Float" },
    description: { ko: "Float 모드에 따른 위젯의 빈 공간 유지 동작을 비교합니다.", en: "Compares how widgets preserve gaps with Float mode enabled or disabled." },
  },
  "lazy-load": {
    title: { ko: "Lazy Loading", en: "Lazy Loading" },
    description: { ko: "스크롤 영역에 진입한 위젯의 Content를 한 번만 렌더링합니다.", en: "Renders widget content once when it enters the scroll area." },
  },
  "mobile-touch": {
    title: { ko: "모바일 터치", en: "Mobile Touch" },
    description: { ko: "터치 환경에서 이동과 리사이즈 핸들을 확인합니다.", en: "Verifies movement and resize handles in a touch environment." },
  },
  "responsive-column": {
    title: { ko: "반응형 - 컬럼 너비", en: "Responsive - Column Width" },
    description: { ko: "컨테이너 너비를 기준으로 컬럼 수를 계산합니다.", en: "Calculates the column count from the container width." },
  },
  "responsive-breakpoints": {
    title: { ko: "반응형 - Breakpoint", en: "Responsive - Breakpoints" },
    description: { ko: "명시적인 Breakpoint별 컬럼과 레이아웃 변환을 적용합니다.", en: "Applies explicit columns and layout transformations for each breakpoint." },
  },
  "responsive-none": {
    title: { ko: "반응형 - Layout None", en: "Responsive - Layout None" },
    description: { ko: "Breakpoint 전환 시 저장된 위치를 다시 계산하지 않습니다.", en: "Preserves saved positions without recalculating them during breakpoint changes." },
  },
  rtl: {
    title: { ko: "RTL", en: "RTL" },
    description: { ko: "오른쪽에서 왼쪽 방향의 배치와 상호작용을 확인합니다.", en: "Verifies right-to-left placement and interaction." },
  },
  "size-to-content": {
    title: { ko: "Size To Content", en: "Size To Content" },
    description: { ko: "위젯 Content 높이를 기준으로 행 높이를 조정합니다.", en: "Adjusts row height to the widget content height." },
  },
  static: {
    title: { ko: "Static Grid", en: "Static Grid" },
    description: { ko: "상태를 유지한 채 Grid 전체 편집 가능 여부를 전환합니다.", en: "Toggles editing for the entire grid while preserving state." },
  },
  "title-drag": {
    title: { ko: "타이틀 Drag Handle", en: "Title Drag Handle" },
    description: { ko: "타이틀 영역에서만 위젯 이동을 시작합니다.", en: "Starts widget movement only from the title area." },
  },
  transform: {
    title: { ko: "Transform", en: "Transform" },
    description: { ko: "Scale과 Offset이 적용된 컨테이너에서 좌표 보정을 확인합니다.", en: "Verifies coordinate correction in a scaled and offset container." },
  },
};

const featureGuidance: Record<AdvancedFeature, { items: ReadonlyArray<LocalizedText>; code?: LocalizedText }> = {
  "cell-height": {
    items: [
      { ko: "engineOptions.cellHeight를 72px, 96px, 120px로 변경해 같은 레이아웃의 행 높이를 비교합니다.", en: "Switch engineOptions.cellHeight between 72px, 96px, and 120px to compare row height on the same layout." },
      { ko: "위젯의 W/H는 Grid 단위로 유지되고 실제 픽셀 높이만 셀 높이에 따라 달라집니다.", en: "Widget W/H remain grid units while their pixel height changes with cell height." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ cellHeight }} />", en: "<DashboardGrid engineOptions={{ cellHeight }} />" },
  },
  "grid-lines": {
    items: [
      { ko: "12컬럼과 96px 행 높이에 맞춘 Playground 전용 가이드 라인을 겹쳐 배치 단위를 표시합니다.", en: "Overlays Playground-only guide lines aligned to 12 columns and 96px rows." },
      { ko: "가이드 라인은 시각 보조이며 저장되는 위젯 레이아웃에는 영향을 주지 않습니다.", en: "Guide lines are visual aids and do not affect saved widget layout." },
    ],
  },
  float: {
    items: [
      { ko: "float=true는 위젯 아래의 빈 행을 유지하고, false는 가능한 위쪽으로 압축합니다.", en: "float=true preserves vertical gaps; false compacts widgets upward when possible." },
      { ko: "토글 전후에 위젯을 이동해 빈 공간 처리 차이를 확인합니다.", en: "Move widgets before and after toggling to observe gap handling." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ float: enabled }} />", en: "<DashboardGrid engineOptions={{ float: enabled }} />" },
  },
  "lazy-load": {
    items: [
      { ko: "lazyRenderWidget는 스크롤 경계에 들어온 위젯 Content를 처음 한 번 렌더링합니다.", en: "lazyRenderWidget renders widget content once when it first enters the scroll boundary." },
      { ko: "위젯 Shell과 레이아웃은 먼저 존재하므로 GridStack geometry는 Content 지연과 독립적입니다.", en: "The widget shell and layout exist first, so GridStack geometry remains independent from deferred content." },
    ],
    code: { ko: "<DashboardGrid lazyRenderWidget widgets={widgets} />", en: "<DashboardGrid lazyRenderWidget widgets={widgets} />" },
  },
  "mobile-touch": {
    items: [
      { ko: "터치 포인터에서 이동과 southeast 리사이즈 핸들의 동작을 확인합니다.", en: "Verifies movement and the southeast resize handle with touch pointers." },
      { ko: "alwaysShowResizeHandle='mobile'은 coarse pointer 환경에서 리사이즈 affordance를 항상 표시합니다.", en: "alwaysShowResizeHandle='mobile' keeps the resize affordance visible for coarse pointers." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ alwaysShowResizeHandle: \"mobile\" }} />", en: "<DashboardGrid engineOptions={{ alwaysShowResizeHandle: \"mobile\" }} />" },
  },
  "responsive-column": {
    items: [
      { ko: "columnWidth=180이 컨테이너 너비를 나누어 활성 컬럼 수를 자동 계산하고 columnMax=12로 상한을 둡니다.", en: "columnWidth=180 divides the container width to calculate active columns automatically, capped by columnMax=12." },
      { ko: "moveScale은 컬럼 수 변화에 맞춰 위치와 너비를 비례 변환합니다.", en: "moveScale transforms positions and widths proportionally as the column count changes." },
    ],
    code: { ko: "responsive={{ columnWidth: 180, columnMax: 12, layout: \"moveScale\" }}", en: "responsive={{ columnWidth: 180, columnMax: 12, layout: \"moveScale\" }}" },
  },
  "responsive-breakpoints": {
    items: [
      { ko: "창 너비가 640px 이하이면 2컬럼, 960px 이하이면 6컬럼, 그보다 넓으면 최대 12컬럼을 사용합니다.", en: "The grid uses 2 columns at 640px or below, 6 columns at 960px or below, and up to 12 columns above that." },
      { ko: "각 Breakpoint는 moveScale을 사용해 명시된 컬럼별 geometry로 전환합니다.", en: "Each breakpoint uses moveScale to transition geometry for its explicit column count." },
    ],
    code: { ko: "breakpoints: [{ maxWidth: 640, columns: 2 }, { maxWidth: 960, columns: 6 }]", en: "breakpoints: [{ maxWidth: 640, columns: 2 }, { maxWidth: 960, columns: 6 }]" },
  },
  "responsive-none": {
    items: [
      { ko: "layout: \"none\"은 Breakpoint에서 컬럼 수만 바꾸고 기존 위젯 좌표와 크기를 재배치하거나 비례 변환하지 않습니다.", en: "layout: \"none\" changes only the column count at the breakpoint without repositioning or scaling existing widget coordinates." },
      { ko: "moveScale 예제와 비교해 좌표 보존이 필요한 소비자 레이아웃을 확인합니다.", en: "Compare it with moveScale when consumer layouts must preserve coordinates." },
    ],
    code: { ko: "responsive={{ breakpoints: [{ maxWidth: 760, columns: 4, layout: \"none\" }], layout: \"none\" }}", en: "responsive={{ breakpoints: [{ maxWidth: 760, columns: 4, layout: \"none\" }], layout: \"none\" }}" },
  },
  rtl: {
    items: [
      { ko: "rtl=true는 위젯 배치 기준과 드래그 좌표를 오른쪽에서 왼쪽 방향으로 전환합니다.", en: "rtl=true switches widget placement and drag coordinates to right-to-left direction." },
      { ko: "제어 상태의 x 값은 유지하면서 GridStack의 시각 위치 계산만 RTL 기준으로 동기화합니다.", en: "Controlled x values remain stable while GridStack synchronizes visual positioning for RTL." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ rtl: true }} />", en: "<DashboardGrid engineOptions={{ rtl: true }} />" },
  },
  "size-to-content": {
    items: [
      { ko: "sizeToContent는 Content의 실제 높이를 측정해 필요한 Grid 행 높이에 맞춥니다.", en: "sizeToContent measures actual content height and fits the required grid rows." },
      { ko: "제어 위젯 데이터와 ID는 유지되고 GridStack geometry만 Content 크기에 맞게 갱신됩니다.", en: "Controlled widget data and IDs remain stable while GridStack geometry follows content size." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ sizeToContent: true }} />", en: "<DashboardGrid engineOptions={{ sizeToContent: true }} />" },
  },
  static: {
    items: [
      { ko: "engineOptions.staticGrid는 GridStack 엔진을 정적 모드로 전환해 이동·리사이즈 UI와 상호작용을 함께 비활성화합니다.", en: "engineOptions.staticGrid switches the GridStack engine to static mode and disables move/resize UI and interactions together." },
      { ko: "레이아웃 잠금 / 해제 예제는 staticGrid가 아니라 movable과 resizable props만 전환하므로 엔진 모드는 유지됩니다.", en: "The Lock / Unlock Layout example keeps the engine mode and toggles only movable and resizable props instead of staticGrid." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ staticGrid: !editable }} />", en: "<DashboardGrid engineOptions={{ staticGrid: !editable }} />" },
  },
  "title-drag": {
    items: [
      { ko: "dragHandle을 타이틀 selector로 제한해 Content 조작과 위젯 이동 시작 영역을 분리합니다.", en: "Limits dragHandle to the title selector, separating content interaction from the widget move start area." },
      { ko: "타이틀 전체의 grab 영역에서만 이동할 수 있고 Content 영역 드래그는 레이아웃을 변경하지 않습니다.", en: "Movement starts only from the full grab-enabled title area; dragging content does not change layout." },
    ],
    code: { ko: "engineOptions={{ dragHandle: \".comins-grid-layout-widget__title\" }}", en: "engineOptions={{ dragHandle: \".comins-grid-layout-widget__title\" }}" },
  },
  transform: {
    items: [
      { ko: "scale과 translate가 적용된 부모에서도 GridStack 포인터 좌표가 위젯 geometry로 정확히 변환되는지 확인합니다.", en: "Verifies that GridStack pointer coordinates map correctly to widget geometry inside scaled and translated parents." },
      { ko: "토글로 변환 전후의 동일한 이동·리사이즈 결과를 비교합니다.", en: "Toggle the transform to compare identical move and resize outcomes." },
    ],
  },
};

export function AdvancedFeaturePlayground({ feature }: { feature: AdvancedFeature }) {
  const { dashboard } = useNumberedDashboard();
  const { locale, text } = usePlaygroundLocale();
  const [enabled, setEnabled] = useState(feature !== "static");
  const [cellHeight, setCellHeight] = useState(96);
  const copy = featureText[feature];
  const guidance = featureGuidance[feature];
  const title = copy.title[locale];
  const isResponsiveFeature = feature === "responsive-column" || feature === "responsive-breakpoints" || feature === "responsive-none";
  const responsive = enabled ? createResponsiveOptions(feature) : undefined;
  const toggleFeature = () => {
    if (enabled && isResponsiveFeature) {
      dashboard.commands.setColumns(12);
    }
    setEnabled((value) => !value);
  };
  const engineOptions: DashboardGridEngineOptions = {
    alwaysShowResizeHandle: feature === "mobile-touch" && enabled ? "mobile" : undefined,
    cellHeight: feature === "cell-height" ? cellHeight : feature === "lazy-load" ? 180 : 96,
    dragHandle: feature === "title-drag" && enabled ? ".comins-grid-layout-widget__title" : undefined,
    float: feature === "float" ? enabled : false,
    rtl: feature === "rtl" ? enabled : false,
    sizeToContent: feature === "size-to-content" ? enabled : false,
    staticGrid: feature === "static" ? !enabled : false,
  };
  const className = [
    feature === "grid-lines" && enabled ? "playground-grid--lines" : undefined,
    feature === "title-drag" ? "playground-grid--title-handle" : undefined,
  ].filter(Boolean).join(" ") || undefined;
  const dashboardNode = (
    <ExampleDashboard
      className={className}
      dashboard={dashboard}
      engineOptions={engineOptions}
      lazyRenderWidget={feature === "lazy-load" && enabled}
      responsive={responsive}
      showControls={feature === "title-drag" ? false : undefined}
    />
  );

  return (
    <section className="playground-workspace" data-advanced-feature={feature}>
      <PlaygroundHeader description={copy.description[locale]} kicker={text("고급 예제", "Advanced Examples")} title={title} />
      <PlaygroundFeatureGuide code={guidance.code?.[locale]} items={guidance.items.map((item) => item[locale])} />
      <PlaygroundStage kind="controls">
        <ExampleToolbar id={`advanced-${feature}`}>
          {feature === "cell-height" ? [72, 96, 120].map((height) => (
            <button
              aria-pressed={cellHeight === height}
              key={height}
              type="button"
              onClick={() => setCellHeight(height)}
            >
              {height}px
            </button>
          )) : (
            <button type="button" onClick={toggleFeature} {...toggleStateProps(enabled)}>
              <Grid2X2 aria-hidden="true" size={15} />
              {advancedToggleLabel(feature, enabled, locale)}
            </button>
          )}
        </ExampleToolbar>
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        {feature === "lazy-load" ? (
          <div className="advanced-lazy-scroll" data-dashboard-lazy-scroll>
            <section aria-label={`${title} Grid`} className="playground-grid-region">{dashboardNode}</section>
          </div>
        ) : feature === "transform" && enabled ? (
          <div className="advanced-transform-stage">
            <section aria-label={`${title} Grid`} className="playground-grid-region">{dashboardNode}</section>
          </div>
        ) : (
          <section aria-label={`${title} Grid`} className="playground-grid-region">{dashboardNode}</section>
        )}
      </PlaygroundStage>
    </section>
  );
}

function advancedToggleLabel(feature: AdvancedFeature, enabled: boolean, locale: "ko" | "en") {
  const localized = (ko: string, en: string) => locale === "ko" ? ko : en;
  switch (feature) {
    case "float": return localized(`Float ${enabled ? "켜짐" : "꺼짐"}`, `Float ${enabled ? "on" : "off"}`);
    case "grid-lines": return localized(`그리드 라인 ${enabled ? "표시" : "숨김"}`, `Grid lines ${enabled ? "shown" : "hidden"}`);
    case "rtl": return localized(`RTL ${enabled ? "켜짐" : "꺼짐"}`, `RTL ${enabled ? "on" : "off"}`);
    case "size-to-content": return localized(`Size To Content ${enabled ? "켜짐" : "꺼짐"}`, `Size To Content ${enabled ? "on" : "off"}`);
    case "static": return localized(enabled ? "편집 가능" : "Static Grid", enabled ? "Editable" : "Static Grid");
    case "transform": return localized(`Transform ${enabled ? "적용" : "해제"}`, `Transform ${enabled ? "applied" : "removed"}`);
    case "lazy-load": return localized("스크롤하여 Content 렌더링", "Scroll to render content");
    case "mobile-touch": return localized("터치 이동 / 리사이즈", "Touch move / resize");
    case "responsive-column":
    case "responsive-breakpoints":
    case "responsive-none": return localized(`반응형 설정 ${enabled ? "적용" : "해제"}`, `Responsive settings ${enabled ? "applied" : "disabled"}`);
    case "title-drag": return localized(enabled ? "타이틀로만 이동" : "전체 위젯에서 이동", enabled ? "Move from title only" : "Move from the full widget");
    default: return localized(enabled ? "사용" : "미사용", enabled ? "Enabled" : "Disabled");
  }
}

function createResponsiveOptions(feature: AdvancedFeature): DashboardResponsiveOptions | undefined {
  if (feature === "responsive-column") {
    return { columnWidth: 180, columnMax: 12, layout: "moveScale" };
  }
  if (feature === "responsive-breakpoints") {
    return {
      breakpoints: [
        { maxWidth: 640, columns: 2, layout: "moveScale" },
        { maxWidth: 960, columns: 6, layout: "moveScale" },
      ],
      columnMax: 12,
    };
  }
  if (feature === "responsive-none") {
    return {
      breakpoints: [{ maxWidth: 760, columns: 4, layout: "none" }],
      columnMax: 12,
      layout: "none",
    };
  }
  return undefined;
}

export function NestedBasicPlayground() {
  const [depth, setDepth] = useState<2 | 3>(2);
  return <NestedPlayground depth={depth} onDepthChange={setDepth} />;
}

function NestedPlayground({ depth, onDepthChange }: { depth: 2 | 3; onDepthChange: (depth: 2 | 3) => void }) {
  const { text } = usePlaygroundLocale();
  const title = text("Nested Grid - 구성", "Nested Grid - Composition");
  const guideItems = depth === 3
    ? [
        text("3단계 DashboardGrid를 재귀 구성해 Root → Child → Grandchild의 독립된 React 제어 상태를 확인합니다.", "Recursively composes three DashboardGrid levels to inspect independent React controlled state for Root → Child → Grandchild."),
        text("각 단계는 고유 gridId와 layout commit 소유자를 가지며 native sub-grid routing을 사용하지 않습니다.", "Each level has its own gridId and layout commit owner without native sub-grid routing."),
        text("계층 내부 이동은 같은 Grid의 layout 이동이며 A→B Grid 전송은 다중 Grid 예제로 분리되어 있습니다.", "Movement inside the hierarchy changes layout within one grid; A-to-B grid transfer is separated into the Multiple Grids example."),
        text("중첩 경계 충돌을 피하기 위해 각 위젯은 표시된 타이틀 grab 영역에서 이동합니다.", "Widgets move from the visible title grab area to avoid interaction conflicts across nested boundaries."),
      ]
    : [
        text("2단계 Root와 Child Grid가 각각 독립된 React 제어 상태와 layout commit을 소유합니다.", "The two-level Root and Child grids each own independent React controlled state and layout commits."),
        text("명시적인 DashboardGrid 합성만 사용하며 GridStack native sub-grid ownership은 사용하지 않습니다.", "Uses explicit DashboardGrid composition without GridStack native sub-grid ownership."),
        text("계층 내부 이동은 같은 Grid의 layout 이동이며 A→B Grid 전송은 다중 Grid 예제로 분리되어 있습니다.", "Movement inside the hierarchy changes layout within one grid; A-to-B grid transfer is separated into the Multiple Grids example."),
        text("중첩 경계 충돌을 피하기 위해 각 위젯은 표시된 타이틀 grab 영역에서 이동합니다.", "Widgets move from the visible title grab area to avoid interaction conflicts across nested boundaries."),
      ];
  const root = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: [
      { ...createNumberedWidget(1), layout: { id: "widget-1", x: 0, y: 0, w: 8, h: 6 } },
      { ...createNumberedWidget(2), layout: { id: "widget-2", x: 8, y: 0, w: 4, h: 2 } },
    ],
  });
  return (
    <section className="playground-workspace" data-advanced-feature="nested">
      <PlaygroundHeader
        description={text(`${depth}단계의 제어된 Grid를 React 상태 소유권을 유지한 채 구성합니다.`, `Builds a ${depth}-level controlled grid while React retains state ownership.`)}
        kicker={text("고급 예제", "Advanced Examples")}
        title={title}
      />
      <PlaygroundFeatureGuide
        code="<DashboardGrid renderWidget={() => <DashboardGrid widgets={childWidgets} />} />"
        items={guideItems}
      />
      <PlaygroundStage
        description={text("구성 깊이를 전환한 뒤 각 Grid의 타이틀 grab 영역에서 이동하고 southeast 핸들에서 리사이즈합니다.", "Switch the composition depth, then move from each grid's title grab area and resize from the southeast handle.")}
        kind="controls"
      >
        <div aria-label={text("Nested Grid 구성 깊이", "Nested Grid composition depth")} className="example-actions" role="group">
          <button
            className="example-toggle-button"
            type="button"
            onClick={() => onDepthChange(2)}
            {...toggleStateProps(depth === 2)}
          >
            {text("2단계", "2 levels")}
          </button>
          <button
            className="example-toggle-button"
            type="button"
            onClick={() => onDepthChange(3)}
            {...toggleStateProps(depth === 3)}
          >
            {text("3단계", "3 levels")}
          </button>
        </div>
        <p className="playground-control-note">
          {text("타이틀: 이동 · 우측 하단: 리사이즈 · ", "Title: move · Bottom-right: resize · ")}
          <a href="/examples/advanced/multi-grid/horizontal">
            {text("A/B Grid 이동·복사 예제", "A/B grid move/copy example")}
          </a>
        </p>
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section aria-label={`${title} Grid`} className="playground-grid-region nested-example-root">
          <DashboardGrid
            className="playground-grid--title-handle"
            columns={root.columns}
            engineOptions={{ animate: false, cellHeight: 78, dragHandle: ".comins-grid-layout-widget__title" }}
            key={`nested-depth-${depth}`}
            refreshKey={root.refreshVersion}
            showControls={false}
            widgets={root.widgets}
            onLayoutCommit={root.commands.applyLayoutSnapshot}
            renderWidget={(widget) => widget.id === "widget-1"
              ? <NestedLevel depth={depth - 1} level={1} />
              : <div className="playground-numbered-widget-content"><WidgetSettingsTable widget={widget} /></div>}
          />
        </section>
      </PlaygroundStage>
    </section>
  );
}

function NestedLevel({ depth, level }: { depth: number; level: number }) {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 4,
    initialWidgets: [
      {
        ...createNumberedWidget(level * 10 + 1),
        data: {
          description: `Nested level ${level}`,
          value: `Nested ${level}`,
          number: level * 10 + 1,
          kind: "kpi",
        },
        layout: { id: `widget-${level * 10 + 1}`, x: 0, y: 0, w: depth > 1 ? 3 : 2, h: depth > 1 ? 4 : 2 },
      },
      { ...createNumberedWidget(level * 10 + 2), layout: { id: `widget-${level * 10 + 2}`, x: 3, y: 0, w: 1, h: 2 } },
    ],
  });
  return (
    <div className="nested-example-level" data-nested-level={level}>
      <DashboardGrid
        className="playground-grid--title-handle"
        columns={dashboard.columns}
        engineOptions={{ animate: false, cellHeight: 84, dragHandle: ".comins-grid-layout-widget__title" }}
        gridId={`nested-grid-${level}`}
        acceptExternalWidgets
        refreshKey={dashboard.refreshVersion}
        showControls={false}
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => depth > 1 && widget.id === dashboard.widgets[0]?.id
          ? <NestedLevel depth={depth - 1} level={level + 1} />
          : <div className="playground-numbered-widget-content"><WidgetSettingsTable widget={widget} /></div>}
      />
    </div>
  );
}

const externalTrashTargets = [
  { id: "trash", selector: "[data-dashboard-drop-target='trash']" },
] as const satisfies ReadonlyArray<DashboardExternalDropTarget>;

export function ExternalDropTrashPlayground() {
  const { text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createNumberedPlaygroundFixture(4),
  });
  const [status, setStatus] = useState<
    { kind: "idle" | "reset" } | { kind: "removed"; widgetId: string }
  >({ kind: "idle" });
  const statusText = status.kind === "removed"
    ? text(
        `${status.widgetId} 위젯을 제어 상태에서 삭제했습니다.`,
        `Removed ${status.widgetId} from controlled state.`,
      )
    : status.kind === "reset"
      ? text("초기 위젯을 복원했습니다.", "Restored the initial widgets.")
      : text("위젯을 휴지통 영역으로 드래그해 보세요.", "Drag a widget to the trash area.");
  const reset = () => {
    dashboard.commands.resetLayout({
      columns: 12,
      widgets: createNumberedPlaygroundFixture(4),
    });
    setStatus({ kind: "reset" });
  };
  const handleExternalDrop = (event: DashboardWidgetExternalDropEvent) => {
    if (event.targetId !== "trash") {
      return;
    }
    dashboard.commands.removeWidget(event.widgetId);
    setStatus({ kind: "removed", widgetId: event.widgetId });
  };

  return (
    <section className="playground-workspace" data-advanced-feature="external-drop-trash">
      <PlaygroundHeader
        description={text(
          "Grid 외부의 휴지통 영역으로 드롭한 위젯을 consumer 제어 상태에서 삭제합니다.",
          "Deletes a widget from consumer-controlled state after it is dropped on a trash target outside the grid.",
        )}
        kicker={text("고급 예제", "Advanced Examples")}
        title={text("외부 드롭 - 휴지통 삭제", "External Drop - Trash Delete")}
      />
      <PlaygroundFeatureGuide
        code={`const targets = [{ id: "trash", selector: "[data-dashboard-drop-target='trash']" }];\n\n<DashboardGrid\n  externalDropTargets={targets}\n  onWidgetExternalDrop={(event) => {\n    if (event.targetId === "trash") removeWidget(event.widgetId);\n  }}\n/>`}
        items={[
          text("externalDropTargets는 Grid 외부의 DOM target을 typed ID와 selector로 등록합니다.", "externalDropTargets registers an external DOM target with a typed ID and selector."),
          text("패키지는 drop event만 전달하며 삭제는 consumer가 targetId === \"trash\"를 확인한 뒤 removeWidget으로 수행합니다.", "The package only emits the drop event; the consumer checks targetId === \"trash\" and calls removeWidget."),
          text("휴지통 밖에 놓거나 이벤트를 처리하지 않으면 제어 위젯 상태는 변경되지 않습니다.", "Dropping outside the trash or ignoring the event leaves controlled widget state unchanged."),
        ]}
      />
      <PlaygroundStage kind="controls">
        <section aria-label={text("휴지통 삭제 컨트롤", "Trash delete controls")} className="external-trash-controls">
          <div
            aria-describedby="playground-external-drop-status"
            aria-label={text("위젯을 여기에 놓으면 삭제됩니다", "Drop a widget here to delete it")}
            className="example-external-drop__target"
            data-dashboard-drop-target="trash"
            data-testid="playground-external-drop-trash"
          >
            <Trash2 aria-hidden="true" size={28} />
            <strong>{text("위젯 삭제 영역", "Widget delete area")}</strong>
            <span>{text("드래그한 위젯을 여기에 놓으세요.", "Drop a dragged widget here.")}</span>
          </div>
          <div className="external-trash-controls__status">
            <p aria-label={text("외부 드롭 처리 상태", "External drop status")} id="playground-external-drop-status" role="status">{statusText}</p>
            <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} />{text("초기화", "Reset")}</button>
          </div>
        </section>
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section aria-label={text("휴지통 삭제 Grid", "Trash delete grid")} className="playground-grid-region">
          <DashboardGrid
            className="playground-grid--numbered playground-grid--title-handle"
            columns={dashboard.columns}
            engineOptions={{ animate: false, cellHeight: 96, dragHandle: ".comins-grid-layout-widget__title" }}
            externalDropTargets={externalTrashTargets}
            refreshKey={dashboard.refreshVersion}
            showControls={false}
            widgets={dashboard.widgets}
            onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
            onWidgetExternalDrop={handleExternalDrop}
            renderWidget={(widget) => <div className="playground-numbered-widget-content"><WidgetSettingsTable widget={widget} /></div>}
          />
        </section>
      </PlaygroundStage>
    </section>
  );
}

export function PublicApiPlayground() {
  const { text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createNumberedPlaygroundFixture(4),
  });
  const gridRef = useRef<DashboardGridHandle>(null);
  const [result, setResult] = useState<string | null>(null);
  const query = () => {
    const handle = gridRef.current;
    setResult(JSON.stringify({
      columns: handle?.getColumnCount(),
      rows: handle?.getRowCount(),
      float: handle?.getFloat(),
      firstAreaEmpty: handle?.isAreaEmpty({ x: 0, y: 0, w: 1, h: 1 }),
      nextRowFits: handle?.willItFit({ x: 0, y: 8, w: 3, h: 2 }),
    }, null, 2));
  };
  const compact = () => {
    const snapshot = gridRef.current?.compact("compact", true);
    if (snapshot) {
      setResult(JSON.stringify(snapshot, null, 2));
    }
  };
  return (
    <section className="playground-workspace" data-advanced-feature="public-api">
      <PlaygroundHeader
        description={text("제어 상태를 우회하지 않는 공개 핸들러와 메서드만 실행합니다.", "Runs only public handlers and methods that preserve controlled state.")}
        kicker={text("고급 예제", "Advanced Examples")}
        title={text("안전한 공개 핸들러 / 메서드", "Safe Public Handlers / Methods")}
      />
      <PlaygroundFeatureGuide
        code={`const columns = gridRef.current?.getColumnCount();\nconst snapshot = gridRef.current?.compact("compact", true);\ngridRef.current?.refresh();`}
        items={[
          text("읽기 메서드: getColumnCount, getRowCount, getFloat, isAreaEmpty, willItFit으로 엔진 상태를 조회합니다.", "Read methods: query engine state with getColumnCount, getRowCount, getFloat, isAreaEmpty, and willItFit."),
          text("제어 커밋 메서드: compact는 정렬 후 DashboardLayoutSnapshot을 제어 상태에 커밋합니다.", "Controlled commit method: compact arranges and commits a DashboardLayoutSnapshot to controlled state."),
          text("동기화 메서드: refresh는 현재 React 위젯과 GridStack geometry를 다시 맞춥니다.", "Synchronization method: refresh realigns current React widgets and GridStack geometry."),
          text("getGridStack은 하위 호환 escape hatch이며 raw addWidget/removeWidget/load/destroy는 제어 상태를 우회하므로 사용하지 않습니다.", "getGridStack is a compatibility escape hatch; raw addWidget/removeWidget/load/destroy bypass controlled state and are not used here."),
        ]}
        referenceCaption={text("공개 메서드", "Public methods")}
        referenceNameLabel={text("메서드명", "Method name")}
        references={[
          { name: "getColumnCount", description: text("현재 Grid의 활성 컬럼 수를 조회합니다.", "Returns the active grid column count.") },
          { name: "getRowCount", description: text("현재 Grid가 사용하는 행 수를 조회합니다.", "Returns the current number of occupied grid rows.") },
          { name: "getFloat", description: text("현재 GridStack float 설정을 조회합니다.", "Returns the current GridStack float setting.") },
          { name: "isAreaEmpty", description: text("지정한 x, y, w, h 영역이 비어 있는지 확인합니다.", "Checks whether a specified x, y, w, h area is empty.") },
          { name: "willItFit", description: text("지정한 위젯 geometry를 현재 Grid에 배치할 수 있는지 확인합니다.", "Checks whether widget geometry can fit in the current grid.") },
          { name: "compact", description: text("정렬 결과를 DashboardLayoutSnapshot으로 제어 상태에 커밋합니다.", "Compacts and commits the resulting DashboardLayoutSnapshot to controlled state.") },
          { name: "refresh", description: text("현재 React 위젯과 GridStack geometry를 다시 동기화합니다.", "Resynchronizes current React widgets and GridStack geometry.") },
          { name: "getGridStack", description: text("하위 호환 escape hatch입니다. raw CRUD는 제어 상태를 우회하므로 사용하지 않습니다.", "Backward-compatibility escape hatch. Do not use raw CRUD because it bypasses controlled state.") },
        ]}
      />
      <PlaygroundStage kind="controls">
        <ExampleToolbar id="advanced-public-api">
          <button type="button" onClick={query}><Columns3 aria-hidden="true" size={15} />{text("상태 조회", "Query state")}</button>
          <button type="button" onClick={compact}><Grid2X2 aria-hidden="true" size={15} />{text("정렬 후 커밋", "Arrange and commit")}</button>
          <button type="button" onClick={() => gridRef.current?.refresh()}><RefreshCcw aria-hidden="true" size={15} />{text("레이아웃 갱신", "Refresh layout")}</button>
        </ExampleToolbar>
        <pre aria-label={text("공개 메서드 실행 결과", "Public method result")} className="public-api-result">
          {result ?? text("메서드를 실행해 결과를 확인하세요.", "Run a method to inspect its result.")}
        </pre>
        <p className="public-api-warning">
          {text(
            "getGridStack()은 하위 호환용 escape hatch입니다. raw CRUD는 React 제어 상태를 우회하므로 이 예제에서는 호출하지 않습니다.",
            "getGridStack() is a backward-compatibility escape hatch. raw CRUD bypasses React controlled state, so this example does not call it.",
          )}
        </p>
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section aria-label={text("공개 API Grid", "Public API Grid")} className="playground-grid-region">
          <DashboardGrid
            ref={gridRef}
            columns={dashboard.columns}
            engineOptions={{ animate: false }}
            refreshKey={dashboard.refreshVersion}
            showControls={false}
            widgets={dashboard.widgets}
            onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
            renderWidget={(widget) => <div className="playground-numbered-widget-content"><WidgetSettingsTable widget={widget} /></div>}
          />
        </section>
      </PlaygroundStage>
    </section>
  );
}
