import { DASHBOARD_COLUMN_COUNTS } from "../../../src";
import type {
  DashboardColumnCount,
  DashboardColumnLayoutSnapshot,
  DashboardLayoutSnapshot,
  DashboardLayoutsByColumn,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetLayout,
} from "../../../src";
import { isPastelColorKey, pastelKeyForIndex } from "./palette";
import type { ExampleWidgetData } from "./types";

const layoutLimitKeys = ["minW", "minH", "maxW", "maxH"] as const;
const supportedColumnKeys = new Set(DASHBOARD_COLUMN_COUNTS.map(String));
const booleanWidgetMetadataKeys = ["locked", "movable", "resizable", "minimized", "maximized"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function hasValidLayoutLimits(value: Record<string, unknown>, columns: DashboardColumnCount): boolean {
  if (!layoutLimitKeys.every((key) => value[key] === undefined || isPositiveInteger(value[key]))) {
    return false;
  }

  const minW = value.minW as number | undefined;
  const minH = value.minH as number | undefined;
  const maxW = value.maxW as number | undefined;
  const maxH = value.maxH as number | undefined;
  return (
    (minW === undefined || minW <= columns) &&
    (maxW === undefined || maxW <= columns) &&
    (minW === undefined || maxW === undefined || minW <= maxW) &&
    (minH === undefined || maxH === undefined || minH <= maxH)
  );
}

function isLayout(value: unknown, columns: DashboardColumnCount): value is DashboardWidgetLayout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    [value.x, value.y, value.w, value.h].every(
      (coordinate) => typeof coordinate === "number" && Number.isInteger(coordinate),
    ) &&
    hasValidLayoutLimits(value, columns) &&
    (value.x as number) >= 0 &&
    (value.y as number) >= 0 &&
    (value.w as number) > 0 &&
    (value.h as number) > 0 &&
    (value.x as number) + (value.w as number) <= columns
  );
}

function isPreviousLayoutMap(
  value: unknown,
  widgetIds: ReadonlySet<string>,
  columns: DashboardColumnCount,
): value is Record<string, DashboardWidgetLayout> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([id, layout]) => widgetIds.has(id) && isLayout(layout, columns) && layout.id === id,
    )
  );
}

function isColumnLayoutSnapshot(
  value: unknown,
  widgetIds: ReadonlySet<string>,
  columns: DashboardColumnCount,
): value is DashboardColumnLayoutSnapshot {
  if (!isRecord(value) || !Array.isArray(value.widgets) || !value.widgets.every((layout) => isLayout(layout, columns))) {
    return false;
  }

  return (
    new Set(value.widgets.map((layout) => layout.id)).size === value.widgets.length &&
    value.widgets.every((layout) => widgetIds.has(layout.id)) &&
    isPreviousLayoutMap(value.previousLayouts, widgetIds, columns)
  );
}

function isWidget<TData>(value: unknown, columns: DashboardColumnCount): value is DashboardWidget<TData> {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isLayout(value.layout, columns) &&
    value.layout.id === value.id &&
    (value.title === undefined || typeof value.title === "string") &&
    booleanWidgetMetadataKeys.every(
      (key) => value[key] === undefined || typeof value[key] === "boolean",
    )
  );
}

function isSupportedColumns(value: unknown): value is DashboardColumnCount {
  return typeof value === "number" && DASHBOARD_COLUMN_COUNTS.includes(value as DashboardColumnCount);
}

export function sanitizeDashboardLayoutSnapshot(value: unknown): DashboardLayoutSnapshot | undefined {
  if (!isRecord(value) || !isSupportedColumns(value.columns) || !Array.isArray(value.widgets)) {
    return undefined;
  }
  const columns = value.columns;
  if (!value.widgets.every((layout) => isLayout(layout, columns))) {
    return undefined;
  }

  const widgetIds = value.widgets.map((layout) => layout.id);
  if (new Set(widgetIds).size !== widgetIds.length) {
    return undefined;
  }

  return {
    columns,
    widgets: value.widgets.map((layout) => ({ ...layout })),
  };
}

export function sanitizeDashboardStateSnapshot<TData>(
  value: unknown,
): DashboardStateSnapshotInput<TData> | undefined {
  if (!isRecord(value) || !isSupportedColumns(value.columns) || !Array.isArray(value.widgets)) {
    return undefined;
  }
  const columns = value.columns;

  if (!value.widgets.every((widget) => isWidget<TData>(widget, columns))) {
    return undefined;
  }

  const widgets = value.widgets;
  const widgetIds = new Set(widgets.map((widget) => widget.id));
  if (widgetIds.size !== widgets.length) {
    return undefined;
  }

  if (value.previousLayouts !== undefined && !isPreviousLayoutMap(value.previousLayouts, widgetIds, columns)) {
    return undefined;
  }

  let layoutsByColumn: DashboardLayoutsByColumn | undefined;
  if (value.layoutsByColumn !== undefined) {
    if (!isRecord(value.layoutsByColumn)) {
      return undefined;
    }

    const supportedLayouts: DashboardLayoutsByColumn = {};
    for (const [column, snapshot] of Object.entries(value.layoutsByColumn)) {
      if (!supportedColumnKeys.has(column)) {
        continue;
      }
      const supportedColumns = Number(column) as DashboardColumnCount;
      if (!isColumnLayoutSnapshot(snapshot, widgetIds, supportedColumns)) {
        return undefined;
      }
      supportedLayouts[supportedColumns] = snapshot;
    }
    layoutsByColumn = supportedLayouts;
  }

  return {
    columns,
    widgets,
    ...(value.previousLayouts === undefined ? {} : { previousLayouts: value.previousLayouts }),
    ...(layoutsByColumn === undefined ? {} : { layoutsByColumn }),
  };
}

type LegacyExampleWidgetData = Omit<ExampleWidgetData, "colorKey" | "contentRevision"> &
  Partial<Pick<ExampleWidgetData, "colorKey" | "contentRevision">>;

function hasSafeExampleWidgetData(data: unknown): data is LegacyExampleWidgetData {
  return (
    isRecord(data) &&
    typeof data.description === "string" &&
    typeof data.value === "string" &&
    (data.fixtureCopyKey === undefined || typeof data.fixtureCopyKey === "string") &&
    (data.generatedDescriptionKey === undefined || typeof data.generatedDescriptionKey === "string") &&
    (data.colorKey === undefined || isPastelColorKey(data.colorKey)) &&
    (data.contentRevision === undefined || (typeof data.contentRevision === "number" && Number.isInteger(data.contentRevision) && data.contentRevision >= 0)) &&
    (data.fixtureIndex === undefined || (typeof data.fixtureIndex === "number" && Number.isInteger(data.fixtureIndex) && data.fixtureIndex > 0))
  );
}

export function sanitizeExampleDashboardStateSnapshot(
  value: unknown,
): DashboardStateSnapshotInput<ExampleWidgetData> | undefined {
  const snapshot = sanitizeDashboardStateSnapshot<unknown>(value);
  if (!snapshot || !snapshot.widgets.every((widget) => widget.data === undefined || hasSafeExampleWidgetData(widget.data))) {
    return undefined;
  }

  const widgets: DashboardWidget<ExampleWidgetData>[] = snapshot.widgets.map((widget, index) => {
    if (widget.data === undefined) {
      return { ...widget, layout: { ...widget.layout } } as DashboardWidget<ExampleWidgetData>;
    }

    const data = widget.data as LegacyExampleWidgetData;
    const normalizedData: ExampleWidgetData = {
      ...data,
      colorKey: data.colorKey ?? pastelKeyForIndex(index),
      contentRevision: data.contentRevision ?? 0,
    };
    return { ...widget, data: normalizedData, layout: { ...widget.layout } };
  });

  return {
    columns: snapshot.columns,
    widgets,
    ...(snapshot.previousLayouts === undefined
      ? {}
      : {
          previousLayouts: Object.fromEntries(
            Object.entries(snapshot.previousLayouts).map(([id, layout]) => [id, { ...layout }]),
          ),
        }),
    ...(snapshot.layoutsByColumn === undefined
      ? {}
      : {
          layoutsByColumn: Object.fromEntries(
            Object.entries(snapshot.layoutsByColumn).map(([column, columnSnapshot]) => [
              column,
              {
                previousLayouts: Object.fromEntries(
                  Object.entries(columnSnapshot.previousLayouts).map(([id, layout]) => [id, { ...layout }]),
                ),
                widgets: columnSnapshot.widgets.map((layout) => ({ ...layout })),
              },
            ]),
          ) as DashboardLayoutsByColumn,
        }),
  };
}
