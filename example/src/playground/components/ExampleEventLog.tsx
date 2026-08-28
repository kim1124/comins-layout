export function ExampleEventLog({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="playground-event-log">
      <span>{label}</span>
      <textarea aria-label={label} readOnly value={value} />
    </label>
  );
}
