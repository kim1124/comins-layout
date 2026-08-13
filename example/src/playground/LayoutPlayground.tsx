import { useRef, useState } from "react";
import { Boxes, Columns3, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";

import { useDashboardGrid } from "../../../src";
import type { DashboardLayoutSnapshot } from "../../../src";
import { Dialog } from "../components/ui/dialog";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader } from "./components/DashboardPreview";
import { WidgetFormDialog } from "./components/WidgetFormDialog";
import type { WidgetDraft } from "./components/WidgetFormDialog";
import { layoutPlaygroundCopy, sharedPlaygroundCopy } from "./copy";
import { createLayoutPlaygroundFixture, createWidget } from "./fixtures";
import { pastelKeyForIndex } from "./palette";
import type { ExampleWidgetData } from "./types";

export function LayoutPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [savedLayout, setSavedLayout] = useState<DashboardLayoutSnapshot | null>(null);
  const addDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);

  const addWidget = (draft: WidgetDraft) => {
    const number = nextWidgetNumber.current;
    nextWidgetNumber.current += 1;
    dashboard.commands.addWidget(
      createWidget(`widget-${number}`, draft.title, 0, 0, draft.width, draft.height, {
        colorKey: draft.colorKey,
        contentRevision: 0,
        description: "새 대시보드 위젯",
        generatedDescriptionKey: "newWidget",
        value: draft.value,
      }),
    );
    setAddDialogOpen(false);
  };

  const restoreLayout = () => {
    if (savedLayout) {
      dashboard.commands.applyLayoutSnapshot(savedLayout);
    }
  };

  const resetLayout = () => {
    dashboard.commands.resetLayout();
    setSavedLayout(null);
  };

  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader
        description={text(layoutPlaygroundCopy.description)}
        kicker={text(layoutPlaygroundCopy.kicker)}
        title={text(layoutPlaygroundCopy.title)}
      />
      <section aria-label={text(layoutPlaygroundCopy.controls)} className="playground-controls">
        <div className="example-toolbar-groups playground-layout-toolbar">
          <div aria-label={text(layoutPlaygroundCopy.groups.widgetCrud)} className="example-toolbar-group" role="group">
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
              disabled={dashboard.widgets.length === 0}
              type="button"
              onClick={dashboard.commands.clearWidgets}
            >
              {text(sharedPlaygroundCopy.clearAll)}
            </button>
          </div>
          <div aria-label={text(layoutPlaygroundCopy.groups.saveRestore)} className="example-toolbar-group" role="group">
            <button type="button" onClick={() => setSavedLayout(dashboard.commands.serializeLayout())}>
              <Save aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.save)}
            </button>
            <button disabled={savedLayout === null} type="button" onClick={restoreLayout}>
              <Undo2 aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.restore)}
            </button>
          </div>
          <div aria-label={text(layoutPlaygroundCopy.groups.rearrange)} className="example-toolbar-group" role="group">
            <button type="button" onClick={dashboard.commands.autoArrangeWidgets}>
              <Boxes aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.arrange)}
            </button>
            <button type="button" onClick={dashboard.commands.fitWidgetsToColumns}>
              <Columns3 aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.fill)}
            </button>
          </div>
          <div aria-label={text(layoutPlaygroundCopy.groups.reset)} className="example-toolbar-group" role="group">
            <button type="button" onClick={resetLayout}>
              <RotateCcw aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.reset)}
            </button>
          </div>
        </div>
      </section>
      <section aria-label={text(layoutPlaygroundCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview
          dashboard={dashboard}
          showWidgetCount={false}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          renderWidgetActions={(widget) => {
            const title = widget.title ?? widget.id;
            return (
              <button
                aria-label={`${title} ${text(sharedPlaygroundCopy.dashboardActions.remove)}`}
                className="comins-grid-layout-widget__action--danger"
                type="button"
                onClick={() => dashboard.commands.removeWidget(widget.id)}
              >
                <Trash2 aria-hidden="true" size={14} />
                <span>{text(sharedPlaygroundCopy.dashboardActions.remove)}</span>
              </button>
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
          resetKey={`layout-add-${nextWidgetNumber.current}`}
          scope="layout-new"
          onCancel={() => setAddDialogOpen(false)}
          onSubmit={addWidget}
        />
      </Dialog>
    </section>
  );
}
