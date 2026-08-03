import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS } from "../../../../src";
import { Dialog } from "../../components/ui/dialog";
import { Select } from "../../components/ui/select";
import type { SelectOption } from "../../components/ui/select";
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

type WidgetCrudControlsProps = {
  addDialogOpen?: boolean;
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
  scope: string;
  onCancel: () => void;
  onSubmit: (draft: NewWidgetDraft) => void;
};

function WidgetDialogForm({
  initialTitle,
  initialValue,
  mode,
  open,
  scope,
  onCancel,
  onSubmit,
}: WidgetDialogFormProps) {
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftValue, setDraftValue] = useState(initialValue);
  const [height, setHeight] = useState(2);
  const [titleError, setTitleError] = useState("");
  const [valueError, setValueError] = useState("");
  const [width, setWidth] = useState(2);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftTitle(initialTitle);
    setDraftValue(initialValue);
    setHeight(2);
    setTitleError("");
    setValueError("");
    setWidth(2);
  }, [initialTitle, initialValue, open]);

  const submit = () => {
    const title = draftTitle.trim();
    const value = draftValue.trim();
    const nextTitleError = title ? "" : "위젯명을 입력해 주세요.";
    const nextValueError = value ? "" : "값을 입력해 주세요.";
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
        <span>위젯명</span>
        <input
          aria-describedby={titleError ? `${scope}-widget-title-error` : undefined}
          aria-invalid={Boolean(titleError)}
          id={`${scope}-widget-title`}
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
        {titleError ? <span className="example-input-error" id={`${scope}-widget-title-error`}>{titleError}</span> : null}
      </label>
      <label className="example-input" htmlFor={`${scope}-widget-value`}>
        <span>값</span>
        <input
          aria-describedby={valueError ? `${scope}-widget-value-error` : undefined}
          aria-invalid={Boolean(valueError)}
          id={`${scope}-widget-value`}
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
        />
        {valueError ? <span className="example-input-error" id={`${scope}-widget-value-error`}>{valueError}</span> : null}
      </label>
      {mode === "add" ? (
        <>
          <Select
            id={`${scope}-widget-width`}
            label="새 위젯 너비"
            options={columnOptions}
            value={String(width)}
            onChange={(value) => setWidth(Number(value))}
          />
          <Select
            id={`${scope}-widget-height`}
            label="새 위젯 높이"
            options={heightOptions}
            value={String(height)}
            onChange={(value) => setHeight(Number(value))}
          />
        </>
      ) : null}
      <div className="example-dialog__footer">
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button className="example-action-button example-action-button--add" type="button" onClick={submit}>
          {mode === "add" ? "위젯 저장" : "변경 저장"}
        </button>
      </div>
    </div>
  );
}

export function WidgetCrudControls({
  addDialogOpen,
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
  const [internalAddDialogOpen, setInternalAddDialogOpen] = useState(false);
  const [internalEditDialogOpen, setInternalEditDialogOpen] = useState(false);
  const [internalSelectedWidgetId, setInternalSelectedWidgetId] = useState("sales");
  const nextWidgetNumber = useRef(dashboard.widgets.length + 1);
  const controlledSelection = onSelectedWidgetIdChange !== undefined;
  const activeSelectedId = controlledSelection ? selectedWidgetId : internalSelectedWidgetId;
  const selectedWidget =
    dashboard.widgets.find((widget) => widget.id === activeSelectedId) ??
    (controlledSelection ? undefined : dashboard.widgets[0]);
  const widgetOptions = dashboard.widgets.map((widget) => ({
    label: widget.title ?? widget.id,
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
      dashboard.commands.updateWidget(selectedWidget.id, {
        data: {
          description: selectedWidget.data?.description ?? `${draft.title} dashboard widget`,
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
      <div className="example-actions example-crud-actions" aria-label={`${mode} widget actions`}>
        <button className="example-action-button example-action-button--add" type="button" onClick={() => setAddDialogOpen(true)}>
          <Plus aria-hidden="true" size={14} />
          위젯 추가
        </button>
        <fieldset className="example-control-fieldset" disabled={dashboard.widgets.length === 0}>
          <Select
            id={`${mode}-widget-select`}
            label="위젯 선택"
            options={widgetOptions}
            value={selectedWidget?.id ?? ""}
            onChange={(id) => setSelectedWidgetId(id)}
          />
        </fieldset>
        <button type="button" disabled={!selectedWidget} onClick={() => setEditDialogOpen(true)}>
          <Pencil aria-hidden="true" size={14} />
          선택 위젯 수정
        </button>
        <button className="example-action-button example-action-button--danger" disabled={!selectedWidget} type="button" onClick={deleteWidget}>
          <Trash2 aria-hidden="true" size={14} />
          선택 위젯 삭제
        </button>
        {onClearWidgets ? (
          <button className="example-action-button example-action-button--danger" disabled={dashboard.widgets.length === 0} type="button" onClick={clearWidgets}>
            전체 삭제
          </button>
        ) : null}
      </div>

      <Dialog
        description="추가할 위젯의 제목, 값, 너비와 높이를 입력합니다."
        open={resolvedAddDialogOpen}
        title="위젯 추가"
        onOpenChange={setAddDialogOpen}
      >
        <WidgetDialogForm
          initialTitle={`위젯 ${nextNumber}`}
          initialValue={String(nextNumber)}
          mode="add"
          open={resolvedAddDialogOpen}
          scope={`${mode}-new`}
          onCancel={() => setAddDialogOpen(false)}
          onSubmit={addWidget}
        />
      </Dialog>

      <Dialog
        description="선택한 위젯의 제목과 값을 변경합니다."
        open={resolvedEditDialogOpen}
        title="위젯 수정"
        onOpenChange={setEditDialogOpen}
      >
        <WidgetDialogForm
          initialTitle={selectedWidget?.title ?? ""}
          initialValue={selectedWidget?.data?.value ?? ""}
          mode="edit"
          open={resolvedEditDialogOpen}
          scope={`${mode}-edit`}
          onCancel={() => setEditDialogOpen(false)}
          onSubmit={editWidget}
        />
      </Dialog>
    </>
  );
}
