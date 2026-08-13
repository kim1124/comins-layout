# Component API Draft

## DashboardGrid

```tsx
type DashboardGridProps<TWidgetData = unknown> = {
  widgets: DashboardWidget<TWidgetData>[];
  columns?: DashboardColumnCount;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  onColumnsChange?: (columns: DashboardColumnCount) => void;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetLayout) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
  onWidgetDragStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetDragStop?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStop?: (event: DashboardWidgetInteractionEvent) => void;
  onMaximizeWidget?: (id: string) => void;
  onMinimizeWidget?: (id: string) => void;
  onRestoreWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  onWidgetHeaderDoubleClick?: (id: string) => void;
  renderWidget: (widget: DashboardWidget<TWidgetData>) => React.ReactNode;
};
```

## DashboardExternalDropTarget

```ts
type DashboardExternalDropTarget = {
  id: string;
  selector: string;
};
```

## DashboardWidgetExternalDropEvent

```ts
type DashboardWidgetExternalDropEvent = {
  widgetId: DashboardWidgetId;
  targetId: string;
  columns: DashboardColumnCount;
  layout: DashboardWidgetLayout;
};
```

## DashboardWidget

```ts
type DashboardWidget<TData = unknown> = {
  id: string;
  title?: string;
  layout: DashboardWidgetLayout;
  data?: TData;
  minimized?: boolean;
  maximized?: boolean;
  locked?: boolean;
  movable?: boolean;
  resizable?: boolean;
};
```

## Per-column persistence types

```ts
type DashboardColumnLayoutSnapshot = {
  widgets: DashboardWidgetLayout[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};

type DashboardLayoutsByColumn = Partial<
  Record<DashboardColumnCount, DashboardColumnLayoutSnapshot>
>;

type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn: DashboardLayoutsByColumn;
};

type DashboardStateSnapshotInput<TData = unknown> = {
  columns: number;
  widgets: DashboardWidget<TData>[];
  previousLayouts?: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn?: DashboardLayoutsByColumn;
};
```

## useDashboardGrid

```ts
type DashboardGridCommands<TData = unknown> = {
  addWidget: (widget: DashboardWidget<TData>) => void;
  updateWidget: (id: string, patch: Partial<DashboardWidget<TData>>) => void;
  updateWidgetLayout: (id: string, patch: Partial<Omit<DashboardWidgetLayout, "id">>) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
  maximizeWidget: (id: string) => void;
  minimizeWidget: (id: string) => void;
  restoreWidget: (id: string) => void;
  autoArrangeWidgets: () => void;
  fitWidgetsToColumns: () => void;
  fitWidgetToColumns: (id: string) => void;
  applyLayoutSnapshot: (snapshot: DashboardLayoutSnapshot) => void;
  resetLayout: (snapshot?: DashboardLayoutSnapshot | DashboardStateSnapshotInput<TData>) => void;
  restoreLayout: (snapshot: DashboardStateSnapshotInput<TData>) => void;
  refreshLayout: () => void;
  setColumns: (columns: number) => void;
  serializeLayout: () => DashboardLayoutSnapshot;
  serializeState: () => DashboardStateSnapshot<TData>;
};
```

## DashboardGridHandle

```ts
interface DashboardGridHandle {
  getGridStack(): GridStack | null;
  refresh(): void;
  compact(layout?: "compact" | "list", doSort?: boolean): DashboardLayoutSnapshot | null;
  commitLayout(): DashboardLayoutSnapshot | null;
}
```

The handle is an optional advanced escape hatch. Comins commands remain the primary React state and CRUD API. The returned GridStack instance is borrowed; DashboardGrid owns initialization, listeners, and destruction. A controlled example must not call raw GridStack `addWidget`, `removeWidget`, or `destroy`; use the documented handle methods and Comins commands instead.

## Option Semantics

- `editable=false`: movement and resizing are disabled.
- `movable=false`: movement is disabled even when `editable=true`.
- `resizable=false`: resizing is disabled even when `editable=true`.
- Widget-level `locked=true`: the widget cannot move or resize.
- `columns` outside `1..12` are clamped by the core state helper.
- Without `responsive`, `columns` is authoritative. With `responsive`, it is the initial/fallback count and `grid.getColumn()` is the active source of truth.
- `engineOptions.nonce` is initialization-only and requires a remount to change.
- Invalid supported engine or responsive options throw `DashboardGridConfigurationError` during render without echoing values.

## Event Semantics

- `onLayoutCommit` runs after committed layout changes, not on every pointer move.
- `onWidgetResizeFrame` can run during resize, but must be animation-frame scheduled.
- `onWidgetExternalDrop` reports a final pointer or touch release in a configured same-document light DOM target. It is non-destructive: consumers choose whether to call `removeWidget(widgetId)`, and no DOM `CustomEvent` is dispatched.
- Drag interaction-stop ordering is `onWidgetLayoutChange` -> `onLayoutCommit` -> optional `onWidgetExternalDrop` -> `onWidgetDragStop`.
- Resize interaction-stop ordering is `onWidgetLayoutChange` -> `onLayoutCommit` -> `onWidgetResizeStop`.
- `onColumnsChange` reports actual engine columns only when the active count changes.
- CRUD callbacks should preserve widget identity and layout snapshot consistency.

## Snapshot Persistence

- `serializeState()` returns `DashboardStateSnapshot`: active `columns`, full `widgets`, active `previousLayouts`, and `layoutsByColumn: DashboardLayoutsByColumn` for every visited supported column.
- `serializeLayout()` returns the unchanged active-only `DashboardLayoutSnapshot`: active `columns` and widget geometry only; it never serializes `layoutsByColumn`.
- `restoreLayout()` accepts `DashboardStateSnapshotInput`. A legacy JSON snapshot without `previousLayouts` or `layoutsByColumn` restores with an empty restore map and no inactive cache.
- If the input's active `layoutsByColumn[columns]` conflicts with top-level state, top-level `widgets` and `previousLayouts` are authoritative. Unsupported serialized column keys are ignored.
- Switching columns restores the matching cache. CRUD keeps IDs coherent across cached layouts, layout-only operations update the active cache, and maximize/minimize/restore preserve the active cache's restore geometry.

```ts
dashboard.commands.setColumns(12);
dashboard.commands.setColumns(6);
dashboard.commands.setColumns(12); // Restores the 12-column cache.

const saved = dashboard.commands.serializeState();
dashboard.commands.restoreLayout(saved);
```
- `applyLayoutSnapshot()` applies active columns and matching widget geometry in one reducer action while preserving widget data and order.

## Current Export Surface

`DashboardGrid`, `DashboardGridHandle`, `DashboardWidgetShell`, `useDashboardGrid`, core layout helpers, types, resize scheduler, and option mapper are public exports. GridStack adapter creation remains internal to the package boundary.
