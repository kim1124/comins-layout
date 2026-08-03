type LayoutJsonProps = {
  id: string;
  onChange: (value: string) => void;
  status: string;
  value: string;
};

export function LayoutJson({ id, onChange, status, value }: LayoutJsonProps) {
  return (
    <section className="example-layout-json" aria-label="layout json controls">
      <label htmlFor={id}>저장된 레이아웃 JSON</label>
      <textarea id={id} spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} />
      <p role="status">{status}</p>
    </section>
  );
}
