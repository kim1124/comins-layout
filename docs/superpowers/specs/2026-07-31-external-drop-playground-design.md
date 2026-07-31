# External Drop Playground Design

## Goal

Expose the `0.2.0` external widget drop contract in the primary Comins
Playground so it can be exercised together with the existing widget CRUD,
layout persistence, runtime columns, and interaction-lock controls.

## Selected Surface

- Add the feature to `/examples/complete`, the default Playground entry.
- Keep `/readme-demo` as the lower-level browser verification fixture.
- Do not add a separate route or repeat the target across every focused
  example.

This keeps the feature visible on first entry while preserving the purpose and
test boundaries of the smaller examples.

## Consumer Interaction

- Render a consumer-owned ordinary `div` with the fixed target ID
  `complete-widget-trash`.
- Size the target to `300 x 300` CSS pixels on desktop.
- Configure `DashboardGrid.externalDropTargets` with the target's CSS selector.
- When `onWidgetExternalDrop` receives target ID `trash`, call
  `dashboard.commands.removeWidget(event.widgetId)`.
- Show a live status message with the removed widget ID.
- Keep the package callback non-destructive; deletion remains explicit
  Playground consumer behavior.
- Preserve the current header remove action and all existing complete-example
  controls.

The target stays usable at narrow viewports by retaining its 300-pixel design
size while capping its rendered width at the available content width.

## Component Boundary

Extend the example-only `DashboardPreview` helper with optional
`externalDropTargets` and `onWidgetExternalDrop` inputs, then pass those values
directly to the public `DashboardGrid` props. Do not add package API, adapter,
or dependency changes.

The target definition is a module-level readonly constant so its identity is
stable across Playground renders.

## Accessibility And Diagnostics

- Give the target an explicit accessible label describing that dropping deletes
  a widget.
- Use `role="status"` with an initial instruction and a post-drop confirmation.
- Keep Playwright-facing selectors example-owned and semantic where practical.
- Treat browser console warnings and page errors as failures in the new
  Playground scenario.

## Verification

Add a Chromium-focused Playwright test that:

1. opens `/examples/complete`;
2. confirms the ordinary 300 x 300 target is present;
3. drags a known movable widget to the target;
4. confirms the widget count decreases and the widget is removed;
5. confirms the status identifies the removed widget;
6. confirms no console warning or page error occurred.

Run the focused Playground spec while implementing. After the example and test
contract pass, run the package build and the repository's full
`npm run verify:full` gate before any push.

## Non-Goals

- A new public API or DOM `CustomEvent`.
- Package-owned target markup or styling.
- A separate external-drop route.
- Hover, drag-enter, or drag-leave styling.
- Release, tag, or npm publication work.
