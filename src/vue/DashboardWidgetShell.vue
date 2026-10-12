<script setup lang="ts" generic="TData = unknown">
import { computed } from "vue";
import type { DashboardWidget, DashboardWidgetInteractionEvent } from "../core/types";
import type { DashboardWidgetShellProps, DashboardWidgetShellEmits } from "./types";
import { DEFAULT_ACTION_LABELS } from "../ui/widget-actions";
import { dashboardActionIcons } from "../ui/icons";

const props = withDefaults(defineProps<DashboardWidgetShellProps<TData>>(), { showControls: true });
const emit = defineEmits<DashboardWidgetShellEmits>();
defineSlots<{ default?(props: { widget: DashboardWidget<TData> }): unknown; actions?(props: { widget: DashboardWidget<TData> }): unknown }>();
const labels = computed(() => props.labels ?? DEFAULT_ACTION_LABELS);
const title = computed(() => props.widget.title ?? props.widget.id);
const actions = ["restore", "remove"] as const;
const actionHandlers = {
  restore: () => emit("restore", props.widget.id),
  remove: () => emit("remove", props.widget.id),
};
function titleDoubleClick() {
  const event: DashboardWidgetInteractionEvent = { id: props.widget.id, layout: { ...props.widget.layout } };
  emit("beforeTitleDoubleClick", event);
  emit("titleDoubleClick", event);
  emit("afterTitleDoubleClick", event);
}
</script>

<template>
  <div class="comins-grid-layout-widget">
    <header class="comins-grid-layout-widget__header">
      <strong class="comins-grid-layout-widget__title" @dblclick="titleDoubleClick">{{ title }}</strong>
      <div v-if="showControls" class="comins-grid-layout-widget__actions" @dblclick.stop @touchstart.stop.passive>
        <slot name="actions" :widget="widget">
          <button v-for="action in actions" :key="action" type="button"
            :aria-label="title + ' ' + labels[action]"
            :class="{ 'comins-grid-layout-widget__action--danger': action === 'remove' }"
            @click="actionHandlers[action]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <component :is="node[0]" v-for="node in dashboardActionIcons[action]" :key="node[1].key" v-bind="node[1]" />
            </svg>
          </button>
        </slot>
      </div>
    </header>
    <div class="comins-grid-layout-widget__body"><slot :widget="widget" /></div>
  </div>
</template>
