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
| `float` | Preserves vertical gaps when `true`; `false` compacts upward and is the package default |
| `animate` | Enables GridStack transition animation |
| `staticGrid` | Blocks engine drag movement and resizing, not application inputs or action buttons |
| `rtl` | Uses `true`, `false`, or `auto` direction handling |
| `minRow` / `maxRow` | Non-negative integer row limits; a positive maximum cannot be below the minimum |
| `sizeToContent` | Opts into adjusting widget row count `h` to content height; does not change `cellHeight` |
| `dragHandle` | Non-empty selector used as the drag handle |
| `resizeHandles` | Non-empty GridStack resize-handle string; package default is `se` |
| `alwaysShowResizeHandle` | `true`, `false`, or coarse-pointer-only `mobile` |
| `nonce` | CSP nonce forwarded to GridStack-generated styles |

Widget-level `sizeToContent` and `resizeToContentParent` override content sizing for an item. Widget `locked`, `movable`, and `resizable` combine with grid-level `editable`, `movable`, and `resizable`.

Content sizing is off by default. Leave it off for fixed-height dashboards and enable it when cards should grow or shrink with content. If content already fits, enabling it may leave `h` unchanged. Disabling it does not restore the previous `h`.

Content sizing measures the widget shell including its header and respects `minH`/`maxH`. Use `refreshKey` or the handle's `refresh()` after content changes that need a new measurement. Connect `onLayoutCommit` to keep React state and saved data in sync with the measured height. An explicit maximize or minimize temporarily suspends content sizing until restore; a widget's `sizeToContent: false` opts out of global sizing.

Static mode is not application-wide read-only mode: consumer-owned input, remove, and maximize actions remain independent. The Playground widget table shows effective movement and resizing availability, including static mode. Per-widget settings are preserved and apply again after the global lock is released.

`dragHandle` restricts where dragging starts and is separate from resize handles. `alwaysShowResizeHandle` controls handle visibility, not whether resizing is allowed.

The `lazyLoad` engine field is a deprecated compatibility mapping retained throughout `0.2.x`. It does not defer React content; use `lazyRenderWidget` and widget `lazyLoad` as described in [Lazy Rendering](./09-lazy-rendering.md).

Invalid supported configuration throws `DashboardGridConfigurationError`. Unsupported GridStack options are intentionally not passed through. Use the advanced handle only when a required operation cannot be represented by component props, and keep controlled state synchronized afterward.

Examples for cell height, float, RTL, size to content, and title drag handles are available under the Advanced menu. Compare static mode and interaction locking on the Layout Lock / Unlock page. Static mode also blocks incoming external widget drops; it does not disable app-owned buttons or imperative commands.

The Size To Content example adds and removes activity items to demonstrate height growth and shrinkage. Row rounding may leave space below content; the painted card and resize handle follow the allocated grid area. Manual resizing is independent, and remeasurement reapplies content-based sizing while enabled.
