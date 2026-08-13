import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { createPresentedWidgets, layoutLockCopy, widgetPlaygroundCopy } from "./copy";
import { createLayoutPlaygroundFixture } from "./fixtures";
import { pastelColor } from "./palette";
import type { ExampleWidgetData } from "./types";

export function LayoutLockPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const [locked, setLocked] = useState(false);
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const widgets = useMemo(
    () => createPresentedWidgets(dashboard.widgets, locale, true),
    [dashboard.widgets, locale],
  );

  return (
    <section className="playground-workspace" data-example-mode="layout-lock">
      <PlaygroundHeader
        description={text(layoutLockCopy.description)}
        kicker={text(layoutLockCopy.kicker)}
        title={text(layoutLockCopy.title)}
      />
      <section aria-label={text(layoutLockCopy.controls)} className="playground-controls">
        <button
          {...toggleStateProps(locked)}
          className="example-toggle-button"
          type="button"
          onClick={() => setLocked((value) => !value)}
        >
          {text(locked ? layoutLockCopy.unlockLayout : layoutLockCopy.lockLayout)}
        </button>
      </section>
      <section aria-label={text(layoutLockCopy.dashboard)} className="playground-grid-region">
        <DashboardGrid
          className={`playground-layout-lock-grid${locked ? " playground-layout-lock-grid--locked" : ""}`}
          columns={dashboard.columns}
          editable={!locked}
          movable={!locked}
          resizable={!locked}
          widgets={widgets}
          onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
          renderWidgetActions={(widget) => {
            const title = widget.title ?? widget.id;
            return (
              <button
                aria-label={`${title} ${text(widgetPlaygroundCopy.actions.delete)}`}
                className="comins-grid-layout-widget__action--danger"
                disabled={locked}
                type="button"
                onClick={() => dashboard.commands.removeWidget(widget.id)}
              >
                <Trash2 aria-hidden="true" size={14} />
                <span>{text(widgetPlaygroundCopy.actions.delete)}</span>
              </button>
            );
          }}
          renderWidget={(widget) => {
            const colors = pastelColor(widget.data?.colorKey ?? "mint");
            return (
              <div className="dashboard-widget-body" style={{ background: colors.background, color: colors.foreground }}>
                <span>{widget.data?.description}</span>
                <strong>{widget.data?.value}</strong>
              </div>
            );
          }}
        />
      </section>
    </section>
  );
}
