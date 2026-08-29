# Advanced GridStack Access

Use a `DashboardGridHandle` ref for queries and engine operations that the controlled component does not expose declaratively. Methods return `null` when the client adapter is not ready.

```tsx
import { useRef } from "react";
import { DashboardGrid, type DashboardGridHandle } from "comins-grid-layout";

export function AdvancedDashboard() {
  const gridRef = useRef<DashboardGridHandle>(null);

  const compactAndCommit = () => {
    gridRef.current?.compact("compact", true);
  };

  return (
    <>
      <button type="button" onClick={compactAndCommit}>Compact</button>
      <DashboardGrid
        ref={gridRef}
        widgets={dashboard.widgets}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

## Safe handle surface

- `getColumnCount`, `getRowCount`, and `getFloat` query current engine state.
- `isAreaEmpty` and `willItFit` query a geometry object containing `x`, `y`, `w`, and `h`.
- `refresh` resynchronizes the adapter immediately; hook users normally call `refreshLayout` and pass `refreshVersion` as `refreshKey`.
- `compact` invokes GridStack compaction, emits the controlled commit, and returns the resulting layout snapshot.
- `commitLayout` emits/deduplicates the current controlled snapshot and returns it.
- `getGridStack` returns the complete borrowed GridStack instance as the final escape hatch.

`compact` already uses the `onLayoutCommit` path shown above. After other raw operations that change geometry without emitting a GridStack change, call `commitLayout`; the same callback writes the snapshot to React state. If using GridStack `batchUpdate()`, commit after `batchUpdate(false)`.

Do not call raw add/remove methods for React widgets, call `destroy()`, or remove listeners from the borrowed instance. `DashboardGrid` owns engine and DOM lifecycle. Prefer `addWidget`, `removeWidget`, and other controlled commands.

Playground: `/examples/advanced/public-api` and API reference `/api`.
