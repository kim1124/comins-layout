import { useRef, useState } from "react";
import { Lock, Move, Pencil, Plus, RefreshCw, Settings2, Trash2 } from "lucide-react";

import { useDashboardGrid } from "../../../src";
import { Dialog } from "../components/ui/dialog";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { WidgetFormDialog } from "./components/WidgetFormDialog";
import type { WidgetDraft } from "./components/WidgetFormDialog";
import { resolveWidgetPresentation, sharedPlaygroundCopy, widgetPlaygroundCopy } from "./copy";
import { createWidget, createWidgetPlaygroundFixture } from "./fixtures";
import { pastelKeyForIndex } from "./palette";
import type { ExampleWidgetData } from "./types";
import { useWidgetRefresh } from "./use-widget-refresh";

export function WidgetPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 6,
    initialWidgets: createWidgetPlaygroundFixture(),
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string>();
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | undefined>("widget-1");
  const addDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const editDialogTriggerRef = useRef<HTMLElement | null>(null);
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const selectedWidget = dashboard.widgets.find((widget) => widget.id === selectedWidgetId);
  const editTargetWidget = dashboard.widgets.find((widget) => widget.id === editTargetId);
  const moveLocked = selectedWidget?.locked === true || selectedWidget?.movable === false;
  const resizeLocked = selectedWidget?.locked === true || selectedWidget?.resizable === false;
  const fullyLocked = selectedWidget?.locked === true;
  const widgetRefresh = useWidgetRefresh((id) => {
    const widget = dashboard.widgets.find((candidate) => candidate.id === id);
    if (!widget?.data) {
      return;
    }

    dashboard.commands.updateWidget(id, {
      data: {
        ...widget.data,
        contentRevision: widget.data.contentRevision + 1,
      },
    });
  });

  const addWidget = (draft: WidgetDraft) => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    const id = `widget-${number}`;
    dashboard.commands.addWidget(
      createWidget(id, draft.title, 0, 0, draft.width, draft.height, {
        colorKey: draft.colorKey,
        contentRevision: 0,
        description: "새 대시보드 위젯",
        generatedDescriptionKey: "newWidget",
        value: draft.value,
      }),
    );
    setSelectedWidgetId(id);
    setAddDialogOpen(false);
  };

  const editWidget = (draft: WidgetDraft) => {
    if (!editTargetWidget?.data) {
      return;
    }

    const {
      fixtureCopyKey: _fixtureCopyKey,
      fixtureIndex: _fixtureIndex,
      ...userData
    } = editTargetWidget.data;
    dashboard.commands.updateWidgetLayout(editTargetWidget.id, { h: draft.height, w: draft.width });
    dashboard.commands.updateWidget(editTargetWidget.id, {
      data: {
        ...userData,
        colorKey: draft.colorKey,
        description: userData.description ?? `${draft.title} dashboard widget`,
        generatedDescriptionKey: "editedWidget",
        value: draft.value,
      },
      title: draft.title,
    });
    setEditDialogOpen(false);
  };

  const removeWidget = (id: string) => {
    if (!dashboard.widgets.some((widget) => widget.id === id)) {
      return;
    }

    widgetRefresh.cancel(id);
    const nextWidget = dashboard.widgets.find((widget) => widget.id !== id);
    dashboard.commands.removeWidget(id);
    if (selectedWidgetId === id) {
      setSelectedWidgetId(nextWidget?.id);
    }
  };

  const clearWidgets = () => {
    dashboard.widgets.forEach((widget) => widgetRefresh.cancel(widget.id));
    dashboard.commands.clearWidgets();
    setSelectedWidgetId(undefined);
  };

  const toggleMoveLock = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.updateWidget(selectedWidget.id, { movable: moveLocked });
  };

  const toggleResizeLock = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.updateWidget(selectedWidget.id, { resizable: resizeLocked });
  };

  const toggleFullLock = () => {
    if (!selectedWidget) {
      return;
    }
    dashboard.commands.updateWidget(selectedWidget.id, { locked: !fullyLocked });
  };

  return (
    <section className="playground-workspace" data-example-mode="widget">
      <PlaygroundHeader
        description={text(widgetPlaygroundCopy.description)}
        kicker={text(widgetPlaygroundCopy.kicker)}
        title={text(widgetPlaygroundCopy.title)}
      />
      <section aria-label={text(widgetPlaygroundCopy.controls)} className="playground-controls">
        <div className="example-toolbar-groups">
          <div aria-label={text(sharedPlaygroundCopy.widgetActions)} className="example-toolbar-group" role="group">
            <button
              ref={addDialogTriggerRef}
              className="example-action-button example-action-button--add"
              type="button"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus aria-hidden="true" size={14} />
              {text(sharedPlaygroundCopy.addWidget)}
            </button>
            <button
              className="example-action-button example-action-button--danger"
              disabled={!selectedWidget}
              type="button"
              onClick={() => selectedWidget && removeWidget(selectedWidget.id)}
            >
              <Trash2 aria-hidden="true" size={14} />
              {text(sharedPlaygroundCopy.deleteSelectedWidget)}
            </button>
            <button
              className="example-action-button example-action-button--danger"
              disabled={dashboard.widgets.length === 0}
              type="button"
              onClick={clearWidgets}
            >
              {text(sharedPlaygroundCopy.clearAll)}
            </button>
          </div>
          <fieldset
            aria-label={text(widgetPlaygroundCopy.interactionActions)}
            className="example-toolbar-group example-interaction-actions"
            disabled={!selectedWidget}
          >
            <button
              className="example-toggle-button"
              disabled={!selectedWidget || fullyLocked}
              type="button"
              onClick={toggleMoveLock}
              {...toggleStateProps(moveLocked)}
            >
              <Move aria-hidden="true" size={14} />
              {text(widgetPlaygroundCopy.moveLock[moveLocked ? "unlock" : "lock"])}
            </button>
            <button
              className="example-toggle-button"
              disabled={!selectedWidget || fullyLocked}
              type="button"
              onClick={toggleResizeLock}
              {...toggleStateProps(resizeLocked)}
            >
              <Settings2 aria-hidden="true" size={14} />
              {text(widgetPlaygroundCopy.resizeLock[resizeLocked ? "unlock" : "lock"])}
            </button>
            <button
              className="example-toggle-button"
              disabled={!selectedWidget}
              type="button"
              onClick={toggleFullLock}
              {...toggleStateProps(fullyLocked)}
            >
              <Lock aria-hidden="true" size={14} />
              {text(widgetPlaygroundCopy.fullLock[fullyLocked ? "unlock" : "lock"])}
            </button>
          </fieldset>
          <div aria-label={text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))} className="example-toolbar-group example-toolbar-group--count">
            <span>{text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}</span>
          </div>
        </div>
      </section>
      <section aria-label={text(widgetPlaygroundCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview
          dashboard={dashboard}
          isWidgetRefreshing={widgetRefresh.isRefreshing}
          selectedWidgetId={selectedWidgetId}
          showWidgetCount={false}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          onWidgetRemove={removeWidget}
          onWidgetSelect={setSelectedWidgetId}
          renderWidgetActions={(widget) => {
            const title = widget.title ?? widget.id;
            return (
              <>
                <button
                  aria-label={`${title} ${text(widgetPlaygroundCopy.actions.edit)}`}
                  type="button"
                  onClick={(event) => {
                    editDialogTriggerRef.current = event.currentTarget;
                    setSelectedWidgetId(widget.id);
                    setEditTargetId(widget.id);
                    setEditDialogOpen(true);
                  }}
                >
                  <Pencil aria-hidden="true" size={14} />
                  <span>{text(widgetPlaygroundCopy.actions.edit)}</span>
                </button>
                <button
                  aria-label={`${title} ${text(widgetPlaygroundCopy.actions.refresh)}`}
                  type="button"
                  onClick={() => widgetRefresh.refresh(widget.id)}
                >
                  <RefreshCw aria-hidden="true" size={14} />
                  <span>{text(widgetPlaygroundCopy.actions.refresh)}</span>
                </button>
                <button
                  aria-label={`${title} ${text(widgetPlaygroundCopy.actions.delete)}`}
                  className="comins-grid-layout-widget__action--danger"
                  type="button"
                  onClick={() => removeWidget(widget.id)}
                >
                  <Trash2 aria-hidden="true" size={14} />
                  <span>{text(widgetPlaygroundCopy.actions.delete)}</span>
                </button>
              </>
            );
          }}
        />
      </section>

      <Dialog
        description={text(sharedPlaygroundCopy.dialog.add.description)}
        open={addDialogOpen}
        returnFocusRef={addDialogTriggerRef}
        title={text(sharedPlaygroundCopy.dialog.add.title)}
        onOpenChange={setAddDialogOpen}
      >
        <WidgetFormDialog
          initialDraft={{
            colorKey: pastelKeyForIndex(nextWidgetNumber.current - 1),
            height: 2,
            title: sharedPlaygroundCopy.generatedWidgetTitle[locale](nextWidgetNumber.current),
            value: String(nextWidgetNumber.current),
            width: 2,
          }}
          mode="add"
          open={addDialogOpen}
          resetKey={`add-${nextWidgetNumber.current}`}
          scope="widget-new"
          onCancel={() => setAddDialogOpen(false)}
          onSubmit={addWidget}
        />
      </Dialog>

      <Dialog
        description={text(sharedPlaygroundCopy.dialog.edit.description)}
        open={editDialogOpen}
        returnFocusRef={editDialogTriggerRef}
        title={text(sharedPlaygroundCopy.dialog.edit.title)}
        onOpenChange={setEditDialogOpen}
      >
        <WidgetFormDialog
          initialDraft={{
            colorKey: editTargetWidget?.data?.colorKey ?? pastelKeyForIndex(0),
            height: editTargetWidget?.layout.h ?? 2,
            title: editTargetWidget ? resolveWidgetPresentation(editTargetWidget, locale).title : "",
            value: editTargetWidget?.data?.value ?? "",
            width: editTargetWidget?.layout.w ?? 2,
          }}
          mode="edit"
          open={editDialogOpen}
          resetKey={editTargetWidget?.id ?? ""}
          scope="widget-edit"
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={editWidget}
        />
      </Dialog>
    </section>
  );
}
