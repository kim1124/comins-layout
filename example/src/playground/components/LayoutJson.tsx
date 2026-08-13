import type { ReactNode } from "react";
import type { LocalizedText } from "../../i18n/types";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { sharedPlaygroundCopy } from "../copy";

type LayoutJsonProps = {
  actions?: ReactNode;
  id: string;
  label?: LocalizedText;
  onChange: (value: string) => void;
  status: string;
  statusLabel?: LocalizedText;
  summary?: LocalizedText;
  value: string;
};

export function LayoutJson({
  actions,
  id,
  label = sharedPlaygroundCopy.layoutJson.defaultLabel,
  onChange,
  status,
  statusLabel,
  summary,
  value,
}: LayoutJsonProps) {
  const { text } = usePlaygroundLocale();

  const editor = (
    <section className="example-layout-json" aria-label={text(sharedPlaygroundCopy.layoutJson.controls)}>
      {actions}
      <label htmlFor={id}>{text(label)}</label>
      <textarea id={id} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />
      <p aria-label={statusLabel ? text(statusLabel) : undefined} role="status">{status}</p>
    </section>
  );

  return summary ? (
    <details className="example-state-editor">
      <summary>{text(summary)}</summary>
      {editor}
    </details>
  ) : editor;
}
