<script setup lang="ts">
import VueStage from "./VueStage.vue";
import { computed, ref, shallowRef, onMounted, onBeforeUnmount } from "vue";
import { DashboardGrid, useDashboardGrid, type DashboardColumnLayout, type DashboardResponsiveOptions, type DashboardGridHandle } from "../../../../src/vue";
import { createExampleConditions } from '../../shared/example-conditions';
import NumberedContent from './NumberedContent.vue';
import NumberedActions from './NumberedActions.vue';
const props = defineProps<{ locale: 'ko' | 'en'; mode: 'columnWidth' | 'breakpoints'; policy: 'moveScale' | 'none'; width: number; enabled: boolean }>();
const text = (ko: string, en: string) => props.locale === 'ko' ? ko : en;
const initial = createExampleConditions('advanced/responsive');
// Width measurements must not resubmit controlled layouts during a resize.
const engineOptions = { cellHeight: initial.cellHeight, animate: false };
const { widgets, columns, commands } = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
const responsive = computed<DashboardResponsiveOptions>(() => ({ ...(props.mode === "columnWidth" ? { columnWidth: 180, columnMax: 12 } : { breakpoints: [{ maxWidth: 640, columns: 2 as const }, { maxWidth: 960, columns: 6 as const }], columnMax: 12 }), layout: props.policy }));
const container = ref<HTMLDivElement | null>(null), actualWidth = ref(0);
let observer: ResizeObserver | undefined;
const grid = shallowRef<DashboardGridHandle | null>(null), ready = ref(false);
let frame = 0;
function waitForGrid() {
  cancelAnimationFrame(frame);
  const check = () => { if (grid.value?.getColumnCount() != null) ready.value = true; else frame = requestAnimationFrame(check); };
  frame = requestAnimationFrame(check);
}
onMounted(() => {
  waitForGrid();
  observer = new ResizeObserver(() => { if (container.value) actualWidth.value = Math.round(container.value.getBoundingClientRect().width); });
  if (container.value) observer.observe(container.value);
});
onBeforeUnmount(() => { cancelAnimationFrame(frame); observer?.disconnect(); });
</script>
<template>
  <VueStage kind="grid" :locale="locale">
    <div class="example-actions" aria-live="polite">
      <span>{{ text('실제 컨테이너 너비', 'Actual container width') }}: <output :aria-label="text('실제 컨테이너 너비', 'Actual container width')">{{ actualWidth }}px</output></span>
      <span>{{ text('현재 컬럼', 'Current columns') }}: <output>{{ columns }}</output></span>
    </div>
<div style="overflow:hidden" :aria-busy="!ready"><div ref="container" class="responsive-demo-container" :style="{ width: (ready ? Math.max(280, Math.min(1440, width)) : 2160) + 'px', maxWidth: ready ? '100%' : undefined, visibility: ready ? 'visible' : 'hidden' }">
    <DashboardGrid ref="grid"  :widgets="widgets" :columns="columns" :responsive="enabled ? responsive : undefined" :engine-options="engineOptions" class="playground-grid--numbered"
      @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
      @remove-widget="commands.removeWidget" @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget" @restore-widget="commands.restoreWidget">
      <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
      <template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale" /></template>
    </DashboardGrid>
  </div></div>
  <table class="responsive-demo-layout"><caption>{{ text('현재 배치 (그리드 단위)', 'Current layout (grid units)') }}</caption>
    <thead><tr><th>{{ text('위젯', 'Widget') }}</th><th>x</th><th>y</th><th>w</th><th>h</th></tr></thead>
    <tbody><tr v-for="widget in widgets" :key="widget.id"><th>{{ widget.title }}</th><td>{{ widget.layout.x }}</td><td>{{ widget.layout.y }}</td><td>{{ widget.layout.w }}</td><td>{{ widget.layout.h }}</td></tr></tbody>
  </table>
</VueStage>
</template>
