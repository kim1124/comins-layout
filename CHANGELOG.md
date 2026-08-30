# comins-grid-layout

## 0.2.2

- Replaced clickable localhost links with source-checkout route guidance so the published README no longer presents unavailable local URLs as live links.
- Added deterministic documentation checks for repository files, Markdown anchors, same-repository GitHub targets, and implemented Playground routes, and included the English/Korean guide contracts in docs-only CI.
- Aligned README, active API docs, Playground descriptions, and public type comments with the `0.2.x` compatibility contract while retaining the planned `0.3.0` removals.
- Reworked all 25 canonical Playground routes into feature guidance, controls, and live GridStack example sections with localized option differences and focused code samples.
- Changed numbered Playground widgets to a W3/H2 baseline, added live N/W/H and interaction-setting tables, and replaced ambiguous per-widget action icons with four-direction move and diagonal resize affordances.
- Expanded title-only and nested drag targets, fixed responsive example toggles, and clarified nested composition, responsive strategies, Static Grid versus layout locking, and the safe public handle surface.
- Added event-handler and public-method reference tables, explicitly mapped the `onDblClickTitle` example event to the public `onTitleDoubleClick` prop, and restored a dedicated controlled external-trash drop example.
- Consolidated duplicate nested and multi-grid menu entries into depth and orientation controls while preserving the former URLs as compatibility redirects.
- Simplified the multi-grid example controls to a compact single row with layout, transfer mode, one Grid A/B clear action, and concise operation status controls.
- Preserved the normalized pointer grab position when transferring widgets across grids with different column widths, preventing adjacent drops from falling into the next row.
- Kept the public package API, runtime implementation, dependencies, and package boundary unchanged after the 100-widget Chromium resource baseline remained stable.

## 0.2.1

- Aligned the README, active API docs, and Playground examples with the implemented palette/Grid transfer, React content lazy-rendering, event, handle, responsive, and persistence contracts.
- Exported the existing `DashboardWidgetActionLabels` type from the package root.
- Deprecated the ineffective native `DashboardGridEngineOptions.lazyLoad`, duplicated drag/resize aliases, the title-only `onWidgetHeaderDoubleClick` alias, legacy option-mapper fields, and the adapter-shaped mapper override while preserving `0.2.1` runtime compatibility. Removal is deferred to `0.3.0`.
- Added a type-backed README inventory gate for every `DashboardGrid` prop, `useDashboardGrid` command, and public handle method.
- Clarified that the configured browser matrix uses Desktop Chrome, representative `@firefox-parity`, representative `@mobile-touch`, and Chromium resource projects. The earlier `0.2.0` Playwright WebKit statement was incorrect; no WebKit or branded Safari project is configured.
- Kept `/examples/transfer` as a compatibility redirect to the canonical multi-grid example and removed duplicated internal consumer-example routes after moving affected checks to current routes or test fixtures.
- Updated package and lockfile metadata to `0.2.1` without changing dependencies.

## 0.2.0

- Reorganized the Playground into Widget, Layout, and Advanced submenus with deterministic numbered examples.
- Added controlled move, resize, title double-click, and semantic layout mutation event surfaces.
- Added custom widget header actions, lazy content rendering, per-widget content sizing options, and safe read-only handle queries.
- Added a visible mint active state for every Playground toggle, including widget interaction and layout controls.
- Extended the Playground locale toggle to Widget, Layout, Advanced, and multi-grid example controls and content.
- Added focused persistence, arrange/fill, responsive, nested, multi-grid, mobile, and public API examples without raw GridStack CRUD.
- Added controlled external widget drop targets with a typed, non-destructive callback; consumers retain deletion ownership through `removeWidget`.
- Added per-column layout persistence across runtime column changes and consolidated the documentation playgrounds around the shared state contract.
- Expanded automated browser coverage to desktop Firefox and Playwright WebKit while retaining Chromium and mobile coverage.
- Added a fail-closed npm service-identity gate before trusted staging and for exact-version release closure.
- Updated development tooling to React Router 8.3.0 and PostCSS 8.5.24.
- Adopted Comins Contract v1.4 release and sensitive-data guidance.

## 0.1.5

- Upgraded the external GridStack engine to the public version 13 API while retaining the package-owned adapter boundary.
- Added supported `engineOptions`, responsive breakpoint columns, actual-column callbacks, and atomic layout snapshot application.
- Added explicit `compact()` and non-reordering `refresh()` handle methods plus drag and resize lifecycle callbacks.
- Added fail-closed third-party notice, external-bundle, installed-license, and exact package-artifact verification.
- Reused the exact inspected package artifact for the React 18 consumer smoke and trusted npm staging.
- Clarified GridStack independence, external dependency licenses, raw engine ownership, and controlled React state guidance.

## 0.1.4

- Added an advanced `DashboardGridHandle` escape hatch for controlled GridStack access, refresh, and state commits.
- Added verified mobile touch drag and resize coverage.
- Reworked the README into an English consumer guide with a real CRUD and drag demonstration.
- Upgraded immutable GitHub Actions pins to Node.js 24-compatible action releases.
- Clarified the latest-only support policy for pre-1.0 releases.

## 0.1.3

- Restore widgets whose IDs contain selector-significant characters through a CSS-escaped adapter lookup.
- Adopt Comins Contract v1.2 sensitive-data hooks, required CI enforcement, and exact package-artifact scanning.
- Preserve the existing public API and dependency set.

## 0.1.2

- Republished the privacy-safe package after npm maintainer metadata remediation.
- No runtime or public API changes.

## 0.1.1

- Removed the maintainer's local absolute path from the published README.
- Updated the publishing documentation after the trusted-publisher bootstrap.

## 0.1.0

- Initial standalone React dashboard grid package.
- GridStack adapter with create, update, move, resize, maximize, minimize, arrange, reset, and serialization flows.
- Runtime column control, package stylesheet export, browser interaction tests, and resource-counter verification.
