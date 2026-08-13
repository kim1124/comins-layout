import { useMemo, useState } from "react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type { DashboardGridEngineOptions, DashboardResponsiveOptions } from "../../../src";
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

type EngineSelectProps = {
  description: string;
  descriptionId: string;
  id: string;
  label: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
};

function EngineSelect({ description, descriptionId, id, label, options, value, onChange }: EngineSelectProps) {
  return (
    <div className="playground-advanced-control">
      <label className="example-select" htmlFor={id}>
        <span>{label}</span>
        <select
          aria-describedby={descriptionId}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <p className="playground-advanced-control__description" id={descriptionId}>{description}</p>
    </div>
  );
}

function numericOptions(values: readonly number[]): Array<{ label: string; value: string }> {
  return values.map((value) => ({ label: String(value), value: String(value) }));
}

function createAdvancedEngineFixture() {
  return createAdvancedPlaygroundFixture().map((widget) => widget.id === "alerts"
    ? { ...widget, layout: { ...widget.layout, w: 4 } }
    : widget);
}

export function AdvancedPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createAdvancedEngineFixture(),
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
      description: advancedPlaygroundCopy.descriptions.controls.float,
      enabled: floatEnabled,
      key: "float",
      labels: advancedPlaygroundCopy.toggles.float,
      toggle: () => setFloatEnabled((value) => !value),
    },
    {
      description: advancedPlaygroundCopy.descriptions.controls.animate,
      enabled: animateEnabled,
      key: "animate",
      labels: advancedPlaygroundCopy.toggles.animate,
      toggle: () => setAnimateEnabled((value) => !value),
    },
    {
      description: advancedPlaygroundCopy.descriptions.controls.staticGrid,
      enabled: staticGridEnabled,
      key: "static-grid",
      labels: advancedPlaygroundCopy.toggles.staticGrid,
      toggle: () => setStaticGridEnabled((value) => !value),
    },
    {
      description: advancedPlaygroundCopy.descriptions.controls.rtl,
      enabled: rtlEnabled,
      key: "rtl",
      labels: advancedPlaygroundCopy.toggles.rtl,
      toggle: () => setRtlEnabled((value) => !value),
    },
    {
      description: advancedPlaygroundCopy.descriptions.controls.sizeToContent,
      enabled: sizeToContentEnabled,
      key: "size-to-content",
      labels: advancedPlaygroundCopy.toggles.sizeToContent,
      toggle: () => setSizeToContentEnabled((value) => !value),
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
          <p className="example-control-description" id="advanced-responsive-description">{text(advancedPlaygroundCopy.descriptions.responsive)}</p>
          <div className="example-actions">
            <button
              className="example-toggle-button"
              type="button"
              aria-describedby="advanced-responsive-description"
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
              <EngineSelect
                description={text(advancedPlaygroundCopy.descriptions.controls.cellHeight)}
                descriptionId="advanced-cell-height-description"
                id="advanced-cell-height"
                label={text(advancedPlaygroundCopy.selects.cellHeight)}
                options={numericOptions(cellHeights)}
                value={String(cellHeight)}
                onChange={(value) => setCellHeight(Number(value) as (typeof cellHeights)[number])}
              />
              <EngineSelect
                description={text(advancedPlaygroundCopy.descriptions.controls.margin)}
                descriptionId="advanced-margin-description"
                id="advanced-margin"
                label={text(advancedPlaygroundCopy.selects.margin)}
                options={numericOptions(margins)}
                value={String(margin)}
                onChange={(value) => setMargin(Number(value) as (typeof margins)[number])}
              />
              <EngineSelect
                description={text(advancedPlaygroundCopy.descriptions.controls.rowLimit)}
                descriptionId="advanced-row-limit-description"
                id="advanced-row-limit"
                label={text(advancedPlaygroundCopy.selects.rowLimit)}
                options={rowLimitOptions}
                value={rowLimitKey}
                onChange={(value) => setRowLimitKey(value as RowLimitKey)}
              />
            </div>
            <div className="example-actions">
              {toggles.map(({ description, enabled, key, labels, toggle }) => (
                <div className="playground-advanced-control" key={key}>
                  <button
                    aria-describedby={`advanced-${key}-description`}
                    className="example-toggle-button"
                    type="button"
                    onClick={toggle}
                    {...toggleStateProps(enabled)}
                  >
                    {text(enabled ? labels.disable : labels.enable)}
                  </button>
                  <p className="playground-advanced-control__description" id={`advanced-${key}-description`}>
                    {text(description)}
                  </p>
                </div>
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
          className={sizeToContentEnabled ? "playground-advanced-grid--size-to-content" : undefined}
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
              {widget.id === "alerts" ? (
                <div className="playground-advanced-size-probe" data-testid="advanced-size-content-probe">
                  {advancedPlaygroundCopy.sizeToContentProbe.map((line) => <span key={line.ko}>{text(line)}</span>)}
                </div>
              ) : null}
            </div>
          )}
        />
      </section>
    </section>
  );
}
