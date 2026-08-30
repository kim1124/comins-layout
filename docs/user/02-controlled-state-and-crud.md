# Controlled State and CRUD

Use `useDashboardGrid` when the dashboard must remain serializable and React-controlled. The hook initializes once from `initialColumns` and `initialWidgets`; later changes should go through its commands or a restored snapshot.

```tsx
import { DashboardGrid, useDashboardGrid } from "comins-grid-layout";

export function EditableDashboard() {
  const dashboard = useDashboardGrid({
    initialColumns: 12,
    initialWidgets: [],
    onLayoutMutation: (event) => {
      console.log(event.kind, event.widgetIds, event.snapshot);
    },
  });

  const addMetric = () => {
    const id = crypto.randomUUID();
    dashboard.commands.addWidget({
      id,
      title: "Metric",
      layout: { id, x: 0, y: 0, w: 3, h: 2 },
    });
  };

  return (
    <>
      <button type="button" onClick={addMetric}>Add metric</button>
      <DashboardGrid
        columns={dashboard.columns}
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

Reuse one ID for both `widget.id` and `widget.layout.id`. Duplicate IDs and invalid insertion layouts are rejected by the pure insertion helper.

## Command reference

- `addWidget` adds a widget using its supplied layout.
- `insertWidgetAt` inserts a palette or transferred widget against the target layout and target snapshot.
- `updateWidget` patches metadata, data, flags, or layout; `updateWidgetLayout` patches geometry only.
- `removeWidget` removes one identity; `clearWidgets` removes every widget.
- `maximizeWidget`, `minimizeWidget`, and `restoreWidget` update display state while retaining restore geometry.
- `applyLayoutSnapshot` writes a completed GridStack layout back to React state.
- `refreshLayout` increments the hook's `refreshVersion` for the component `refreshKey`.
- `resetLayout`, `restoreLayout`, `serializeLayout`, and `serializeState` are covered in [Persistence](./05-persistence.md).
- `setColumns`, `autoArrangeWidgets`, `fitWidgetsToColumns`, and `fitWidgetToColumns` are covered in [Columns, Arrange, and Reset](./04-columns-arrange-and-reset.md).

The root exports also include pure state helpers for reducers or non-React code. `insertDashboardWidgetAtLayout` returns an accepted/rejected result without mutating either input. `serializeDashboardState` creates a complete serializable snapshot. `transferDashboardWidget` is described in the transfer guide.

Do not use raw GridStack add/remove methods for React content. Raw engine CRUD changes only engine/DOM state and can be replaced by the next controlled render.

Playground: `/examples/widget/manage`.
