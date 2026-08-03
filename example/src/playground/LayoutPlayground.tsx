import { useState } from "react";
import { Columns3, Lock, RotateCcw, Save, Unlock } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import type { DashboardStateSnapshot } from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { createLayoutPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

export function LayoutPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState("저장된 레이아웃이 없습니다.");
  const [locked, setLocked] = useState(false);

  const saveLayout = () => {
    setLayoutJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setLayoutStatus("저장 완료");
  };

  const restoreLayout = () => {
    try {
      const parsed = JSON.parse(layoutJson) as DashboardStateSnapshot<ExampleWidgetData>;
      dashboard.commands.restoreLayout(parsed);
      setLayoutStatus("복원 완료");
    } catch {
      setLayoutStatus("JSON 형식을 확인해 주세요.");
    }
  };

  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader kicker="레이아웃 예제" title="레이아웃" />
      <section aria-label="레이아웃 예제 컨트롤" className="playground-controls">
        <div className="example-actions" aria-label="layout actions">
          <Select
            id="layout-columns"
            label="컬럼 선택"
            options={columnOptions}
            value={String(dashboard.columns)}
            onChange={(value) => dashboard.commands.setColumns(Number(value))}
          />
          <button type="button" onClick={() => dashboard.commands.fitWidgetsToColumns()}>
            <Columns3 aria-hidden="true" size={14} />
            빈 공간 채우기
          </button>
          <button className="example-toggle-button" type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
            {locked ? <Unlock aria-hidden="true" size={14} /> : <Lock aria-hidden="true" size={14} />}
            {locked ? "레이아웃 잠금" : "레이아웃 해제"}
          </button>
          <button type="button" onClick={saveLayout}>
            <Save aria-hidden="true" size={14} />
            레이아웃 저장
          </button>
          <button type="button" onClick={restoreLayout}>
            <RotateCcw aria-hidden="true" size={14} />
            레이아웃 복원
          </button>
        </div>
        <LayoutJson id="layout-json" status={layoutStatus} value={layoutJson} onChange={setLayoutJson} />
      </section>
      <section aria-label="레이아웃 dashboard" className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} movable={!locked} resizable={!locked} />
      </section>
    </section>
  );
}
