type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
};

export function Select({ id, label, options, value, onChange }: SelectProps) {
  return (
    <label className="example-select" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export type { SelectOption };
