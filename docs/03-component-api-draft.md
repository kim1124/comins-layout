# Component API Draft

## DashboardGrid

```tsx
type DashboardGridProps<TWidgetData = unknown> = {
  widgets: DashboardWidget<TWidgetData>[];
  columns?: DashboardColumnCount;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  autoArrange?: boolean;
  onWidgetsChange?: (widgets: DashboardWidget<TWidgetData>[]) => void;
  onLayoutChange?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  renderWidget: (widget: DashboardWidget<TWidgetData>) => React.ReactNode;
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
};
```

## useDashboardGrid

```ts
type DashboardGridCommands<TData = unknown> = {
  createWidget: (widget: DashboardWidget<TData>) => void;
  updateWidget: (id: string, patch: Partial<DashboardWidget<TData>>) => void;
  removeWidget: (id: string) => void;
  maximizeWidget: (id: string) => void;
  minimizeWidget: (id: string) => void;
  restoreWidget: (id: string) => void;
  autoArrangeWidgets: () => void;
  resetLayout: (snapshot?: DashboardLayoutSnapshot) => void;
  refreshLayout: () => void;
  setColumns: (columns: DashboardColumnCount) => void;
  serializeLayout: () => DashboardLayoutSnapshot;
};
```

## Option Semantics

- `editable=false`: movement and resizing are disabled.
- `movable=false`: movement is disabled even when `editable=true`.
- `resizable=false`: resizing is disabled even when `editable=true`.
- Widget-level `locked=true`: the widget cannot move or resize.
- `columns` outside `1..12` must be clamped or rejected by an explicit API decision. Current scaffold provides a clamp helper.

## Event Semantics

- `onLayoutChange` should run after committed layout changes, not on every pointer move.
- `onWidgetResizeFrame` can run during resize, but must be animation-frame scheduled.
- CRUD callbacks should preserve widget identity and layout snapshot consistency.

## Initial Export Surface

The initial scaffold exports type contracts and column helpers only. React components and GridStack adapter implementation should be added by TDD in later tasks.
