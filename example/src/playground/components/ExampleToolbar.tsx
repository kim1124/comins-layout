import type { ReactNode } from "react";

import { DASHBOARD_COLUMN_COUNTS } from "../../../../src";
import { Select } from "../../components/ui/select";
import { usePlaygroundLocale } from "../locale";

const columnOptions = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

export function ExampleToolbar({
  children,
  columns,
  id,
  onColumnsChange,
}: {
  children: ReactNode;
  columns?: number;
  id: string;
  onColumnsChange?: (columns: number) => void;
}) {
  const { text } = usePlaygroundLocale();
  return (
    <section aria-label={text("예제 기능", "Example controls")} className="playground-example-toolbar">
      <div className="playground-example-toolbar__actions">{children}</div>
      {columns !== undefined && onColumnsChange ? (
        <div className="playground-example-toolbar__column">
          <Select
            id={`${id}-columns`}
            label={text("컬럼", "Columns")}
            options={columnOptions}
            value={String(columns)}
            onChange={(value) => onColumnsChange(Number(value))}
          />
        </div>
      ) : null}
    </section>
  );
}
