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
const title = computed(() => props.exampleId.endsWith('/basic') ? 'Basic' : props.exampleId.endsWith('/manage') ? text('추가 / 전체 삭제 / 초기화', 'Add / Clear All / Reset') : text('이벤트', 'Events'));
const initial = createExampleConditions(props.exampleId);
const events = ref<string[]>([]);
const { widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialWidgets: initial.widgets, initialColumns: initial.columns });
const selectedId = ref('widget-1');
const selected = computed(() => widgets.value.find(widget => widget.id === selectedId.value) ?? widgets.value[0]);
let nextNumber = 10;
function record(name: string, event: DashboardWidgetInteractionEvent) {
  const widget = widgets.value.find(item => item.id === event.id);
  events.value = [...events.value, `${name} ${JSON.stringify({ id: event.id, title: widget?.title ?? event.id, layout: event.layout })}`];
}
</script>
<template>
  <VueStage kind="controls" :locale="locale">
    <label v-if="exampleId.endsWith('/events')" class="playground-event-log"><span>{{ text('위젯 이벤트', 'Widget events') }}</span><textarea :aria-label="text('위젯 이벤트', 'Widget events')" readonly :value="events.join('\n')" /></label>
    <VueToolbar v-else :locale="locale">
      <template v-if="exampleId.endsWith('/manage')"><button type="button" @click="commands.addWidget(createNumberedWidget(++nextNumber))"><VueIcon name="Plus" />{{ text('추가', 'Add') }}</button>
      <button type="button" @click="commands.resetLayout()"><VueIcon name="RotateCcw" />{{ text('초기화', 'Reset') }}</button>
      <button class="example-action-button--danger" type="button" @click="commands.clearWidgets()"><VueIcon name="Trash2" />{{ text('전체 삭제', 'Clear all') }}</button></template>
      <template v-else>
        <label>{{ text('대상 위젯', 'Target widget') }}<select :aria-label="text('대상 위젯', 'Target widget')" :value="selected?.id ?? ''" :disabled="!selected" @change="selectedId = ($event.target as HTMLSelectElement).value"><option v-for="widget in widgets" :key="widget.id" :value="widget.id">{{ widget.title }}</option></select></label>
        <button type="button" :disabled="!selected" @click="selected && commands.maximizeWidget(selected.id)">{{ text('선택 위젯 최대화', 'Maximize selected widget') }}</button>
        <button type="button" :disabled="!selected" @click="selected && commands.minimizeWidget(selected.id)">{{ text('선택 위젯 최소화', 'Minimize selected widget') }}</button>
        <button type="button" :disabled="!selected" @click="selected && commands.restoreWidget(selected.id)">{{ text('선택 위젯 복원', 'Restore selected widget') }}</button>
      </template>
    </VueToolbar>
  </VueStage>
  <VueStage kind="grid" :locale="locale"><section class="playground-grid-region" :aria-label="`${title} Grid`">
    <DashboardGrid class="playground-grid--numbered" :widgets="widgets" :columns="columns" :refresh-key="refreshVersion" :engine-options="{ animate: false }"
      @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
      @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget" @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget" @before-move="record('beforeMove', $event)" @move="record('move', $event)" @after-move="record('afterMove', $event)" @before-resize="record('beforeResize', $event)" @resize="record('resize', $event)" @after-resize="record('afterResize', $event)" @before-title-double-click="record('beforeTitleDoubleClick', $event)" @title-double-click="record('titleDoubleClick', $event)" @after-title-double-click="record('afterTitleDoubleClick', $event)">
      <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
      <template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale"  /></template>
    </DashboardGrid>
  </section></VueStage>
</template>
