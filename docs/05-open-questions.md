# Resolved Decisions And Support Boundaries

## Resolved Product Decisions

- GridStack is the browser interaction engine and remains behind the package-owned adapter.
- `DashboardGrid` is controlled by the `widgets` prop; `useDashboardGrid()` is the provided state helper.
- Maximize, minimize, restore, auto-arrange, runtime columns, persistence, and widget CRUD use the implemented package commands.
- `DashboardGridHandle` provides advanced access to the borrowed GridStack instance without replacing controlled React state.
- GridStack 13 remains an external runtime dependency behind the package adapter; third-party notices and package-boundary gates verify the license and non-bundling contract.
- 2026-08-05: supported engine options and responsive columns are additive public APIs. Per-column persistence is resolved: `serializeState()` stores `layoutsByColumn`, while `serializeLayout()` remains active-only and legacy inputs without the cache remain readable.
- Desktop Chrome is covered by the main Chromium project. Firefox coverage is limited to representative `@firefox-parity` engine-sensitive scenarios, and mobile coverage is limited to `@mobile-touch` cases on the Pixel 7 Chromium profile. Branded Edge is not directly automated.
- `0.2.0` implements `externalDropTargets` and the typed, non-destructive `onWidgetExternalDrop` callback for same-document light DOM targets. Consumers retain deletion ownership through `removeWidget`; raw GridStack `removable` remains unsupported.
- `0.2.1` documents palette copy and controlled Grid move/copy through `useDashboardDragIn`, `onWidgetDropRequest`, `insertDashboardWidgetAtLayout`, and `transferDashboardWidget`.
- `0.2.1` keeps ineffective or duplicated APIs as deprecated compatibility surfaces. Their removal is deferred to the separately approved `0.3.0` boundary.

## Explicit Support Boundaries

- Runtime columns are limited to 1 through 12.
- Keyboard widget movement and resize are not implemented. Normal button controls retain their keyboard behavior.
- Safari on macOS and iOS is outside the automated browser contract and requires separate consumer verification.
- SSR consumers must render the package inside a client boundary.
- Raw GridStack add/remove operations do not create or remove React widget content; use Comins CRUD commands.
- `lazyRenderWidget` defers React content only. It keeps outer Grid items mounted and does not provide skeleton state or full virtualization.
- Native `engineOptions.lazyLoad` does not defer React-owned content and is deprecated. Within the Comins content boundary, per-widget `lazyLoad` overrides global `lazyRenderWidget`.
- Explicit controlled nested `DashboardGrid` composition is supported; GridStack native dynamic sub-grid ownership is not.
- GridStack `removable` and DOM `CustomEvent` dispatch are outside the controlled Comins surface; use the typed external-drop callback instead.
- `refresh()` never compacts; use the explicit handle `compact()` method or `autoArrangeWidgets()` depending on whether GridStack or Comins layout semantics are intended.

## Operational Decisions

- Before 1.0.0, only the latest published version receives security fixes.
- Exact package-artifact inspection and automatic provenance follow the current Comins Governance Contract and Release Policy.
- Legacy npm versions and public account metadata are provider-side remediation work and are not hidden by current-change gates.
