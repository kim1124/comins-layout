import { useRef, useState } from "react";
import { Columns3, Grid2X2, RefreshCcw } from "lucide-react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type {
  DashboardGridEngineOptions,
  DashboardGridHandle,
  DashboardResponsiveOptions,
} from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
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

export function AdvancedFeaturePlayground({ feature }: { feature: AdvancedFeature }) {
  const { dashboard } = useNumberedDashboard();
  const { locale, text } = usePlaygroundLocale();
  const [enabled, setEnabled] = useState(feature !== "static");
  const [cellHeight, setCellHeight] = useState(96);
  const copy = featureText[feature];
  const title = copy.title[locale];
  const responsive = createResponsiveOptions(feature);
  const engineOptions: DashboardGridEngineOptions = {
    alwaysShowResizeHandle: feature === "mobile-touch" ? "mobile" : undefined,
    cellHeight: feature === "cell-height" ? cellHeight : feature === "lazy-load" ? 180 : 96,
    dragHandle: feature === "title-drag" ? ".comins-grid-layout-widget__title" : undefined,
    float: feature === "float" ? enabled : false,
    lazyLoad: feature === "lazy-load",
    rtl: feature === "rtl" ? enabled : false,
    sizeToContent: feature === "size-to-content" ? enabled : false,
    staticGrid: feature === "static" ? !enabled : false,
  };
  const className = feature === "grid-lines" && enabled ? "playground-grid--lines" : undefined;
  const dashboardNode = (
    <ExampleDashboard
      className={className}
      dashboard={dashboard}
      engineOptions={engineOptions}
      lazyRenderWidget={feature === "lazy-load"}
      responsive={responsive}
    />
  );

  return (
    <section className="playground-workspace" data-advanced-feature={feature}>
      <PlaygroundHeader description={copy.description[locale]} kicker={text("고급 예제", "Advanced Examples")} title={title} />
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
          <button type="button" onClick={() => setEnabled((value) => !value)} {...toggleStateProps(enabled)}>
            <Grid2X2 aria-hidden="true" size={15} />
            {advancedToggleLabel(feature, enabled, locale)}
          </button>
        )}
      </ExampleToolbar>
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
    case "responsive-none": return localized("반응형 설정 적용", "Responsive settings applied");
    case "title-drag": return localized("타이틀로만 이동", "Move from title only");
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
  return <NestedPlayground depth={2} constraints={false} title={{ ko: "Nested Grid - Basic", en: "Nested Grid - Basic" }} />;
}

export function NestedAdvancedPlayground() {
  return <NestedPlayground depth={3} constraints={false} title={{ ko: "Nested Grid - 고급", en: "Nested Grid - Advanced" }} />;
}

export function NestedConstraintsPlayground() {
  return <NestedPlayground depth={2} constraints title={{ ko: "Nested Grid - 제약", en: "Nested Grid - Constraints" }} />;
}

function NestedPlayground({ depth, constraints, title: localizedTitle }: { depth: number; constraints: boolean; title: LocalizedText }) {
  const { locale, text } = usePlaygroundLocale();
  const title = localizedTitle[locale];
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
        description={constraints
          ? text("하위 Grid가 허용된 category의 위젯만 받도록 제약을 적용합니다.", "Restricts the child grid to widgets in an allowed category.")
          : text(`${depth}단계의 제어된 Grid를 React 상태 소유권을 유지한 채 구성합니다.`, `Builds a ${depth}-level controlled grid while React retains state ownership.`)}
        kicker={text("고급 예제", "Advanced Examples")}
        title={title}
      />
      <section aria-label={`${title} Grid`} className="playground-grid-region nested-example-root">
        <DashboardGrid
          columns={root.columns}
          engineOptions={{ animate: false, cellHeight: 78, dragHandle: ".comins-grid-layout-widget__title" }}
          refreshKey={root.refreshVersion}
          showControls={false}
          widgets={root.widgets}
          onLayoutCommit={root.commands.applyLayoutSnapshot}
          renderWidget={(widget) => widget.id === "widget-1"
            ? <NestedLevel depth={depth - 1} constraints={constraints} level={1} />
            : <div className="playground-numbered-widget-content">Content 2</div>}
        />
      </section>
    </section>
  );
}

function NestedLevel({ depth, constraints, level }: { depth: number; constraints: boolean; level: number }) {
  const { text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 4,
    initialWidgets: [
      {
        ...createNumberedWidget(level * 10 + 1),
        data: {
          description: constraints ? "허용 category" : `Nested level ${level}`,
          value: `Nested ${level}`,
          number: level * 10 + 1,
          kind: constraints ? "chart" : "kpi",
        },
        layout: { id: `widget-${level * 10 + 1}`, x: 0, y: 0, w: depth > 1 ? 3 : 2, h: depth > 1 ? 4 : 2 },
      },
      { ...createNumberedWidget(level * 10 + 2), layout: { id: `widget-${level * 10 + 2}`, x: 3, y: 0, w: 1, h: 2 } },
    ],
  });
  return (
    <div className="nested-example-level" data-nested-level={level}>
      {constraints ? <p className="nested-example-rule">{text("허용: chart category", "Allowed: chart category")}</p> : null}
      <DashboardGrid
        columns={dashboard.columns}
        engineOptions={{ animate: false, cellHeight: 58, dragHandle: ".comins-grid-layout-widget__title" }}
        gridId={`nested-grid-${level}`}
        acceptExternalWidgets={constraints ? (candidate) => candidate.widget.data?.kind === "chart" : true}
        refreshKey={dashboard.refreshVersion}
        showControls={false}
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => depth > 1 && widget === dashboard.widgets[0]
          ? <NestedLevel depth={depth - 1} constraints={constraints} level={level + 1} />
          : <div className="playground-numbered-widget-content">{widget.data?.value}</div>}
      />
    </div>
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
      dashboard.commands.applyLayoutSnapshot(snapshot);
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
      <section aria-label={text("공개 API Grid", "Public API Grid")} className="playground-grid-region">
        <DashboardGrid
          ref={gridRef}
          columns={dashboard.columns}
          engineOptions={{ animate: false }}
          refreshKey={dashboard.refreshVersion}
          showControls={false}
          widgets={dashboard.widgets}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          renderWidget={(widget) => <div className="playground-numbered-widget-content">Content {widget.data?.number}</div>}
        />
      </section>
    </section>
  );
}
