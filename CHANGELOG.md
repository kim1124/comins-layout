# comins-grid-layout

## 0.1.5

- Upgraded the external GridStack engine to the public version 13 API while retaining the package-owned adapter boundary.
- Added supported `engineOptions`, responsive breakpoint columns, actual-column callbacks, and atomic layout snapshot application.
- Added explicit `compact()` and non-reordering `refresh()` handle methods plus drag and resize lifecycle callbacks.
- Added fail-closed third-party notice, external-bundle, installed-license, and exact package-artifact verification.
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
