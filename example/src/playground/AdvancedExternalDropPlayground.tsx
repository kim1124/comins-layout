import { useCallback, useMemo, useState } from "react";

import {
  DashboardGrid,
  useDashboardGrid,
} from "../../../src";
import type {
  DashboardExternalDropTarget,
  DashboardWidgetExternalDropEvent,
} from "../../../src";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader } from "./components/DashboardPreview";
import {
  advancedExternalDropCopy,
  createPresentedWidgets,
  resolveDashboardActionLabels,
  sharedPlaygroundCopy,
} from "./copy";
import { createWidgetPlaygroundFixture } from "./fixtures";
import { pastelColor } from "./palette";
import type { ExampleWidgetData } from "./types";

type ExternalDropEventEntry = {
  columns: number;
  h: number;
  name: "onWidgetExternalDrop";
  targetId: string;
  w: number;
  widgetId: string;
  x: number;
  y: number;
};

const eventLimit = 10;
const externalDropTargets: DashboardExternalDropTarget[] = [
  { id: "trash", selector: "[data-dashboard-drop-target='trash']" },
];

function appendBoundedEvent(
  entries: ExternalDropEventEntry[],
  entry: ExternalDropEventEntry,
): ExternalDropEventEntry[] {
  const numericValues = [entry.columns, entry.h, entry.w, entry.x, entry.y];
  if (!entry.targetId || !entry.widgetId || !numericValues.every(Number.isFinite)) {
    return entries;
  }

  return [...entries, { ...entry }].slice(-eventLimit);
}

function formatEvent(entry: ExternalDropEventEntry) {
  return `${entry.name} target=${entry.targetId} widget=${entry.widgetId} columns=${entry.columns} x=${entry.x} y=${entry.y} w=${entry.w} h=${entry.h}`;
}

export function AdvancedExternalDropPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createWidgetPlaygroundFixture(),
  });
  const [events, setEvents] = useState<ExternalDropEventEntry[]>([]);
  const widgets = useMemo(
    () => createPresentedWidgets(dashboard.widgets, locale, true),
    [dashboard.widgets, locale],
  );
  const handleWidgetExternalDrop = useCallback((event: DashboardWidgetExternalDropEvent) => {
    if (event.targetId !== "trash") return;
    setEvents((current) => appendBoundedEvent(current, {
      name: "onWidgetExternalDrop",
      targetId: event.targetId,
      widgetId: event.widgetId,
      columns: event.columns,
      ...event.layout,
    }));
    dashboard.commands.removeWidget(event.widgetId);
  }, [dashboard.commands]);

  return (
    <section className="playground-workspace" data-example-mode="advanced-external-drop">
      <PlaygroundHeader
        description={text(advancedExternalDropCopy.description)}
        kicker={text(advancedExternalDropCopy.kicker)}
        title={text(advancedExternalDropCopy.title)}
      />
      <div className="playground-external-drop-layout">
        <section aria-label={text(advancedExternalDropCopy.controls)} className="playground-controls playground-external-drop-controls">
          <div className="example-external-drop">
            <div
              aria-label={text(advancedExternalDropCopy.target.label)}
              className="example-external-drop__target"
              data-dashboard-drop-target="trash"
            >
              <strong>{text(advancedExternalDropCopy.target.title)}</strong>
              <span>{text(advancedExternalDropCopy.target.description)}</span>
            </div>
            <div className="playground-external-drop-guidance">
              {advancedExternalDropCopy.guidance.map((message) => <p key={message.ko}>{text(message)}</p>)}
            </div>
            <div aria-label={text(advancedExternalDropCopy.log)} aria-live="polite" className="playground-event-log" role="log">
              {events.length === 0 ? (
                <p>{text(advancedExternalDropCopy.empty)}</p>
              ) : (
                <ol>
                  {events.map((entry, index) => (
                    <li data-event-name={entry.name} key={`${index}-${formatEvent(entry)}`}>
                      <code>{formatEvent(entry)}</code>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
        <section aria-label={text(advancedExternalDropCopy.dashboard)} className="playground-grid-region">
          <p className="example-widget-count">
            {text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}
          </p>
          <DashboardGrid
            actionLabels={resolveDashboardActionLabels(locale)}
            columns={dashboard.columns}
            externalDropTargets={externalDropTargets}
            showControls={false}
            widgets={widgets}
            onWidgetExternalDrop={handleWidgetExternalDrop}
            onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
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
      </div>
    </section>
  );
}
