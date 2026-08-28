import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";

import type { DashboardWidgetInteractionEvent } from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { ExampleEventLog } from "./components/ExampleEventLog";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { PlaygroundHeader } from "./components/DashboardPreview";
import { usePlaygroundLocale } from "./locale";
import { useNumberedDashboard } from "./use-numbered-dashboard";

export function WidgetBasicPlayground() {
  const { dashboard } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();

  return (
    <PlaygroundPage
      description={text("GridStack Layout에 10개의 기본 위젯만 배치합니다.", "Places ten basic widgets in a GridStack layout.")}
      title="Basic"
    >
      <section aria-label={text("위젯 Basic Grid", "Widget Basic Grid")} className="playground-grid-region">
        <ExampleDashboard dashboard={dashboard} />
      </section>
    </PlaygroundPage>
  );
}

export function WidgetManagePlayground() {
  const { dashboard, addWidget, clearWidgets, reset } = useNumberedDashboard();
  const { text } = usePlaygroundLocale();

  return (
    <PlaygroundPage
      description={text(
        "위젯 번호를 재사용하지 않고 추가·전체 삭제·초기화합니다.",
        "Adds, clears, and resets widgets without reusing widget numbers.",
      )}
      title={text("추가 / 전체 삭제 / 초기화", "Add / Clear All / Reset")}
    >
      <ExampleToolbar id="widget-manage">
        <button type="button" onClick={addWidget}><Plus aria-hidden="true" size={15} />{text("추가", "Add")}</button>
        <button type="button" onClick={reset}><RotateCcw aria-hidden="true" size={15} />{text("초기화", "Reset")}</button>
        <button className="example-action-button--danger" type="button" onClick={clearWidgets}>
          <Trash2 aria-hidden="true" size={15} />{text("전체 삭제", "Clear all")}
        </button>
      </ExampleToolbar>
      <section aria-label={text("위젯 관리 Grid", "Widget Management Grid")} className="playground-grid-region">
        <ExampleDashboard dashboard={dashboard} />
      </section>
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
      description={text(
        "위젯 이동, 리사이즈, 타이틀 더블 클릭의 before/action/after 이벤트를 출력합니다.",
        "Logs before, action, and after events for widget moves, resizes, and title double-clicks.",
      )}
      title={text("이벤트", "Events")}
    >
      <ExampleEventLog label={text("위젯 이벤트", "Widget events")} value={events.join("\n")} />
      <section aria-label={text("위젯 이벤트 Grid", "Widget Events Grid")} className="playground-grid-region">
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
      </section>
    </PlaygroundPage>
  );
}

function PlaygroundPage({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  const { text } = usePlaygroundLocale();
  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader description={description} kicker={text("위젯", "Widget")} title={title} />
      {children}
    </section>
  );
}
