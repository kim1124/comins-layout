# Resolved Decisions And Support Boundaries

## Resolved Product Decisions

- GridStack is the browser interaction engine and remains behind the package-owned adapter.
- `DashboardGrid` is controlled by the `widgets` prop; `useDashboardGrid()` is the provided state helper.
- Maximize, minimize, restore, auto-arrange, runtime columns, persistence, and widget CRUD use the implemented package commands.
- `DashboardGridHandle` provides advanced access to the borrowed GridStack instance without replacing controlled React state.
- GridStack 13 remains an external runtime dependency behind the package adapter; third-party notices and package-boundary gates verify the license and non-bundling contract.
- 2026-08-05: supported engine options and responsive columns are additive public APIs. Per-column persistence is resolved: `serializeState()` stores `layoutsByColumn`, while `serializeLayout()` remains active-only and legacy inputs without the cache remain readable.
- Desktop Chromium and Firefox pointer drag/resize are supported and covered by Playwright. Mobile touch coverage remains on the Pixel 7 Chromium profile.
- `0.2.0` implements `externalDropTargets` and the typed, non-destructive `onWidgetExternalDrop` callback for same-document light DOM targets. Consumers retain deletion ownership through `removeWidget`; raw GridStack `removable` remains unsupported.

## Explicit Support Boundaries

- Runtime columns are limited to 1 through 12.
- Keyboard widget movement and resize are not implemented. Normal button controls retain their keyboard behavior.
- Safari on macOS and iOS is outside the automated browser contract and requires separate consumer verification.
- SSR consumers must render the package inside a client boundary.
- Raw GridStack add/remove operations do not create or remove React widget content; use Comins CRUD commands.
- GridStack `removable` and DOM `CustomEvent` dispatch are outside the controlled Comins surface; use the typed external-drop callback instead.
- `refresh()` never compacts; use the explicit handle `compact()` method or `autoArrangeWidgets()` depending on whether GridStack or Comins layout semantics are intended.

## Operational Decisions

- Before 1.0.0, only the latest published version receives security fixes.
- Exact package-artifact inspection and automatic provenance follow the current Comins Governance Contract and Release Policy.
- Legacy npm versions and public account metadata are provider-side remediation work and are not hidden by current-change gates.
