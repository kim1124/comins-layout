import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS } from "../../../../src";
import { Dialog } from "../../components/ui/dialog";
import { Select } from "../../components/ui/select";
import type { SelectOption } from "../../components/ui/select";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { resolveWidgetPresentation, sharedPlaygroundCopy } from "../copy";
import { createWidget } from "../fixtures";
import type { DashboardRuntime } from "../types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const heightOptions: SelectOption[] = [1, 2, 3, 4].map((height) => ({
  label: String(height),
  value: String(height),
}));

export type NewWidgetDraft = {
  height: number;
  title: string;
  value: string;
  width: number;
};

export type EditedWidgetDraft = Pick<NewWidgetDraft, "title" | "value">;

type WidgetValidationError = "titleRequired" | "valueRequired" | null;

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

type WidgetDialogFormProps = {
  initialTitle: string;
  initialValue: string;
  mode: "add" | "edit";
  open: boolean;
  resetKey: string;
  scope: string;
  onCancel: () => void;
  onSubmit: (draft: NewWidgetDraft) => void;
};

function WidgetDialogForm({
  initialTitle,
  initialValue,
  mode,
  open,
  resetKey,
  scope,
  onCancel,
  onSubmit,
}: WidgetDialogFormProps) {
  const { text } = usePlaygroundLocale();
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftValue, setDraftValue] = useState(initialValue);
  const [height, setHeight] = useState(2);
  const [titleError, setTitleError] = useState<WidgetValidationError>(null);
  const [valueError, setValueError] = useState<WidgetValidationError>(null);
  const [width, setWidth] = useState(2);
  const previousOpen = useRef(false);
  const previousResetKey = useRef(resetKey);

  useEffect(() => {
    const shouldReset = open && (!previousOpen.current || previousResetKey.current !== resetKey);
    previousOpen.current = open;
    previousResetKey.current = resetKey;

    if (!shouldReset) {
      return;
    }

    setDraftTitle(initialTitle);
    setDraftValue(initialValue);
    setHeight(2);
    setTitleError(null);
    setValueError(null);
    setWidth(2);
  }, [open, resetKey]);

  const submit = () => {
    const title = draftTitle.trim();
    const value = draftValue.trim();
    const nextTitleError: WidgetValidationError = title ? null : "titleRequired";
    const nextValueError: WidgetValidationError = value ? null : "valueRequired";
    setTitleError(nextTitleError);
    setValueError(nextValueError);
    if (nextTitleError || nextValueError) {
      return;
    }

    onSubmit({ height, title, value, width });
  };

  return (
    <div className="example-dialog-form">
      <label className="example-input" htmlFor={`${scope}-widget-title`}>
        <span>{text(sharedPlaygroundCopy.widgetName)}</span>
        <input
          aria-describedby={titleError ? `${scope}-widget-title-error` : undefined}
          aria-invalid={Boolean(titleError)}
          id={`${scope}-widget-title`}
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
        {titleError ? <span className="example-input-error" id={`${scope}-widget-title-error`}>{text(sharedPlaygroundCopy.validation[titleError])}</span> : null}
      </label>
      <label className="example-input" htmlFor={`${scope}-widget-value`}>
        <span>{text(sharedPlaygroundCopy.value)}</span>
        <input
          aria-describedby={valueError ? `${scope}-widget-value-error` : undefined}
          aria-invalid={Boolean(valueError)}
          id={`${scope}-widget-value`}
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
        />
        {valueError ? <span className="example-input-error" id={`${scope}-widget-value-error`}>{text(sharedPlaygroundCopy.validation[valueError])}</span> : null}
      </label>
      {mode === "add" ? (
        <>
          <Select
            id={`${scope}-widget-width`}
            label={text(sharedPlaygroundCopy.newWidgetWidth)}
            options={columnOptions}
            value={String(width)}
            onChange={(value) => setWidth(Number(value))}
          />
          <Select
            id={`${scope}-widget-height`}
            label={text(sharedPlaygroundCopy.newWidgetHeight)}
            options={heightOptions}
            value={String(height)}
            onChange={(value) => setHeight(Number(value))}
          />
        </>
      ) : null}
      <div className="example-dialog__footer">
        <button type="button" onClick={onCancel}>
          {text(sharedPlaygroundCopy.cancel)}
        </button>
        <button className="example-action-button example-action-button--add" type="button" onClick={submit}>
          {text(mode === "add" ? sharedPlaygroundCopy.saveWidget : sharedPlaygroundCopy.saveChanges)}
        </button>
      </div>
    </div>
  );
}

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
      onEditWidget(draft);
    } else {
      const generatedDescriptionKey = selectedWidget.data?.fixtureCopyKey
        ? "editedWidget"
        : selectedWidget.data?.generatedDescriptionKey;

      dashboard.commands.updateWidget(selectedWidget.id, {
        data: {
          description: selectedWidget.data?.description ?? `${draft.title} dashboard widget`,
          ...(generatedDescriptionKey ? { generatedDescriptionKey } : {}),
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
        <WidgetDialogForm
          initialTitle={sharedPlaygroundCopy.generatedWidgetTitle[locale](nextNumber)}
          initialValue={String(nextNumber)}
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
          <WidgetDialogForm
            initialTitle={selectedWidget ? resolveWidgetPresentation(selectedWidget, locale).title : ""}
            initialValue={selectedWidget?.data?.value ?? ""}
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
