# comins-grid-layout

## Unreleased

- Prevent stale Playground route-normalization effects from overwriting newer React/Vue navigation during rapid framework switches.

## 0.3.0

- Reset stale resize-hover ownership during controlled column transitions so subsequent widgets retain working resize handles.

- Update development tooling and pinned GitHub Actions, including source-map-js 1.2.2 to address the development dependency advisory. Runtime GridStack and framework peer ranges remain unchanged.

- Replace the always-rejected Playground palette item with an A → B transfer acceptance toggle shared by drag and button flows in React/Vue. Widen new palette widgets to 6×2 cells.
- Use a 1px cell height in the React/Vue Size To Content example so additions and removals follow actual content height, including wrapped text. Keep the package's default cell height unchanged.
- Add spacing below Basic framework tabs, allow Dynamic Widget Size to fill the current column count, and show grab cursors only on interactive widget titles.

- Add constraint-aware `resizeWidget` / `resizeDashboardWidget` and a matching React/Vue Dynamic Widget Size example. Restore retains the first pre-resize geometry.
- Keep maximize/minimize APIs as deprecated compatibility commands with their original behavior; remove their default buttons and recommend explicit W/H sizing.
- Enable title double-click row filling by default in React/Vue, with lock guards and `titleDoubleClickAction="none"` for notification-only/custom consumers. This intentionally changes the former notification-only default.
- Clarify Playground lock modes, restore semantics, and content height rounding in the bilingual guides.

Minor release: adds framework-independent Core and Vue 3 CSR support while preserving root React imports, deprecated aliases, layout/state serialization, CSS, and React peer ranges. Existing React imports and legacy commands remain available. Consumers relying on default maximize/minimize buttons must provide custom controls, and notification-only title handlers should set `titleDoubleClickAction="none"`. The previously announced 0.3.0 alias and native lazyLoad removals are deferred to a future version. Vue consumers install Vue >=3.5.0 <4.0.0 and import the shared CSS; Nuxt/SSR, Vanilla/Svelte renderers and mixed-framework transfer remain unsupported.

- Adopt Governance Contract v1.10 and managed Sol 6.1 defaults.
- Keep the Playground as a developer-run local example; reduce narrow-screen menus to a labeled selector, restore page scrolling, and wrap widget titles/actions within their headers.

- Unify the Playground shell with React/Vue tabs, framework-specific source/API names, shareable example routes and matching initial geometry/options. Preserve legacy React URLs; redirect standalone Vue links into the shared shell. Add Vue quick start guidance to README.
- Align the Playground header, sidebar, framework tabs, right-aligned controls and workspace/source cards with the Comins Sortable visual layout across React and Vue.
- Use matching bidirectional resize/move SVG icons in React/Vue widget controls and add an inset select chevron while preserving native selection and forced-colors fallback.

- Restore controlled source geometry when a Grid rejects a duplicate or restricted drag; wait for drag completion in the React/Vue regression checks so early assertions cannot hide a later commit.
- Add a public framework-independent `/core` entry and explicit `/react` entry; preserve existing root React imports and legacy state commands.
- Add Vue `>=3.5.0 <4.0.0` Composables, generic SFC slots/events, shared browser lifecycle, KeepAlive cleanup, and matching controlled GridStack features. Browser CSR only; no Vanilla/Svelte renderer or Nuxt/SSR support claim.
- Make framework peers optional, keep renderer dependency graphs isolated, and share copied icon data with complete upstream license notices.
- Match all 23 React/Vue examples in control order, icons, layout, interaction results, and bilingual framework-specific guidance; preserve native Vue rendering and local-only operation.
- Add 23 Vue Playground scenarios, API example framework selection, and matching English/Korean Core/Vue guidance. Existing README GIFs remain React recordings.

## 0.2.3

Patch release: fixes existing behavior and improves examples and documentation without removing public APIs or changing React peer ranges. No consumer migration is required; the previously announced removals remain deferred to `0.3.0`.

- Refresh README, the documentation index, architecture/API references, and matching English/Korean guidance against the current implementation. Distinguish source-only changes from npm publication and explain the shared API/Playground examples.
- Regenerate all five README animations from the current source, record their capture scope and metadata, and clarify that the responsive-persistence animation uses explicit column switches while the Playground demonstrates automatic width changes.
- Show a stationary source snapshot and a pointer outline for grid copy drags, preserving normal same-grid moves and cleaning previews on drop, cancellation, and teardown.
- Combine responsive examples into independent column-calculation and layout-policy controls with a width experiment, keeping the previous URLs as redirects.
- Make lazy content rendering observable through actual mount counts, per-widget status, explicit on/off labels, and a restart action; align the API examples and English/Korean guides.
- Expand the external-trash Playground target to full width and place its reset action at the right edge of the live-example heading.
- Keep content-sized card decoration aligned with the allocated grid area and resize handle without stretching the intrinsic measurement shell.
- Add actual content growth/shrink controls, combine Static Grid with the layout-lock comparison, and preserve the former Static Grid URL as a redirect.
- Reuse Playground screens as on-demand API examples, add a feature index and collapsible API details, and expose maximize/minimize/restore controls in Widget Basic.

- Apply controlled geometry atomically while retaining widget DOM, defer synchronization across consumer-owned batches, and commit engine packing corrections back to React and saved layouts.
- Measure intrinsic widget content height, honor per-widget sizing and height limits, and suspend content sizing during maximize/minimize until restore.
- Preserve native taps on widget action controls; give the Mobile Touch example readable narrow-screen columns and an effective resize-handle visibility toggle.
- Clarify container-based responsive breakpoints and bounds/overlap correction with the `none` strategy.
- Refresh README animations and English/Korean guides, and add a content-sizing animation showing actual height growth and shrinkage.
- Batch controlled widget synchronization so GridStack 13.2 does not repeatedly reorder all widget DOM nodes during column changes.
- Update runtime and development dependencies, including GridStack 13.2 and Vitest 5, while preserving the public API and React peer ranges.
- Align React third-party source and license links with its current upstream repository.
- Keep browser interaction checks tied to widget IDs and compare column-cache geometry independently of DOM order; add a DOM-reordering budget to the existing 100-widget resource gate.

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
