import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import { Select } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader } from "./components/DashboardPreview";
import { layoutColumnsCopy } from "./copy";
import { createLayoutPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

export function LayoutColumnsPlayground() {
  const { text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });

  return (
    <section className="playground-workspace" data-example-mode="layout-columns">
      <PlaygroundHeader
        description={text(layoutColumnsCopy.description)}
        kicker={text(layoutColumnsCopy.kicker)}
        title={text(layoutColumnsCopy.title)}
      />
      <section aria-label={text(layoutColumnsCopy.controls)} className="playground-controls">
        <Select
          id="layout-columns"
          label={text(layoutColumnsCopy.select)}
          options={DASHBOARD_COLUMN_COUNTS.map((column) => ({ label: String(column), value: String(column) }))}
          value={String(dashboard.columns)}
          onChange={(value) => dashboard.commands.setColumns(Number(value))}
        />
      </section>
      <section aria-label={text(layoutColumnsCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} showControls={false} />
      </section>
    </section>
  );
}
