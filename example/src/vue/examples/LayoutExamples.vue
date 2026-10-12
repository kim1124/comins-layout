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
const title = computed(() => ({
  basic: 'Basic', lock: text('레이아웃 잠금 / 해제', 'Lock / Unlock Layout'),
  persistence: text('레이아웃 저장 / 불러오기', 'Save / Load Layout'),
  arrange: text('자동 정렬 / 빈 공간 채우기', 'Auto Arrange / Fill Gaps'),
  events: text('레이아웃 이벤트', 'Layout Events'),
})[props.exampleId.split('/')[1] as 'basic' | 'lock' | 'persistence' | 'arrange' | 'events']);
const initial = createExampleConditions(props.exampleId);
const events = ref<string[]>([]);
const { widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialWidgets: initial.widgets, initialColumns: initial.columns,
  onLayoutMutation: event => { events.value = [...events.value, `${event.kind} ${JSON.stringify({ widgetIds: event.widgetIds, columns: event.columns })}`]; },
});
let nextNumber = 10;
const locked = ref(false), mode = ref('interaction'), json = ref('');
const saved = ref<DashboardStateSnapshot<ExampleWidgetData> | null>(null);
function save() { const snapshot = commands.serializeState(); saved.value = snapshot; json.value = JSON.stringify(snapshot, null, 2); }
function load() { if (saved.value) commands.restoreLayout(JSON.parse(json.value)); }
</script>
<template>
  <VueStage kind="controls" :locale="locale">
    <VueToolbar :locale="locale" :columns="columns" @columns-change="commands.setColumns">
      <button type="button" @click="commands.addWidget(createNumberedWidget(++nextNumber))"><VueIcon name="Plus" />{{ text('추가', 'Add') }}</button>
      <button type="button" @click="commands.resetLayout()"><VueIcon name="RotateCcw" />{{ text('초기화', 'Reset') }}</button>
      <button class="example-action-button--danger" type="button" @click="commands.clearWidgets()"><VueIcon name="Trash2" />{{ text('전체 삭제', 'Clear all') }}</button>
      <template v-if="exampleId.endsWith('/lock')">
        <label>{{ text('잠금 방식', 'Lock mode') }}<select :aria-label="text('잠금 방식', 'Lock mode')" v-model="mode"><option value="interaction">{{ text('이동·리사이즈 잠금', 'Movement / resize lock') }}</option><option value="static">{{ text('정적 모드 (Static Grid)', 'Static Grid') }}</option></select></label>
      </template>
      <button v-if="exampleId.endsWith('/lock') || exampleId.endsWith('/events')" type="button" :aria-pressed="locked" @click="locked = !locked"><VueIcon :name="locked ? 'Unlock' : 'Lock'" />{{ locked ? text('레이아웃 해제', 'Unlock layout') : text('레이아웃 잠금', 'Lock layout') }}</button>
      <template v-if="exampleId.endsWith('/persistence')">
        <button type="button" @click="save"><VueIcon name="Save" />{{ text('레이아웃 저장', 'Save layout') }}</button>
        <button type="button" :disabled="!saved" @click="load"><VueIcon name="Upload" />{{ text('레이아웃 불러오기', 'Load layout') }}</button>
      </template>
      <template v-if="exampleId.endsWith('/arrange')">
        <button type="button" @click="commands.autoArrangeWidgets()"><VueIcon name="AlignVerticalSpaceAround" />{{ text('자동 정렬', 'Auto arrange') }}</button>
        <button type="button" @click="commands.fitWidgetsToColumns()"><VueIcon name="Columns3" />{{ text('빈 공간 채우기', 'Fill gaps') }}</button>
      </template>
    </VueToolbar>
    <label v-if="exampleId.endsWith('/persistence')" class="playground-event-log"><span>{{ text('마지막 저장 레이아웃 JSON', 'Last saved layout JSON') }}</span><textarea readonly :aria-label="text('마지막 저장 레이아웃 JSON', 'Last saved layout JSON')" :value="json" /></label>
    <label v-if="exampleId.endsWith('/events')" class="playground-event-log"><span>{{ text('레이아웃 이벤트', 'Layout events') }}</span><textarea readonly :aria-label="text('레이아웃 이벤트', 'Layout events')" :value="events.join('\n')" /></label>
  </VueStage>
  <VueStage kind="grid" :locale="locale"><section class="playground-grid-region" :aria-label="`${title} Grid`">
    <DashboardGrid class="playground-grid--numbered" :widgets="widgets" :columns="columns" :refresh-key="refreshVersion" :movable="mode === 'static' || !locked" :resizable="mode === 'static' || !locked" :engine-options="{ animate: false, staticGrid: mode === 'static' && locked }"
      @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns"
      @maximize-widget="commands.maximizeWidget" @minimize-widget="commands.minimizeWidget" @restore-widget="commands.restoreWidget" @remove-widget="commands.removeWidget" >
      <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
      <template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale" :movable="!locked" :resizable="!locked" /></template>
    </DashboardGrid>
  </section></VueStage>
</template>
