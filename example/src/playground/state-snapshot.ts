import { DASHBOARD_COLUMN_COUNTS } from "../../../src";
import type {
  DashboardColumnCount,
  DashboardColumnLayoutSnapshot,
  DashboardLayoutsByColumn,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetLayout,
} from "../../../src";

const layoutLimitKeys = ["minW", "minH", "maxW", "maxH"] as const;
const supportedColumnKeys = new Set(DASHBOARD_COLUMN_COUNTS.map(String));
const booleanWidgetMetadataKeys = ["locked", "movable", "resizable", "minimized", "maximized"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayout(value: unknown): value is DashboardWidgetLayout {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    [value.x, value.y, value.w, value.h].every(
      (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate),
    ) &&
    layoutLimitKeys.every(
      (key) => value[key] === undefined || (typeof value[key] === "number" && Number.isFinite(value[key])),
    ) &&
    (value.w as number) > 0 &&
    (value.h as number) > 0
  );
}

function isPreviousLayoutMap(
  value: unknown,
  widgetIds: ReadonlySet<string>,
): value is Record<string, DashboardWidgetLayout> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([id, layout]) => widgetIds.has(id) && isLayout(layout) && layout.id === id,
    )
  );
}

function isColumnLayoutSnapshot(
  value: unknown,
  widgetIds: ReadonlySet<string>,
): value is DashboardColumnLayoutSnapshot {
  if (!isRecord(value) || !Array.isArray(value.widgets) || !value.widgets.every(isLayout)) {
    return false;
  }

  return (
    new Set(value.widgets.map((layout) => layout.id)).size === value.widgets.length &&
    value.widgets.every((layout) => widgetIds.has(layout.id)) &&
    isPreviousLayoutMap(value.previousLayouts, widgetIds)
  );
}

function isWidget<TData>(value: unknown): value is DashboardWidget<TData> {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isLayout(value.layout) &&
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

export function sanitizeDashboardStateSnapshot<TData>(
  value: unknown,
): DashboardStateSnapshotInput<TData> | undefined {
  if (!isRecord(value) || !isSupportedColumns(value.columns) || !Array.isArray(value.widgets)) {
    return undefined;
  }

  if (!value.widgets.every((widget) => isWidget<TData>(widget))) {
    return undefined;
  }

  const widgets = value.widgets;
  const widgetIds = new Set(widgets.map((widget) => widget.id));
  if (widgetIds.size !== widgets.length) {
    return undefined;
  }

  if (value.previousLayouts !== undefined && !isPreviousLayoutMap(value.previousLayouts, widgetIds)) {
    return undefined;
  }

  let layoutsByColumn: DashboardLayoutsByColumn | undefined;
  if (value.layoutsByColumn !== undefined) {
    if (!isRecord(value.layoutsByColumn)) {
      return undefined;
    }

    const supportedLayouts: DashboardLayoutsByColumn = {};
    Object.entries(value.layoutsByColumn).forEach(([column, snapshot]) => {
      if (!supportedColumnKeys.has(column) || !isColumnLayoutSnapshot(snapshot, widgetIds)) {
        return;
      }
      supportedLayouts[Number(column) as DashboardColumnCount] = snapshot;
    });
    layoutsByColumn = supportedLayouts;
  }

  return {
    columns: value.columns,
    widgets,
    ...(value.previousLayouts === undefined ? {} : { previousLayouts: value.previousLayouts }),
    ...(layoutsByColumn === undefined ? {} : { layoutsByColumn }),
  };
}
