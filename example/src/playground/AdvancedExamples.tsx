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
  | "mobile-touch"
  | "rtl"
  | "title-drag"
  | "transform";

const featureText: Record<AdvancedFeature, { title: LocalizedText; description: LocalizedText }> = {
  "cell-height": {
    title: { ko: "셀 높이", en: "Cell Height" },
    description: { ko: "한 행의 픽셀 높이를 바꿔 위젯을 더 촘촘하거나 여유 있게 표시합니다.", en: "Changes the pixel height of each row to make widgets more compact or spacious." },
  },
  "grid-lines": {
    title: { ko: "그리드 라인", en: "Grid Lines" },
    description: { ko: "위젯 배치 단위를 보기 쉽게 예제 전용 보조선을 표시합니다.", en: "Displays example-only guide lines to make widget placement units visible." },
  },
  float: {
    title: { ko: "Float", en: "Float" },
    description: { ko: "위젯 위쪽의 빈 공간을 유지할지, 가능한 위쪽으로 당겨 채울지 비교합니다.", en: "Compares preserving gaps above widgets with packing widgets upward." },
  },
  "mobile-touch": {
    title: { ko: "모바일 터치", en: "Mobile Touch" },
    description: { ko: "터치로 위젯을 이동하고 크기를 조절하며, 리사이즈 핸들의 표시 방식을 비교합니다.", en: "Move and resize widgets by touch and compare resize-handle visibility modes." },
  },
  rtl: {
    title: { ko: "RTL", en: "RTL" },
    description: { ko: "오른쪽을 기준으로 위젯을 배치하는 RTL 화면에서 이동과 크기 조절을 확인합니다.", en: "Try moving and resizing widgets in a right-to-left layout anchored to the right edge." },
  },
  "title-drag": {
    title: { ko: "타이틀 Drag Handle", en: "Title Drag Handle" },
    description: { ko: "콘텐츠를 조작할 때 위젯이 움직이지 않도록 드래그 시작 영역을 타이틀로 제한합니다.", en: "Restricts dragging to the title so interacting with content does not move the widget." },
  },
  transform: {
    title: { ko: "Transform", en: "Transform" },
    description: { ko: "CSS로 확대·축소하거나 이동한 부모 영역 안에서도 위젯을 이동하고 크기를 조절합니다.", en: "Move and resize widgets inside a parent transformed with CSS scale and translate." },
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
      { ko: "float=true는 위젯 위쪽의 빈 공간을 유지하고, false는 가능한 위쪽으로 당겨 배치합니다. 패키지 기본값은 false이며 이 예제는 true로 시작합니다.", en: "float=true preserves gaps above widgets; false packs widgets upward. The package default is false; this example starts with true." },
      { ko: "토글 전후에 위젯을 이동해 빈 공간 처리 차이를 확인합니다.", en: "Move widgets before and after toggling to observe gap handling." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ float: enabled }} />", en: "<DashboardGrid engineOptions={{ float: enabled }} />" },
  },
  "mobile-touch": {
    items: [
      { ko: "터치로 위젯을 이동하고 우측 하단 핸들로 크기를 조절합니다. 토글은 핸들 표시 방식만 바꾸며 이동·리사이즈 기능을 끄지 않습니다.", en: "Move widgets by touch and resize from the bottom-right handle. The toggle changes handle visibility, not whether movement or resizing is enabled." },
      { ko: "터치 환경에서 핸들을 상시 표시하는 mobile 설정과 자동 숨김 설정을 비교합니다. 640px 이하 컨테이너의 3컬럼 전환은 이 예제의 설정입니다.", en: "Compare the mobile setting, which keeps handles visible on touch devices, with auto-hide. Switching to 3 columns at container widths up to 640px is specific to this example." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ alwaysShowResizeHandle: \"mobile\" }} />", en: "<DashboardGrid engineOptions={{ alwaysShowResizeHandle: \"mobile\" }} />" },
  },
  rtl: {
    items: [
      { ko: "rtl=true는 위젯 배치 기준과 드래그 좌표를 오른쪽에서 왼쪽 방향으로 전환합니다.", en: "rtl=true switches widget placement and drag coordinates to right-to-left direction." },
      { ko: "제어 상태의 x 값은 유지하면서 GridStack의 시각 위치 계산만 RTL 기준으로 동기화합니다.", en: "Controlled x values remain stable while GridStack synchronizes visual positioning for RTL." },
    ],
    code: { ko: "<DashboardGrid engineOptions={{ rtl: true }} />", en: "<DashboardGrid engineOptions={{ rtl: true }} />" },
  },
  "title-drag": {
    items: [
      { ko: "dragHandle을 타이틀 selector로 제한해 Content 조작과 위젯 이동 시작 영역을 분리합니다.", en: "Limits dragHandle to the title selector, separating content interaction from the widget move start area." },
      { ko: "설정이 켜져 있을 때 타이틀과 콘텐츠를 각각 드래그해 비교합니다. 타이틀에서만 이동이 시작되며 리사이즈는 우측 하단 핸들을 사용합니다.", en: "With the setting enabled, compare dragging the title and the content. Only the title starts movement; resize using the bottom-right handle." },
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
  const [enabled, setEnabled] = useState(true);
  const [cellHeight, setCellHeight] = useState(96);
  const copy = featureText[feature];
  const guidance = featureGuidance[feature];
  const title = copy.title[locale];
  const responsive = createResponsiveOptions(feature);
  const toggleFeature = () => {
    setEnabled((value) => !value);
  };
  const engineOptions: DashboardGridEngineOptions = {
    alwaysShowResizeHandle: feature === "mobile-touch" ? (enabled ? "mobile" : false) : undefined,
    cellHeight: feature === "cell-height" ? cellHeight : 96,
    dragHandle: feature === "title-drag" && enabled ? ".comins-grid-layout-widget__title" : undefined,
    float: feature === "float" ? enabled : false,
    rtl: feature === "rtl" ? enabled : false,
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
        {feature === "transform" && enabled ? (
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
    case "transform": return localized(`Transform ${enabled ? "적용" : "해제"}`, `Transform ${enabled ? "applied" : "removed"}`);
    case "mobile-touch": return localized(enabled ? "리사이즈 핸들 항상 표시" : "리사이즈 핸들 자동 표시", enabled ? "Resize handles always visible" : "Resize handles shown automatically");
    case "title-drag": return localized(enabled ? "타이틀로만 이동" : "전체 위젯에서 이동", enabled ? "Move from title only" : "Move from the full widget");
    default: return localized(enabled ? "사용" : "미사용", enabled ? "Enabled" : "Disabled");
  }
}

function createResponsiveOptions(feature: AdvancedFeature): DashboardResponsiveOptions | undefined {
  if (feature === "mobile-touch") {
    return { breakpoints: [{ maxWidth: 640, columns: 3, layout: "none" }], columnMax: 12, layout: "none" };
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
        text("각 단계의 위젯과 배치는 해당 React 상태에서 관리합니다. 자식 Grid의 gridId는 서로 다르며 GridStack의 자동 하위 Grid 생성 기능은 사용하지 않습니다.", "Each level manages its widgets and layout in its own React state. Child grids have distinct gridId values; GridStack's automatic sub-grid creation is not used."),
        text("계층 내부 이동은 같은 Grid의 layout 이동이며 A→B Grid 전송은 다중 Grid 예제로 분리되어 있습니다.", "Movement inside the hierarchy changes layout within one grid; A-to-B grid transfer is separated into the Multiple Grids example."),
        text("중첩 경계 충돌을 피하기 위해 각 위젯은 표시된 타이틀 grab 영역에서 이동합니다.", "Widgets move from the visible title grab area to avoid interaction conflicts across nested boundaries."),
      ]
    : [
        text("2단계 Root와 Child Grid가 각각 독립된 React 제어 상태와 layout commit을 소유합니다.", "The two-level Root and Child grids each own independent React controlled state and layout commits."),
        text("부모 위젯의 renderWidget 안에 자식 DashboardGrid를 렌더링합니다. 중첩만으로 위젯이 다른 Grid로 전송되지는 않습니다.", "Render a child DashboardGrid inside the parent widget's renderWidget. Nesting alone does not transfer widgets between grids."),
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
        description={text(`위젯 안에 다른 Grid를 넣어 ${depth}단계 대시보드를 구성하고 각 단계의 배치를 독립적으로 관리합니다.`, `Build a ${depth}-level dashboard by placing grids inside widgets, with independent layout state at each level.`)}
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
          "위젯을 그리드 밖 휴지통에 놓으면 드롭 이벤트를 받아 앱의 위젯 목록에서 삭제합니다.",
          "Drop a widget on the trash area outside the grid to remove it from the app's widget list through a drop event.",
        )}
        kicker={text("고급 예제", "Advanced Examples")}
        title={text("외부 드롭 - 휴지통 삭제", "External Drop - Trash Delete")}
      />
      <PlaygroundFeatureGuide
        code={`const targets = [{ id: "trash", selector: "[data-dashboard-drop-target='trash']" }];\n\n<DashboardGrid\n  externalDropTargets={targets}\n  onWidgetExternalDrop={(event) => {\n    if (event.targetId === "trash") removeWidget(event.widgetId);\n  }}\n/>`}
        items={[
          text("externalDropTargets는 같은 문서의 HTML 영역을 ID와 CSS 선택자로 등록합니다. iframe과 Shadow DOM 내부 대상은 지원하지 않습니다.", "externalDropTargets registers HTML areas in the same document by ID and CSS selector. Targets inside iframes or Shadow DOM are not supported."),
          text("패키지는 onWidgetExternalDrop으로 드롭을 알립니다. 이 예제는 targetId === \"trash\"를 확인하고 removeWidget을 호출해 삭제합니다.", "The package reports drops through onWidgetExternalDrop. This example checks targetId === \"trash\" and calls removeWidget to delete the widget."),
          text("휴지통 밖에 놓거나 삭제 콜백을 연결하지 않으면 위젯은 삭제되지 않습니다. 일반 드래그에 따른 배치 변경은 onLayoutCommit을 통해 별도로 반영될 수 있습니다.", "Dropping outside the trash or omitting the deletion callback does not delete the widget. Ordinary drag layout changes may still be applied through onLayoutCommit."),
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
          </div>
        </section>
      </PlaygroundStage>
      <PlaygroundStage kind="grid" actions={(
        <button className="external-trash-reset" type="button" onClick={reset}>
          <RotateCcw aria-hidden="true" size={15} />{text("초기화", "Reset")}
        </button>
      )}>
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
        description={text("Grid의 컬럼·행·빈 영역을 조회하고, 배치 정리와 콘텐츠 재측정을 실행합니다.", "Query grid columns, rows, and empty areas; compact layouts and remeasure content.")}
        kicker={text("고급 예제", "Advanced Examples")}
        title={text("안전한 공개 핸들러 / 메서드", "Safe Public Handlers / Methods")}
      />
      <PlaygroundFeatureGuide
        code={`const columns = gridRef.current?.getColumnCount();\nconst snapshot = gridRef.current?.compact("compact", true);\ngridRef.current?.refresh();`}
        items={[
          text("읽기 메서드: getColumnCount, getRowCount, getFloat, isAreaEmpty, willItFit으로 엔진 상태를 조회합니다.", "Read methods: query engine state with getColumnCount, getRowCount, getFloat, isAreaEmpty, and willItFit."),
          text("compact는 배치를 정리하고 결과를 onLayoutCommit으로 전달합니다. 이 예제는 applyLayoutSnapshot을 연결해 React 상태에 반영합니다. commitLayout은 현재 배치를 전달하며 같은 결과의 중복 전달을 억제합니다.", "compact rearranges widgets and reports the result through onLayoutCommit. This example connects applyLayoutSnapshot to update React state. commitLayout reports the current layout and suppresses duplicates."),
          text("refresh는 콘텐츠와 드래그 핸들을 다시 측정하고 필요한 배치 보정을 전달합니다. 엔진 준비 전에는 조회 결과와 배치 반환값이 null일 수 있습니다.", "refresh remeasures content and drag handles and reports any needed layout corrections. Queries and layout-returning methods may return null before the engine is ready."),
          text("isAreaEmpty는 지정 영역의 점유 여부를 검사합니다. willItFit은 위젯 배치 후 최대 행 수 maxRow를 넘는지 검사하며, 이 예제처럼 제한이 없으면 true입니다.", "isAreaEmpty checks occupancy of a specified area. willItFit checks whether placing a widget would exceed maxRow; it is true without that limit, as in this example."),
          text("getGridStack은 하위 호환 escape hatch이며 raw addWidget/removeWidget/load/destroy는 제어 상태를 우회하므로 사용하지 않습니다.", "getGridStack is a compatibility escape hatch; raw addWidget/removeWidget/load/destroy bypass controlled state and are not used here."),
        ]}
        referenceCaption={text("공개 메서드", "Public methods")}
        referenceNameLabel={text("메서드명", "Method name")}
        references={[
          { name: "getColumnCount", description: text("현재 Grid의 활성 컬럼 수를 조회합니다.", "Returns the active grid column count.") },
          { name: "getRowCount", description: text("최소 행 수 minRow 설정을 포함한 현재 Grid의 행 수를 조회합니다.", "Returns the current grid row count, including the minRow setting.") },
          { name: "getFloat", description: text("현재 GridStack float 설정을 조회합니다.", "Returns the current GridStack float setting.") },
          { name: "isAreaEmpty", description: text("지정한 x, y, w, h 영역이 비어 있는지 확인합니다.", "Checks whether a specified x, y, w, h area is empty.") },
          { name: "willItFit", description: text("최대 행 수 maxRow 안에 배치 가능한지 검사합니다. 제한이 없으면 true이며 지정 위치가 비었다는 보장은 아닙니다.", "Checks whether placement fits within maxRow. Without that limit it returns true; this does not guarantee the requested position is empty.") },
          { name: "compact", description: text("배치를 정리하고 onLayoutCommit으로 결과를 전달한 뒤 스냅샷을 반환합니다.", "Compacts the layout, reports it through onLayoutCommit, and returns the snapshot.") },
          { name: "refresh", description: text("콘텐츠와 핸들을 재측정하고 필요한 배치 보정을 전달합니다. 반환값은 없습니다.", "Remeasures content and handles and reports needed layout corrections. Returns no value.") },
          { name: "commitLayout", description: text("현재 배치를 콜백으로 전달하고 반환합니다. 동일 스냅샷의 중복 전달은 억제합니다.", "Reports and returns the current layout, suppressing duplicate snapshot notifications.") },
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
