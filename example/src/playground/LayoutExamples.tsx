import { useState } from "react";
import { AlignVerticalSpaceAround, Columns3, Lock, Plus, RotateCcw, Save, Trash2, Unlock, Upload } from "lucide-react";

import type { DashboardLayoutMutationEvent, DashboardStateSnapshot } from "../../../src";
import { ExampleDashboard } from "./components/ExampleDashboard";
import { ExampleEventLog } from "./components/ExampleEventLog";
import { PlaygroundFeatureGuide, PlaygroundStage } from "./components/ExampleGuide";
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
      guideItems={[
        text("1~12 컬럼을 선택하면 현재 제어 레이아웃이 해당 컬럼 수에 맞게 전환됩니다.", "Selecting 1–12 columns switches the current controlled layout to that column count."),
        text("추가·초기화·전체 삭제는 위젯 상태와 컬럼별 레이아웃 캐시를 함께 관리합니다.", "Add, reset, and clear all manage widget state together with per-column layout caches."),
      ]}
      code={`<DashboardGrid\n  columns={dashboard.columns}\n  widgets={dashboard.widgets}\n  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}\n/>`}
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
      guideItems={[
        text("movable과 resizable을 동시에 false로 전달해 전체 레이아웃 상호작용을 잠급니다.", "Passing false to both movable and resizable locks layout-wide interactions."),
        text("위젯별 movable/resizable 값은 유지되므로 전체 잠금을 해제하면 기존 위젯 설정이 다시 적용됩니다.", "Per-widget movable/resizable values are preserved and apply again after unlocking."),
      ]}
      code={`<DashboardGrid\n  movable={!locked}\n  resizable={!locked}\n/>`}
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
      guideItems={[
        text("serializeState는 위젯 속성, 현재 컬럼, 복원 위치, 컬럼별 레이아웃 캐시를 저장합니다.", "serializeState stores widget properties, active columns, restore positions, and per-column layout caches."),
        text("restoreLayout은 저장한 전체 상태를 한 번의 제어 상태 명령으로 복구합니다.", "restoreLayout restores the saved full state through one controlled-state command."),
      ]}
      code={`const saved = dashboard.commands.serializeState();\ndashboard.commands.restoreLayout(saved);`}
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
      guideItems={[
        text("autoArrangeWidgets는 패키지 정렬 순서에 따라 위젯을 압축 배치합니다.", "autoArrangeWidgets compacts widgets in package-defined order."),
        text("fitWidgetsToColumns는 현재 행의 빈 공간을 사용하도록 위젯 너비와 위치를 조정합니다.", "fitWidgetsToColumns adjusts widget widths and positions to use row gaps."),
      ]}
      code={`dashboard.commands.autoArrangeWidgets();\ndashboard.commands.fitWidgetsToColumns();`}
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
      guideItems={[
        text("onLayoutMutation은 add, update, remove, columns, arrange와 같은 의미 단위 변경을 전달합니다.", "onLayoutMutation emits semantic changes such as add, update, remove, columns, and arrange."),
        text("타이틀 더블 클릭 같은 위젯 내부 이벤트는 레이아웃 변경 이벤트에 포함되지 않습니다.", "Widget-internal events such as title double-click are not included in layout mutations."),
      ]}
      code={`useDashboardGrid({\n  onLayoutMutation: (event) => {\n    console.log(event.kind, event.widgetIds, event.columns);\n  },\n});`}
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
  code,
  controls,
  description,
  extraControls,
  guideItems,
  movable = true,
  resizable = true,
  title,
}: {
  belowToolbar?: React.ReactNode;
  code?: string;
  controls: NumberedControls;
  description: string;
  extraControls?: React.ReactNode;
  guideItems: ReadonlyArray<string>;
  movable?: boolean;
  resizable?: boolean;
  title: string;
}) {
  const { text } = usePlaygroundLocale();
  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader description={description} kicker={text("레이아웃", "Layout")} title={title} />
      <PlaygroundFeatureGuide code={code} items={guideItems} />
      <PlaygroundStage kind="controls">
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
      </PlaygroundStage>
      <PlaygroundStage kind="grid">
        <section aria-label={`${title} Grid`} className="playground-grid-region">
          <ExampleDashboard dashboard={controls.dashboard} movable={movable} resizable={resizable} />
        </section>
      </PlaygroundStage>
    </section>
  );
}
