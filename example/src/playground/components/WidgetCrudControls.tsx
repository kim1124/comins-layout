import { useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Dialog } from "../../components/ui/dialog";
import { Select } from "../../components/ui/select";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { resolveWidgetPresentation, sharedPlaygroundCopy } from "../copy";
import { createWidget } from "../fixtures";
import { pastelKeyForIndex } from "../palette";
import type { DashboardRuntime } from "../types";
import { WidgetFormDialog } from "./WidgetFormDialog";
import type { WidgetDraft } from "./WidgetFormDialog";

export type NewWidgetDraft = WidgetDraft;
export type EditedWidgetDraft = Pick<WidgetDraft, "title" | "value">;

type WidgetCrudControlsProps = {
  addDialogOpen?: boolean;
  canClear?: boolean;
  canEdit?: boolean;
  dashboard: DashboardRuntime;
  editDialogOpen?: boolean;
  mode: string;
  nextWidgetNumber?: number;
  selectedWidgetId?: string;
  onAddDialogOpenChange?: (open: boolean) => void;
  onAddWidget?: (draft: NewWidgetDraft) => void;
  onClearWidgets?: () => void;
  onDeleteWidget?: () => void;
  onEditDialogOpenChange?: (open: boolean) => void;
  onEditWidget?: (draft: EditedWidgetDraft) => void;
  onSelectedWidgetIdChange?: (id: string | undefined) => void;
};

export function WidgetCrudControls({
  addDialogOpen,
  canClear = false,
  canEdit = false,
  dashboard,
  editDialogOpen,
  mode,
  nextWidgetNumber: controlledNextWidgetNumber,
  selectedWidgetId,
  onAddDialogOpenChange,
  onAddWidget,
  onClearWidgets,
  onDeleteWidget,
  onEditDialogOpenChange,
  onEditWidget,
  onSelectedWidgetIdChange,
}: WidgetCrudControlsProps) {
  const { locale, text } = usePlaygroundLocale();
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false);
  const [internalEditDialogOpen, setInternalEditDialogOpen] = useState(false);
  const [internalSelectedWidgetId, setInternalSelectedWidgetId] = useState("sales");
  const addDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const editDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const controlledSelection = onSelectedWidgetIdChange !== undefined;
  const activeSelectedId = controlledSelection ? selectedWidgetId : internalSelectedWidgetId;
  const selectedWidget =
    dashboard.widgets.find((widget) => widget.id === activeSelectedId) ??
    (controlledSelection ? undefined : dashboard.widgets[0]);
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: resolveWidgetPresentation(widget, locale).title,
    value: widget.id,
  }));
  const resolvedAddDialogOpen = onAddDialogOpenChange ? Boolean(addDialogOpen) : internalAddDialogOpen;
  const resolvedEditDialogOpen = onEditDialogOpenChange ? Boolean(editDialogOpen) : internalEditDialogOpen;

  const setSelectedWidgetId = (id: string | undefined) => {
    if (controlledSelection) {
      onSelectedWidgetIdChange(id);
      return;
    }
    setInternalSelectedWidgetId(id ?? "");
  };

  const setAddDialogOpen = (open: boolean) => {
    if (onAddDialogOpenChange) {
      onAddDialogOpenChange(open);
      return;
    }
    setInternalAddDialogOpen(open);
  };

  const setEditDialogOpen = (open: boolean) => {
    if (onEditDialogOpenChange) {
      onEditDialogOpenChange(open);
      return;
    }
    setInternalEditDialogOpen(open);
  };

  const addWidget = (draft: NewWidgetDraft) => {
    if (onAddWidget) {
      onAddWidget(draft);
    } else {
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
    }
    setAddDialogOpen(false);
  };

  const editWidget = (draft: NewWidgetDraft) => {
    if (!selectedWidget) {
      return;
    }

    if (onEditWidget) {
      onEditWidget({ title: draft.title, value: draft.value });
    } else {
      const generatedDescriptionKey = selectedWidget.data?.fixtureCopyKey
        ? "editedWidget"
        : selectedWidget.data?.generatedDescriptionKey;

      dashboard.commands.updateWidget(selectedWidget.id, {
        data: {
          ...selectedWidget.data,
          description: selectedWidget.data?.description ?? `${draft.title} dashboard widget`,
          ...(generatedDescriptionKey ? { generatedDescriptionKey } : {}),
          colorKey: draft.colorKey,
          contentRevision: (selectedWidget.data?.contentRevision ?? 0) + 1,
          value: draft.value,
        },
        title: draft.title,
      });
    }
    setEditDialogOpen(false);
  };

  const deleteWidget = () => {
    if (!selectedWidget) {
      return;
    }

    if (onDeleteWidget) {
      onDeleteWidget();
      return;
    }
    dashboard.commands.removeWidget(selectedWidget.id);
    setSelectedWidgetId(dashboard.widgets.find((widget) => widget.id !== selectedWidget.id)?.id);
  };

  const clearWidgets = () => {
    if (onClearWidgets) {
      onClearWidgets();
      return;
    }
    dashboard.commands.clearWidgets();
    setSelectedWidgetId(undefined);
  };

  const nextNumber = controlledNextWidgetNumber ?? nextWidgetNumber.current;

  return (
    <>
      <div className="example-actions example-crud-actions" aria-label={text(sharedPlaygroundCopy.widgetActions)}>
        <button ref={addDialogTriggerRef} className="example-action-button example-action-button--add" type="button" onClick={() => setAddDialogOpen(true)}>
          <Plus aria-hidden="true" size={14} />
          {text(sharedPlaygroundCopy.addWidget)}
        </button>
        <fieldset className="example-control-fieldset" disabled={dashboard.widgets.length === 0}>
          <Select
            id={`${mode}-widget-select`}
            label={text(sharedPlaygroundCopy.selectWidget)}
            options={widgetOptions}
            value={selectedWidget?.id ?? ""}
            onChange={(id) => setSelectedWidgetId(id)}
          />
        </fieldset>
        {canEdit ? (
          <button ref={editDialogTriggerRef} type="button" disabled={!selectedWidget} onClick={() => setEditDialogOpen(true)}>
            <Pencil aria-hidden="true" size={14} />
            {text(sharedPlaygroundCopy.editSelectedWidget)}
          </button>
        ) : null}
        <button className="example-action-button example-action-button--danger" disabled={!selectedWidget} type="button" onClick={deleteWidget}>
          <Trash2 aria-hidden="true" size={14} />
          {text(sharedPlaygroundCopy.deleteSelectedWidget)}
        </button>
        {canClear || onClearWidgets ? (
          <button className="example-action-button example-action-button--danger" disabled={dashboard.widgets.length === 0} type="button" onClick={clearWidgets}>
            {text(sharedPlaygroundCopy.clearAll)}
          </button>
        ) : null}
      </div>

      <Dialog
        description={text(sharedPlaygroundCopy.dialog.add.description)}
        open={resolvedAddDialogOpen}
        returnFocusRef={addDialogTriggerRef}
        title={text(sharedPlaygroundCopy.dialog.add.title)}
        onOpenChange={setAddDialogOpen}
      >
        <WidgetFormDialog
          initialDraft={{
            colorKey: pastelKeyForIndex(nextNumber - 1),
            height: 2,
            title: sharedPlaygroundCopy.generatedWidgetTitle[locale](nextNumber),
            value: String(nextNumber),
            width: 2,
          }}
          mode="add"
          open={resolvedAddDialogOpen}
          resetKey={`add-${nextNumber}`}
          scope={`${mode}-new`}
          onCancel={() => setAddDialogOpen(false)}
          onSubmit={addWidget}
        />
      </Dialog>

      {canEdit ? (
        <Dialog
          description={text(sharedPlaygroundCopy.dialog.edit.description)}
          open={resolvedEditDialogOpen}
          returnFocusRef={editDialogTriggerRef}
          title={text(sharedPlaygroundCopy.dialog.edit.title)}
          onOpenChange={setEditDialogOpen}
        >
        <WidgetFormDialog
          initialDraft={{
            colorKey: selectedWidget?.data?.colorKey ?? pastelKeyForIndex(0),
            height: selectedWidget?.layout.h ?? 2,
            title: selectedWidget ? resolveWidgetPresentation(selectedWidget, locale).title : "",
            value: selectedWidget?.data?.value ?? "",
            width: selectedWidget?.layout.w ?? 2,
          }}
            mode="edit"
            open={resolvedEditDialogOpen}
            resetKey={selectedWidget?.id ?? ""}
            scope={`${mode}-edit`}
            onCancel={() => setEditDialogOpen(false)}
            onSubmit={editWidget}
          />
        </Dialog>
      ) : null}
    </>
  );
}
