<script setup lang="ts">
import { computed, ref } from 'vue';
import { DashboardGrid, useDashboardGrid, transferDashboardWidget, insertDashboardWidgetAtLayout, serializeDashboardState,
  type DashboardWidget, type DashboardWidgetDropCandidate, type DashboardWidgetDropRequest, type DashboardWidgetLayout, type DashboardWidgetExternalDropEvent } from '../../../../src/vue';
import { createExampleConditions, createTransferTargetConditions, createPaletteExampleWidget } from '../../shared/example-conditions';
import type { ExampleWidgetData } from '../../playground/types';
import VueStage from './VueStage.vue';
import VueIcon from './VueIcon.vue';
import NumberedContent from './NumberedContent.vue';
import PaletteWidget from './PaletteWidget.vue';
const props = defineProps<{ exampleId: string; locale: 'ko' | 'en' }>();
const text = (ko: string, en: string) => props.locale === 'ko' ? ko : en;
const initial = createExampleConditions(props.exampleId), targetInitial = createTransferTargetConditions();
const source = useDashboardGrid({ initialColumns: initial.columns, initialWidgets: initial.widgets });
const target = useDashboardGrid({ initialColumns: targetInitial.columns, initialWidgets: targetInitial.widgets });
type Operation = { status: 'idle' | 'accepted' | 'rejected' | 'cleared'; reason?: string; operationId?: string; source?: string; target?: string; mode?: 'move' | 'copy'; widgetId?: string; targetLayout?: DashboardWidgetLayout };
const mode = ref<'move' | 'copy'>('move'), orientation = ref<'horizontal' | 'vertical'>('horizontal');
const operation = ref<Operation>({ status: 'idle' });
const trashStatus = ref<{ kind: 'idle' | 'reset' | 'removed'; widgetId?: string }>({ kind: 'idle' });
const multi = props.exampleId.includes('multi-grid');
const panels = [{ dashboard: source, id: 'grid-a', label: 'Grid A', targetId: 'grid-b', targetLabel: 'Grid B' }, { dashboard: target, id: 'grid-b', label: 'Grid B', targetId: 'grid-a', targetLabel: 'Grid A' }];
const sequences: Record<string, number> = {};
let operationSequence = 0;
const paletteDefinitions = computed(() => [
  { kind: 'kpi' as const, label: 'KPI', description: text('2×2 핵심 지표', '2×2 key metric'), width: 2 },
  { kind: 'chart' as const, label: text('차트', 'Chart'), description: text('4×2 추세 시각화', '4×2 trend visualization'), width: 4 },
  { kind: 'table' as const, label: text('표', 'Table'), description: text('4×2 데이터 목록', '4×2 data list'), width: 4 },
  { kind: 'restricted' as const, label: text('제한 위젯', 'Restricted widget'), description: text('predicate 거부 확인', 'Verify predicate rejection'), width: 2 },
]);
const operationStatusText = computed(() => operation.value.status === 'idle' ? text('전송 대기', 'Ready')
  : operation.value.status === 'cleared' ? text('삭제 완료 · Grid A/B', 'Cleared · Grid A/B')
  : operation.value.status === 'rejected' ? text(`거부 · ${operation.value.reason ?? 'unknown'}`, `Rejected · ${operation.value.reason ?? 'unknown'}`)
  : text(`완료 · ${operation.value.widgetId ?? '-'} → ${operation.value.target ?? '-'}`, `Completed · ${operation.value.widgetId ?? '-'} → ${operation.value.target ?? '-'}`));
const trashStatusText = computed(() => trashStatus.value.kind === 'removed'
  ? text(`${trashStatus.value.widgetId} 위젯을 제어 상태에서 삭제했습니다.`, `Removed ${trashStatus.value.widgetId} from controlled state.`)
  : trashStatus.value.kind === 'reset' ? text('초기 위젯을 복원했습니다.', 'Restored the initial widgets.')
  : text('위젯을 휴지통 영역으로 드래그해 보세요.', 'Drag a widget to the trash area.'));
const runtimeFor = (id: string) => id === 'grid-b' ? target : source;
const acceptCandidate = (candidate: DashboardWidgetDropCandidate<ExampleWidgetData>) => candidate.widget.data?.kind !== 'restricted';
const describeSource = (candidate: DashboardWidgetDropCandidate<ExampleWidgetData>) => candidate.source.kind === 'palette' ? candidate.source.sourceId : `${candidate.source.gridId}:${candidate.source.widgetId}`;
function rejected(candidate: DashboardWidgetDropCandidate<ExampleWidgetData>, reason: string) {
  operation.value = { status: 'rejected', reason, source: describeSource(candidate), target: candidate.targetGridId, mode: candidate.mode, widgetId: candidate.widget.id };
}
function paletteWidget(kind: NonNullable<ExampleWidgetData['kind']>) {
  const sequence = (sequences[kind] ?? 0) + 1; sequences[kind] = sequence;
  return createPaletteExampleWidget(kind, sequence);
}
function buttonTarget(widget: DashboardWidget<ExampleWidgetData>, destination: typeof source) {
  return { ...widget.layout, id: widget.id, x: 0, y: destination.widgets.value.reduce((max, item) => Math.max(max, item.layout.y + item.layout.h), 0), w: Math.min(widget.layout.w, destination.columns.value) };
}
function addPalette(widget: DashboardWidget<ExampleWidgetData>, gridId: string) {
  const destination = runtimeFor(gridId);
  const candidate: DashboardWidgetDropCandidate<ExampleWidgetData> = { source: { kind: 'palette', sourceId: `palette-${widget.data?.kind}` }, targetGridId: gridId, widget, mode: 'copy' };
  if (!acceptCandidate(candidate)) { rejected(candidate, 'predicate-rejected'); return; }
  const targetLayout = buttonTarget(widget, destination);
  const result = insertDashboardWidgetAtLayout(destination.state.value, widget, targetLayout, { columns: destination.columns.value, widgets: [...destination.widgets.value.map(item => item.layout), targetLayout] });
  if (!result.accepted) { rejected(candidate, result.reason); return; }
  destination.commands.restoreLayout(serializeDashboardState(result.state));
  operation.value = { status: 'accepted', operationId: `button-palette-${++operationSequence}`, source: describeSource(candidate), target: gridId, mode: 'copy', widgetId: widget.id, targetLayout };
}
function drop(request: DashboardWidgetDropRequest<ExampleWidgetData>) {
  const destination = runtimeFor(request.targetGridId);
  if (request.source.kind === 'palette') {
    const result = insertDashboardWidgetAtLayout(destination.state.value, request.widget, request.targetLayout, request.targetSnapshot);
    if (!result.accepted) { rejected(request, result.reason); return; }
    destination.commands.restoreLayout(serializeDashboardState(result.state));
  } else {
    const origin = runtimeFor(request.source.gridId);
    const result = transferDashboardWidget({ source: origin.state.value, target: destination.state.value, widgetId: request.source.widgetId, mode: request.mode, targetLayout: request.targetLayout, targetSnapshot: request.targetSnapshot });
    if (!result.accepted) { rejected(request, result.reason); return; }
    origin.commands.restoreLayout(serializeDashboardState(result.source)); destination.commands.restoreLayout(serializeDashboardState(result.target));
  }
  operation.value = { status: 'accepted', operationId: request.operationId, source: describeSource(request), target: request.targetGridId, mode: request.mode, widgetId: request.widget.id, targetLayout: request.targetLayout };
}
function transferWithButton(sourceId: string, targetId: string, widgetId: string) {
  const origin = runtimeFor(sourceId), destination = runtimeFor(targetId), widget = origin.widgets.value.find(item => item.id === widgetId);
  if (!widget) return;
  const targetLayout = buttonTarget(widget, destination), targetSnapshot = { columns: destination.columns.value, widgets: [...destination.widgets.value.map(item => item.layout), targetLayout] };
  const result = transferDashboardWidget({ source: origin.state.value, target: destination.state.value, widgetId, targetLayout, targetSnapshot, mode: mode.value });
  if (!result.accepted) { operation.value = { status: 'rejected', reason: result.reason, source: sourceId, target: targetId, mode: mode.value, widgetId }; return; }
  origin.commands.restoreLayout(serializeDashboardState(result.source)); destination.commands.restoreLayout(serializeDashboardState(result.target));
  operation.value = { status: 'accepted', operationId: `button-grid-${++operationSequence}`, source: sourceId, target: targetId, mode: mode.value, widgetId, targetLayout };
}
function clearAll() { source.commands.clearWidgets(); target.commands.clearWidgets(); operation.value = { status: 'cleared' }; }
function resetTrash() { source.commands.resetLayout({ columns: initial.columns, widgets: initial.widgets }); trashStatus.value = { kind: 'reset' }; }
function trashDrop(event: DashboardWidgetExternalDropEvent) { if (event.targetId === 'trash') { source.commands.removeWidget(event.widgetId); trashStatus.value = { kind: 'removed', widgetId: event.widgetId }; } }
type TransferWidgetPresentation = {
  description: Record<'ko' | 'en', string>;
  title: Record<'ko' | 'en', string>;
  value?: Record<'ko' | 'en', string>;
};

const transferWidgetPresentations: ReadonlyArray<readonly [string, TransferWidgetPresentation]> = [
  ["a-sales", { title: { ko: "매출 KPI", en: "Sales KPI" }, description: { ko: "매출 KPI kpi", en: "Sales KPI kpi" }, value: { ko: "1.28억", en: "KRW 128M" } }],
  ["a-chart", { title: { ko: "추세 차트", en: "Trend Chart" }, description: { ko: "추세 차트 chart", en: "Trend chart" } }],
  ["b-table", { title: { ko: "주문 표", en: "Order Table" }, description: { ko: "주문 표 table", en: "Order table" }, value: { ko: "1,284건", en: "1,284 orders" } }],
  ["palette-kpi-", { title: { ko: "신규 KPI", en: "New KPI" }, description: { ko: "신규 KPI kpi", en: "New KPI" } }],
  ["palette-chart-", { title: { ko: "신규 차트", en: "New Chart" }, description: { ko: "신규 차트 chart", en: "New chart" } }],
  ["palette-table-", { title: { ko: "신규 표", en: "New Table" }, description: { ko: "신규 표 table", en: "New table" }, value: { ko: "320행", en: "320 rows" } }],
  ["palette-restricted-", { title: { ko: "제한 위젯", en: "Restricted Widget" }, description: { ko: "제한 위젯 restricted", en: "Restricted widget" }, value: { ko: "거부됨", en: "Rejected" } }],
];

function presentTransferWidget(
  widget: DashboardWidget<ExampleWidgetData>,
  locale: 'ko' | 'en',
): DashboardWidget<ExampleWidgetData> {
  const presentation = transferWidgetPresentations.find(([idPrefix]) => widget.id.startsWith(idPrefix))?.[1];
  if (!presentation) {
    return widget;
  }
  return {
    ...widget,
    title: presentation.title[locale],
    data: widget.data ? {
      ...widget.data,
      description: presentation.description[locale],
      value: presentation.value?.[locale] ?? widget.data.value,
    } : widget.data,
  };
}

</script>
<template>
  <section v-if="multi" class="playground-workspace transfer-playground" data-example-mode="transfer" :data-transfer-orientation="orientation">
    <VueStage kind="controls" :locale="locale">
      <section :aria-label="text('전송 예제 컨트롤', 'Transfer example controls')" class="playground-controls transfer-controls">
        <div class="transfer-controls__group"><div :aria-label="text('Grid 배치 방향', 'Grid layout orientation')" class="example-actions" role="group">
          <button v-for="value in (['horizontal', 'vertical'] as const)" :key="value" class="example-toggle-button" type="button" :aria-pressed="orientation === value" :data-active="String(orientation === value)" @click="orientation = value">{{ value === 'horizontal' ? text('가로 배치', 'Horizontal layout') : text('세로 배치', 'Vertical layout') }}</button>
        </div></div>
        <div :aria-label="text('Grid 전송 모드', 'Grid transfer mode')" class="transfer-controls__group" role="group"><button class="example-toggle-button transfer-controls__mode" type="button" :aria-pressed="mode === 'copy'" :data-active="String(mode === 'copy')" @click="mode = mode === 'copy' ? 'move' : 'copy'"><VueIcon :name="mode === 'copy' ? 'Copy' : 'MoveRight'" :size="14" />{{ mode === 'copy' ? text('복사 모드', 'Copy mode') : text('이동 모드', 'Move mode') }}</button></div>
        <button :aria-label="text('Grid A/B 위젯 전체 삭제', 'Clear all Grid A/B widgets')" :title="text('Grid A/B 위젯 전체 삭제', 'Clear all Grid A/B widgets')" class="example-action-button example-action-button--danger transfer-controls__clear" :disabled="source.widgets.value.length === 0 && target.widgets.value.length === 0" type="button" @click="clearAll"><VueIcon name="Trash2" :size="14" /></button>
        <p :aria-label="text('전송 작업 상태', 'Transfer operation status')" class="transfer-controls__status" :data-operation="JSON.stringify(operation)" :data-reason="operation.reason" :data-transfer-result="operation.status" role="status"><span>{{ operationStatusText }}</span></p>
      </section>
      <section class="transfer-palette" :aria-label="text('위젯 팔레트', 'Widget Palette')">
        <div class="transfer-palette__header"><div><p class="example-kicker">{{ text('외부 Drag-in', 'External Drag-in') }}</p><h2>{{ text('위젯 팔레트', 'Widget Palette') }}</h2></div><p>{{ text('handle을 Grid로 드래그하거나 추가 버튼을 사용합니다.', 'Drag the handle into a grid or use an add button.') }}</p></div>
        <div class="transfer-palette__items"><PaletteWidget v-for="definition in paletteDefinitions" :key="definition.kind" :source-id="`palette-${definition.kind}`" :locale="locale" :restricted="definition.kind === 'restricted'" :label="definition.label" :description="definition.description" :width="definition.width" :create-widget="() => paletteWidget(definition.kind)" @add="addPalette" /></div>
      </section>
    </VueStage>
    <VueStage kind="grid" :locale="locale">
      <section :aria-label="text('전송 Grid 영역', 'Transfer grid area')" class="transfer-grid-layout playground-grid-region">
        <section v-for="panel in panels" :key="panel.id" :aria-label="text(`${panel.label} 패널`, `${panel.label} panel`)" class="transfer-grid-panel" :data-transfer-grid="panel.id">
          <header><div><p class="example-kicker">{{ panel.dashboard.columns.value }} columns</p><h2>{{ panel.label }}</h2></div><output :aria-label="text(`${panel.label} 위젯 수`, `${panel.label} widget count`)">{{ text(`${panel.dashboard.widgets.value.length}개`, `${panel.dashboard.widgets.value.length} widgets`) }}</output></header>
          <DashboardGrid :widgets="panel.dashboard.widgets.value.map(widget => presentTransferWidget(widget, locale))" :columns="panel.dashboard.columns.value" :grid-id="panel.id" :accept-external-widgets="acceptCandidate" :grid-transfer-mode="mode" :show-controls="false" :refresh-key="panel.dashboard.refreshVersion.value" :engine-options="{ cellHeight: 84, animate: false }" @widget-drop-request="drop" @layout-commit="panel.dashboard.commands.applyLayoutSnapshot">
            <template #default="{ widget }"><div class="dashboard-widget-body transfer-widget-body"><span>{{ widget.data?.description }}</span><strong>{{ widget.data?.value }}</strong><button type="button" @click="transferWithButton(panel.id, panel.targetId, widget.id)"><VueIcon name="ArrowLeftRight" :size="13" />{{ text(`${panel.targetLabel}로 ${mode === 'move' ? '이동' : '복사'}`, `${mode === 'move' ? 'Move' : 'Copy'} to ${panel.targetLabel}`) }}</button></div></template>
          </DashboardGrid>
          <pre :aria-label="text(`${panel.label} 상태 JSON`, `${panel.label} state JSON`)" class="transfer-grid-state">{{ JSON.stringify(panel.dashboard.widgets.value.map(widget => ({ id: widget.id, layout: widget.layout })), null, 2) }}</pre>
        </section>
      </section>
    </VueStage>
  </section>
  <section v-else class="playground-workspace" data-advanced-feature="external-drop-trash">
    <VueStage kind="controls" :locale="locale">
      <section :aria-label="text('휴지통 삭제 컨트롤', 'Trash delete controls')" class="external-trash-controls">
        <div aria-describedby="playground-external-drop-status" :aria-label="text('위젯을 여기에 놓으면 삭제됩니다', 'Drop a widget here to delete it')" class="example-external-drop__target" data-dashboard-drop-target="trash" data-testid="playground-external-drop-trash"><VueIcon name="Trash2" :size="28" /><strong>{{ text('위젯 삭제 영역', 'Widget delete area') }}</strong><span>{{ text('드래그한 위젯을 여기에 놓으세요.', 'Drop a dragged widget here.') }}</span></div>
        <div class="external-trash-controls__status"><p :aria-label="text('외부 드롭 처리 상태', 'External drop status')" id="playground-external-drop-status" role="status">{{ trashStatusText }}</p></div>
      </section>
    </VueStage>
    <VueStage kind="grid" :locale="locale">
      <template #actions><button class="external-trash-reset" type="button" @click="resetTrash"><VueIcon name="RotateCcw" :size="15" />{{ text('초기화', 'Reset') }}</button></template>
      <section :aria-label="text('휴지통 삭제 Grid', 'Trash delete grid')" class="playground-grid-region">
        <DashboardGrid :widgets="source.widgets.value" :columns="source.columns.value" :show-controls="false" :refresh-key="source.refreshVersion.value" class="playground-grid--numbered playground-grid--title-handle" :engine-options="{ cellHeight: 96, animate: false, dragHandle: '.comins-grid-layout-widget__title' }" :external-drop-targets="[{ id: 'trash', selector: `[data-dashboard-drop-target='trash']` }]" @widget-external-drop="trashDrop" @layout-commit="source.commands.applyLayoutSnapshot"><template #default="{ widget }"><NumberedContent :widget="widget" :locale="locale" /></template></DashboardGrid>
      </section>
    </VueStage>
  </section>
</template>
