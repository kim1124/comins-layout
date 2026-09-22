# Advanced GridStack Access

Use a `DashboardGridHandle` ref for queries and engine operations that the controlled component does not expose declaratively. Query and snapshot-returning methods may return `null` before the client adapter is ready or after unmount. `refresh` has no return value.

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

- `getColumnCount`, `getRowCount`, and `getFloat` query current engine state. `getRowCount` includes `minRow`; it is not the maximum capacity.
- `isAreaEmpty` checks whether an `x`, `y`, `w`, `h` area is free of existing widgets.
- `willItFit` checks whether an added widget can fit within the `maxRow` height limit after engine rearrangement. It is not an empty-area check and always returns `true` when no `maxRow` limit is set.
- `refresh` remeasures content and refreshes handles, committing corrected geometry after active interaction finishes; hook users normally call `refreshLayout` and pass `refreshVersion` as `refreshKey`.
- `compact` invokes GridStack compaction, emits the controlled commit, and returns the resulting layout snapshot.
- `commitLayout` emits/deduplicates the current controlled snapshot and returns it.
- `getGridStack` returns the complete borrowed GridStack instance as the final escape hatch.

`compact` already uses the `onLayoutCommit` path shown above. React state is updated only when the consumer connects that callback, as in the example. After other raw operations that change geometry without emitting a GridStack change, call `commitLayout` to deliver the snapshot through the same callback. If using GridStack `batchUpdate()`, commit after `batchUpdate(false)`. Controlled updates wait for that batch to close and then apply the latest snapshot while retaining widget DOM.

Do not call raw add/remove methods for React widgets, call `destroy()`, or remove listeners from the borrowed instance. `DashboardGrid` owns engine and DOM lifecycle. Prefer `addWidget`, `removeWidget`, and other controlled commands.

Playground: `/examples/advanced/public-api` and API reference `/api`.
