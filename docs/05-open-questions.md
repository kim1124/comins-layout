# Resolved Decisions And Support Boundaries

## Resolved Product Decisions

- GridStack is the browser interaction engine and remains behind the package-owned adapter.
- `DashboardGrid` is controlled by the `widgets` prop; `useDashboardGrid()` is the provided state helper.
- Maximize, minimize, restore, auto-arrange, runtime columns, persistence, and widget CRUD use the implemented package commands.
- `DashboardGridHandle` provides advanced access to the borrowed GridStack instance without replacing controlled React state.
- GridStack 13 remains an external runtime dependency behind the package adapter; third-party notices and package-boundary gates verify the license and non-bundling contract.
- Supported engine options and responsive columns are additive public APIs. Breakpoint-specific layout persistence is deferred to 0.2.0; 0.1.5 persists the active layout only.
- Desktop pointer and mobile Chrome touch drag/resize are supported and covered by Playwright.

## Explicit Support Boundaries

- Runtime columns are limited to 1 through 12.
- Keyboard widget movement and resize are not implemented. Normal button controls retain their keyboard behavior.
- Firefox and Safari are not verified or supported until dedicated browser projects are approved.
- SSR consumers must render the package inside a client boundary.
- Raw GridStack add/remove operations do not create or remove React widget content; use Comins CRUD commands.
- `refresh()` never compacts; use the explicit handle `compact()` method or `autoArrangeWidgets()` depending on whether GridStack or Comins layout semantics are intended.

## Operational Decisions

- Before 1.0.0, only the latest published version receives security fixes.
- Exact package-artifact inspection and automatic provenance follow Comins Contract v1.2 governance.
- Legacy npm versions and public account metadata are provider-side remediation work and are not hidden by current-change gates.
