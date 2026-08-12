import type { LocalizedText } from "../../i18n/types";
import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { sharedPlaygroundCopy } from "../copy";

type LayoutJsonProps = {
  id: string;
  label?: LocalizedText;
  onChange: (value: string) => void;
  status: string;
  statusLabel?: LocalizedText;
  value: string;
};

export function LayoutJson({
  id,
  label = sharedPlaygroundCopy.layoutJson.defaultLabel,
  onChange,
  status,
  statusLabel,
  value,
}: LayoutJsonProps) {
  const { text } = usePlaygroundLocale();

  return (
    <section className="example-layout-json" aria-label={text(sharedPlaygroundCopy.layoutJson.controls)}>
      <label htmlFor={id}>{text(label)}</label>
      <textarea id={id} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />
      <p aria-label={statusLabel ? text(statusLabel) : undefined} role="status">{status}</p>
    </section>
  );
}
