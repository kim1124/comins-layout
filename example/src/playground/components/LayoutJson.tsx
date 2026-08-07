type LayoutJsonProps = {
  id: string;
  label?: string;
  onChange: (value: string) => void;
  status: string;
  statusLabel?: string;
  value: string;
};

export function LayoutJson({
  id,
  label = "저장된 레이아웃 JSON",
  onChange,
  status,
  statusLabel,
  value,
}: LayoutJsonProps) {
  return (
    <section className="example-layout-json" aria-label="layout json controls">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />
      <p aria-label={statusLabel} role="status">{status}</p>
    </section>
  );
}
