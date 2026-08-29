import type {
  DashboardGridCommands,
  DashboardGridHandle,
  DashboardGridProps,
  DashboardWidgetActionLabels,
} from "../../src";

type EqualKeySet<Actual, Documented> =
  [Exclude<Actual, Documented>, Exclude<Documented, Actual>] extends [never, never]
    ? true
    : false;
type Assert<T extends true> = T;

export const dashboardGridPropNames = [
  "widgets",
  "columns",
  "engineOptions",
  "responsive",
  "externalDropTargets",
  "gridId",
  "acceptExternalWidgets",
  "gridTransferMode",
  "editable",
  "movable",
  "resizable",
  "className",
  "refreshKey",
  "showControls",
  "lazyRenderWidget",
  "actionLabels",
  "renderWidget",
  "renderWidgetActions",
  "onColumnsChange",
  "onLayoutCommit",
  "onWidgetLayoutChange",
  "onWidgetResizeFrame",
  "onWidgetExternalDrop",
  "onWidgetDropRequest",
  "onWidgetDragStart",
  "onWidgetDragStop",
  "onWidgetResizeStart",
  "onWidgetResizeStop",
  "onBeforeMove",
  "onMove",
  "onAfterMove",
  "onBeforeResize",
  "onResize",
  "onAfterResize",
  "onBeforeTitleDoubleClick",
  "onTitleDoubleClick",
  "onAfterTitleDoubleClick",
  "onMaximizeWidget",
  "onMinimizeWidget",
  "onRestoreWidget",
  "onRemoveWidget",
  "onWidgetHeaderDoubleClick",
] as const satisfies ReadonlyArray<keyof DashboardGridProps<unknown>>;

export const dashboardGridCommandNames = [
  "addWidget",
  "insertWidgetAt",
  "updateWidget",
  "updateWidgetLayout",
  "removeWidget",
  "clearWidgets",
  "maximizeWidget",
  "minimizeWidget",
  "restoreWidget",
  "autoArrangeWidgets",
  "fitWidgetsToColumns",
  "fitWidgetToColumns",
  "setColumns",
  "applyLayoutSnapshot",
  "resetLayout",
  "restoreLayout",
  "refreshLayout",
  "serializeLayout",
  "serializeState",
] as const satisfies ReadonlyArray<keyof DashboardGridCommands<unknown>>;

export const dashboardGridHandleNames = [
  "getGridStack",
  "getColumnCount",
  "getRowCount",
  "getFloat",
  "isAreaEmpty",
  "willItFit",
  "refresh",
  "compact",
  "commitLayout",
] as const satisfies ReadonlyArray<keyof DashboardGridHandle>;

type DashboardGridPropsAreComplete = Assert<
  EqualKeySet<keyof DashboardGridProps<unknown>, typeof dashboardGridPropNames[number]>
>;
type DashboardGridCommandsAreComplete = Assert<
  EqualKeySet<keyof DashboardGridCommands<unknown>, typeof dashboardGridCommandNames[number]>
>;
type DashboardGridHandleIsComplete = Assert<
  EqualKeySet<keyof DashboardGridHandle, typeof dashboardGridHandleNames[number]>
>;

export const publicDocTypeContract: [
  DashboardGridPropsAreComplete,
  DashboardGridCommandsAreComplete,
  DashboardGridHandleIsComplete,
] = [true, true, true];

export const actionLabelsFixture: DashboardWidgetActionLabels = {
  maximize: "Maximize",
  minimize: "Minimize",
  restore: "Restore",
  remove: "Remove",
};
