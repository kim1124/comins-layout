# Persistence

Use `serializeState` for durable application storage. It includes the active widgets, maximize/minimize restore geometry, and layouts cached for every visited column count. Use `serializeLayout` only when you need the active columns and geometry.

```tsx
const STORAGE_KEY = "dashboard:v1";

function saveDashboard() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard.commands.serializeState()));
}

function restoreDashboard() {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value) dashboard.commands.restoreLayout(JSON.parse(value));
}

function resetDashboard() {
  dashboard.commands.resetLayout();
}
```

`serializeLayout` returns a `DashboardLayoutSnapshot`: `{ columns, widgets }`, where widgets are geometry only. `serializeState` returns a `DashboardStateSnapshot<TData>` with top-level `widgets`, `previousLayouts`, and `layoutsByColumn`.

`restoreLayout` accepts `DashboardStateSnapshotInput<TData>`. For compatibility, `previousLayouts` and `layoutsByColumn` may be omitted. If an active cached entry conflicts with the top-level state, the top-level `widgets` and `previousLayouts` are authoritative. `resetLayout(snapshot)` uses the same validation and replacement path; without an argument it returns to hook initialization.

The pure helper `serializeDashboardState` is available when state is managed outside React. `applyLayoutSnapshot` should be used for engine geometry commits, not as a replacement for full-state restoration.

Storage, schema migration, encryption, authentication, and server synchronization are consumer responsibilities. Parse and validate untrusted persisted JSON before passing it to application state.

Playground: `/examples/layout/persistence`. Its Save button keeps a snapshot only in page-local memory; leaving or reloading the page discards it. Applications must implement durable storage, as in the example above.

Keep `onLayoutCommit={dashboard.commands.applyLayoutSnapshot}` connected before saving. The adapter commits final packing and content-sizing corrections to React, so the saved state matches the visible layout after removal, arrange, or Float changes. If a consumer opens an engine batch, controlled synchronization waits until that batch closes.
