# Engine Options

Use `engineOptions` for the supported GridStack configuration surface. Keep product state in React and pass only the engine behavior that the package explicitly maps.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  engineOptions={{
    cellHeight: 88,
    margin: 8,
    float: false,
    animate: true,
    dragHandle: ".comins-grid-layout-widget__header",
    resizeHandles: "se",
    alwaysShowResizeHandle: "mobile",
  }}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  renderWidget={(widget) => widget.title}
/>
```

## Supported fields

| Field | Purpose |
| --- | --- |
| `cellHeight` | Cell height as a non-negative number/dimension or `auto`/`initial`; package default is `96` |
| `margin` | Non-negative GridStack margin dimension; package default is `8` |
| `float` | Allows widgets to float upward; package default is `false` |
| `animate` | Enables GridStack transition animation |
| `staticGrid` | Disables interactive editing at the engine level |
| `rtl` | Uses `true`, `false`, or `auto` direction handling |
| `minRow` / `maxRow` | Non-negative integer row limits; a positive maximum cannot be below the minimum |
| `sizeToContent` | Enables GridStack content-sized items globally |
| `dragHandle` | Non-empty selector used as the drag handle |
| `resizeHandles` | Non-empty GridStack resize-handle string; package default is `se` |
| `alwaysShowResizeHandle` | `true`, `false`, or coarse-pointer-only `mobile` |
| `nonce` | CSP nonce forwarded to GridStack-generated styles |

Widget-level `sizeToContent` and `resizeToContentParent` override content sizing for an item. Widget `locked`, `movable`, and `resizable` combine with grid-level `editable`, `movable`, and `resizable`.

The `lazyLoad` engine field is a deprecated compatibility mapping retained throughout `0.2.x`. It does not defer React content; use `lazyRenderWidget` and widget `lazyLoad` as described in [Lazy Rendering](./09-lazy-rendering.md).

Invalid supported configuration throws `DashboardGridConfigurationError`. Unsupported GridStack options are intentionally not passed through. Use the advanced handle only when a required operation cannot be represented by component props, and keep controlled state synchronized afterward.

Examples are available under the Advanced menu, including cell height, float, RTL, static grid, size to content, and title drag handle.
