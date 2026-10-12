import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";

import type { DashboardWidgetInteractionEvent } from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { ExampleEventLog } from "./components/ExampleEventLog";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { PlaygroundHeader } from "./components/DashboardPreview";
import { usePlaygroundLocale } from "./locale";
import { useNumberedDashboard } from "./use-numbered-dashboard";

export function WidgetBasicPlayground() {
  const { dashboard } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();

  return (
    <PlaygroundPage
      code={`<DashboardGrid widgets={dashboard.widgets} onLayoutCommit={dashboard.commands.applyLayoutSnapshot} />`}
      description={text("10개 위젯을 배치하고 위젯별 이동, 크기 조절, 삭제를 확인합니다.", "Try moving, resizing, and removing individual widgets in a ten-widget dashboard.")}
      guideItems={[
        text("이 예제는 12컬럼에 10개 위젯을 W3/H2로 배치합니다. W/H는 픽셀이 아니라 위젯이 차지하는 컬럼 수와 행 수입니다.", "This example places ten W3/H2 widgets in 12 columns. W/H are column and row counts, not pixels."),
        text("각 위젯 표에서 번호, 현재 W/H, 이동 및 리사이즈 가능 여부를 확인합니다.", "Each widget table shows its number, current W/H, and move/resize availability."),
        text("타이틀 버튼은 해당 위젯의 이동·리사이즈 허용 여부만 독립적으로 전환합니다.", "Title actions toggle movement and resizing for that widget independently."),
        text("타이틀 더블 클릭은 같은 행의 빈 공간을 채웁니다. 위젯 2·6·10을 삭제한 뒤 Title 1을 더블 클릭해 비교합니다. 잠금 상태에서는 실행하지 않습니다.", "Double-click a title to fill unused columns in its row. Remove widgets 2, 6 and 10, then double-click Title 1 to compare. Locked widgets do not fill gaps."),
      ]}
      title="Basic"
      controls={null}
    >
      <ExampleDashboard dashboard={dashboard} />
    </PlaygroundPage>
  );
}

export function WidgetResizePlayground() {
  const { dashboard } = useNumberedDashboard(undefined, "widget/resize");
  const { text } = usePlaygroundLocale();
  const [selectedId, setSelectedId] = useState("widget-1");
  const selected = dashboard.widgets.find(widget => widget.id === selectedId) ?? dashboard.widgets[0];
  const resize = (axis: "w" | "h", input: HTMLInputElement) => {
    if (!selected || input.value === "" || !Number.isFinite(input.valueAsNumber)) return;
    const value = Math.min(Number(input.max) || Infinity, Math.max(Number(input.min) || 1, Math.round(input.valueAsNumber)));
    input.value = String(value);
    dashboard.commands.resizeWidget(selected.id, { w: selected.layout.w, h: selected.layout.h, [axis]: value });
  };
  return <PlaygroundPage title={text("동적 위젯 크기", "Dynamic Widget Size")}
    description={text("대상 위젯의 W/H를 직접 변경하고 적용된 크기와 제약 조건을 확인합니다.", "Set the selected widget’s W/H and inspect its applied size and constraints.")}
    code={`dashboard.commands.resizeWidget(id, { w: 5, h: 3 });\ndashboard.commands.restoreWidget(id);`}
    guideItems={[text("대상 위젯의 W/H를 입력하면 resizeWidget으로 즉시 반영합니다. W/H는 픽셀이 아닌 컬럼 수와 행 수이며, W는 1부터 현재 레이아웃의 전체 컬럼 수까지, H는 1~6까지 허용합니다.", "Enter W/H to apply resizeWidget immediately. W/H are column and row counts, not pixels; W supports 1 through the current layout column count, and H supports 1–6."), text("크기 복원은 최초 API 크기 변경 전 저장한 해당 위젯의 위치·크기를 복원합니다. 직전 작업 취소나 전체 레이아웃 초기화가 아닙니다. 다른 위젯은 충돌 처리로 이동할 수 있습니다.", "Restore size restores the selected widget’s saved position and size before its first API resize. It is not undo or a full layout reset. Collision handling may move other widgets."), text("타이틀의 이동·리사이즈 잠금은 포인터 조작을 제한합니다. resizeWidget 명령은 잠금과 무관하게 허용 범위 안에서 크기를 변경합니다.", "Title movement and resize locks restrict pointer interaction. The resizeWidget command still applies sizes within the allowed bounds.")]}
    controls={<ExampleToolbar id="widget-resize">
      <label>{text("대상 위젯", "Target widget")}<select aria-label={text("대상 위젯", "Target widget")} value={selected?.id ?? ""} disabled={!selected} onChange={event => setSelectedId(event.target.value)}>
        {dashboard.widgets.map(widget => <option key={widget.id} value={widget.id}>{widget.title}</option>)}
      </select></label>
      <label>W<input aria-label="W" type="number" min={selected?.layout.minW ?? 1} max={Math.min(selected?.layout.maxW ?? dashboard.columns, dashboard.columns)} step="1" value={selected?.layout.w ?? ""} disabled={!selected} onChange={event => resize("w", event.currentTarget)} onBlur={event => { event.currentTarget.value = String(selected?.layout.w ?? ""); }} /></label>
      <label>H<input aria-label="H" type="number" min={selected?.layout.minH ?? 1} max={selected?.layout.maxH} step="1" value={selected?.layout.h ?? ""} disabled={!selected} onChange={event => resize("h", event.currentTarget)} onBlur={event => { event.currentTarget.value = String(selected?.layout.h ?? ""); }} /></label>
      <button type="button" disabled={!selected || !dashboard.state.previousLayouts[selected.id]} onClick={() => selected && dashboard.commands.restoreWidget(selected.id)}>{text("크기 복원", "Restore size")}</button>
      <output aria-label={text("적용된 크기", "Applied size")}>{selected ? `W${selected.layout.w} / H${selected.layout.h} · W ${selected.layout.minW}–${Math.min(selected.layout.maxW ?? dashboard.columns, dashboard.columns)} / H ${selected.layout.minH}–${selected.layout.maxH}` : "—"}</output>
    </ExampleToolbar>}><ExampleDashboard dashboard={dashboard} /></PlaygroundPage>;
}

export function WidgetManagePlayground() {
  const { dashboard, addWidget, clearWidgets, reset } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();

  return (
    <PlaygroundPage
      code={`dashboard.commands.addWidget(widget);\ndashboard.commands.clearWidgets();\ndashboard.commands.resetLayout(initialState);`}
      description={text(
        "위젯을 추가하거나 모두 삭제하고, 초기 배치를 복원하는 방법을 확인합니다.",
        "Add widgets, remove them all, and restore the initial layout.",
      )}
      guideItems={[
        text("추가 버튼은 페이지가 열린 동안 번호를 계속 증가시킵니다. 번호 발급은 이 예제의 정책이며 패키지가 ID를 자동 생성하는 기능은 아닙니다.", "Add increments the number while this page is mounted. This is an example policy; the package does not automatically generate IDs."),
        text("전체 삭제는 모든 위젯을 제거합니다. 초기화는 최초 1~10번 위젯과 12컬럼 배치를 복원하지만 추가 번호 카운터는 되돌리지 않습니다.", "Clear all removes every widget. Reset restores widgets 1–10 and the initial 12-column layout without resetting the next-number counter."),
        text("모든 작업은 useDashboardGrid의 제어 상태 명령으로 처리됩니다.", "Every action is handled by controlled-state commands from useDashboardGrid."),
      ]}
      title={text("추가 / 전체 삭제 / 초기화", "Add / Clear All / Reset")}
      controls={(
        <ExampleToolbar id="widget-manage">
          <button type="button" onClick={addWidget}><Plus aria-hidden="true" size={15} />{text("추가", "Add")}</button>
          <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} />{text("초기화", "Reset")}</button>
          <button className="example-action-button--danger" type="button" onClick={clearWidgets}>
            <Trash2 aria-hidden="true" size={15} />{text("전체 삭제", "Clear all")}
          </button>
        </ExampleToolbar>
      )}
    >
      <ExampleDashboard dashboard={dashboard} />
    </PlaygroundPage>
  );
}

export function WidgetEventsPlayground() {
  const { dashboard } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();
  const [events, setEvents] = useState<string[]>([]);
  const record = (name: string) => (event: DashboardWidgetInteractionEvent) => {
    const widget = dashboard.widgets.find((candidate) => candidate.id === event.id);
    setEvents((current) => [
      ...current,
      `${name} ${JSON.stringify({ id: event.id, title: widget?.title ?? event.id, layout: event.layout })}`,
    ]);
  };

  return (
    <PlaygroundPage
      code={`<DashboardGrid\n  onBeforeMove={record("onBeforeMove")}\n  onMove={record("onMove")}\n  onAfterMove={record("onAfterMove")}\n  onBeforeResize={record("onBeforeResize")}\n  onResize={record("onResize")}\n  onAfterResize={record("onAfterResize")}\n  onBeforeTitleDoubleClick={record("onBeforeTitleDoubleClick")}\n  onTitleDoubleClick={record("onTitleDoubleClick")}\n  onAfterTitleDoubleClick={record("onAfterTitleDoubleClick")}\n/>`}
      description={text(
        "위젯 이동, 리사이즈, 타이틀 더블 클릭의 before/action/after 이벤트를 출력합니다.",
        "Logs before, action, and after events for widget moves, resizes, and title double-clicks.",
      )}
      guideItems={[
        text("이동은 onBeforeMove → onMove → onAfterMove, 크기 조절은 onBeforeResize → onResize → onAfterResize 순서로 관찰합니다. 진행 중 이벤트는 animation frame 단위로 병합됩니다.", "Observe movement through onBeforeMove → onMove → onAfterMove and resizing through onBeforeResize → onResize → onAfterResize. Active events are coalesced per animation frame."),
        text("이벤트의 layout은 그리드 단위 좌표입니다. 종료 이벤트는 필요한 레이아웃 콜백 전달 후 호출되지만 React 화면 갱신이나 비동기 작업 완료를 기다리지 않습니다. before 이벤트는 취소용 API가 아닙니다.", "Event layout values use grid units. End events run after any required layout callbacks, without waiting for React rendering or asynchronous work. Before events are notifications, not cancellation APIs."),
        text("타이틀을 더블 클릭하면 onBeforeTitleDoubleClick → onTitleDoubleClick → onAfterTitleDoubleClick을 기록합니다. 같은 행에 빈 공간이 있으면 기본 너비 확장도 실행합니다. 잠금 상태에서는 이벤트만 기록합니다.", "Double-click the title to log onBeforeTitleDoubleClick → onTitleDoubleClick → onAfterTitleDoubleClick. The default action also fills unused columns in the same row. Locked widgets only log events."),
      ]}
      referenceCaption={text("이벤트 핸들러", "Event handlers")}
      referenceNameLabel={text("이벤트명", "Event name")}
      references={[
        { name: "onBeforeMove", description: text("위젯 이동이 시작되기 직전에 호출됩니다.", "Called immediately before widget movement starts.") },
        { name: "onMove", description: text("위젯 이동 중 갱신된 layout을 전달합니다.", "Provides the updated layout while the widget moves.") },
        { name: "onAfterMove", description: text("이동 종료 시 필요한 레이아웃 콜백 전달 후 최종 좌표를 알립니다.", "Reports final coordinates after movement ends and any required layout callbacks are delivered.") },
        { name: "onBeforeResize", description: text("위젯 리사이즈가 시작되기 직전에 호출됩니다.", "Called immediately before widget resizing starts.") },
        { name: "onResize", description: text("위젯 리사이즈 중 갱신된 layout을 전달합니다.", "Provides the updated layout while the widget resizes.") },
        { name: "onAfterResize", description: text("크기 조절 종료 시 필요한 레이아웃 콜백 전달 후 최종 크기를 알립니다.", "Reports final size after resizing ends and any required layout callbacks are delivered.") },
        { name: "onBeforeTitleDoubleClick", description: text("타이틀 더블 클릭 처리 직전에 호출됩니다.", "Called immediately before title double-click handling.") },
        { name: "onTitleDoubleClick", description: text("기본 빈 공간 채우기 후 타이틀 더블 클릭을 알립니다.", "Reports a title double-click after default row-gap filling.") },
        { name: "onAfterTitleDoubleClick", description: text("더블 클릭 콜백 호출 후 실행됩니다. 세 단계 모두 클릭 시점의 좌표를 전달합니다.", "Runs after the double-click callback. All three stages receive the layout captured at click time.") },
      ]}
      title={text("이벤트", "Events")}
      controls={<ExampleEventLog label={text("위젯 이벤트", "Widget events")} value={events.join("\n")} />}
    >
      <ExampleDashboard
        dashboard={dashboard}
        onBeforeMove={record("onBeforeMove")}
        onMove={record("onMove")}
        onAfterMove={record("onAfterMove")}
        onBeforeResize={record("onBeforeResize")}
        onResize={record("onResize")}
        onAfterResize={record("onAfterResize")}
        onBeforeTitleDoubleClick={record("onBeforeTitleDoubleClick")}
        onTitleDoubleClick={record("onTitleDoubleClick")}
        onAfterTitleDoubleClick={record("onAfterTitleDoubleClick")}
      />
    </PlaygroundPage>
  );
}

function PlaygroundPage({
  children,
  code,
  controls,
  description,
  guideItems,
  referenceCaption,
  referenceNameLabel,
  references,
  title,
}: {
  children: React.ReactNode;
  code?: string;
  controls: React.ReactNode;
  description: string;
  guideItems: ReadonlyArray<string>;
  referenceCaption?: string;
  referenceNameLabel?: string;
  references?: ReadonlyArray<{ description: string; name: string }>;
  title: string;
}) {
  const { text } = usePlaygroundLocale();
  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader description={description} kicker={text("위젯", "Widget")} title={title} />
      <PlaygroundFeatureGuide
        code={code}
        items={guideItems}
        referenceCaption={referenceCaption}
        referenceNameLabel={referenceNameLabel}
        references={references}
      />
      {controls ? <PlaygroundStage kind="controls">{controls}</PlaygroundStage> : null}
      <PlaygroundStage kind="grid">
        <section aria-label={`${title} Grid`} className="playground-grid-region">{children}</section>
      </PlaygroundStage>
    </section>
  );
}
