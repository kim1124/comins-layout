# Current Component API Reference (`0.2.2`)

## DashboardGrid

```tsx
type DashboardGridProps<TWidgetData = unknown> = {
  widgets: DashboardWidget<TWidgetData>[];
  columns?: DashboardColumnCount;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  gridId?: string;
  acceptExternalWidgets?: boolean | ((candidate: DashboardWidgetDropCandidate<TWidgetData>) => boolean);
  gridTransferMode?: DashboardWidgetTransferMode;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  lazyRenderWidget?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  renderWidgetActions?: (widget: DashboardWidget<TWidgetData>) => React.ReactNode;
  onColumnsChange?: (columns: DashboardColumnCount) => void;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetLayout) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
  onWidgetDropRequest?: (request: DashboardWidgetDropRequest<TWidgetData>) => void;
  onBeforeMove?: (event: DashboardWidgetInteractionEvent) => void;
  onMove?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterMove?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeResize?: (event: DashboardWidgetInteractionEvent) => void;
  onResize?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterResize?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onMaximizeWidget?: (id: string) => void;
  onMinimizeWidget?: (id: string) => void;
  onRestoreWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  renderWidget: (widget: DashboardWidget<TWidgetData>) => React.ReactNode;
};
```

`onWidgetDragStart`, `onWidgetDragStop`, `onWidgetResizeStart`, `onWidgetResizeStop`, and the title-only `onWidgetHeaderDoubleClick` alias remain deprecated compatibility props throughout `0.2.x`. Use the canonical lifecycle props above; removal is planned for `0.3.0`.

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
  lazyLoad?: boolean;
  sizeToContent?: boolean | number;
  resizeToContentParent?: string;
};
```

`lazyLoad` is a per-widget override for `DashboardGrid.lazyRenderWidget`; it does not enable content lazy rendering by itself.

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
  insertWidgetAt: (
    widget: DashboardWidget<TData>,
    targetLayout: DashboardWidgetLayout,
    targetSnapshot: DashboardLayoutSnapshot,
  ) => void;
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
  getColumnCount(): number | null;
  getRowCount(): number | null;
  getFloat(): boolean | null;
  isAreaEmpty(layout: Omit<DashboardWidgetLayout, "id">): boolean | null;
  willItFit(layout: Omit<DashboardWidgetLayout, "id">): boolean | null;
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
- `engineOptions.rtl` and `engineOptions.sizeToContent` safely reinitialize the adapter. Other supported routine options synchronize in place.
- `engineOptions.lazyLoad` is deprecated: GridStack native lazy loading does not defer React-owned content. Use `lazyRenderWidget`.
- Invalid supported engine or responsive options throw `DashboardGridConfigurationError` during render without echoing values.

## Event Semantics

- `onLayoutCommit` runs after committed layout changes, not on every pointer move.
- `onWidgetResizeFrame` is an animation-frame-scheduled content-pixel notification; `onResize` is an active layout-geometry lifecycle event.
- `onWidgetExternalDrop` reports a final pointer or touch release in a configured same-document light DOM target. It is non-destructive: consumers choose whether to call `removeWidget(widgetId)`, and no DOM `CustomEvent` is dispatched.
- Move start ordering is `onBeforeMove` -> deprecated `onWidgetDragStart`. Stop ordering is `onWidgetLayoutChange` -> `onLayoutCommit` -> optional `onWidgetExternalDrop` -> deprecated `onWidgetDragStop` -> `onAfterMove`.
- Resize start ordering is `onBeforeResize` -> deprecated `onWidgetResizeStart`. Stop ordering is `onWidgetLayoutChange` -> `onLayoutCommit` -> deprecated `onWidgetResizeStop` -> `onAfterResize`.
- Title-only double-click ordering is `onBeforeTitleDoubleClick` -> `onTitleDoubleClick` -> deprecated `onWidgetHeaderDoubleClick` -> `onAfterTitleDoubleClick`.
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

`DashboardGrid`, `DashboardGridHandle`, `DashboardWidgetShell`, `DashboardWidgetActionLabels`, `useDashboardGrid`, `useDashboardDragIn`, transfer/state helpers, types, resize scheduler, and option mapper are public exports. GridStack adapter creation remains internal to the package boundary. `DashboardGridAdapterOptionOverrides` and the mapper's second argument are deprecated adapter-shaped compatibility exports planned for removal in `0.3.0`.

## Palette And Grid Transfer

- `useDashboardDragIn` registers a palette source. Its `createWidget` factory runs for each drag and palette mode is always `copy`.
- A transfer-enabled target requires a non-empty `gridId` and `acceptExternalWidgets`.
- `onWidgetDropRequest` is fail-closed. The adapter rolls back temporary GridStack DOM first; no callback means no controlled mutation.
- Use `insertDashboardWidgetAtLayout` when palette insertion rejection details are required.
- Use `transferDashboardWidget` for atomic source/target move or copy results.
- `insertWidgetAt` is a fire-and-forget reducer command for an already validated single-grid insertion.
- Rejected duplicate IDs, predicates, or non-transferable grid sources leave both controlled states unchanged.

## React Content Lazy Rendering

- `lazyRenderWidget=false` renders all widget content eagerly.
- When enabled, `DashboardWidget.lazyLoad=false` opts that widget out; `true` alone does not enable the global boundary.
- The nearest `[data-dashboard-lazy-scroll]` ancestor is the observer root; otherwise the viewport is used.
- Content mounts once and remains mounted. Without `IntersectionObserver`, client rendering falls back to eager content.
- Skeletons, loading state, root-margin/threshold options, and full virtualization are not public features.
