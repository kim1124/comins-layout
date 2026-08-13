import { useMemo, useState } from "react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type { DashboardGridEngineOptions, DashboardResponsiveOptions } from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import {
  advancedPlaygroundCopy,
  createPresentedWidgets,
  resolveDashboardActionLabels,
  sharedPlaygroundCopy,
} from "./copy";
import { createAdvancedPlaygroundFixture } from "./fixtures";
import type { ExampleWidgetData } from "./types";

const cellHeights = [60, 80, 100] as const;
const margins = [4, 8, 12] as const;
const rowLimits = [
  { key: "none", minRow: 0, maxRow: 0 },
  { key: "two-eight", minRow: 2, maxRow: 8 },
  { key: "four-twelve", minRow: 4, maxRow: 12 },
] as const;

type RowLimitKey = (typeof rowLimits)[number]["key"];

const responsiveOptions: DashboardResponsiveOptions = {
  breakpointForWindow: true,
  columnMax: 12,
  breakpoints: [{ maxWidth: 900, columns: 6, layout: "moveScale" }],
};

function numericOptions(values: readonly number[]): SelectOption[] {
  return values.map((value) => ({ label: String(value), value: String(value) }));
}

export function AdvancedPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createAdvancedPlaygroundFixture(),
  });
  const [responsiveEnabled, setResponsiveEnabled] = useState(false);
  const [floatEnabled, setFloatEnabled] = useState(false);
  const [animateEnabled, setAnimateEnabled] = useState(false);
  const [staticGridEnabled, setStaticGridEnabled] = useState(false);
  const [rtlEnabled, setRtlEnabled] = useState(false);
  const [sizeToContentEnabled, setSizeToContentEnabled] = useState(false);
  const [cellHeight, setCellHeight] = useState<(typeof cellHeights)[number]>(60);
  const [margin, setMargin] = useState<(typeof margins)[number]>(4);
  const [rowLimitKey, setRowLimitKey] = useState<RowLimitKey>("none");
  const presentedWidgets = useMemo(() => createPresentedWidgets(dashboard.widgets, locale), [dashboard.widgets, locale]);
  const rowLimit = rowLimits.find(({ key }) => key === rowLimitKey) ?? rowLimits[0];
  const engineOptions = useMemo<DashboardGridEngineOptions>(() => ({
    animate: animateEnabled,
    cellHeight,
    float: floatEnabled,
    margin,
    maxRow: rowLimit.maxRow,
    minRow: rowLimit.minRow,
    rtl: rtlEnabled,
    sizeToContent: sizeToContentEnabled,
    staticGrid: staticGridEnabled,
  }), [animateEnabled, cellHeight, floatEnabled, margin, rowLimit, rtlEnabled, sizeToContentEnabled, staticGridEnabled]);
  const rowLimitOptions = advancedPlaygroundCopy.rowLimits.map(({ key, label }) => ({
    label: text(label),
    value: key,
  }));

  const toggles = [
    {
      enabled: floatEnabled,
      labels: advancedPlaygroundCopy.toggles.float,
      setEnabled: setFloatEnabled,
    },
    {
      enabled: animateEnabled,
      labels: advancedPlaygroundCopy.toggles.animate,
      setEnabled: setAnimateEnabled,
    },
    {
      enabled: staticGridEnabled,
      labels: advancedPlaygroundCopy.toggles.staticGrid,
      setEnabled: setStaticGridEnabled,
    },
    {
      enabled: rtlEnabled,
      labels: advancedPlaygroundCopy.toggles.rtl,
      setEnabled: setRtlEnabled,
    },
    {
      enabled: sizeToContentEnabled,
      labels: advancedPlaygroundCopy.toggles.sizeToContent,
      setEnabled: setSizeToContentEnabled,
    },
  ] as const;

  return (
    <section className="playground-workspace" data-example-mode="advanced">
      <PlaygroundHeader
        description={text(advancedPlaygroundCopy.description)}
        kicker={text(advancedPlaygroundCopy.kicker)}
        title={text(advancedPlaygroundCopy.title)}
      />
      <section aria-label={text(advancedPlaygroundCopy.controls)} className="playground-controls playground-advanced-controls">
        <section aria-label={text(advancedPlaygroundCopy.groups.responsive)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.responsive)}</h2>
          <p className="example-control-description">{text(advancedPlaygroundCopy.descriptions.responsive)}</p>
          <div className="example-actions">
            <button
              className="example-toggle-button"
              type="button"
              onClick={() => setResponsiveEnabled((value) => !value)}
              {...toggleStateProps(responsiveEnabled)}
            >
              {text(responsiveEnabled ? advancedPlaygroundCopy.toggles.responsive.disable : advancedPlaygroundCopy.toggles.responsive.enable)}
            </button>
          </div>
        </section>

        <section aria-label={text(advancedPlaygroundCopy.groups.engine)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.engine)}</h2>
          <p className="example-control-description">{text(advancedPlaygroundCopy.descriptions.engine)}</p>
          <div className="playground-advanced-options">
            <div className="example-actions">
              <Select
                id="advanced-cell-height"
                label={text(advancedPlaygroundCopy.selects.cellHeight)}
                options={numericOptions(cellHeights)}
                value={String(cellHeight)}
                onChange={(value) => setCellHeight(Number(value) as (typeof cellHeights)[number])}
              />
              <Select
                id="advanced-margin"
                label={text(advancedPlaygroundCopy.selects.margin)}
                options={numericOptions(margins)}
                value={String(margin)}
                onChange={(value) => setMargin(Number(value) as (typeof margins)[number])}
              />
              <Select
                id="advanced-row-limit"
                label={text(advancedPlaygroundCopy.selects.rowLimit)}
                options={rowLimitOptions}
                value={rowLimitKey}
                onChange={(value) => setRowLimitKey(value as RowLimitKey)}
              />
            </div>
            <div className="example-actions">
              {toggles.map(({ enabled, labels, setEnabled }) => (
                <button
                  className="example-toggle-button"
                  key={text(labels.enable)}
                  type="button"
                  onClick={() => setEnabled((value) => !value)}
                  {...toggleStateProps(enabled)}
                >
                  {text(enabled ? labels.disable : labels.enable)}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section aria-label={text(advancedPlaygroundCopy.dashboard)} className="playground-grid-region">
        <p className="example-widget-count">
          {text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}
        </p>
        <DashboardGrid
          actionLabels={resolveDashboardActionLabels(locale)}
          columns={dashboard.columns}
          engineOptions={engineOptions}
          responsive={responsiveEnabled ? responsiveOptions : undefined}
          showControls={false}
          widgets={presentedWidgets}
          onColumnsChange={dashboard.commands.setColumns}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          renderWidget={(widget) => (
            <div className="dashboard-widget-body">
              <span>{widget.data?.description}</span>
              <strong>{widget.data?.value}</strong>
            </div>
          )}
        />
      </section>
    </section>
  );
}
