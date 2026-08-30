# Responsive Layouts

Use the `responsive` prop when GridStack should calculate the active column count from container or window width. Keep `columns` in React state and write `onColumnsChange` back so rendering, serialization, and the engine agree.

```tsx
<DashboardGrid
  columns={dashboard.columns}
  widgets={dashboard.widgets}
  responsive={{
    breakpoints: [
      { maxWidth: 640, columns: 1, layout: "list" },
      { maxWidth: 960, columns: 6, layout: "moveScale" },
      { maxWidth: 1280, columns: 12, layout: "moveScale" },
    ],
    breakpointForWindow: false,
    layout: "moveScale",
  }}
  onColumnsChange={dashboard.commands.setColumns}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

`responsive` must provide a positive `columnWidth` or at least one breakpoint. `columnMax` limits width-derived columns to `1..12`. Breakpoint `maxWidth` values must be positive and unique, and each breakpoint column must be `1..12`. Supported layout strategies are `list`, `compact`, `moveScale`, `move`, `scale`, and `none`.

Set `breakpointForWindow: true` only when breakpoints should follow the window rather than the grid container. `columnWidth` supports automatic column calculation; it may be combined with `columnMax`, `breakpoints`, and a fallback `layout`.

Each active column count has a separate serializable cache. A `12 → 6 → 12` sequence restores the earlier 12-column geometry instead of repeatedly scaling the most recent layout. Persist with `serializeState`, not `serializeLayout`, when that history matters.

Invalid responsive configuration throws `DashboardGridConfigurationError` with a stable generic message. Validate product-specific settings before rendering if a more detailed user-facing error is required.

Playground: `/examples/advanced/responsive/column` and `/examples/advanced/responsive/breakpoints`.
