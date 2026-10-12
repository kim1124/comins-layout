<script setup lang="ts">
import VueStage from "./VueStage.vue";
import { defineComponent, h, ref, onMounted } from "vue";
import { DashboardGrid, useDashboardGrid } from "../../../../src/vue";
import { createExampleConditions } from '../../shared/example-conditions';
import NumberedContent from './NumberedContent.vue';
import type { DashboardWidget } from '../../../../src/core';
import type { ExampleWidgetData } from '../../playground/types';
import type { PropType } from 'vue';
const props = defineProps<{ exampleId: string; locale: "ko" | "en" }>();
const text = (ko: string, en: string) => props.locale === "ko" ? ko : en;
const enabled = ref(true), generation = ref(0), mountedIds = ref<string[]>([]);
const initial = createExampleConditions(props.exampleId);
const { widgets, columns, commands } = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
// Count actual content setup, not intersection callbacks or reserved widget shells.
const Content = defineComponent({ props: { widget: { type: Object as PropType<DashboardWidget<ExampleWidgetData>>, required: true } }, setup(content) {
  onMounted(() => { mountedIds.value = [...new Set([...mountedIds.value, content.widget.id])]; });
  return () => h(NumberedContent, { widget: content.widget, locale: props.locale });
} });
function restart() { commands.resetLayout(); mountedIds.value = []; generation.value++; }
</script>
<template>
  <VueStage kind="controls" :locale="locale"><div class="example-actions">
    <button type="button" :aria-pressed="enabled" @click="enabled = !enabled">{{ text(`지연 렌더링 ${enabled ? '켜짐' : '꺼짐'}`, `Lazy rendering ${enabled ? 'on' : 'off'}`) }}</button>
    <button type="button" @click="restart">{{ text('다시 실험', 'Restart experiment') }}</button>
  </div></VueStage>
  <VueStage kind="grid" :locale="locale">
    <p aria-live="polite">{{ text('콘텐츠 렌더링', 'Content rendered') }}: <output :aria-label="text('콘텐츠 렌더링 수', 'Rendered content count')">{{ mountedIds.length }} / {{ widgets.length }}</output></p>
    <ul class="lazy-demo-status" :aria-label="text('위젯별 렌더링 상태', 'Per-widget render status')"><li v-for="widget in widgets" :key="widget.id" :data-rendered="mountedIds.includes(widget.id)">{{ widget.title }}: {{ mountedIds.includes(widget.id) ? text('완료', 'Rendered') : text('대기', 'Waiting') }}</li></ul>
    <div :key="generation" data-dashboard-lazy-scroll class="advanced-lazy-scroll lazy-demo" :data-language="locale">
      <section class="playground-grid-region" :aria-label="text('콘텐츠 지연 렌더링 Grid', 'Lazy Content Rendering Grid')">
        <DashboardGrid :columns="columns" :widgets="widgets" :lazy-render-widget="enabled" :show-controls="false" :engine-options="{ cellHeight: 180, animate: false }" class="playground-grid--numbered" @columns-change="commands.setColumns" @layout-commit="commands.applyLayoutSnapshot">
          <template #default="{ widget }"><Content :widget="widget" /></template>
        </DashboardGrid>
      </section>
    </div>
  </VueStage>
</template>
