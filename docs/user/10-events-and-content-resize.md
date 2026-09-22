# Events and Content Resize

Choose callbacks by responsibility: layout events synchronize geometry, lifecycle events observe interaction, and resize-frame events notify pixel-sensitive content.

```tsx
<DashboardGrid
  widgets={dashboard.widgets}
  onWidgetLayoutChange={(id, layout) => updateSpatialIndex(id, layout)}
  onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
  onWidgetResizeFrame={({ id, width, height }) => {
    chartRegistry.get(id)?.resize(width, height);
  }}
  onBeforeMove={(event) => setActiveInteraction(event.id)}
  onMove={(event) => showLiveCoordinates(event.layout)}
  onAfterMove={() => setActiveInteraction(null)}
  onBeforeResize={(event) => setActiveInteraction(event.id)}
  onResize={(event) => showLiveSize(event.layout)}
  onAfterResize={() => setActiveInteraction(null)}
  renderWidget={(widget) => <Chart id={widget.id} />}
/>
```

For a changed committed snapshot, `onWidgetLayoutChange` runs once for each layout and then `onLayoutCommit` runs once for the full snapshot. Identical duplicate commits are suppressed. Under non-responsive control, snapshots whose engine column count differs from the controlled `columns` prop are not emitted.

`onWidgetResizeFrame` receives the rendered item's pixel `width` and `height`, scheduled to an animation frame. It is separate from `onResize`, which reports grid-cell geometry. Use it for charts, tables, canvases, or other content that must recalculate after a resize.

The canonical move events are `onBeforeMove`, `onMove`, and `onAfterMove`; resize uses `onBeforeResize`, `onResize`, and `onAfterResize`. Active events are animation-frame coalesced. Before callbacks cannot cancel the interaction. After callbacks run after any required layout callbacks have been invoked; they do not await React rendering or consumer asynchronous work. The title sequence is `onBeforeTitleDoubleClick`, `onTitleDoubleClick`, and `onAfterTitleDoubleClick`. All three receive the same pre-action layout. Consumers connect actions such as maximize to the callback explicitly.

Hook-level `onLayoutMutation` observes command-driven state changes after React commits and includes the mutation kind, affected IDs, columns, and full state snapshot. It is a hook option, not a `DashboardGrid` prop or pointer-interaction event. Property changes such as widget locking or move permissions produce `widget:update` even without geometry changes. Kinds are `widget:add`, `widget:update`, `widget:remove`, `widgets:clear`, `layout:commit`, `layout:reset`, `layout:restore`, `layout:arrange`, `layout:fill`, and `columns:change`.

Playground: `/examples/layout/events` and `/examples/widget/events`.

A controlled update may also emit a changed layout after the engine corrects packing, column bounds, or content height. These corrections use the same commit callbacks and suppress duplicates. `refreshKey` or `refresh()` remeasures eligible content; while a drag or resize is active, the refreshed layout commit waits until interaction completion.
