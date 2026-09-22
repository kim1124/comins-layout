import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardGridHandle, DashboardResponsiveOptions } from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { usePlaygroundLocale } from "./locale";
import { useNumberedDashboard } from "./use-numbered-dashboard";

type Method = "columnWidth" | "breakpoints";
type Policy = "moveScale" | "none";

export function ResponsivePlayground() {
  const { text } = usePlaygroundLocale();
  const [method, setMethod] = useState<Method>("columnWidth");
  const [policy, setPolicy] = useState<Policy>("moveScale");
  const [width, setWidth] = useState(1080);
  const [enabled, setEnabled] = useState(true);
  const [experiment, setExperiment] = useState(0);
  return (
    <section className="playground-workspace" data-advanced-feature="responsive">
      <PlaygroundHeader title={text("반응형", "Responsive")} kicker={text("고급 예제", "Advanced Examples")}
        description={text("컬럼 수를 정하는 방식과 컬럼 변경 시 배치 정책을 따로 선택하여 비교합니다.", "Compare how column counts are calculated separately from how widgets adapt to a column change.")} />
      <PlaygroundFeatureGuide items={[
        text("컬럼 결정 방식: columnWidth=180은 컨테이너 너비를 180으로 나눈 값을 반올림해 1~12컬럼으로 제한합니다. 고정 셀 너비가 아닙니다.", "Column calculation: columnWidth=180 rounds the container width divided by 180, limited to 1–12 columns. It does not fix cell widths."),
        text("Breakpoint 방식: 컨테이너 너비 640px 이하에서 2컬럼, 960px 이하에서 6컬럼, 그보다 넓으면 12컬럼입니다. 이 수치는 예제 설정입니다.", "Breakpoints: up to 640px uses 2 columns, up to 960px uses 6, and wider containers use 12. These are example settings."),
        text('배치 정책: moveScale은 x/w를 비례 조정합니다. layout: "none"은 비례 변환을 하지 않지만 컬럼 경계와 위젯 겹침은 보정합니다. none은 반응형을 끄는 설정이 아닙니다.', 'Layout policy: moveScale scales x/w proportionally. layout: "none" skips proportional scaling but corrects column bounds and overlaps. none does not disable responsiveness.'),
        text("너비만 바꾸면 방문한 컬럼의 저장된 배치를 복원합니다. 방식·정책 변경 또는 다시 실험은 초기 배치와 캐시부터 시작합니다. 실제 너비는 화면의 사용 가능한 공간으로 제한됩니다.", "Changing width restores cached layouts for visited column counts. Changing method/policy or restarting resets the layout and cache. Actual width is capped by the available screen space."),
      ]} code={`responsive={{ ${method === "columnWidth" ? "columnWidth: 180" : "breakpoints: [{ maxWidth: 640, columns: 2 }, { maxWidth: 960, columns: 6 }]"}, columnMax: 12, layout: "${policy}" }}\nonColumnsChange={dashboard.commands.setColumns}\nonLayoutCommit={dashboard.commands.applyLayoutSnapshot}`} />
      <PlaygroundStage kind="controls">
        <div className="example-actions responsive-demo-controls">
          <label>{text("컬럼 결정 방식", "Column calculation")}
            <select value={method} onChange={event => setMethod(event.target.value as Method)}>
              <option value="columnWidth">{text("목표 컬럼 너비 (180px)", "Target column width (180px)")}</option>
              <option value="breakpoints">{text("너비 구간 (Breakpoint)", "Width ranges (breakpoints)")}</option>
            </select>
          </label>
          <label>{text("배치 정책", "Layout policy")}
            <select value={policy} onChange={event => setPolicy(event.target.value as Policy)}>
              <option value="moveScale">{text("위치·너비 비례 조정 (moveScale)", "Scale position and width (moveScale)")}</option>
              <option value="none">{text("비례 조정 안 함 (none)", "No proportional scaling (none)")}</option>
            </select>
          </label>
          <label>{text("컨테이너 너비", "Container width")}
            <input type="number" min={280} max={1440} step={20} value={width} onChange={event => setWidth(Number(event.target.value))} />
          </label>
          <input aria-label={text("너비 슬라이더", "Width slider")} type="range" min={280} max={1440} step={20} value={width} onChange={event => setWidth(Number(event.target.value))} />
          <button type="button" {...toggleStateProps(enabled)} onClick={() => setEnabled(value => !value)}>{text(`반응형 설정 ${enabled ? "적용" : "해제"}`, `Responsive settings ${enabled ? "applied" : "disabled"}`)}</button>
          <button type="button" onClick={() => setExperiment(value => value + 1)}>{text("다시 실험", "Restart experiment")}</button>
        </div>
      </PlaygroundStage>
      <ResponsiveExperiment key={`${method}-${policy}-${enabled}-${experiment}`} enabled={enabled} method={method} policy={policy} width={Math.max(280, Math.min(1440, width))} />
    </section>
  );
}

function ResponsiveExperiment({ method, policy, width, enabled }: { method: Method; policy: Policy; width: number; enabled: boolean }) {
  const { dashboard } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();
  const container = useRef<HTMLDivElement>(null);
  const gridRef = useRef<DashboardGridHandle>(null);
  const [ready, setReady] = useState(false);
  const [actualWidth, setActualWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setActualWidth(Math.round(element.getBoundingClientRect().width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    // Start at a clipped 12-column width, then resize the actual container.
    // Changing responsive options and loading the controlled initial layout
    // together would overwrite the transition we want to demonstrate.
    let frame: number;
    const waitForGrid = () => {
      if (gridRef.current?.getColumnCount() != null) setReady(true);
      else frame = requestAnimationFrame(waitForGrid);
    };
    frame = requestAnimationFrame(waitForGrid);
    return () => cancelAnimationFrame(frame);
  }, []);
  const responsive = useMemo<DashboardResponsiveOptions>(() => method === "columnWidth"
    ? { columnWidth: 180, columnMax: 12, layout: policy }
    : { breakpoints: [{ maxWidth: 640, columns: 2 }, { maxWidth: 960, columns: 6 }], columnMax: 12, layout: policy }, [method, policy]);
  return <PlaygroundStage kind="grid">
    <div className="example-actions" aria-live="polite">
      <span>{text("실제 컨테이너 너비", "Actual container width")}: <output aria-label={text("실제 컨테이너 너비", "Actual container width")}>{actualWidth}px</output></span>
      <span>{text("현재 컬럼", "Current columns")}: <output>{dashboard.columns}</output></span>
    </div>
    <div style={{ overflow: "hidden" }} aria-busy={!ready}>
      <div className="responsive-demo-container" ref={container} style={{ width: ready ? width : 2160, maxWidth: ready ? "100%" : undefined, visibility: ready ? "visible" : "hidden" }}>
        <ExampleDashboard gridRef={gridRef} dashboard={dashboard} responsive={enabled ? responsive : undefined} />
      </div>
    </div>
    <table className="responsive-demo-layout"><caption>{text("현재 배치 (그리드 단위)", "Current layout (grid units)")}</caption>
      <thead><tr><th>{text("위젯", "Widget")}</th><th>x</th><th>y</th><th>w</th><th>h</th></tr></thead>
      <tbody>{dashboard.widgets.map(widget => <tr key={widget.id}><th>{widget.title}</th><td>{widget.layout.x}</td><td>{widget.layout.y}</td><td>{widget.layout.w}</td><td>{widget.layout.h}</td></tr>)}</tbody>
    </table>
  </PlaygroundStage>;
}
