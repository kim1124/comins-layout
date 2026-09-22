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

Set `breakpointForWindow: true` only when breakpoints should follow the window rather than the grid container. `columnWidth` is a reference width for calculating columns, not a fixed pixel width for each cell: the width ratio is rounded and capped by `columnMax`. When both are supplied, `breakpoints` takes precedence over `columnWidth`. The example widths and column counts are demonstration settings, not package defaults.

Each active column count has a separate serializable cache. A `12 → 6 → 12` sequence restores the earlier 12-column geometry instead of repeatedly scaling the most recent layout. Persist with `serializeState`, not `serializeLayout`, when that history matters.

Invalid responsive configuration throws `DashboardGridConfigurationError` with a stable generic message. Validate product-specific settings before rendering if a more detailed user-facing error is required.

`none` skips proportional position and size transforms when columns change; it does not disable responsive behavior. It preserves grid-unit `x` and `w` where possible, not pixel dimensions. Coordinates and widths can still be corrected to keep widgets inside the active columns and resolve overlaps. Previously visited columns restore their cached geometry.

Playground: `/examples/advanced/responsive`.

Select **column calculation** (target width or breakpoints) independently from **layout policy** (moveScale or none) on one page. Change the container width and inspect actual width, active columns, and each widget's x/y/w/h. Available screen space can cap the actual width below the requested value. Changing method/policy or restarting resets the grid and layout cache; changing only width preserves the cache. All three former responsive URLs redirect to this combined page.
