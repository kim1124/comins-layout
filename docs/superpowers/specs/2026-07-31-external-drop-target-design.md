# External Drop Target Design

## Release Scope

- Target `comins-grid-layout@0.2.0` as an additive public feature.
- Let consumers designate ordinary HTML elements as widget drop targets.
- Emit a typed React callback when the final mouse, pointer, or touch release
  point is inside a configured target.
- Keep React widget state authoritative. Dropping on a target does not remove
  GridStack DOM or mutate widget state by itself.
- Keep all GridStack and browser-event integration inside the package adapter.

## Consumer Contract

`DashboardGrid` adds two optional props:

```ts
export type DashboardExternalDropTarget = {
  id: string;
  selector: string;
};

export type DashboardWidgetExternalDropEvent = {
  widgetId: DashboardWidgetId;
  targetId: string;
  columns: DashboardColumnCount;
  layout: DashboardWidgetLayout;
};

export type DashboardGridProps<TData = unknown> = {
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  onWidgetExternalDrop?: (
    event: DashboardWidgetExternalDropEvent,
  ) => void;
};
```

The target remains consumer-owned HTML. It does not require a Comins wrapper,
GridStack class, or registration function:

```tsx
<DashboardGrid
  externalDropTargets={[
    { id: "trash", selector: "#widget-trash" },
  ]}
  onWidgetExternalDrop={({ widgetId, targetId }) => {
    if (targetId === "trash") {
      dashboard.commands.removeWidget(widgetId);
    }
  }}
  {...dashboardProps}
/>

<div id="widget-trash" style={{ width: 300, height: 300 }}>
  Drop here to delete
</div>
```

`onWidgetExternalDrop` is the only new event surface. Version `0.2.0` does not
dispatch a DOM `CustomEvent`. Consumers that require a DOM event can dispatch
one from the typed callback without changing package ownership.

## Target Resolution

- Resolve selectors at drop time, not only at grid initialization. A valid
  target may mount or unmount after `DashboardGrid`.
- Resolve targets only in the grid element's owner document.
- A selector may match more than one element. Dropping on any connected match
  emits the configured target ID.
- The release point must be inside the target or one of its descendants.
- If targets overlap, the first matching entry in `externalDropTargets` wins.
- Ignore disconnected and unmatched targets. A rendered target must have at
  least one client rectangle and must not have `display: none` or
  `visibility: hidden`.
- Ignore targets inside the current `DashboardGrid`; this API is for external
  HTML regions.
- Invalid configuration uses the existing constant
  `DashboardGridConfigurationError` message without exposing the rejected ID or
  selector. Target IDs must be non-empty and unique, and selectors must be
  non-empty valid CSS selectors.

Selector resolution is limited to the same document's light DOM. Cross-frame
targets and targets hidden inside a shadow root are outside the `0.2.0` scope.

## Interaction Semantics

- Only widget drag completion participates. Resize completion never emits an
  external drop.
- Global `editable` and `movable` settings and widget-level `locked` and
  `movable` settings remain authoritative. A widget that cannot start a drag
  cannot produce an external drop.
- Normalize the final client point from `MouseEvent`, `PointerEvent`, or the
  final `changedTouches` entry of `TouchEvent`.
- Reuse the adapter's last captured point for its existing forced drag-release
  fallback when the browser omits a usable final point.
- If no final point can be established, fail safely by preserving the existing
  drag-stop behavior and emitting no external drop.
- A matching drop emits exactly one `onWidgetExternalDrop` callback with the
  widget ID, target ID, active columns, and final widget geometry.
- Existing committed-layout ordering remains intact. When GridStack emits a
  changed layout, per-widget layout callbacks and `onLayoutCommit` run first,
  followed by `onWidgetExternalDrop`, then `onWidgetDragStop`.
- When GridStack produces no changed layout, `onWidgetExternalDrop` runs
  immediately before `onWidgetDragStop`.
- An unmatched drop follows the current layout-commit and drag-stop behavior
  without any additional callback.
- The package does not automatically call `onRemoveWidget`, remove GridStack
  DOM, or change React state. If the callback does nothing, the widget remains
  controlled by the consumer's existing `widgets` state.

## State And Responsive Layout Integration

The external drop feature does not own deletion. Consumers use the existing
`removeWidget(widgetId)` command when a target represents deletion.

The `0.2.0` responsive-layout persistence work must make that command remove
the widget ID from:

- the shared widget collection;
- the active layout;
- every stored column layout;
- maximize and minimize restore geometry.

This keeps button removal and external-drop removal on one reducer path. The
external drop callback must not duplicate or bypass that state transition.

## Adapter Design

- Add external target configuration and the typed callback to
  `DashboardGridAdapterOptions`.
- Preserve the last usable client point for the duration of a drag, including
  touch drag.
- Subscribe to GridStack's public `drag` lifecycle event only to update that
  imperative point. Do not forward high-frequency drag events into React state.
- Pass the original drag-stop event and item into the adapter stop handler.
- Resolve the target before interaction state and the last point are cleared.
- Keep target matching in a small package-owned helper that depends on
  `Document`, the configured targets, and a client point. Do not expose or
  import GridStack engine internals.
- Continue using GridStack public drag lifecycle events. Do not enable
  GridStack's `removable` option.
- Remove no external listeners beyond the package's existing interaction
  guards, and clear all retained element and point references on drag end and
  adapter destruction.

GridStack's native `removable` selector is intentionally not used because it
registers one static target and removes the widget DOM before the controlled
React state changes. The package-owned adapter needs dynamic target resolution,
multiple target IDs, and a non-destructive callback contract.

## Error Handling

- Duplicate or empty target IDs and empty or invalid selectors fail with
  `DashboardGridConfigurationError`.
- Missing target elements are valid because targets may be conditionally
  rendered.
- A target removed between pointer movement and release is treated as no match.
- A callback exception remains a consumer exception; the package does not
  swallow, retry, or convert it into a state mutation.
- No error message includes consumer target IDs, selectors, widget IDs, or
  pointer coordinates.

## Verification Contract

### Vitest

- Accept valid external target configuration.
- Reject empty or duplicate IDs and empty or invalid selectors with the
  constant configuration error.
- Resolve a plain `div`, its descendant, and multiple elements for one selector.
- Select the first configured target when targets overlap.
- Ignore disconnected, missing, in-grid, and non-rendered targets.
- Normalize mouse, pointer, touch, and fallback points.
- Preserve the existing callback order and emit the external event once.
- Confirm unmatched drops and resize stops emit no external event.

### Playwright

- Drop a widget on a `300 x 300` plain `div` and remove it through
  `dashboard.commands.removeWidget`.
- Confirm dropping outside the target preserves the widget and emits no event.
- Mount the target after grid initialization and confirm late resolution.
- Confirm a child element inside the target counts as the same target.
- Confirm locked and non-movable widgets cannot emit the event.
- Confirm a touch drop works in the existing mobile Chrome project.
- Run the desktop drop contract in Chromium, Firefox, and WebKit once the
  separate multi-browser support project is approved.
- Confirm browser console and page diagnostics remain empty.

### Package Gates

- Run focused Vitest and Playwright checks during implementation.
- Run `npm run verify`.
- Run `npm run verify:full` once after the adapter and interaction contract are
  complete.
- Include the external-drop interaction in the repeated resource-stability
  review when listener or retained-element behavior changes.

## Documentation

- Add the props and event type to the README API tables.
- Add a plain `300 x 300` deletion target to the consumer example.
- State that the callback is non-destructive and that consumers must call
  `removeWidget` to delete React content.
- State the same-document light-DOM boundary and the pointer-release hit rule.
- Update the changelog only when the implementation is accepted for the
  `0.2.0` release.

## Non-Goals

- Automatic deletion or implicit calls to `onRemoveWidget`.
- DOM `CustomEvent` dispatch.
- Drag-enter, drag-leave, or hover-state callbacks.
- Package-owned drop-target styling or markup.
- Rectangle-overlap or percentage-overlap hit testing.
- Cross-document, iframe, or shadow-root target discovery.
- Native file, text, or HTML5 drag-and-drop payloads.
- Moving widgets between two `DashboardGrid` instances.
- Exposing GridStack `removable` or `removableOptions` as public engine options.
