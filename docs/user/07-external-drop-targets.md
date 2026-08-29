# External Drop Targets

Use `externalDropTargets` to detect a widget released over consumer-owned HTML. The package reports the release through `onWidgetExternalDrop`; it does not remove or otherwise mutate controlled widget state.

```tsx
export function DashboardWithTrash() {
  const dashboard = useDashboardGrid({ initialWidgets });

  return (
    <>
      <DashboardGrid
        widgets={dashboard.widgets}
        externalDropTargets={[{ id: "trash", selector: "#dashboard-trash" }]}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        onWidgetExternalDrop={(event) => {
          if (event.targetId === "trash") {
            dashboard.commands.removeWidget(event.widgetId);
          }
        }}
        renderWidget={(widget) => widget.title}
      />
      <aside id="dashboard-trash" aria-label="Remove widget">Drop here to remove</aside>
    </>
  );
}
```

The event includes `widgetId`, `targetId`, active `columns`, and committed `layout`. The callback runs after the layout commit for the completed move, so apply `onLayoutCommit` even when the consumer then removes the widget.

Target IDs must be non-empty and unique. Selectors must be non-empty, valid selectors that resolve in the dashboard's owner document. Targets are same-document light-DOM elements; cross-frame and shadow-root targeting are outside the contract. A target does not need to be a GridStack container.

Invalid target configuration throws `DashboardGridConfigurationError`. Dropping outside all configured target bounds produces no external-drop event.

This feature is grid-to-HTML release. For palette-to-grid or grid-to-grid operations, use [Palette and Grid Transfer](./08-palette-and-grid-transfer.md).
