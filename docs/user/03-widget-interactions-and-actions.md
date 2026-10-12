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
    restore: "Restore",
    remove: "Remove",
  }}
  renderWidget={(widget) => widget.title}
  renderWidgetActions={(widget) => (
    <button type="button" onClick={() => openDetails(widget.id)}>Details</button>
  )}
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
  titleDoubleClickAction="none"
  onTitleDoubleClick={(event) => dashboard.commands.resizeWidget(event.id, { w: 6, h: 3 })}
  onAfterTitleDoubleClick={(event) => audit("title:after", event)}
/>
```

`showControls={false}` hides the built-in action buttons. `actionLabels` customizes their accessible names. Supplying `renderWidgetActions` replaces the complete built-in action group, so the consumer owns keyboard labels and behavior for those controls.

Wire built-in actions through `onRestoreWidget` and `onRemoveWidget`. The component only requests these changes; controlled state changes when the consumer applies the corresponding command.

Move and resize callbacks receive `{ id, layout }`. `onBeforeMove`/`onBeforeResize` fire at interaction start, `onMove`/`onResize` are animation-frame coalesced active notifications, and `onAfterMove`/`onAfterResize` fire after the committed layout callbacks. `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, and `onAfterTitleDoubleClick` surround the title-only double-click notification; the default fill action emits a controlled layout commit between the before and action notifications.

## Compatibility aliases

The following aliases remain available throughout `0.2.x` and retain that behavior in `0.3.0`; they are deprecated, with removal deferred to a future version:

| Deprecated prop | Canonical prop |
| --- | --- |
| `onWidgetDragStart` | `onBeforeMove` |
| `onWidgetDragStop` | `onAfterMove` |
| `onWidgetResizeStart` | `onBeforeResize` |
| `onWidgetResizeStop` | `onAfterResize` |
| `onWidgetHeaderDoubleClick` | `onTitleDoubleClick` |

Use canonical props in new code. Playground routes: `/examples/layout/basic`, `/examples/layout/lock`, and `/examples/widget/events`.

## Explicit size, restore, and title double-click

- `resizeWidget` accepts `(id, { w, h })`, rounds finite dimensions to integers and clamps to minW/maxW/minH/maxH and current columns. Unknown IDs and nonfinite values are ignored. Grid collision handling may reposition peers; automatic content sizing may later recompute height.
- `restoreWidget` restores the first saved geometry before API resizing or a legacy view change. Repeated resizes keep that first snapshot. It is not last-operation undo or a full reset.
- `maximizeWidget` and `minimizeWidget` remain deprecated with their original behavior: x=0/y=0/full width/height at least 3, or unchanged width/H1, respectively. Use explicit dimensions for new integrations.
- `titleDoubleClickAction` defaults to `"fill"`: double-clicking a title assigns unused columns in its starting row to that widget, respecting its maximum width. Connect `onLayoutCommit` to controlled state to retain the result. Set `titleDoubleClickAction="none"` for notification-only events or a custom action. Standalone `DashboardWidgetShell` only emits notifications.
- The default action is blocked by grid/widget movement or resize locks, `staticGrid`, and maximized/minimized state. Imperative state commands and consumer buttons remain independently controlled.

Vue uses the same prop (`title-double-click-action="none"` in templates) and commits through `@layout-commit="commands.applyLayoutSnapshot"`.

Example: `/examples/widget/resize/react`, `/examples/widget/resize/vue`. Core uses `resizeDashboardWidget(state, id, { w, h })`. `onMaximizeWidget` and `onMinimizeWidget` remain deprecated compatibility types but are not called by default buttons.
