# Widget Interactions and Actions

Grid-level `editable`, `movable`, and `resizable` default to `true`. Setting `editable={false}` disables both moving and resizing. A widget can further restrict interaction with `locked`, `movable`, and `resizable` without changing other widgets.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  editable
  movable
  resizable
  showControls
  actionLabels={{
    maximize: "Maximize",
    minimize: "Minimize",
    restore: "Restore",
    remove: "Remove",
  }}
  renderWidget={(widget) => widget.title}
  renderWidgetActions={(widget) => (
    <button type="button" onClick={() => openDetails(widget.id)}>Details</button>
  )}
  onMaximizeWidget={dashboard.commands.maximizeWidget}
  onMinimizeWidget={dashboard.commands.minimizeWidget}
  onRestoreWidget={dashboard.commands.restoreWidget}
  onRemoveWidget={dashboard.commands.removeWidget}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  onBeforeMove={(event) => audit("move:start", event)}
  onMove={(event) => audit("move:active", event)}
  onAfterMove={(event) => audit("move:end", event)}
  onBeforeResize={(event) => audit("resize:start", event)}
  onResize={(event) => audit("resize:active", event)}
  onAfterResize={(event) => audit("resize:end", event)}
  onBeforeTitleDoubleClick={(event) => audit("title:before", event)}
  onTitleDoubleClick={(event) => dashboard.commands.maximizeWidget(event.id)}
  onAfterTitleDoubleClick={(event) => audit("title:after", event)}
/>
```

`showControls={false}` hides the built-in action buttons. `actionLabels` customizes their accessible names. Supplying `renderWidgetActions` replaces the complete built-in action group, so the consumer owns keyboard labels and behavior for those controls.

Wire built-in actions through `onMaximizeWidget`, `onMinimizeWidget`, `onRestoreWidget`, and `onRemoveWidget`. The component only requests these changes; controlled state changes when the consumer applies the corresponding command.

Move and resize callbacks receive `{ id, layout }`. `onBeforeMove`/`onBeforeResize` fire at interaction start, `onMove`/`onResize` are animation-frame coalesced active notifications, and `onAfterMove`/`onAfterResize` fire after the committed layout callbacks. `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, and `onAfterTitleDoubleClick` surround the title-only double-click notification; they do not change state automatically.

## Compatibility aliases

The following aliases remain available throughout `0.2.x` but are deprecated and planned for removal in `0.3.0`:

| Deprecated prop | Canonical prop |
| --- | --- |
| `onWidgetDragStart` | `onBeforeMove` |
| `onWidgetDragStop` | `onAfterMove` |
| `onWidgetResizeStart` | `onBeforeResize` |
| `onWidgetResizeStop` | `onAfterResize` |
| `onWidgetHeaderDoubleClick` | `onTitleDoubleClick` |

Use canonical props in new code. Playground routes: `/examples/layout/basic`, `/examples/layout/lock`, and `/examples/widget/events`.
