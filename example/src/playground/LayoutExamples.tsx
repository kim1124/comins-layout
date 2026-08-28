import { useState } from "react";
import { AlignVerticalSpaceAround, Columns3, Lock, Plus, RotateCcw, Save, Trash2, Unlock, Upload } from "lucide-react";

import type { DashboardLayoutMutationEvent, DashboardStateSnapshot } from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { ExampleEventLog } from "./components/ExampleEventLog";
import { ExampleToolbar } from "./components/ExampleToolbar";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { usePlaygroundLocale } from "./locale";
import type { ExampleWidgetData } from "./types";
import { useNumberedDashboard } from "./use-numbered-dashboard";

export function LayoutBasicPlayground() {
  const controls = useNumberedDashboard();
  const { text } = usePlaygroundLocale();
  return (
    <LayoutPage
      title="Basic"
      description={text("위젯 관리 기능과 1~12 컬럼 설정을 제공합니다.", "Provides widget management and a 1–12 column setting.")}
      controls={controls}
    />
  );
}

export function LayoutLockPlayground() {
  const controls = useNumberedDashboard();
  const [locked, setLocked] = useState(false);
  const { text } = usePlaygroundLocale();
  return (
    <LayoutPage
      title={text("레이아웃 잠금 / 해제", "Lock / Unlock Layout")}
      description={text(
        "전체 레이아웃의 이동과 리사이즈를 함께 잠그거나 해제합니다.",
        "Locks or unlocks movement and resizing for the entire layout.",
      )}
      controls={controls}
      movable={!locked}
      resizable={!locked}
      extraControls={(
        <button type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
          {locked ? <Unlock aria-hidden="true" size={15} /> : <Lock aria-hidden="true" size={15} />}
          {locked ? text("레이아웃 해제", "Unlock layout") : text("레이아웃 잠금", "Lock layout")}
        </button>
      )}
    />
  );
}

export function LayoutPersistencePlayground() {
  const controls = useNumberedDashboard();
  const [saved, setSaved] = useState<DashboardStateSnapshot<ExampleWidgetData> | null>(null);
  const [json, setJson] = useState("");
  const { text } = usePlaygroundLocale();
  const save = () => {
    const snapshot = controls.dashboard.commands.serializeState();
    setSaved(structuredClone(snapshot));
    setJson(JSON.stringify(snapshot, null, 2));
  };
  const load = () => {
    if (saved) {
      controls.dashboard.commands.restoreLayout(structuredClone(saved));
    }
  };
  return (
    <LayoutPage
      title={text("레이아웃 저장 / 불러오기", "Save / Load Layout")}
      description={text(
        "마지막 전체 상태를 메모리에 저장하고 위젯 속성과 컬럼 캐시까지 복구합니다.",
        "Stores the latest full state in memory and restores widget properties and the column cache.",
      )}
      controls={controls}
      extraControls={(
        <>
          <button type="button" onClick={save}><Save aria-hidden="true" size={15} />{text("레이아웃 저장", "Save layout")}</button>
          <button disabled={!saved} type="button" onClick={load}><Upload aria-hidden="true" size={15} />{text("레이아웃 불러오기", "Load layout")}</button>
        </>
      )}
      belowToolbar={<ExampleEventLog label={text("마지막 저장 레이아웃 JSON", "Last saved layout JSON")} value={json} />}
    />
  );
}

export function LayoutArrangePlayground() {
  const controls = useNumberedDashboard();
  const { text } = usePlaygroundLocale();
  return (
    <LayoutPage
      title={text("자동 정렬 / 빈 공간 채우기", "Auto Arrange / Fill Gaps")}
      description={text(
        "제어 상태 명령으로 위젯을 자동 정렬하고 행의 빈 공간을 채웁니다.",
        "Uses controlled-state commands to auto-arrange widgets and fill row gaps.",
      )}
      controls={controls}
      extraControls={(
        <>
          <button type="button" onClick={controls.dashboard.commands.autoArrangeWidgets}>
            <AlignVerticalSpaceAround aria-hidden="true" size={15} />{text("자동 정렬", "Auto arrange")}
          </button>
          <button type="button" onClick={controls.dashboard.commands.fitWidgetsToColumns}>
            <Columns3 aria-hidden="true" size={15} />{text("빈 공간 채우기", "Fill gaps")}
          </button>
        </>
      )}
    />
  );
}

export function LayoutEventsPlayground() {
  const [events, setEvents] = useState<string[]>([]);
  const { text } = usePlaygroundLocale();
  const record = (event: DashboardLayoutMutationEvent<ExampleWidgetData>) => {
    setEvents((current) => [
      ...current,
      `${event.kind} ${JSON.stringify({ widgetIds: event.widgetIds, columns: event.columns })}`,
    ]);
  };
  const controls = useNumberedDashboard(record);
  const [locked, setLocked] = useState(false);
  return (
    <LayoutPage
      title={text("레이아웃 이벤트", "Layout Events")}
      description={text(
        "추가, 수정, 삭제, 컬럼 및 배치 변경처럼 레이아웃에 직접 영향을 주는 이벤트만 출력합니다.",
        "Logs only events that directly affect the layout, such as add, update, remove, column, and placement changes.",
      )}
      controls={controls}
      movable={!locked}
      resizable={!locked}
      extraControls={(
        <button type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
          {locked ? <Unlock aria-hidden="true" size={15} /> : <Lock aria-hidden="true" size={15} />}
          {locked ? text("레이아웃 해제", "Unlock layout") : text("레이아웃 잠금", "Lock layout")}
        </button>
      )}
      belowToolbar={<ExampleEventLog label={text("레이아웃 이벤트", "Layout events")} value={events.join("\n")} />}
    />
  );
}

type NumberedControls = ReturnType<typeof useNumberedDashboard>;

function LayoutPage({
  belowToolbar,
  controls,
  description,
  extraControls,
  movable = true,
  resizable = true,
  title,
}: {
  belowToolbar?: React.ReactNode;
  controls: NumberedControls;
  description: string;
  extraControls?: React.ReactNode;
  movable?: boolean;
  resizable?: boolean;
  title: string;
}) {
  const { text } = usePlaygroundLocale();
  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader description={description} kicker={text("레이아웃", "Layout")} title={title} />
      <ExampleToolbar
        columns={controls.dashboard.columns}
        id={`layout-${title.replaceAll(" ", "-")}`}
        onColumnsChange={controls.dashboard.commands.setColumns}
      >
        <button type="button" onClick={controls.addWidget}><Plus aria-hidden="true" size={15} />{text("추가", "Add")}</button>
        <button type="button" onClick={controls.reset}><RotateCcw aria-hidden="true" size={15} />{text("초기화", "Reset")}</button>
        <button className="example-action-button--danger" type="button" onClick={controls.clearWidgets}>
          <Trash2 aria-hidden="true" size={15} />{text("전체 삭제", "Clear all")}
        </button>
        {extraControls}
      </ExampleToolbar>
      {belowToolbar}
      <section aria-label={`${title} Grid`} className="playground-grid-region">
        <ExampleDashboard dashboard={controls.dashboard} movable={movable} resizable={resizable} />
      </section>
    </section>
  );
}
