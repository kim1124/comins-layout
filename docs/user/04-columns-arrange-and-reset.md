# Columns, Arrange, and Reset

`DashboardGrid` and `useDashboardGrid` support integer column counts from `1` through `12`. `setColumns` clamps other numbers into that range and restores the cached layout when that column count has already been visited.

```tsx
export function LayoutToolbar() {
  const dashboard = useDashboardGrid({ initialColumns: 12, initialWidgets });

  return (
    <>
      <button type="button" onClick={() => dashboard.commands.setColumns(6)}>6 columns</button>
      <button type="button" onClick={() => dashboard.commands.autoArrangeWidgets()}>Arrange</button>
      <button type="button" onClick={() => dashboard.commands.fitWidgetsToColumns()}>Fit all</button>
      <button type="button" onClick={() => dashboard.commands.fitWidgetToColumns("sales")}>Fit sales</button>
      <button type="button" onClick={() => dashboard.commands.resetLayout()}>Reset</button>
      <DashboardGrid
        className="analytics-grid"
        columns={dashboard.columns}
        widgets={dashboard.widgets}
        onColumnsChange={dashboard.commands.setColumns}
        onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.title}
      />
    </>
  );
}
```

- `autoArrangeWidgets` compacts widgets into deterministic row-major positions.
- `fitWidgetsToColumns` clamps all active layouts to the current width; `fitWidgetToColumns` applies the same rule to one ID.
- `resetLayout()` restores the hook's initial snapshot. Passing a layout or full state snapshot resets to that value instead.
- `onColumnsChange` is required when `responsive` owns the active column count. Without responsive options, the controlled `columns` prop is authoritative.
- `className` adds a consumer class beside `.grid-stack` and `.comins-grid-layout`.

Each visited column count owns its own layout cache. CRUD identity changes propagate across existing caches; active layout-only operations change the current cache entry. See [Persistence](./05-persistence.md) before storing or migrating state.

Playground: `/examples/layout/arrange`.
