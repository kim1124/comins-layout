# Core and Vue 3 (0.3.0)

This chapter describes source version 0.3.0. Registry availability is verified separately. Existing root React imports remain compatible. `/react` is an explicit React entry, `/vue` supports Vue `>=3.5.0 <4.0.0`, and `/core` exposes framework-independent state helpers and types. Vanilla and Svelte renderers are not shipped.

## Ownership and entry points

| Entry | Responsibility | Consumer dependencies |
| --- | --- | --- |
| `comins-grid-layout/core` | Serializable state, layouts, commands' types, transfer policy | No DOM or framework required |
| `comins-grid-layout` or `/react` | React hook and DOM renderer | React and React DOM 18 or 19 |
| `comins-grid-layout/vue` | Vue Composables, SFC renderer and slots | Vue 3.5 or later within major 3 |
| `comins-grid-layout/styles.css` | Shared visual styles | Browser |

Core does not expose the reducer, mutation queue, resize scheduler, option mapper, or GridStack handle. Browser lifecycle and engine integration are internal shared layers; a public Vanilla renderer is not implied. The package installation may contain GridStack because it is a package dependency, but importing `/core` does not load it or either framework. React/Vue peers are optional so install only the framework you use.

```ts
import { createDashboardLayoutState, serializeDashboardState } from 'comins-grid-layout/core';

const state = createDashboardLayoutState({ widgets: [], columns: 12 });
const snapshot = serializeDashboardState(state);
```

## Vue installation and minimal controlled grid

After this version is published, install `comins-grid-layout` and `vue@^3.5`. Until then use a locally built package artifact. Do not infer registry availability from these source examples. Import both GridStack CSS and package CSS once in your browser entry:

```ts
import 'gridstack/dist/gridstack.min.css';
import 'comins-grid-layout/styles.css';
```

```vue
<script setup lang="ts">
import { DashboardGrid, useDashboardGrid } from 'comins-grid-layout/vue';

const { widgets, columns, commands, refreshVersion } = useDashboardGrid<{ value: number }>({
  initialWidgets: [{
    id: 'revenue', title: 'Revenue', data: { value: 100 },
    layout: { id: 'revenue', x: 0, y: 0, w: 4, h: 3 },
  }],
});
</script>

<template>
  <DashboardGrid :widgets="widgets" :columns="columns" :refresh-key="refreshVersion"
    @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
    @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget">
    <template #default="{ widget }">{{ widget.data?.value }}</template>
  </DashboardGrid>
</template>
```

The renderer does not mutate your widget array. Without `layoutCommit` and action connections, gestures/buttons do not persist into controlled state. `columnsChange` keeps responsive column changes in state. Slots receive the same generic `DashboardWidget<TData>`; `actions` replaces default action buttons. Initial options are read once; changing `initialWidgets` later is not a controlled update. Use commands instead. `state`, `widgets`, `columns`, and `refreshVersion` are read-only computed refs; commands are stable and read current state. In script use `.value`; templates unwrap top-level refs.

`onLayoutMutation` runs after Vue flushes rendering, in order, with a snapshot per mutation. Reentrant commands are delivered in a later flush. Scope disposal stops pending delivery; route callback failures through Vue's `app.config.errorHandler`. Standalone unhandled exceptions are not a recovery contract.

Consumers may instead pass their own `ref`/`reactive` arrays and options as controlled props. Array `push`/`splice`, widget layout fields, engine/responsive settings and external deletion targets synchronize together after the render flush, including in-place changes. Changes to `useDashboardDragIn` preview/drag settings reconnect the source. Widget `data` internals are not deeply watched for engine synchronization. This does not permit directly mutating Composable-owned state; use its commands for those changes.

## React to Vue mapping

| React | Vue |
| --- | --- |
| `renderWidget(widget)` | `#default="{ widget }"` |
| `renderWidgetActions(widget)` | `#actions="{ widget }"` |
| `onLayoutCommit(snapshot)` | `@layout-commit="commands.applyLayoutSnapshot"` |
| `onWidgetLayoutChange(id, layout)` | `@widget-layout-change` with two arguments |
| `onColumnsChange(columns)` | `@columns-change="commands.setColumns"` |
| `onMaximizeWidget` / `onMinimizeWidget` / `onRestoreWidget` / `onRemoveWidget` | `@maximize-widget` / `@minimize-widget` / `@restore-widget` / `@remove-widget` |
| `onWidgetDropRequest(request)` | `@widget-drop-request` — apply an accepted transfer result to both states |
| `onWidgetExternalDrop(event)` | `@widget-external-drop` — the consumer decides whether to delete |
| `onWidgetResizeFrame(event)` | `@widget-resize-frame` — scheduled content resize notification |

Other emits are `beforeMove`, `move`, `afterMove`, `beforeResize`, `resize`, `afterResize`, `beforeTitleDoubleClick`, `titleDoubleClick`, and `afterTitleDoubleClick`. In templates use kebab-case, for example `@after-resize`. These are notifications, not permission vetoes. Shared props retain their meaning: `widgets`, `columns`, `editable`, `movable`, `resizable`, `engineOptions`, `responsive`, `externalDropTargets`, `gridId`, `acceptExternalWidgets`, `gridTransferMode`, `refreshKey`, `showControls`, `lazyRenderWidget`, and `actionLabels`.

## Lifecycle and advanced operations

- Create Composables inside component setup or an active effect scope. `useDashboardDragIn` returns the element ref for the palette; `createWidget` reads current state at drag start.
- A component ref exposes `DashboardGridHandle`: `getGridStack`, `getColumnCount`, `getRowCount`, `getFloat`, `isAreaEmpty`, `willItFit`, `refresh`, `compact`, `commitLayout`. Engine queries return `null` before connection. Direct GridStack access is an advanced escape hatch, not a Core API.
- KeepAlive deactivation disconnects the engine, drag-in, observers and scheduled work. Activation reconnects once; unmount cancels pending asynchronous connection. `rtl` and `sizeToContent` changes reconnect the engine; other options synchronize in place.
- Lazy rendering reserves widget layout first and mounts slot content once when visible. It is not virtualization and does not unload offscreen content. Trigger `commands.refreshLayout()` after intrinsic content changes when automatic sizing needs a new measurement.
- State, IDs, duplicate-ID rejection, move/copy transfer and layout persistence share the same Core implementation across React and Vue. Nested grids have separate state owners.

This release scope is browser CSR. SSR, hydration guarantees, Nuxt integration, Vanilla/Svelte renderers, per-widget teleport and arbitrary GridStack DOM ownership are not supported contracts.

## Runnable examples

Run `npm run dev` from a checkout. Open `/examples/widget/basic/react` or `/examples/widget/basic/vue` in the shared Playground. React/Vue tabs share navigation, language, related API labels and the source panel. All 23 scenarios use matching initial widgets, geometry, columns, cell heights and primary settings. Switching the framework/example resets state and releases the previous engine. Changing language retains state. Routes support sharing, reload and browser history; legacy React URLs remain available.

View code displays the running TSX/SFC and its supporting files with public package imports. This is a multi-file Vite example, not a single standalone snippet. `/api` changes callback/emit/slot labels, actual source and preview with the selected framework. `onLayoutMutation` remains a Composable option callback in Vue; React-only compatibility aliases are omitted.

Legacy `/vue.html?example=widget/basic&locale=en` links redirect to the shared Vue screen. `embed=1` retains the independent Vue root used by API previews. Unknown IDs are rejected. `npm run build:examples` builds both HTML entries; `npm run preview:examples` serves the production result. Existing README GIFs remain React recordings, not Vue verification evidence.
