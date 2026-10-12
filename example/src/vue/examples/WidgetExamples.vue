<script setup lang="ts">
import VueStage from './VueStage.vue';
import VueToolbar from './VueToolbar.vue';
import VueIcon from './VueIcon.vue';
import NumberedContent from './NumberedContent.vue';
import NumberedActions from './NumberedActions.vue';
import { computed, ref } from 'vue';
import { DashboardGrid, useDashboardGrid, type DashboardWidgetInteractionEvent, type DashboardStateSnapshot } from '../../../../src/vue';
import { createExampleConditions } from '../../shared/example-conditions';
import { createNumberedWidget } from '../../playground/fixtures';
import type { ExampleWidgetData } from '../../playground/types';
const props = defineProps<{ exampleId: string; locale: 'ko' | 'en' }>();
const text = (ko: string, en: string) => props.locale === 'ko' ? ko : en;
const title = computed(() => props.exampleId.endsWith('/resize') ? text('동적 위젯 크기', 'Dynamic Widget Size') : props.exampleId.endsWith('/basic') ? 'Basic' : props.exampleId.endsWith('/manage') ? text('추가 / 전체 삭제 / 초기화', 'Add / Clear All / Reset') : text('이벤트', 'Events'));
const initial = createExampleConditions(props.exampleId);
const events = ref<string[]>([]);
const { state, widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialWidgets: initial.widgets, initialColumns: initial.columns });
const selectedId = ref('widget-1');
const selected = computed(() => widgets.value.find(widget => widget.id === selectedId.value) ?? widgets.value[0]);
function resize(axis: 'w' | 'h', event: Event) {
  const input = event.target as HTMLInputElement;
  if (!selected.value || input.value === '' || !Number.isFinite(input.valueAsNumber)) return;
  const value = Math.min(Number(input.max) || Infinity, Math.max(Number(input.min) || 1, Math.round(input.valueAsNumber)));
  input.value = String(value);
  commands.resizeWidget(selected.value.id, { w: selected.value.layout.w, h: selected.value.layout.h, [axis]: value });
}
let nextNumber = 10;
function record(name: string, event: DashboardWidgetInteractionEvent) {
  const widget = widgets.value.find(item => item.id === event.id);
  events.value = [...events.value, `${name} ${JSON.stringify({ id: event.id, title: widget?.title ?? event.id, layout: event.layout })}`];
}
</script>
<template>
  <VueStage v-if="!exampleId.endsWith('/basic')" kind="controls" :locale="locale">
    <label v-if="exampleId.endsWith('/events')" class="playground-event-log"><span>{{ text('위젯 이벤트', 'Widget events') }}</span><textarea :aria-label="text('위젯 이벤트', 'Widget events')" readonly :value="events.join('\n')" /></label>
    <VueToolbar v-else :locale="locale">
      <template v-if="exampleId.endsWith('/manage')"><button type="button" @click="commands.addWidget(createNumberedWidget(++nextNumber))"><VueIcon name="Plus" />{{ text('추가', 'Add') }}</button>
      <button type="button" @click="commands.resetLayout()"><VueIcon name="RotateCcw" />{{ text('초기화', 'Reset') }}</button>
      <button class="example-action-button--danger" type="button" @click="commands.clearWidgets()"><VueIcon name="Trash2" />{{ text('전체 삭제', 'Clear all') }}</button></template>
      <template v-else-if="exampleId.endsWith('/resize')">
        <label>{{ text('대상 위젯', 'Target widget') }}<select :aria-label="text('대상 위젯', 'Target widget')" :value="selected?.id ?? ''" :disabled="!selected" @change="selectedId = ($event.target as HTMLSelectElement).value"><option v-for="widget in widgets" :key="widget.id" :value="widget.id">{{ widget.title }}</option></select></label>
        <label>W<input aria-label="W" type="number" :min="selected?.layout.minW ?? 1" :max="Math.min(selected?.layout.maxW ?? columns, columns)" step="1" :value="selected?.layout.w ?? ''" :disabled="!selected" @input="resize('w', $event)" @blur="($event.target as HTMLInputElement).value = String(selected?.layout.w ?? '')" /></label>
        <label>H<input aria-label="H" type="number" :min="selected?.layout.minH ?? 1" :max="selected?.layout.maxH" step="1" :value="selected?.layout.h ?? ''" :disabled="!selected" @input="resize('h', $event)" @blur="($event.target as HTMLInputElement).value = String(selected?.layout.h ?? '')" /></label>
        <button type="button" :disabled="!selected || !state.previousLayouts[selected.id]" @click="selected && commands.restoreWidget(selected.id)">{{ text('크기 복원', 'Restore size') }}</button>
        <output :aria-label="text('적용된 크기', 'Applied size')">{{ selected ? `W${selected.layout.w} / H${selected.layout.h} · W ${selected.layout.minW}–${Math.min(selected.layout.maxW ?? columns, columns)} / H ${selected.layout.minH}–${selected.layout.maxH}` : '—' }}</output>
      </template>
    </VueToolbar>
  </VueStage>
  <VueStage kind="grid" :locale="locale"><section class="playground-grid-region" :aria-label="`${title} Grid`">
    <DashboardGrid class="playground-grid--numbered" :widgets="widgets" :columns="columns" :refresh-key="refreshVersion" :engine-options="{ animate: false }"
      @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns" @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget" @before-move="record('beforeMove', $event)" @move="record('move', $event)" @after-move="record('afterMove', $event)" @before-resize="record('beforeResize', $event)" @resize="record('resize', $event)" @after-resize="record('afterResize', $event)" @before-title-double-click="record('beforeTitleDoubleClick', $event)" @title-double-click="record('titleDoubleClick', $event)" @after-title-double-click="record('afterTitleDoubleClick', $event)">
      <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
      <template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale"  /></template>
    </DashboardGrid>
  </section></VueStage>
</template>
