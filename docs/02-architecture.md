# Architecture Draft

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
- controlled or uncontrolled state bridge
- cleanup on unmount

This layer must not expose GridStack as the main contract.

### Core State Layer

The core state layer owns:

- widget identity
- serialized layout snapshots
- column count clamping
- maximize and minimize state transitions
- reset and refresh commands
- pure helper tests

This layer should remain framework-light and easy to cover with Vitest.

### GridStack Adapter Layer

The adapter layer owns:

- GridStack initialization
- GridStack option mapping
- drag and resize event subscriptions
- layout load and compact commands
- movement and resize toggles
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
    option-mapper.ts
  components/
    DashboardGrid.tsx
    DashboardWidget.tsx
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

## Memory Strategy

- Release GridStack instances on unmount.
- Cancel pending `requestAnimationFrame` callbacks on widget removal and unmount.
- Disconnect `ResizeObserver` instances on widget removal and unmount.
- Use widget IDs as stable keys and avoid index-based identity.
- Keep example-only data outside runtime exports.
