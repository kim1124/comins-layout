# Architecture

## Layers

```text
consumer app
  -> comins-grid-layout React components
    -> dashboard state and command API
      -> GridStack adapter
        -> gridstack runtime
```

## Runtime Boundaries

### React API Layer

The React API layer owns:

- public props
- render structure
- widget render slots
- user callbacks
- controlled state bridge
- React content lazy-render boundary
- cleanup on unmount

This layer must not expose GridStack as the main contract.

### Core State Layer

The core state layer owns:

- widget identity
- serialized layout snapshots
- column count clamping
- maximize and minimize state transitions
- reset and refresh commands
- palette insertion과 cross-grid transfer의 pure state transition
- pure helper tests

This layer should remain framework-light and easy to cover with Vitest.

### GridStack Adapter Layer

The adapter layer owns:

- GridStack initialization
- GridStack option mapping
- drag and resize event subscriptions
- layout load and compact commands
- movement and resize toggles
- palette/Grid source registry와 incoming drop rollback
- instance cleanup

This layer is the only place that should import from `gridstack`.

## Proposed Source Layout

```text
src/
  core/
    columns.ts
    layout-state.ts
    resize-scheduler.ts
    types.ts
  gridstack/
    adapter.ts
    drag-in.ts
    option-mapper.ts
    transfer-registry.ts
  components/
    DashboardGrid.tsx
    DashboardWidget.tsx
    use-dashboard-drag-in.ts
  index.ts
```

## State Model

```ts
type DashboardWidgetId = string;

type DashboardWidgetLayout = {
  id: DashboardWidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

type DashboardLayoutSnapshot = {
  columns: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  widgets: DashboardWidgetLayout[];
};
```

## Performance Strategy

- Initialize GridStack once per grid container.
- Apply option changes through the instance API where possible.
- Commit serialized layout changes after drag stop or resize stop.
- Schedule content resize callbacks with one animation frame per widget per frame.
- Keep previous layout snapshots for maximize and minimize in a map keyed by widget ID.
- Avoid storing non-serializable engine objects in public state.
- Keep all GridStack items mounted while `lazyRenderWidget` defers only consumer content.
- Retain content after its first intersection to avoid scroll-driven mount churn.

## Transfer Boundary

- `externalDropTargets` reports a Grid widget release over ordinary consumer HTML and never mutates state.
- `useDashboardDragIn` registers palette sources through the adapter-owned GridStack bridge.
- Incoming `onWidgetDropRequest` is emitted only after GridStack's temporary DOM transfer is rolled back.
- `insertDashboardWidgetAtLayout` and `transferDashboardWidget` are pure controlled-state helpers. Rejection preserves both source and target state.

## Lazy Rendering Boundary

- `lazyRenderWidget` owns React content deferral. Within that boundary, `DashboardWidget.lazyLoad` overrides the global setting per widget; its GridStack mapping does not defer React-owned content.
- Native `DashboardGridEngineOptions.lazyLoad` is ineffective for React-owned content and deprecated in `0.2.1`.
- The observer root is the nearest `[data-dashboard-lazy-scroll]` ancestor or the viewport.
- Outer GridStack items and widget shells always remain mounted. Skeleton UI and full virtualization are not implemented.

## Memory Strategy

- Release GridStack instances on unmount.
- Cancel pending `requestAnimationFrame` callbacks on widget removal and unmount.
- Disconnect `ResizeObserver` instances on widget removal and unmount.
- Use widget IDs as stable keys and avoid index-based identity.
- Keep example-only data outside runtime exports.
