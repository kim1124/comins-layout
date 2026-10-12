<script setup lang="ts" generic="TData = unknown">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, watch } from "vue";
import { clampDashboardColumnCount } from "../core/columns";
import { validateDashboardGridConfiguration } from "../core/configuration";
// Keep names used by inferred generic emits anchored to neutral Core. Without
// local type bindings declaration emit can choose the root React barrel.
import type {
  DashboardWidget, DashboardWidgetInteractionEvent, DashboardColumnCount,
  DashboardLayoutSnapshot, DashboardWidgetLayout, DashboardWidgetResizeFrameEvent,
  DashboardWidgetExternalDropEvent, DashboardWidgetDropRequest,
} from "../core/types";
import type { DashboardGridAdapterOptions, DashboardGridHandle } from "../gridstack/adapter";
import { validateDashboardExternalDropTargetSelectors } from "../gridstack/external-drop-target";
import { createDashboardGridConnection } from "../browser/grid-connection";
import { createDashboardResizeScheduler } from "../browser/resize-scheduler";
import { DEFAULT_ACTION_LABELS } from "../ui/widget-actions";
import DashboardWidgetShell from "./DashboardWidgetShell.vue";
import DashboardWidgetContent from "./DashboardWidgetContent.vue";
import type { DashboardGridProps, DashboardGridEmits } from "./types";
import { snapshotDashboardGridInputs } from "./input-snapshot";

const props = withDefaults(defineProps<DashboardGridProps<TData>>(), {
  columns: 12, editable: true, movable: true, resizable: true,
  acceptExternalWidgets: false, showControls: true, lazyRenderWidget: false,
});
const emit = defineEmits<DashboardGridEmits<TData>>();
defineSlots<{ default?(props: { widget: DashboardWidget<TData> }): unknown; actions?(props: { widget: DashboardWidget<TData> }): unknown }>();
const element = shallowRef<HTMLElement | null>(null);
const responsiveColumns = shallowRef(clampDashboardColumnCount(props.columns));
const columns = computed(() => props.responsive ? responsiveColumns.value : clampDashboardColumnCount(props.columns));
const labels = computed(() => ({
  maximize: props.actionLabels?.maximize ?? DEFAULT_ACTION_LABELS.maximize,
  minimize: props.actionLabels?.minimize ?? DEFAULT_ACTION_LABELS.minimize,
  restore: props.actionLabels?.restore ?? DEFAULT_ACTION_LABELS.restore,
  remove: props.actionLabels?.remove ?? DEFAULT_ACTION_LABELS.remove,
}));
const connection = createDashboardGridConnection<TData>();
const scheduler = createDashboardResizeScheduler(event => emit("widgetResizeFrame", event));
let active = false;
const options = computed<DashboardGridAdapterOptions<TData>>(() => {
  validateDashboardGridConfiguration(props);
  return {
    ...snapshotDashboardGridInputs(props), columns: props.columns,
    editable: props.editable, movable: props.movable, resizable: props.resizable,
    gridId: props.gridId,
    acceptExternalWidgets: props.acceptExternalWidgets, gridTransferMode: props.gridTransferMode,
    onColumnsChange: value => { responsiveColumns.value = value; emit("columnsChange", value); },
    onLayoutCommit: snapshot => {
      if (!props.responsive && snapshot.columns !== clampDashboardColumnCount(props.columns)) return;
      emit("layoutCommit", snapshot);
    },
    onWidgetLayoutChange: (id, layout) => emit("widgetLayoutChange", id, layout),
    onWidgetResize: (id, size) => scheduler.schedule({ id, ...size }),
    onWidgetExternalDrop: event => emit("widgetExternalDrop", event),
    onWidgetDropRequest: request => emit("widgetDropRequest", request),
    onBeforeMove: event => emit("beforeMove", event),
    onMove: event => emit("move", event),
    onAfterMove: event => emit("afterMove", event),
    onBeforeResize: event => emit("beforeResize", event),
    onResize: event => emit("resize", event),
    onAfterResize: event => emit("afterResize", event),
  };
});
void options.value;
const reinitializeKey = computed(() => JSON.stringify([props.engineOptions?.rtl ?? null, props.engineOptions?.sizeToContent ?? null]));
let connectedKey: string | undefined;
function connect() {
  if (!element.value) return;
  validateDashboardExternalDropTargetSelectors(element.value.ownerDocument, props.externalDropTargets);
  connectedKey = reinitializeKey.value;
  connection.connect(element.value, options.value);
}
function start() { if (!active) { active = true; connect(); } }
function stop() { active = false; scheduler.cancel(); connection.disconnect(); }
onMounted(start);
onActivated(start);
onDeactivated(stop);
onBeforeUnmount(stop);
watch([options, reinitializeKey], () => {
  if (!active || !element.value) return;
  validateDashboardExternalDropTargetSelectors(element.value.ownerDocument, props.externalDropTargets);
  if (connectedKey !== reinitializeKey.value) { scheduler.cancel(); connect(); }
  else connection.sync(options.value);
}, { flush: "post" });
watch(() => props.refreshKey, value => {
  if (active && value !== undefined) connection.getAdapter()?.refresh();
}, { flush: "post" });
defineExpose<DashboardGridHandle>({
  getGridStack: () => connection.getAdapter()?.grid ?? null,
  getColumnCount: () => connection.getAdapter()?.grid.getColumn() ?? null,
  getRowCount: () => connection.getAdapter()?.grid.getRow() ?? null,
  getFloat: () => connection.getAdapter()?.grid.getFloat() ?? null,
  isAreaEmpty: layout => connection.getAdapter()?.grid.isAreaEmpty(layout.x, layout.y, layout.w, layout.h) ?? null,
  willItFit: layout => connection.getAdapter()?.grid.willItFit(layout) ?? null,
  refresh: () => connection.getAdapter()?.refresh(),
  compact: (layout, doSort) => connection.getAdapter()?.compact(layout, doSort) ?? null,
  commitLayout: () => connection.getAdapter()?.commit() ?? null,
});
</script>

<template>
  <section ref="element" class="grid-stack comins-grid-layout" :data-columns="columns"
    :data-grid-id="gridId?.trim() || undefined" data-testid="dashboard-grid">
    <article v-for="widget in widgets" :key="widget.id" class="grid-stack-item"
      :data-layout-h="widget.layout.h" :data-layout-w="widget.layout.w"
      :data-layout-x="widget.layout.x" :data-layout-y="widget.layout.y"
      :data-maximized="String(widget.maximized ?? false)" :data-minimized="String(widget.minimized ?? false)"
      :data-testid="'dashboard-widget-' + widget.id" :data-widget-id="widget.id"
      :gs-h="widget.layout.h" :gs-w="widget.layout.w" :gs-x="widget.layout.x" :gs-y="widget.layout.y" :gs-id="widget.id">
      <div class="grid-stack-item-content">
        <DashboardWidgetShell :widget="widget" :show-controls="showControls" :labels="labels"
          @maximize="emit('maximizeWidget', $event)" @minimize="emit('minimizeWidget', $event)"
          @restore="emit('restoreWidget', $event)" @remove="emit('removeWidget', $event)"
          @before-title-double-click="emit('beforeTitleDoubleClick', $event)"
          @title-double-click="emit('titleDoubleClick', $event)"
          @after-title-double-click="emit('afterTitleDoubleClick', $event)">
          <template v-if="$slots.actions" #actions><slot name="actions" :widget="widget" /></template>
          <DashboardWidgetContent :enabled="lazyRenderWidget && (widget.lazyLoad ?? true)">
            <slot :widget="widget" />
          </DashboardWidgetContent>
        </DashboardWidgetShell>
      </div>
    </article>
  </section>
</template>
