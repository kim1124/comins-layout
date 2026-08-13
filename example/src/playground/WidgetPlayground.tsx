import { useRef, useState } from "react";
import { Lock, Move, Settings2 } from "lucide-react";

import { useDashboardGrid } from "../../../src";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import type { EditedWidgetDraft, NewWidgetDraft } from "./components/WidgetCrudControls";
import { formatWidgetStatus, toWidgetStatusTitle, widgetPlaygroundCopy } from "./copy";
import { createWidgetPlaygroundFixture } from "./fixtures";
import { createWidget } from "./fixtures";
import type { ExampleWidgetData } from "./types";
import type { WidgetStatus } from "./copy";

export function WidgetPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: createWidgetPlaygroundFixture(),
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | undefined>("sales");
  const [status, setStatus] = useState<WidgetStatus>(() => {
    const selectedWidget = dashboard.widgets.find((widget) => widget.id === "sales");
    return selectedWidget ? { type: "selected", title: toWidgetStatusTitle(selectedWidget) } : { type: "empty" };
  });
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedWidgetId);
  const moveLocked = selectedWidget?.locked === true || selectedWidget?.movable === false;
  const resizeLocked = selectedWidget?.locked === true || selectedWidget?.resizable === false;
  const fullyLocked = selectedWidget?.locked === true;

  const selectWidget = (id: string | undefined) => {
    setSelectedWidgetId(id);
    const widget = dashboard.widgets.find((candidate) => candidate.id === id);
    setStatus(widget ? { type: "selected", title: toWidgetStatusTitle(widget) } : { type: "empty" });
  };

  const addWidget = (draft: NewWidgetDraft) => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    const id = `widget-${number}`;
    dashboard.commands.addWidget(
      createWidget(id, draft.title, 0, 0, draft.width, draft.height, {
        description: "새 대시보드 위젯",
        generatedDescriptionKey: "newWidget",
        value: draft.value,
      }),
    );
    setSelectedWidgetId(id);
    setStatus({ type: "added", title: { kind: "literal", value: draft.title } });
  };

  const editWidget = (draft: EditedWidgetDraft) => {
    if (!selectedWidget) {
      return;
    }

    const generatedDescriptionKey = selectedWidget.data?.fixtureCopyKey
      ? "editedWidget"
      : selectedWidget.data?.generatedDescriptionKey;

    dashboard.commands.updateWidget(selectedWidget.id, {
      data: {
        ...selectedWidget.data,
        colorKey: selectedWidget.data?.colorKey ?? "mint",
        contentRevision: (selectedWidget.data?.contentRevision ?? 0) + 1,
        description: selectedWidget.data?.description ?? `${draft.title} dashboard widget`,
        ...(generatedDescriptionKey ? { generatedDescriptionKey } : {}),
        value: draft.value,
      },
      title: draft.title,
    });
    setStatus({ type: "edited", title: { kind: "literal", value: draft.title } });
  };

  const removeWidget = (id: string) => {
    const removedWidget = dashboard.widgets.find((widget) => widget.id === id);
    if (!removedWidget) {
      return;
    }

    const nextWidget = dashboard.widgets.find((widget) => widget.id !== id);
    dashboard.commands.removeWidget(id);
    setSelectedWidgetId(nextWidget?.id);
    setStatus(nextWidget ? { type: "selected", title: toWidgetStatusTitle(nextWidget) } : { type: "empty" });
  };

  const deleteWidget = () => {
    if (selectedWidget) {
      removeWidget(selectedWidget.id);
    }
  };

  const clearWidgets = () => {
    dashboard.commands.clearWidgets();
    setSelectedWidgetId(undefined);
    setStatus({ type: "empty" });
  };

  const toggleMoveLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      movable: moveLocked,
    });
    setStatus({ type: "moveLock", active: !moveLocked });
  };

  const toggleResizeLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, {
      resizable: resizeLocked,
    });
    setStatus({ type: "resizeLock", active: !resizeLocked });
  };

  const toggleFullLock = () => {
    if (!selectedWidget) {
      return;
    }

    dashboard.commands.updateWidget(selectedWidget.id, { locked: !fullyLocked });
    setStatus({ type: "fullLock", active: !fullyLocked });
  };

  const serializedState = JSON.stringify(dashboard.commands.serializeState(), null, 2);

  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader
        description={text(widgetPlaygroundCopy.description)}
        kicker={text(widgetPlaygroundCopy.kicker)}
        title={text(widgetPlaygroundCopy.title)}
      />
      <section aria-label={text(widgetPlaygroundCopy.controls)} className="playground-controls">
        <WidgetCrudControls
          addDialogOpen={addDialogOpen}
          canEdit
          dashboard={dashboard}
          editDialogOpen={editDialogOpen}
          mode="widget"
          nextWidgetNumber={nextWidgetNumber.current}
          selectedWidgetId={selectedWidgetId}
          onAddDialogOpenChange={setAddDialogOpen}
          onAddWidget={addWidget}
          onClearWidgets={clearWidgets}
          onDeleteWidget={deleteWidget}
          onEditDialogOpenChange={setEditDialogOpen}
          onEditWidget={editWidget}
          onSelectedWidgetIdChange={selectWidget}
        />
        <fieldset
          aria-label={text(widgetPlaygroundCopy.interactionActions)}
          className="example-actions example-interaction-actions"
          disabled={!selectedWidget}
        >
          <button className="example-toggle-button" disabled={!selectedWidget || fullyLocked} type="button" onClick={toggleMoveLock} {...toggleStateProps(moveLocked)}>
            <Move aria-hidden="true" size={14} />
            {text(widgetPlaygroundCopy.moveLock)}
          </button>
          <button className="example-toggle-button" disabled={!selectedWidget || fullyLocked} type="button" onClick={toggleResizeLock} {...toggleStateProps(resizeLocked)}>
            <Settings2 aria-hidden="true" size={14} />
            {text(widgetPlaygroundCopy.resizeLock)}
          </button>
          <button
            className="example-toggle-button"
            disabled={!selectedWidget}
            type="button"
            onClick={toggleFullLock}
            {...toggleStateProps(fullyLocked)}
          >
            <Lock aria-hidden="true" size={14} />
            {text(widgetPlaygroundCopy.fullLock)}
          </button>
        </fieldset>
        <p aria-label={text(widgetPlaygroundCopy.status.label)} aria-live="polite" className="example-status" role="status">
          {formatWidgetStatus(status, locale)}
        </p>
        <details className="example-state-output">
          <summary>{text(widgetPlaygroundCopy.state.summary)}</summary>
          <pre aria-label={text(widgetPlaygroundCopy.state.jsonLabel)}>{serializedState}</pre>
        </details>
      </section>
      <section aria-label={text(widgetPlaygroundCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview
          dashboard={dashboard}
          selectedWidgetId={selectedWidgetId}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          onWidgetRemove={removeWidget}
          onWidgetSelect={selectWidget}
        />
      </section>
    </section>
  );
}
