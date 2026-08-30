# Palette and Grid Transfer

Transfer is a request/commit protocol: the DOM interaction creates a typed request, the adapter rolls back temporary engine ownership, and the consumer accepts or rejects the operation by updating controlled React state.

## Palette to grid

```tsx
import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  useDashboardDragIn,
  useDashboardGrid,
} from "comins-grid-layout";

let sequence = 0;

export function TransferTarget() {
  const target = useDashboardGrid({ initialColumns: 12 });
  const paletteRef = useDashboardDragIn({
    sourceId: "metric-palette",
    previewLayout: { w: 2, h: 2 },
    createWidget: () => {
      const id = `metric-${++sequence}`;
      return { id, title: "Metric", layout: { id, x: 0, y: 0, w: 2, h: 2 } };
    },
    dragOptions: { scroll: true },
  });

  return (
    <>
      <button ref={paletteRef} type="button">Drag metric</button>
      <DashboardGrid
        gridId="target-grid"
        acceptExternalWidgets
        widgets={target.widgets}
        onLayoutCommit={target.commands.applyLayoutSnapshot}
        onWidgetDropRequest={(request) => {
          const result = insertDashboardWidgetAtLayout(
            target.state,
            request.widget,
            request.targetLayout,
            request.targetSnapshot,
          );
          if (result.accepted) {
            target.commands.restoreLayout(serializeDashboardState(result.state));
          }
        }}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

`useDashboardDragIn` returns a ref callback. Its `sourceId` identifies the palette, `previewLayout` defines drag geometry, and `createWidget` must return a fresh stable ID for every drag. `dragOptions` configures the source interaction; `disabled` disconnects it.

## Grid to grid

Give every source and target a unique `gridId`. Set the source `gridTransferMode` to `move` or `copy`; the default registered source mode is `move`. The target enables `acceptExternalWidgets` as `true` or a predicate and handles `onWidgetDropRequest`.

When source and target grids use different column widths, the adapter preserves the pointer's normalized grab point and maps it into the target cell geometry. A drop beside an existing widget therefore remains in the intended row instead of colliding one column early and falling to a lower row.

For a grid source request, call `transferDashboardWidget` with the source state, target state, request layout/snapshot, widget ID, and mode. On acceptance, restore `serializeDashboardState(result.source)` and `serializeDashboardState(result.target)` into the corresponding hooks. `move` removes the source identity; `copy` preserves it.

The helper rejects `missing-widget`, `duplicate-id`, `not-transferable`, or `invalid-layout`. Same-state transfer, locked/non-movable widgets, minimized/maximized widgets, and invalid modes are not transferable. Rejection must leave both controlled states unchanged. Deduplicate requests by `operationId` if the application can replay external events.

`acceptExternalWidgets` requires a non-empty `gridId`; `gridTransferMode` also requires `gridId`. Invalid configuration throws `DashboardGridConfigurationError`.

Playground: `/examples/advanced/multi-grid/horizontal`. Use the in-page orientation control to compare horizontal and vertical Grid placement without changing the transfer contract.

Controlled deletion through an external DOM drop target is demonstrated separately at `/examples/advanced/external-drop-trash`.
