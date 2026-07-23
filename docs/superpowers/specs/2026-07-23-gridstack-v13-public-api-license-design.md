# GridStack 13 Public API And License Design

## Release Scope

- Target `comins-grid-layout@0.1.5` as a backward-compatible additive release.
- Upgrade the external GridStack dependency to the public version 13 API.
- Keep React state, widget CRUD, lifecycle, and persistence owned by Comins.
- Keep direct engine integration in the package adapter; consumers receive only a borrowed public GridStack instance.

## Supported Engine Configuration

`DashboardGrid.engineOptions` supports cell height, margin, float, animation, static mode, RTL, minimum and maximum rows, size-to-content, drag handle, resize handles, always-visible resize handles, and CSP nonce. Only changed runtime-capable options are synchronized. `nonce` is initialization-only and a new value requires remounting.

Construction internals, engine/item classes, children, nested grids, removable/drop contracts, global callbacks, and lifecycle-destroying options are excluded. Invalid numeric dimensions, row bounds, handles, and responsive definitions throw `DashboardGridConfigurationError` with a constant non-disclosing message.

## Responsive State Contract

- Without `responsive`, the clamped `columns` prop remains authoritative.
- With `responsive`, GridStack selects the active column from `columnWidth` or explicit breakpoints; rerenders do not force the fallback column back onto the engine.
- `grid.getColumn()` is the source for DOM metadata, snapshots, layout commits, and `onColumnsChange`.
- Active column changes are animation-frame coalesced and committed even when widget geometry is unchanged.
- `applyLayoutSnapshot()` updates active columns and matching widget geometry in one reducer action. Version 0.1.5 persists only the active layout; breakpoint-specific persistence is deferred.

## Handle And Events

- `refresh()` recalculates resize-to-content, dynamic handles, and resize-frame notifications without reordering.
- `compact(layout, doSort)` invokes the public GridStack command, commits once, and returns the snapshot.
- `commitLayout()` commits commands that do not emit `change`; duplicate snapshots are suppressed.
- Drag and resize expose start/stop callbacks with widget ID and geometry. Stop ordering is per-widget layout callbacks, layout commit, then interaction stop.
- High-frequency drag events remain on the borrowed GridStack instance. Raw React-content add/remove is unsupported, and consumers must not destroy the instance or remove package listeners.

## Dependency And License Boundary

- `gridstack`, `lucide-react`, `react`, and `react-dom` remain external to the JavaScript bundle.
- `THIRD_PARTY_NOTICES.md` records dependency scope, SPDX identifier, and upstream source/license links without copying upstream author or personal contact data.
- The fail-closed gate compares direct runtime and peer dependencies, installed SPDX metadata and license files, bundle externals, and the exact npm artifact.
- Bundled or copied third-party source requires a separate Governance notice exception and is outside this release.

## Verification Contract

- Run focused type, configuration, option mapping, atomic state, handle, responsive, engine-option, and interaction-order tests.
- Run security, consumer, exact package-artifact, and full browser/resource gates once after the meaningful implementation is complete.
- Preserve the 100-widget steady-state contract: fixed DOM counters, 12% transient heap peak, trailing three-sample 2% final growth, and non-monotonic leak detection.
