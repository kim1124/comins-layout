import { useCallback, useEffect, useState } from "react";
import { DashboardGrid } from "../../../src";
import type { DashboardWidget } from "../../../src";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetSettingsTable } from "./components/WidgetSettingsTable";
import { usePlaygroundLocale } from "./locale";
import { useNumberedDashboard } from "./use-numbered-dashboard";
import type { ExampleWidgetData } from "./types";

export function LazyRenderPlayground() {
  const { text } = usePlaygroundLocale();
  const [enabled, setEnabled] = useState(true);
  const [experiment, setExperiment] = useState(0);
  return <section className="playground-workspace" data-advanced-feature="lazy-load">
    <PlaygroundHeader title={text("콘텐츠 지연 렌더링", "Lazy Content Rendering")} kicker={text("고급 예제", "Advanced Examples")}
      description={text("내부 영역을 스크롤하여 대기 중인 본문이 처음 렌더링되는 시점과 개수를 확인합니다.", "Scroll inside the example to see when waiting content first mounts and how the rendered count changes.")} />
    <PlaygroundFeatureGuide items={[
      text("lazyRenderWidget는 콘텐츠의 최초 렌더링만 지연합니다. 외곽과 제목은 처음부터 표시되며 전체 위젯 가상화나 데이터 다운로드 기능은 아닙니다.", "lazyRenderWidget delays only the first content render. Shells and titles exist from the start; this is not whole-widget virtualization or data fetching."),
      text("아래 상태는 실제 콘텐츠 컴포넌트가 마운트된 결과입니다. 한 번 완료된 본문은 화면 밖으로 나가도 유지되며 이후 React 상태 변경도 반영됩니다.", "The status reflects actual content component mounts. Once mounted, content stays mounted offscreen and continues to receive React updates."),
      text("끄면 모든 본문이 즉시 렌더링됩니다. 다시 켜도 이미 표시된 본문은 숨기지 않습니다. 켜짐 상태에서 다시 실험을 누르면 Grid를 새로 마운트하고 스크롤을 처음으로 되돌립니다.", "Turning this off renders all content immediately. Turning it back on does not hide existing content. Restart while enabled to remount the grid and reset its scroll position."),
    ]} code={'<div data-dashboard-lazy-scroll style={{ height: 430, overflow: "auto" }}>\n  <DashboardGrid lazyRenderWidget={enabled} widgets={widgets} renderWidget={renderContent} />\n</div>'} />
    <PlaygroundStage kind="controls"><div className="example-actions">
      <button type="button" {...toggleStateProps(enabled)} onClick={() => setEnabled(value => !value)}>{text(`지연 렌더링 ${enabled ? "켜짐" : "꺼짐"}`, `Lazy rendering ${enabled ? "on" : "off"}`)}</button>
      <button type="button" onClick={() => setExperiment(value => value + 1)}>{text("다시 실험", "Restart experiment")}</button>
    </div></PlaygroundStage>
    <LazyExperiment key={experiment} enabled={enabled} />
  </section>;
}

function LazyExperiment({ enabled }: { enabled: boolean }) {
  const { dashboard } = useNumberedDashboard();
  const { text, locale } = usePlaygroundLocale();
  const [rendered, setRendered] = useState<ReadonlySet<string>>(() => new Set());
  const recordMount = useCallback((id: string) => setRendered(previous => previous.has(id) ? previous : new Set([...previous, id])), []);
  return <PlaygroundStage kind="grid">
    <p aria-live="polite">{text("콘텐츠 렌더링", "Content rendered")}: <output aria-label={text("콘텐츠 렌더링 수", "Rendered content count")}>{rendered.size} / {dashboard.widgets.length}</output></p>
    <ul className="lazy-demo-status" aria-label={text("위젯별 렌더링 상태", "Per-widget render status")}>{dashboard.widgets.map(widget => <li key={widget.id} data-rendered={rendered.has(widget.id)}>{widget.title}: {rendered.has(widget.id) ? text("완료", "Rendered") : text("대기", "Waiting")}</li>)}</ul>
    <div className="advanced-lazy-scroll lazy-demo" data-dashboard-lazy-scroll data-language={locale}>
      <section aria-label={text("콘텐츠 지연 렌더링 Grid", "Lazy Content Rendering Grid")} className="playground-grid-region">
        <DashboardGrid columns={dashboard.columns} widgets={dashboard.widgets} showControls={false} lazyRenderWidget={enabled} engineOptions={{ animate: false, cellHeight: 180 }} className="playground-grid--numbered"
          onColumnsChange={dashboard.commands.setColumns} onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          renderWidget={widget => <MountedContent widget={widget} onMount={recordMount} />} />
      </section>
    </div>
  </PlaygroundStage>;
}

function MountedContent({ widget, onMount }: { widget: DashboardWidget<ExampleWidgetData>; onMount: (id: string) => void }) {
  useEffect(() => { onMount(widget.id); }, [onMount, widget.id]);
  return <div className="playground-numbered-widget-content"><WidgetSettingsTable widget={widget} movable resizable /></div>;
}
