import { useState } from "react";
import { Lock, Move, Settings2 } from "lucide-react";

import { useDashboardGrid } from "../../../src";
import { Select } from "../components/ui/select";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import { createWidgetPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

export function WidgetPlayground() {
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: createWidgetPlaygroundFixture(),
  });
  const [selectedId, setSelectedId] = useState("sales");
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedId) ?? dashboard.widgets[0];
  const selectedValue = selectedWidget?.id ?? "";
  const moveLocked = selectedWidget?.locked === true || selectedWidget?.movable === false;
  const resizeLocked = selectedWidget?.locked === true || selectedWidget?.resizable === false;
  const fullyLocked = selectedWidget?.locked === true;
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: widget.title ?? widget.id,
    value: widget.id,
  }));

  const toggleMoveLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      locked: false,
      movable: selectedWidget.movable === false,
    });
  };

  const toggleResizeLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      locked: false,
      resizable: selectedWidget.resizable === false,
    });
  };

  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader kicker="위젯 예제" title="위젯" />
      <section aria-label="위젯 예제 컨트롤" className="playground-controls">
        <WidgetCrudControls dashboard={dashboard} mode="widget" onAfterAdd={setSelectedId} />
        <div className="example-actions" aria-label="widget interaction actions">
          <Select id="widget-select" label="위젯 선택" options={widgetOptions} value={selectedValue} onChange={setSelectedId} />
          <button className="example-toggle-button" type="button" onClick={toggleMoveLock} {...toggleStateProps(moveLocked)}>
            <Move aria-hidden="true" size={14} />
            이동 잠금
          </button>
          <button className="example-toggle-button" type="button" onClick={toggleResizeLock} {...toggleStateProps(resizeLocked)}>
            <Settings2 aria-hidden="true" size={14} />
            리사이즈 잠금
          </button>
          <button
            className="example-toggle-button"
            type="button"
            onClick={() =>
              selectedWidget
                ? dashboard.commands.updateWidget(selectedWidget.id, { locked: !selectedWidget.locked })
                : undefined
            }
            {...toggleStateProps(fullyLocked)}
          >
            <Lock aria-hidden="true" size={14} />
            전체 잠금
          </button>
        </div>
      </section>
      <section aria-label="위젯 dashboard" className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} />
      </section>
    </section>
  );
}
