import { useState } from "react";
import { AlignVerticalSpaceAround, Columns3, Lock, Plus, RotateCcw, Save, Trash2, Unlock, Upload } from "lucide-react";

import type { DashboardGridEngineOptions, DashboardLayoutMutationEvent, DashboardStateSnapshot } from "../../../src";
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
      description={text("컬럼 수를 1~12로 바꾸며 전체 위젯 배치가 어떻게 달라지는지 확인합니다.", "Change the column count from 1 to 12 and observe the resulting dashboard layout.")}
      guideItems={[
        text("1~12 컬럼을 선택하면 현재 제어 레이아웃이 해당 컬럼 수에 맞게 전환됩니다.", "Selecting 1–12 columns switches the current controlled layout to that column count."),
        text("이전에 사용한 컬럼 수로 돌아오면 저장된 배치를 복원합니다. x/y는 시작 컬럼·행, w/h는 차지하는 컬럼·행 수이며 픽셀 좌표가 아닙니다.", "Returning to a visited column count restores its saved layout. x/y are starting column/row positions and w/h are column/row spans, not pixels."),
      ]}
      code={`<DashboardGrid\n  columns={dashboard.columns}\n  widgets={dashboard.widgets}\n  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}\n/>`}
      controls={controls}
    />
  );
}

export function LayoutLockPlayground() {
  const controls = useNumberedDashboard();
  const [locked, setLocked] = useState(false);
  const [mode, setMode] = useState("interaction");
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
        text("잠금은 포인터 이동과 크기 조절에 적용됩니다. 추가·삭제 버튼이나 콘텐츠 입력은 별도로 제어하며, 이 예제에서는 계속 사용할 수 있습니다.", "The lock applies to pointer movement and resizing. Add/remove buttons and content inputs require separate control and remain available in this example."),
        text("잠금 방식에서 Static Grid를 선택하면 engineOptions.staticGrid로 엔진의 정적 모드를 사용합니다. 레이아웃 잠금은 movable/resizable을 제어하고, 정적 모드는 외부 위젯 드롭 수신까지 차단합니다.", "Choose Static Grid to use engineOptions.staticGrid. Interaction locking controls movable/resizable; static mode also blocks incoming external widget drops."),
        text("삭제 버튼이나 콘텐츠 입력을 막는 읽기 전용 권한은 아닙니다. 두 모드의 드래그·리사이즈 결과는 같으며, 위젯별 설정은 잠금 해제 후 다시 적용됩니다.", "Neither mode is a read-only permission for delete buttons or content inputs. Both block dragging and resizing; widget permissions apply again after unlocking."),
      ]}
      code={mode === "static" ? `<DashboardGrid engineOptions={{ staticGrid: locked }} />` : `<DashboardGrid\n  movable={!locked}\n  resizable={!locked}\n/>`}
      controls={controls}
      movable={mode === "static" || !locked}
      resizable={mode === "static" || !locked}
      engineOptions={{ staticGrid: mode === "static" && locked }}
      extraControls={(
        <>
        <label>{text("잠금 방식", "Lock mode")}
          <select aria-label={text("잠금 방식", "Lock mode")} value={mode} onChange={event => setMode(event.target.value)}>
            <option value="interaction">{text("이동·리사이즈 잠금", "Movement / resize lock")}</option>
            <option value="static">{text("정적 모드 (Static Grid)", "Static Grid")}</option>
          </select>
        </label>
        <button type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
          {locked ? <Unlock aria-hidden="true" size={15} /> : <Lock aria-hidden="true" size={15} />}
          {locked ? text("레이아웃 해제", "Unlock layout") : text("레이아웃 잠금", "Lock layout")}
        </button>
        </>
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
        text("저장 → 위젯 이동 또는 컬럼 변경 → 불러오기 순서로 확인합니다. 이 예제는 페이지 메모리에만 저장하므로 새로고침하거나 페이지를 나가면 저장본이 사라집니다.", "Save, move a widget or change columns, then load. This example stores the snapshot only in page memory; reloading or leaving the page discards it."),
        text("새로고침 후에도 유지하려면 앱에서 JSON을 저장소에 보관해야 합니다. serializeLayout은 현재 배치만, serializeState는 위젯 속성과 컬럼별 배치까지 포함합니다.", "To persist across reloads, store the JSON in your app's storage. serializeLayout captures only the active layout; serializeState includes widget properties and per-column layouts."),
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
        text("autoArrangeWidgets는 위젯 배열 순서대로 왼쪽부터 배치하고 너비가 부족하면 다음 행으로 넘깁니다. 임의의 빈 구멍을 모두 메우는 최적화 알고리즘은 아닙니다.", "autoArrangeWidgets places widgets left to right in array order and starts a new row when needed. It is not an optimization algorithm that fills every possible gap."),
        text("fitWidgetsToColumns는 시작 행 y가 같은 위젯을 묶어, 빈 컬럼 공간이 있는 행의 너비를 가능한 균등하게 재분배합니다. 위젯의 가로 위치와 너비가 바뀌며 크기 제약을 따릅니다.", "fitWidgetsToColumns groups widgets with the same starting y and redistributes widths as evenly as possible in rows with unused columns. It changes horizontal positions and widths while respecting size constraints."),
        text("위젯을 이동하거나 삭제해 빈 공간을 만든 뒤 두 명령의 결과를 비교합니다. GridStack의 compact()와는 별개의 상태 변경 명령입니다.", "Move or remove widgets to create gaps, then compare the two commands. These state commands are distinct from GridStack compact()."),
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
        "위젯 속성, 추가·삭제, 컬럼과 배치에 대한 상태 명령의 처리 결과를 출력합니다.",
        "Logs state-command results for widget properties, additions, removals, columns, and layouts.",
      )}
      guideItems={[
        text("onLayoutMutation은 useDashboardGrid의 옵션입니다. widget:add, widget:update, widget:remove, widgets:clear, layout:commit, layout:reset, layout:restore, layout:arrange, layout:fill, columns:change를 구분합니다.", "onLayoutMutation is a useDashboardGrid option. Kinds are widget:add, widget:update, widget:remove, widgets:clear, layout:commit, layout:reset, layout:restore, layout:arrange, layout:fill, and columns:change."),
        text("좌표 변경만 감지하는 이벤트가 아닙니다. 위젯의 이동 잠금을 바꿔도 widget:update가 기록됩니다. React 상태 처리 후 kind, widgetIds, columns, snapshot을 전달하며 이 화면은 앞의 세 필드를 표시합니다.", "This is not limited to coordinate changes: toggling a widget's move lock logs widget:update. After React state processing, it supplies kind, widgetIds, columns, and snapshot; this screen displays the first three fields."),
        text("타이틀 더블 클릭 자체는 기록하지 않습니다. 해당 콜백에서 상태 명령을 실행하면 그 명령의 결과는 기록됩니다. 상단 전체 잠금은 예제의 별도 상태이므로 이 로그에 포함되지 않습니다.", "A title double-click itself is not logged, but state commands run by its callback can be. The top-level lock uses separate example state and is not included in this log."),
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
  engineOptions,
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
  engineOptions?: DashboardGridEngineOptions;
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
          <ExampleDashboard dashboard={controls.dashboard} engineOptions={engineOptions} movable={movable} resizable={resizable} />
        </section>
      </PlaygroundStage>
    </section>
  );
}
