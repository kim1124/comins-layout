import { useEffect, useRef, useState } from "react";

import { DASHBOARD_COLUMN_COUNTS } from "../../../../src";
import { Select } from "../../components/ui/select";
import type { SelectOption } from "../../components/ui/select";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { sharedPlaygroundCopy } from "../copy";
import { PASTEL_COLORS } from "../palette";
import type { PastelColorKey } from "../palette";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const heightOptions: SelectOption[] = [1, 2, 3, 4].map((height) => ({
  label: String(height),
  value: String(height),
}));

export type WidgetDraft = {
  colorKey: PastelColorKey;
  height: number;
  title: string;
  value: string;
  width: number;
};

type WidgetValidationError = "titleRequired" | "valueRequired" | null;

type WidgetFormDialogProps = {
  initialDraft: WidgetDraft;
  mode: "add" | "edit";
  open: boolean;
  resetKey: string;
  scope: string;
  onCancel: () => void;
  onSubmit: (draft: WidgetDraft) => void;
};

export function WidgetFormDialog({
  initialDraft,
  mode,
  open,
  resetKey,
  scope,
  onCancel,
  onSubmit,
}: WidgetFormDialogProps) {
  const { text } = usePlaygroundLocale();
  const [draft, setDraft] = useState(initialDraft);
  const [titleError, setTitleError] = useState<WidgetValidationError>(null);
  const [valueError, setValueError] = useState<WidgetValidationError>(null);
  const previousOpen = useRef(false);
  const previousResetKey = useRef(resetKey);

  useEffect(() => {
    const shouldReset = open && (!previousOpen.current || previousResetKey.current !== resetKey);
    previousOpen.current = open;
    previousResetKey.current = resetKey;

    if (!shouldReset) {
      return;
    }

    setDraft(initialDraft);
    setTitleError(null);
    setValueError(null);
  }, [initialDraft, open, resetKey]);

  const submit = () => {
    const title = draft.title.trim();
    const value = draft.value.trim();
    const nextTitleError: WidgetValidationError = title ? null : "titleRequired";
    const nextValueError: WidgetValidationError = value ? null : "valueRequired";
    setTitleError(nextTitleError);
    setValueError(nextValueError);
    if (nextTitleError || nextValueError) {
      return;
    }

    onSubmit({ ...draft, title, value });
  };

  return (
    <div className="example-dialog-form" data-widget-form-mode={mode}>
      <label className="example-input" htmlFor={`${scope}-widget-title`}>
        <span>{text(sharedPlaygroundCopy.widgetName)}</span>
        <input
          aria-describedby={titleError ? `${scope}-widget-title-error` : undefined}
          aria-invalid={Boolean(titleError)}
          id={`${scope}-widget-title`}
          value={draft.title}
          onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        />
        {titleError ? <span className="example-input-error" id={`${scope}-widget-title-error`}>{text(sharedPlaygroundCopy.validation[titleError])}</span> : null}
      </label>
      <label className="example-input" htmlFor={`${scope}-widget-value`}>
        <span>{text(sharedPlaygroundCopy.value)}</span>
        <input
          aria-describedby={valueError ? `${scope}-widget-value-error` : undefined}
          aria-invalid={Boolean(valueError)}
          id={`${scope}-widget-value`}
          value={draft.value}
          onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
        />
        {valueError ? <span className="example-input-error" id={`${scope}-widget-value-error`}>{text(sharedPlaygroundCopy.validation[valueError])}</span> : null}
      </label>
      <Select
        id={`${scope}-widget-width`}
        label={text(sharedPlaygroundCopy.newWidgetWidth)}
        options={columnOptions}
        value={String(draft.width)}
        onChange={(value) => setDraft((current) => ({ ...current, width: Number(value) }))}
      />
      <Select
        id={`${scope}-widget-height`}
        label={text(sharedPlaygroundCopy.newWidgetHeight)}
        options={heightOptions}
        value={String(draft.height)}
        onChange={(value) => setDraft((current) => ({ ...current, height: Number(value) }))}
      />
      <fieldset className="example-palette-fieldset">
        <legend>{text(sharedPlaygroundCopy.color)}</legend>
        <div className="example-palette-options">
          {PASTEL_COLORS.map((color) => (
            <label key={color.key} className="example-palette-option" style={{ background: color.background, color: color.foreground }}>
              <input
                checked={draft.colorKey === color.key}
                name={`${scope}-widget-color`}
                type="radio"
                value={color.key}
                onChange={() => setDraft((current) => ({ ...current, colorKey: color.key }))}
              />
              <span>{text(sharedPlaygroundCopy.colors[color.key])}</span>
            </label>
          ))}
        </div>
      </fieldset>
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
