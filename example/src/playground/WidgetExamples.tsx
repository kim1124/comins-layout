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
      code={`const dashboard = useDashboardGrid({\n  initialColumns: 12,\n  initialWidgets: createNumberedPlaygroundFixture(),\n});`}
      description={text("GridStack Layout에 10개의 기본 위젯만 배치합니다.", "Places ten basic widgets in a GridStack layout.")}
      guideItems={[
        text("10개 위젯을 12컬럼 Grid에 기본 W3, H2로 배치합니다.", "Places ten widgets in a 12-column grid with default W3 and H2 geometry."),
        text("각 위젯 표에서 번호, 현재 W/H, 이동 및 리사이즈 가능 여부를 확인합니다.", "Each widget table shows its number, current W/H, and move/resize availability."),
        text("타이틀 버튼은 해당 위젯의 이동·리사이즈 허용 여부만 독립적으로 전환합니다.", "Title actions toggle movement and resizing for that widget independently."),
      ]}
      title="Basic"
      controls={<p className="playground-control-note">{text("별도 상단 컨트롤은 없으며 각 위젯 타이틀의 이동·리사이즈·삭제 버튼을 사용합니다.", "There are no separate top controls; use each widget title's move, resize, and remove actions.")}</p>}
    >
      <ExampleDashboard dashboard={dashboard} />
    </PlaygroundPage>
  );
}

export function WidgetManagePlayground() {
  const { dashboard, addWidget, clearWidgets, reset } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();

  return (
    <PlaygroundPage
      code={`dashboard.commands.addWidget(widget);\ndashboard.commands.clearWidgets();\ndashboard.commands.resetLayout(initialState);`}
      description={text(
        "위젯 번호를 재사용하지 않고 추가·전체 삭제·초기화합니다.",
        "Adds, clears, and resets widgets without reusing widget numbers.",
      )}
      guideItems={[
        text("추가는 마지막으로 발급한 번호 다음 값을 사용해 삭제된 번호를 재사용하지 않습니다.", "Add uses the next issued number and never reuses a deleted number."),
        text("전체 삭제는 모든 위젯을 제거하고, 초기화는 최초 10개 W3/H2 위젯을 복원합니다.", "Clear all removes every widget; reset restores the initial ten W3/H2 widgets."),
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
      code={`<DashboardGrid\n  onBeforeMove={record("onBeforeMove")}\n  onMove={record("onMove")}\n  onAfterMove={record("onAfterMove")}\n  onBeforeResize={record("onBeforeResize")}\n  onResize={record("onResize")}\n  onAfterResize={record("onAfterResize")}\n  onBeforeTitleDoubleClick={record("onBeforeTitleDoubleClick")}\n  onTitleDoubleClick={record("onDblClickTitle")}\n  onAfterTitleDoubleClick={record("onAfterTitleDoubleClick")}\n/>`}
      description={text(
        "위젯 이동, 리사이즈, 타이틀 더블 클릭의 before/action/after 이벤트를 출력합니다.",
        "Logs before, action, and after events for widget moves, resizes, and title double-clicks.",
      )}
      guideItems={[
        text("이동 이벤트는 onBeforeMove → onMove → onAfterMove 순서로 발생합니다.", "Move events fire in the order onBeforeMove → onMove → onAfterMove."),
        text("리사이즈 이벤트는 onBeforeResize → onResize → onAfterResize 순서로 발생합니다.", "Resize events fire in the order onBeforeResize → onResize → onAfterResize."),
        text("예제 이벤트명 onDblClickTitle은 실제 DashboardGrid의 onTitleDoubleClick prop에서 수신하며 레이아웃 이벤트와 구분됩니다.", "The example event name onDblClickTitle is received from the actual DashboardGrid onTitleDoubleClick prop and remains distinct from layout events."),
      ]}
      referenceCaption={text("이벤트 핸들러", "Event handlers")}
      referenceNameLabel={text("이벤트명", "Event name")}
      references={[
        { name: "onBeforeMove", description: text("위젯 이동이 시작되기 직전에 호출됩니다.", "Called immediately before widget movement starts.") },
        { name: "onMove", description: text("위젯 이동 중 갱신된 layout을 전달합니다.", "Provides the updated layout while the widget moves.") },
        { name: "onAfterMove", description: text("위젯 이동과 제어 상태 커밋이 끝난 후 호출됩니다.", "Called after movement and controlled-state commit finish.") },
        { name: "onBeforeResize", description: text("위젯 리사이즈가 시작되기 직전에 호출됩니다.", "Called immediately before widget resizing starts.") },
        { name: "onResize", description: text("위젯 리사이즈 중 갱신된 layout을 전달합니다.", "Provides the updated layout while the widget resizes.") },
        { name: "onAfterResize", description: text("위젯 리사이즈와 제어 상태 커밋이 끝난 후 호출됩니다.", "Called after resizing and controlled-state commit finish.") },
        { name: "onBeforeTitleDoubleClick", description: text("타이틀 더블 클릭 처리 직전에 호출됩니다.", "Called immediately before title double-click handling.") },
        { name: "onDblClickTitle", description: text("예제 이벤트명입니다. 실제 public prop은 onTitleDoubleClick입니다.", "Example event name. The actual public prop is onTitleDoubleClick.") },
        { name: "onAfterTitleDoubleClick", description: text("타이틀 더블 클릭 처리가 끝난 후 호출됩니다.", "Called after title double-click handling finishes.") },
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
        onTitleDoubleClick={record("onDblClickTitle")}
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
      <PlaygroundStage kind="controls">{controls}</PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section aria-label={`${title} Grid`} className="playground-grid-region">{children}</section>
      </PlaygroundStage>
    </section>
  );
}
