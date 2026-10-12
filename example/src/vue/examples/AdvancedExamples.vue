<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { DashboardGrid, useDashboardGrid, type DashboardGridHandle } from '../../../../src/vue';
import { createExampleConditions } from '../../shared/example-conditions';
import { frameworkExamplePath } from '../../shared/framework-navigation';
import VueStage from './VueStage.vue';
import VueToolbar from './VueToolbar.vue';
import VueIcon from './VueIcon.vue';
import NumberedContent from './NumberedContent.vue';
import NumberedActions from './NumberedActions.vue';
import NestedGrid from './NestedGrid.vue';
const props = defineProps<{ exampleId: string; locale: 'ko' | 'en' }>();
const text = (ko: string, en: string) => props.locale === 'ko' ? ko : en;
const feature = computed(() => props.exampleId.replace('advanced/', ''));
const enabled = ref(true), height = ref(96), result = ref<string | null>(null), depth = ref(2);
const initial = createExampleConditions(props.exampleId);
const { widgets, columns, commands, refreshVersion } = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
const grid = shallowRef<DashboardGridHandle | null>(null);
const nested = computed(() => feature.value === 'nested/basic');
const publicApi = computed(() => feature.value === 'public-api');
const options = computed(() => ({
  cellHeight: nested.value ? 78 : publicApi.value ? undefined : height.value,
  animate: false,
  float: feature.value === 'float' ? enabled.value : false,
  rtl: feature.value === 'rtl' ? enabled.value : false,
  dragHandle: (feature.value === 'title-drag' && enabled.value) || nested.value ? '.comins-grid-layout-widget__title' : undefined,
  alwaysShowResizeHandle: feature.value === 'mobile-touch' ? (enabled.value ? 'mobile' as const : false) : undefined,
}));
const title = computed(() => ({
  'cell-height': text('셀 높이', 'Cell Height'), 'grid-lines': text('그리드 라인', 'Grid Lines'), float: 'Float',
  'mobile-touch': text('모바일 터치', 'Mobile Touch'), rtl: 'RTL', 'title-drag': text('타이틀 Drag Handle', 'Title Drag Handle'),
  transform: 'Transform', 'nested/basic': text('Nested Grid - 구성', 'Nested Grid - Composition'),
  'public-api': text('안전한 공개 핸들러 / 메서드', 'Safe Public Handlers / Methods'),
}[feature.value]));
const toggleLabel = computed(() => {
  const on = enabled.value;
  switch (feature.value) {
    case 'float': return text(`Float ${on ? '켜짐' : '꺼짐'}`, `Float ${on ? 'on' : 'off'}`);
    case 'grid-lines': return text(`그리드 라인 ${on ? '표시' : '숨김'}`, `Grid lines ${on ? 'shown' : 'hidden'}`);
    case 'rtl': return text(`RTL ${on ? '켜짐' : '꺼짐'}`, `RTL ${on ? 'on' : 'off'}`);
    case 'transform': return text(`Transform ${on ? '적용' : '해제'}`, `Transform ${on ? 'applied' : 'removed'}`);
    case 'mobile-touch': return text(on ? '리사이즈 핸들 항상 표시' : '리사이즈 핸들 자동 표시', on ? 'Resize handles always visible' : 'Resize handles shown automatically');
    case 'title-drag': return text(on ? '타이틀로만 이동' : '전체 위젯에서 이동', on ? 'Move from title only' : 'Move from the full widget');
    default: return text(on ? '사용' : '미사용', on ? 'Enabled' : 'Disabled');
  }
});
function inspect() {
  result.value = JSON.stringify({ columns: grid.value?.getColumnCount(), rows: grid.value?.getRowCount(), float: grid.value?.getFloat(),
    firstAreaEmpty: grid.value?.isAreaEmpty({ x: 0, y: 0, w: 1, h: 1 }), nextRowFits: grid.value?.willItFit({ x: 0, y: 8, w: 3, h: 2 }) }, null, 2);
}
function compact() { const snapshot = grid.value?.compact('compact', true); if (snapshot) result.value = JSON.stringify(snapshot, null, 2); }
</script>
<template>
  <section class="playground-workspace" :data-advanced-feature="nested ? 'nested' : feature">
    <VueStage kind="controls" :locale="locale" :description="nested ? text('구성 깊이를 전환한 뒤 각 Grid의 타이틀 grab 영역에서 이동하고 southeast 핸들에서 리사이즈합니다.', `Switch the composition depth, then move from each grid's title grab area and resize from the southeast handle.`) : undefined">
      <template v-if="nested">
        <div :aria-label="text('Nested Grid 구성 깊이', 'Nested Grid composition depth')" class="example-actions" role="group">
          <button v-for="value in [2, 3]" :key="value" class="example-toggle-button" type="button" :aria-pressed="depth === value" :data-active="String(depth === value)" @click="depth = value">{{ value }}{{ text('단계', ' levels') }}</button>
        </div>
        <p class="playground-control-note">{{ text('타이틀: 이동 · 우측 하단: 리사이즈 · ', 'Title: move · Bottom-right: resize · ') }}<a :href="frameworkExamplePath('advanced/multi-grid/horizontal', 'vue')">{{ text('A/B Grid 이동·복사 예제', 'A/B grid move/copy example') }}</a></p>
      </template>
      <VueToolbar v-else :locale="locale" :id="`advanced-${feature}`">
        <template v-if="feature === 'cell-height'"><button v-for="value in [72, 96, 120]" :key="value" type="button" :aria-pressed="height === value" @click="height = value">{{ value }}px</button></template>
        <template v-else-if="publicApi">
          <button type="button" @click="inspect"><VueIcon name="Columns3" :size="15" />{{ text('상태 조회', 'Query state') }}</button>
          <button type="button" @click="compact"><VueIcon name="Grid2X2" :size="15" />{{ text('정렬 후 커밋', 'Arrange and commit') }}</button>
          <button type="button" @click="grid?.refresh()"><VueIcon name="RefreshCcw" :size="15" />{{ text('레이아웃 갱신', 'Refresh layout') }}</button>
        </template>
        <button v-else type="button" :aria-pressed="enabled" :data-active="String(enabled)" @click="enabled = !enabled"><VueIcon name="Grid2X2" :size="15" />{{ toggleLabel }}</button>
      </VueToolbar>
      <template v-if="publicApi">
        <pre :aria-label="text('공개 메서드 실행 결과', 'Public method result')" class="public-api-result">{{ result ?? text('메서드를 실행해 결과를 확인하세요.', 'Run a method to inspect its result.') }}</pre>
        <p class="public-api-warning">{{ text('getGridStack()은 하위 호환용 escape hatch입니다. raw CRUD는 Vue 제어 상태를 우회하므로 이 예제에서는 호출하지 않습니다.', 'getGridStack() is a backward-compatibility escape hatch. raw CRUD bypasses Vue controlled state, so this example does not call it.') }}</p>
      </template>
    </VueStage>
    <VueStage kind="grid" :locale="locale">
      <div v-if="feature === 'transform' && enabled" class="advanced-transform-stage">
        <section :aria-label="`${title} Grid`" class="playground-grid-region">
          <DashboardGrid ref="grid" :widgets="widgets" :columns="columns" :engine-options="options" :refresh-key="refreshVersion" class="playground-grid--numbered" @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns">
            <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
            <template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale" /></template>
          </DashboardGrid>
        </section>
      </div>
      <section v-else :aria-label="publicApi ? text('공개 API Grid', 'Public API Grid') : `${title} Grid`" :class="['playground-grid-region', { 'nested-example-root': nested }]">
        <DashboardGrid ref="grid" :key="nested ? depth : undefined" :widgets="widgets" :columns="columns" :engine-options="options" :refresh-key="refreshVersion"
          :class="{ 'playground-grid--numbered': !nested && !publicApi, 'playground-grid--title-handle': nested || feature === 'title-drag', 'playground-grid--lines': feature === 'grid-lines' && enabled }"
          :show-controls="feature !== 'title-drag' && !nested && !publicApi"
          :responsive="feature === 'mobile-touch' ? { breakpoints: [{ maxWidth: 640, columns: 3, layout: 'none' }], columnMax: 12, layout: 'none' } : undefined"
          @layout-commit="commands.applyLayoutSnapshot" @columns-change="commands.setColumns">
          <template #actions="{ widget }"><NumberedActions :widget="widget" :commands="commands" :locale="locale" /></template>
          <template #default="{ widget }"><NestedGrid v-if="nested && widget.id === 'widget-1'" :remaining="depth - 1" :level="1" :locale="locale" /><NumberedContent v-else :widget="widget" :locale="locale" /></template>
        </DashboardGrid>
      </section>
    </VueStage>
  </section>
</template>
