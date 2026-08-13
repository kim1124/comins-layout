import { useCallback, useMemo, useState } from "react";

import {
  DASHBOARD_COLUMN_COUNTS,
  DashboardGrid,
  useDashboardGrid,
} from "../../../src";
import type {
  DashboardWidgetInteractionEvent,
  DashboardWidgetResizeFrameEvent,
} from "../../../src";
import { Select } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader } from "./components/DashboardPreview";
import {
  advancedEventsCopy,
  createPresentedWidgets,
  resolveDashboardActionLabels,
  sharedPlaygroundCopy,
} from "./copy";
import { appendBoundedEvent, type PlaygroundEventEntry } from "./event-log";
import { createLayoutPlaygroundFixture } from "./fixtures";
import { pastelColor } from "./palette";
import type { ExampleWidgetData } from "./types";

type InteractionEventName = Extract<
  PlaygroundEventEntry["name"],
  "onWidgetDragStart" | "onWidgetDragStop" | "onWidgetResizeStart" | "onWidgetResizeStop"
>;

function formatEvent(entry: PlaygroundEventEntry) {
  switch (entry.name) {
    case "onColumnsChange":
    case "onLayoutCommit":
      return `${entry.name} columns=${entry.columns}`;
    case "onWidgetResizeFrame":
      return `${entry.name} id=${entry.id} width=${Math.round(entry.width)} height=${Math.round(entry.height)}`;
    case "onWidgetDragStart":
    case "onWidgetDragStop":
    case "onWidgetResizeStart":
    case "onWidgetResizeStop":
      return `${entry.name} id=${entry.id} x=${entry.x} y=${entry.y} w=${entry.w} h=${entry.h}`;
  }
}

export function AdvancedEventsPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [events, setEvents] = useState<PlaygroundEventEntry[]>([]);
  const widgets = useMemo(
    () => createPresentedWidgets(dashboard.widgets, locale),
    [dashboard.widgets, locale],
  );
  const record = useCallback((entry: PlaygroundEventEntry) => {
    setEvents((current) => appendBoundedEvent(current, entry));
  }, []);
  const recordInteraction = useCallback((name: InteractionEventName, event: DashboardWidgetInteractionEvent) => {
    const { h, w, x, y } = event.layout;
    record({ name, id: event.id, x, y, w, h });
  }, [record]);
  const recordResizeFrame = useCallback((event: DashboardWidgetResizeFrameEvent) => {
    record({ name: "onWidgetResizeFrame", id: event.id, width: event.width, height: event.height });
  }, [record]);

  return (
    <section className="playground-workspace" data-example-mode="advanced-events">
      <PlaygroundHeader
        description={text(advancedEventsCopy.description)}
        kicker={text(advancedEventsCopy.kicker)}
        title={text(advancedEventsCopy.title)}
      />
      <section aria-label={text(advancedEventsCopy.controls)} className="playground-controls playground-event-controls">
        <Select
          id="advanced-events-columns"
          label={text(advancedEventsCopy.columns)}
          options={DASHBOARD_COLUMN_COUNTS.map((columns) => ({ label: String(columns), value: String(columns) }))}
          value={String(dashboard.columns)}
          onChange={(value) => dashboard.commands.setColumns(Number(value))}
        />
        <div aria-label={text(advancedEventsCopy.log)} aria-live="polite" className="playground-event-log" role="log">
          {events.length === 0 ? (
            <p>{text(advancedEventsCopy.empty)}</p>
          ) : (
            <ol>
              {events.map((entry, index) => (
                <li data-event-name={entry.name} key={`${index}-${entry.name}-${formatEvent(entry)}`}>
                  <code>{formatEvent(entry)}</code>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
      <section aria-label={text(advancedEventsCopy.dashboard)} className="playground-grid-region">
        <p className="example-widget-count">
          {text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}
        </p>
        <DashboardGrid
          actionLabels={resolveDashboardActionLabels(locale)}
          columns={dashboard.columns}
          showControls={false}
          widgets={widgets}
          onColumnsChange={(columns) => {
            dashboard.commands.setColumns(columns);
            record({ name: "onColumnsChange", columns });
          }}
          onLayoutCommit={(snapshot) => {
            dashboard.commands.applyLayoutSnapshot(snapshot);
            record({ name: "onLayoutCommit", columns: snapshot.columns });
          }}
          onWidgetDragStart={(event) => recordInteraction("onWidgetDragStart", event)}
          onWidgetDragStop={(event) => recordInteraction("onWidgetDragStop", event)}
          onWidgetResizeFrame={recordResizeFrame}
          onWidgetResizeStart={(event) => recordInteraction("onWidgetResizeStart", event)}
          onWidgetResizeStop={(event) => recordInteraction("onWidgetResizeStop", event)}
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
